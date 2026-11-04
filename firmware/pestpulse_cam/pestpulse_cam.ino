/*
 * PestPulse – ESP32-CAM trap node  ->  PestPulse Cloud  (Team Prime Minds, CHIP TO CROP PS1)
 *
 * Every cycle the node:
 *   1. switches on the LED ring and photographs the trap card
 *   2. reads temperature + humidity (DHT22)
 *   3. uploads photo + readings over HTTPS to the cloud  (POST /api/v1/ingest, header X-Device-Key)
 *   4. shows the AI count + risk from the cloud's reply on the OLED
 *   5. takes the next photo after the interval the cloud sends back (change it from the app)
 * If Wi-Fi or the cloud is down it retries 3 times, then waits a short time and tries again.
 *
 * Arduino IDE:  Board "AI Thinker ESP32-CAM" (esp32 by Espressif, core 3.x), PSRAM enabled.
 * Libraries:    DHT sensor library + Adafruit Unified Sensor, Adafruit SSD1306 + Adafruit GFX, ArduinoJson v7
 * Wiring:       same as before – DHT22 DATA IO13 (10k pull-up), OLED SDA IO15 / SCL IO14,
 *               LED ring via 2N2222 on IO12 (+10k IO12->GND), 5 V from MT3608 or power bank, no microSD card.
 */
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include "esp_camera.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include <DHT.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>

// ============================ EDIT THESE ============================
const char* WIFI_SSID     = "YOUR_WIFI_NAME";        // farm Wi-Fi or a phone hotspot
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* CLOUD_URL     = "https://your-app.onrender.com";   // your cloud address, no slash at the end
const char* DEVICE_KEY    = "change-me-device-key";            // = PP_DEVICE_KEY on the cloud
const char* NODE_ID       = "trap1";                 // unique per node: trap1, trap2, trap3 ...
const char* TRAP_TYPE     = "sticky_yellow";         // sticky_yellow | pheromone | tuta_delta | lirio_sticky
const bool  USE_DEEP_SLEEP = false;                  // true in the field (saves battery, OLED goes dark)
const bool  HAS_OLED = true;
const bool  HAS_DHT  = true;
// ====================================================================
#define FW_VERSION "1.1.0"
const uint32_t FIRST_INTERVAL_S = 60;                // until the cloud tells us its interval
const uint32_t RETRY_INTERVAL_S = 120;               // after a failed upload

// AI-Thinker ESP32-CAM camera pins (do not change)
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22
// our pins
#define DHT_PIN 13
#define OLED_SDA 15
#define OLED_SCL 14
#define LED_RING_PIN 12
#define FLASH_LED_PIN 4

DHT dht(DHT_PIN, DHT22);
Adafruit_SSD1306 display(128, 64, &Wire, -1);
bool oledOk = false;

RTC_DATA_ATTR uint32_t seq = 0;                      // survive deep sleep
RTC_DATA_ATTR uint32_t intervalS = FIRST_INTERVAL_S;
RTC_DATA_ATTR uint32_t fails = 0;

void oled(const String& a, const String& b = "", const String& c = "", const String& d = "") {
  if (!oledOk) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1); display.setCursor(0, 0);  display.println(a);
  display.setTextSize(2); display.setCursor(0, 14); display.println(b);
  display.setCursor(0, 32); display.println(c);
  display.setTextSize(1); display.setCursor(0, 54); display.println(d);
  display.display();
}

bool initCamera() {
  camera_config_t c = {};
  c.ledc_channel = LEDC_CHANNEL_0; c.ledc_timer = LEDC_TIMER_0;
  c.pin_d0 = Y2_GPIO_NUM; c.pin_d1 = Y3_GPIO_NUM; c.pin_d2 = Y4_GPIO_NUM; c.pin_d3 = Y5_GPIO_NUM;
  c.pin_d4 = Y6_GPIO_NUM; c.pin_d5 = Y7_GPIO_NUM; c.pin_d6 = Y8_GPIO_NUM; c.pin_d7 = Y9_GPIO_NUM;
  c.pin_xclk = XCLK_GPIO_NUM; c.pin_pclk = PCLK_GPIO_NUM; c.pin_vsync = VSYNC_GPIO_NUM; c.pin_href = HREF_GPIO_NUM;
  c.pin_sccb_sda = SIOD_GPIO_NUM; c.pin_sccb_scl = SIOC_GPIO_NUM; c.pin_pwdn = PWDN_GPIO_NUM; c.pin_reset = RESET_GPIO_NUM;
  c.xclk_freq_hz = 20000000; c.pixel_format = PIXFORMAT_JPEG; c.grab_mode = CAMERA_GRAB_LATEST;
  if (psramFound()) { c.frame_size = FRAMESIZE_SXGA; c.jpeg_quality = 10; c.fb_count = 2; c.fb_location = CAMERA_FB_IN_PSRAM; }
  else              { c.frame_size = FRAMESIZE_VGA;  c.jpeg_quality = 12; c.fb_count = 1; c.fb_location = CAMERA_FB_IN_DRAM; }
  if (esp_camera_init(&c) != ESP_OK) { Serial.println("Camera init failed"); return false; }
  sensor_t* s = esp_camera_sensor_get();
  s->set_whitebal(s, 1); s->set_awb_gain(s, 1); s->set_exposure_ctrl(s, 1); s->set_gain_ctrl(s, 1);
  // s->set_vflip(s, 1);   // uncomment if the photo is upside down
  return true;
}

bool connectWiFi(uint32_t timeoutMs = 20000) {
  if (WiFi.status() == WL_CONNECTED) return true;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < timeoutMs) { delay(400); Serial.print("."); }
  Serial.println();
  if (WiFi.status() != WL_CONNECTED) { Serial.println("WiFi failed"); return false; }
  Serial.println("WiFi IP " + WiFi.localIP().toString() + "  RSSI " + String(WiFi.RSSI()));
  return true;
}

camera_fb_t* capture() {
  digitalWrite(LED_RING_PIN, HIGH);
  delay(300);                                        // light + auto-exposure settle
  for (int i = 0; i < 2; i++) { camera_fb_t* f = esp_camera_fb_get(); if (f) esp_camera_fb_return(f); }
  camera_fb_t* fb = esp_camera_fb_get();
  digitalWrite(LED_RING_PIN, LOW);
  return fb;
}

// Uploads one photo. Returns true when the cloud answered 200 and updates the OLED + interval.
bool upload(camera_fb_t* fb, float t, float h) {
  String url = String(CLOUD_URL) + "/api/v1/ingest?node=" + NODE_ID + "&trap=" + TRAP_TYPE +
               "&seq=" + String(seq) + "&rssi=" + String(WiFi.RSSI()) + "&fw=" FW_VERSION +
               "&uptime=" + String(millis() / 1000);
  if (!isnan(t)) url += "&temp=" + String(t, 1) + "&hum=" + String(h, 1);

  WiFiClientSecure tls;
  tls.setInsecure();      // encrypts traffic but skips certificate checks; for production add tls.setCACert(rootCA)
  WiFiClient plain;
  HTTPClient http;
  bool https = String(CLOUD_URL).startsWith("https");
  if (https) http.begin(tls, url); else http.begin(plain, url);   // http:// works for a laptop on the same Wi-Fi
  http.setTimeout(45000);                            // a sleeping free cloud server can take ~30 s to wake
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  int code = http.POST(fb->buf, fb->len);
  String body = code > 0 ? http.getString() : "";
  http.end();
  Serial.printf("Cloud HTTP %d  %s\n", code, body.c_str());
  if (code != 200) {
    oled(String(NODE_ID) + " cloud err", code == 401 ? "BAD KEY" : "ERR " + String(code));
    return false;
  }
  JsonDocument doc;
  if (deserializeJson(doc, body) == DeserializationError::Ok) {
    uint32_t iv = doc["interval_s"] | intervalS;
    if (iv >= 30 && iv <= 6 * 3600) intervalS = iv;
    String l1 = doc["oled"][0] | "Count: ?";
    String l2 = doc["oled"][1] | "";
    String risk = doc["risk"] | "?";
    oled(String(NODE_ID) + "  risk " + risk, l1, l2,
         (isnan(t) ? String("") : String(t, 1) + "C " + String(h, 0) + "%  ") + "next " + String(intervalS / 60) + "m");
  }
  return true;
}

void cycle() {
  seq++;
  float t = NAN, h = NAN;
  if (HAS_DHT) { h = dht.readHumidity(); t = dht.readTemperature(); }
  if (isnan(t) || isnan(h)) Serial.println("DHT22 read failed (check wiring / pull-up)");
  oled(String(NODE_ID) + " capturing", "", "", "seq " + String(seq));

  camera_fb_t* fb = capture();
  if (!fb) { oled(NODE_ID, "CAM ERR"); fails++; return; }
  Serial.printf("Photo %u bytes\n", fb->len);

  bool ok = false;
  for (int attempt = 1; attempt <= 3 && !ok; attempt++) {
    if (!connectWiFi()) { oled(NODE_ID, "NO WIFI", String(attempt) + "/3"); delay(3000); continue; }
    ok = upload(fb, t, h);
    if (!ok) delay(4000);
  }
  esp_camera_fb_return(fb);
  fails = ok ? 0 : fails + 1;
  if (fails >= 6) { Serial.println("Too many failures, restarting"); delay(500); ESP.restart(); }
}

uint32_t nextWaitS() { return fails ? RETRY_INTERVAL_S : intervalS; }

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);         // avoid brown-out resets when Wi-Fi starts
  Serial.begin(115200);
  delay(200);
  pinMode(FLASH_LED_PIN, OUTPUT); digitalWrite(FLASH_LED_PIN, LOW);
  pinMode(LED_RING_PIN, OUTPUT);  digitalWrite(LED_RING_PIN, LOW);
  if (!initCamera()) { delay(3000); ESP.restart(); }
  if (HAS_DHT) dht.begin();
  if (HAS_OLED) { Wire.begin(OLED_SDA, OLED_SCL); oledOk = display.begin(SSD1306_SWITCHCAPVCC, 0x3C); }
  oled("PestPulse " FW_VERSION, NODE_ID, "", "connecting...");
  if (USE_DEEP_SLEEP) {
    cycle();
    uint32_t w = nextWaitS();
    Serial.printf("Deep sleep %u s\n", w);
    WiFi.disconnect(true);
    esp_sleep_enable_timer_wakeup((uint64_t)w * 1000000ULL);
    esp_deep_sleep_start();
  }
}

void loop() {
  static uint32_t last = 0;
  static bool first = true;
  if (first || millis() - last >= nextWaitS() * 1000UL) {
    first = false;
    last = millis();
    cycle();
  }
  delay(50);
}
