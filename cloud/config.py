"""PestPulse Cloud settings. Every value can be set with an environment variable on the cloud host."""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.environ.get("PP_APP_DIR", os.path.join(os.path.dirname(BASE_DIR), "app"))   # the phone app (PWA)
DATA_DIR = os.environ.get("PP_DATA_DIR", os.path.join(BASE_DIR, "data"))                 # mount a disk/volume here
DB_PATH = os.path.join(DATA_DIR, "pestpulse.db")
IMAGE_DIR = os.path.join(DATA_DIR, "images")

PORT = int(os.environ.get("PORT", "8080"))

# ---------------- Security ----------------
# DEVICE_KEY: every ESP32-CAM sends this in the "X-Device-Key" header. Same value goes in the firmware.
# APP_TOKEN : the farmer app sends this as "Authorization: Bearer <token>". Leave empty to keep the app open (demo).
DEVICE_KEY = os.environ.get("PP_DEVICE_KEY", "change-me-device-key")
APP_TOKEN = os.environ.get("PP_APP_TOKEN", "")

# ---------------- Farm ----------------
FARM_NAME = os.environ.get("PP_FARM_NAME", "Prime Minds Demo Farm")
FARM_PLACE = os.environ.get("PP_FARM_PLACE", "Hesaraghatta, Bengaluru")
FARM_LAT = float(os.environ.get("PP_FARM_LAT", "13.1357"))     # ICAR-IIHR Hesaraghatta (change to your farm)
FARM_LON = float(os.environ.get("PP_FARM_LON", "77.4950"))
CROP = os.environ.get("PP_CROP", "Tomato")

# ---------------- Devices ----------------
DEFAULT_INTERVAL_S = 60        # photo every 30 min in the field; change per trap from the app
OFFLINE_AFTER_S = 3 * 3600       # trap shown "offline" if nothing for 3 h (or 3 x its interval)
ALLOW_BACKFILL = os.environ.get("PP_ALLOW_BACKFILL", "0") == "1"   # lets tools/simulate_cloud.py add past days (demo only)
RETAIN_DAYS = int(os.environ.get("PP_RETAIN_DAYS", "14"))      # photos older than this are deleted

# ---------------- AI models ----------------
TRAP_MODEL_PATH = os.environ.get("PP_TRAP_MODEL", os.path.join(BASE_DIR, "models", "trap.pt"))
LEAF_MODEL_PATH = os.environ.get("PP_LEAF_MODEL", os.path.join(BASE_DIR, "models", "leaf.pt"))
YOLO_CONF = 0.35
YOLO_IMGSZ = 512
YOLO_IOU = 0.30

# ---------------- Trap types + action thresholds ----------------
# medium / high = NEW insects per trap in 24 h.
# >>> Placeholders. Confirm the thresholds for your crop with the ICAR-IIHR mentors. <<<
TRAP_TYPES = {
    "sticky_yellow": {"label": "Yellow sticky card", "species": "insect", "medium": 20, "high": 50},
    "pheromone": {"label": "Pheromone trap", "species": "moth", "medium": 5, "high": 15},
    "tuta_delta": {"label": "Tuta delta trap", "species": "tuta", "medium": 3, "high": 10},
    "lirio_sticky": {"label": "Liriomyza sticky card", "species": "liriomyza", "medium": 10, "high": 30},
}
DEFAULT_TRAP = "sticky_yellow"
CARD_RESET_FRACTION = 0.5        # count drops below half the last count -> card was replaced
FAVOURABLE_TEMP = (20.0, 32.0)   # warm + humid weather favours pest build-up
FAVOURABLE_RH = 60.0
LEAF_DAMAGE_MEDIUM = 2.0
LEAF_DAMAGE_HIGH = 5.0

# ---------------- Weather & External APIs ----------------
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "AIzaSyBAdVcNzWRRHI4ASDvgYJF6znlRwHZbbb4")

# ---------------- Alerts ----------------
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
ALERT_MIN_GAP_S = 3600           # at most one alert per trap per hour

os.makedirs(IMAGE_DIR, exist_ok=True)
