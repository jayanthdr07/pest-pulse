"""Crop intelligence & Pest risk assessment engine."""
import time

import config
import db
import pests

LEVELS = ["LOW", "MEDIUM", "HIGH"]
LEVEL_KN = {"LOW": "ಕಡಿಮೆ", "MEDIUM": "ಮಧ್ಯಮ", "HIGH": "ಹೆಚ್ಚು"}

SPECIES_EN = {
    "insect": "insects",
    "moth": "moths",
    "tuta": "Tuta moths",
    "liriomyza": "leaf miners",
    "whitefly": "whiteflies",
    "thrips": "thrips",
}
SPECIES_KN = {
    "insect": "ಕೀಟಗಳು",
    "moth": "ಪತಂಗಗಳು",
    "tuta": "ಟ್ಯೂಟಾ ಪತಂಗಗಳು",
    "liriomyza": "ಎಲೆ ಸುರಂಗ ಕೀಟಗಳು",
    "whitefly": "ಬಿಳಿ ನೊಣಗಳು",
    "thrips": "ನುಸಿ ಕೀಟಗಳು",
}

OFFICER = (
    "Ask your agriculture officer / ICAR-IIHR before any spray; use only label-approved products.",
    "ಯಾವುದೇ ಸಿಂಪಡಣೆಗೆ ಮೊದಲು ಕೃಷಿ ಅಧಿಕಾರಿ / ICAR-IIHR ಅವರನ್ನು ಕೇಳಿ; ಅನುಮೋದಿತ ಔಷಧಿ ಮಾತ್ರ ಬಳಸಿ."
)

ADVICE = {
    "insect": [
        ("Scout the field today to confirm which pest it is.", "ಯಾವ ಕೀಟ ಎಂದು ತಿಳಿಯಲು ಇಂದೇ ಹೊಲವನ್ನು ಪರಿಶೀಲಿಸಿ."),
        ("Replace the sticky card when it is more than half covered.", "ಅಂಟು ಕಾರ್ಡ್ ಅರ್ಧಕ್ಕಿಂತ ಹೆಚ್ಚು ತುಂಬಿದರೆ ಬದಲಾಯಿಸಿ."),
        OFFICER,
    ],
    "moth": [
        ("Check plants for eggs and young larvae.", "ಗಿಡಗಳಲ್ಲಿ ಮೊಟ್ಟೆ ಮತ್ತು ಮರಿಹುಳುಗಳಿವೆಯೇ ಎಂದು ನೋಡಿ."),
        ("Add more pheromone traps for mass trapping.", "ಸಾಮೂಹಿಕ ಹಿಡಿತಕ್ಕಾಗಿ ಹೆಚ್ಚು ಫೆರೋಮೋನ್ ಬಲೆಗಳನ್ನು ಇಡಿ."),
        OFFICER,
    ],
    "tuta": [
        ("Pick and destroy mined leaves and bored fruits.", "ಹಾನಿಯಾದ ಎಲೆ ಮತ್ತು ಕಾಯಿಗಳನ್ನು ಕಿತ್ತು ನಾಶಮಾಡಿ."),
        ("Add more pheromone delta traps for mass trapping.", "ಸಾಮೂಹಿಕ ಹಿಡಿತಕ್ಕಾಗಿ ಹೆಚ್ಚು ಫೆರೋಮೋನ್ ಬಲೆಗಳನ್ನು ಇಡಿ."),
        OFFICER,
    ],
    "liriomyza": [
        ("Add more yellow sticky traps around the crop perimeter.", "ಬೆಳೆಯ ಸುತ್ತ ಹೆಚ್ಚು ಹಳದಿ ಅಂಟು ಬಲೆಗಳನ್ನು ಇಡಿ."),
        ("Remove heavily mined lower leaves.", "ಹೆಚ್ಚು ಹಾನಿಯಾದ ಕೆಳಗಿನ ಎಲೆಗಳನ್ನು ತೆಗೆಯಿರಿ."),
        OFFICER,
    ],
    "whitefly": [
        ("Install yellow sticky traps at 15 per hectare.", "ಹೆಕ್ಟೇರಿಗೆ 15 ಹಳದಿ ಅಂಟು ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ."),
        ("Rogue out plants with viral curling symptoms.", "ಎಲೆ ಮುದುಡಿದ ರೋಗಪೀಡಿತ ಗಿಡಗಳನ್ನು ಕಿತ್ತು ನಾಶಮಾಡಿ."),
        OFFICER,
    ],
    "thrips": [
        ("Hang blue sticky traps around vulnerable plots.", "ನೀಲಿ ಅಂಟು ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ."),
        ("Spray Neem Oil 3000 ppm at 3 ml/L in evening.", "ಸಂಜೆ ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಿಸಿ."),
        OFFICER,
    ],
}

WEATHER_NOTE = (
    "Warm, humid weather favours pests: check traps daily.",
    "ಬೆಚ್ಚಗಿನ, ತೇವದ ಹವಾಮಾನ ಕೀಟಗಳಿಗೆ ಅನುಕೂಲ: ಪ್ರತಿದಿನ ಬಲೆ ನೋಡಿ."
)


def trap_cfg(trap):
    return config.TRAP_TYPES.get(trap or config.DEFAULT_TRAP, config.TRAP_TYPES[config.DEFAULT_TRAP])


def favourable(temp, hum):
    if temp is None or hum is None:
        return False
    lo, hi = config.FAVOURABLE_TEMP
    return lo <= temp <= hi and hum >= config.FAVOURABLE_RH


def new_catches(node, total):
    """Insects pile up on a card, so NEW catches = this count minus the previous one."""
    prev = db.last_reading(node, "trap")
    if prev is None or prev["total"] is None:
        return total, False
    if prev["total"] and total < prev["total"] * config.CARD_RESET_FRACTION:
        return total, True
    return max(0, total - prev["total"]), False


def catches_24h(node, at=None):
    if at is None:
        return sum((r["new"] or 0) for r in db.readings_since(node, 24 * 3600, "trap"))
    rows = db.readings_since(node, time.time() - at + 24 * 3600, "trap")
    return sum((r["new"] or 0) for r in rows if at - 24 * 3600 <= r["ts"] <= at)


def trap_level(trap, c24, temp, hum):
    t = trap_cfg(trap)
    lvl = 2 if c24 >= t["high"] else 1 if c24 >= t["medium"] else 0
    if lvl == 0 and favourable(temp, hum) and c24 >= 0.5 * t["medium"]:
        lvl = 1
    return LEVELS[lvl]


def hourly(node, hours=24):
    now, buckets = time.time(), [0] * hours
    for r in db.readings_since(node, hours * 3600, "trap"):
        i = int((now - r["ts"]) // 3600)
        if 0 <= i < hours:
            buckets[hours - 1 - i] += r["new"] or 0
    return buckets


def daily(node, days=7):
    """New catches per calendar day (server local time), oldest first."""
    lt = time.localtime()
    midnight = time.mktime((lt.tm_year, lt.tm_mon, lt.tm_mday, 0, 0, 0, 0, 0, -1))
    starts = [midnight - 86400 * (days - 1 - i) for i in range(days)]
    out = [
        {
            "day": time.strftime("%a", time.localtime(s)),
            "date": time.strftime("%d %b", time.localtime(s)),
            "new": 0,
        }
        for s in starts
    ]
    for r in db.readings_since(node, days * 86400 + 86400, "trap"):
        for i in range(days - 1, -1, -1):
            if r["ts"] >= starts[i]:
                out[i]["new"] += r["new"] or 0
                break
    return out


def steps_for(species):
    return ADVICE.get(species, ADVICE["insect"])


def maybe_create_alert(dev, level, prev_level, c24, image):
    """New alert when a trap's risk rises or stays HIGH for more than ALERT_MIN_GAP_S."""
    if level == "LOW":
        return None
    rank = LEVELS.index
    last = db.last_alert(dev["node"])
    rising = prev_level is None or rank(level) > rank(prev_level)
    repeat_high = level == "HIGH" and (last is None or time.time() - last["ts"] > config.ALERT_MIN_GAP_S)
    if not (rising or repeat_high):
        return None
    t = trap_cfg(dev["trap"])
    sp = t["species"]
    name = dev["name"] or dev["node"]
    steps = steps_for(sp)
    aid = db.insert_alert(
        node=dev["node"],
        field_id=dev.get("field_id"),
        level=level,
        species=sp,
        catches_24h=c24,
        title_en=f"{level.title()} pest risk at {name}",
        title_kn=f"{name}: ಕೀಟ ಅಪಾಯ {LEVEL_KN[level]}",
        body_en=f"{c24} new {SPECIES_EN.get(sp, sp)} caught in the last 24 h (action level {t['medium']} / {t['high']}).",
        body_kn=f"ಕಳೆದ 24 ಗಂಟೆಗಳಲ್ಲಿ {c24} ಹೊಸ {SPECIES_KN.get(sp, sp)} ಸಿಕ್ಕಿವೆ (ಕ್ರಮದ ಮಟ್ಟ {t['medium']} / {t['high']}).",
        steps=[{"en": e, "kn": k} for e, k in steps],
        done=[],
        image=image,
    )
    return db.alert(aid)
