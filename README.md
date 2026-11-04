# PestPulse — AI + IoT Smart Agriculture Platform

> **Team Prime Minds · CHIP TO CROP 2026 · PS1 AI-Based Insect Counting and Pest Monitoring**  
> Complete digital farming assistant connecting ESP32-CAM smart optical traps to cloud AI inference, agronomic intelligence, and interactive farmer dashboards.

```
ESP32-CAM Trap Node ──HTTPS + device key──▶  PestPulse Cloud  ◀──HTTPS──  PestPulse Web App (Phone/Desktop)
 Photo (LED ring) + DHT22 temp/hum           AI count, risk engine        Home, Fields, AI Gallery, History,
 Every 30 min (set from app)                 Open-Meteo weather, alerts   Spray Advisor, Diseases, 3D Demo,
 OLED count & interval response              CSV reports, SQLite/Postgres English / ಕನ್ನಡ voice & UI
```

---

## 🌾 Project Overview

PestPulse empowers farmers to manage crop protection and nutrient health like a **digital farming assistant** rather than a complex technical IoT dashboard.

### Core Objectives Answered for Farmers:
- **What crop am I monitoring?** Multi-field support with crop varieties (e.g. Arka Rakshak F1 tomato, Arka Harita chilli), planting dates, and growth stages.
- **What insects are present in my field?** Real optical trap photography processed with AI computer vision (Whitefly, Fruit Borer, Tuta Pinworm, Leaf Miner, Thrips).
- **How many insects have been detected?** Real-time whole-card counts and daily 24h new catch rates.
- **Is the insect population increasing or decreasing?** Trend trajectory analytics, peak day detection, and multi-period comparisons.
- **What crop damage or disease can this pest cause?** Vector classification (Confirmed Vector vs Wound Facilitator vs Airborne), symptoms, and potential yield loss.
- **What should I do now?** Clear, explainable action checklist prioritized with non-chemical IPM cultural measures first.
- **What treatment or fertilizer is appropriate?** Strict separation between **Fertilizers** (NPK fertigation & micronutrients) and **Pesticides** (active ingredients & IRAC mode-of-action rotation).
- **How much product should I apply for my field size?** Automatic dosage calculation scaling verified rates per acre to the farmer's registered acreage (`Total = Rate/acre × Area`).
- **What is the current weather?** Local microclimate conditions (temperature, humidity, rainfall, wind speed, 3-day forecast) and agricultural spray windows.
- **Is my field at risk?** Crop-specific dynamic action thresholds (ETL) derived from ICAR-IIHR guidelines.
- **What happens if pest activity increases while I am away?** Real-time multi-channel alerts (In-App notification center, checklist persistence, Telegram bot).

---

## 📁 Repository Structure

```
pestpulse/
├── cloud/                        # Python Cloud Backend
│   ├── app.py                    # REST API, JWT auth, device ingestion, static delivery
│   ├── config.py                 # Configuration & environment variables
│   ├── db.py                     # SQLite / PostgreSQL schema & query engine
│   ├── detectors.py              # OpenCV blob detection & YOLO inference engine
│   ├── pests.py                  # Agricultural pest knowledge base & IRAC rotation
│   ├── fertilizers.py            # ICAR-IIHR nutrient schedules & acreage calculator
│   ├── diseases.py               # Plant pathology database & vector classifications
│   ├── risk.py                   # Crop intelligence & action threshold evaluation
│   ├── weather.py                # Open-Meteo live API integration & fallback
│   ├── advisor.py                # Spray advisor & efficacy analyzer
│   ├── alerts_out.py             # Alert dispatcher & Telegram bot integration
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Environment variables template
├── frontend/                     # Modern React + TypeScript + Vite Web App
│   ├── src/
│   │   ├── types/index.ts        # TypeScript definitions
│   │   ├── i18n/translations.ts  # Full English & Kannada (ಕನ್ನಡ) localization
│   │   ├── context/AppContext.tsx# Global application state & language manager
│   │   ├── services/api.ts       # Backend REST client
│   │   ├── components/
│   │   │   ├── Header.tsx        # Farmer greeting, field switcher, language toggle
│   │   │   ├── Navbar.tsx        # Main navigation bar with badges
│   │   │   └── AudioPlayer.tsx   # Text-to-speech voice assistant (Kannada/English)
│   │   ├── views/
│   │   │   ├── HomeView.tsx      # Main dashboard with 5 core cards & AI suggestions
│   │   │   ├── FieldsView.tsx    # Plot management & crop stage tracker
│   │   │   ├── MonitoringView.tsx# AI detection gallery & inspection modal
│   │   │   ├── TrendsView.tsx    # Recharts trends, trap comparisons & CSV export
│   │   │   ├── IntelligenceView.tsx # Action thresholds & ETL evaluation
│   │   │   ├── WeatherView.tsx   # Microclimate forecast & spraying window
│   │   │   ├── RecommendationsView.tsx # Fertilizer vs Pesticides & Spray log
│   │   │   ├── DiseasesView.tsx  # Crop disease vector guide & ICAR citations
│   │   │   ├── DevicesView.tsx   # IoT node telemetry & remote interval setting
│   │   │   ├── AlertsView.tsx    # Real-time alert center & action checklists
│   │   │   ├── ThreeDView.tsx    # Three.js 3D Smart Spraying Demonstration
│   │   │   ├── SettingsView.tsx  # Preferences, hardware device keys & demo toggle
│   │   │   └── OnboardingModal.tsx # Friendly registration & hardware pairing
│   │   ├── App.tsx               # Route declarations & layout
│   │   └── main.tsx              # Application entrypoint
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── firmware/
│   └── pestpulse_cam/
│       └── pestpulse_cam.ino     # ESP32-CAM firmware (Camera + DHT22 + OLED + HTTPS)
├── tools/
│   ├── seed_demo_data.py         # Seeds realistic historical observations & cards
│   ├── test_e2e.py               # Complete 15-point automated test suite
│   └── simulate_cloud.py         # Simulates multi-node hardware uploads
├── run_pestpulse.py              # One-click launcher script
└── README.md
```

---

## 🚀 Quick Start Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Install & Setup Backend
```bash
cd cloud
pip install -r requirements.txt
cp .env.example .env
```

### 2. Seed Realistic Baseline Data
Populates 14 days of realistic observations, sticky card photos, weather telemetry, and alerts:
```bash
cd tools
python seed_demo_data.py
```

### 3. Build & Run Frontend
```bash
# Production Build
cd frontend
npm install
npm run build

# Start Platform (Flask serves both API and React SPA on port 8080)
cd ..
python run_pestpulse.py
```
Open **`http://localhost:8080`** in any web browser.

---

## 🧪 Automated End-to-End Testing

Run the comprehensive 15-point automated test suite verifying all subsystems:
```bash
cd tools
python test_e2e.py
```
Test Coverage:
1. `test_01_health`: System health and device registry.
2. `test_02_auth_and_farmer`: JWT registration, login, and profile update.
3. `test_03_fields_crud`: Field creation, acreage tracking, and crop stages.
4. `test_04_hardware_ingest`: ESP32-CAM JPEG upload, AI counting, risk, and OLED lines.
5. `test_05_devices_management`: Remote interval configuration and battery tracking.
6. `test_06_observations_and_detections`: Querying bounding boxes and camera captures.
7. `test_07_pests_catalog`: Agricultural taxonomy and scientific classifications.
8. `test_08_diseases`: Plant pathology and vector classifications.
9. `test_09_fertilizers_scaling`: Acreage-based nutrient dosage scaling.
10. `test_10_spray_advice_and_rotation`: IRAC mode-of-action resistance rotation.
11. `test_11_weather`: Open-Meteo live integration and rain/wind spray windows.
12. `test_12_alerts_and_checklists`: In-app alert triage and checklist state persistence.
13. `test_13_3d_simulation_events`: Three.js simulation event logging.
14. `test_14_csv_export`: FPO/KVK compliant CSV report export.
15. `test_15_frontend_spa_delivery`: Single Page Application delivery.

---

## 🔌 Hardware Integration & ESP32-CAM Firmware

The platform receives real data from field hardware over HTTPS:
- **Hardware**: AI Thinker ESP32-CAM, DHT22 sensor (IO13), 128x64 I2C OLED (SDA IO15 / SCL IO14), LED ring (IO12).
- **Payload Protocol**:
  ```http
  POST /api/v1/ingest?node=trap1&trap=sticky_yellow&temp=28.5&hum=65&battery=92 HTTP/1.1
  Host: localhost:8080
  X-Device-Key: change-me-device-key
  Content-Type: image/jpeg

  [Binary JPEG bytes...]
  ```
- **Device Response**:
  ```json
  {
    "ok": true,
    "total": 38,
    "new": 4,
    "catches_24h": 46,
    "risk": "MEDIUM",
    "interval_s": 1800,
    "oled": ["Insec: 38", "24h  : 46"]
  }
  ```
- **Flashing Instructions**:
  1. Open `firmware/pestpulse_cam/pestpulse_cam.ino` in Arduino IDE.
  2. Install board: **esp32 by Espressif** (board: *AI Thinker ESP32-CAM*).
  3. Install libraries: *DHT sensor library*, *Adafruit SSD1306*, *ArduinoJson* (v7).
  4. Edit `WIFI_SSID`, `WIFI_PASSWORD`, `CLOUD_URL`, and `DEVICE_KEY`.
  5. Upload and open Serial Monitor at 115200 baud.

---

## 🌿 Agricultural Sources & Citations

All crop recommendations, action thresholds, disease etiologies, and dosages adhere to published Indian agricultural extension standards:
- **Tomato & Solanaceous Practices**: ICAR-Indian Institute of Horticultural Research (IIHR), Hesaraghatta, Bengaluru ([IIHR Package of Practices](https://iihr.res.in/package-practices-tomato)).
- **Fruit Borer, Whitefly & Leaf Miner**: Kerala Agricultural University (KAU) Vegetable Protection Guidelines ([CELKAU](https://celkau.in/crops/vegetables/tomato/)).
- **Serpentine Leaf Miner Thresholds**: Tamil Nadu Agricultural University (TNAU) Agritech Portal ([TNAU Tomato Protection](https://agritech.tnau.ac.in/crop_protection/tomato/tomato_2.html)).
- **Tuta absoluta IPM**: Krishi Vigyan Kendra (KVK) Wyra IPM Manual and ICAR-NBAIR National Recommendations ([NBAIR Technical Guidance](https://www.nbair.res.in/)).
- **Insecticide Resistance Management**: Insecticide Resistance Action Committee (IRAC) Mode of Action Classification Scheme.

---

## ⚠️ Prototype Safety & Simulation Disclosure
The **3D Smart Spraying Demonstration Mode** feature is designed for technical presentation and educational simulation only:
- All 3D field visualizations are labeled with **“3D Simulation — No Physical Spraying”**.
- Chemical application equipment, pumps, and valves remain completely deactivated.
- An insect count alone never triggers autonomous physical spray deployment.
