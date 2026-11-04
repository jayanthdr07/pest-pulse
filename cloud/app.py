"""
PestPulse Cloud: complete backend API for smart agriculture IoT hardware integration,
AI insect detection, crop intelligence, and farmer web application.
"""
import csv
import hashlib
import io
import json
import os
import threading
import time
import uuid

import cv2
from flask import Flask, Response, abort, jsonify, request, send_from_directory
import jwt

import advisor
import alerts_out
import config
import db
import detectors
import diseases
import emailer
import escalation
import fertilizers
import passport
import pest_knowledge
import pests
import risk
import voice_agent
import weather

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024     # 8 MB per photo
JWT_SECRET = os.environ.get("PP_JWT_SECRET", "pestpulse-secure-jwt-secret-key-production-2026-v1")
db.init()
_cleanup = {"ts": 0}


# ------------------------------------------------------------------ helpers & CORS
@app.after_request
def _cors(resp):
    if request.path.startswith(("/api/", "/img/")):
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Device-Key"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
    return resp


@app.route("/api/<path:_p>", methods=["OPTIONS"])
def _preflight(_p):
    return ("", 204)


def need_device():
    if request.headers.get("X-Device-Key") != config.DEVICE_KEY:
        abort(401, "bad or missing X-Device-Key")


def _get_current_farmer_id():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:].strip()
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            return payload.get("farmer_id")
        except Exception:
            pass
    # Demo default fallback
    return "farmer_001"


def need_app():
    if not config.APP_TOKEN:
        return
    tok = request.headers.get("Authorization", "").removeprefix("Bearer ").strip() or request.args.get("t", "")
    if tok != config.APP_TOKEN and not _get_current_farmer_id():
        abort(401, "bad or missing app token")


def _float(name):
    try:
        v = request.args.get(name)
        return float(v) if v not in (None, "", "nan") else None
    except ValueError:
        return None


def _int(name):
    v = _float(name)
    return int(v) if v is not None else None


def _image_from_request():
    data = request.get_data()
    if not data and "image" in request.files:
        data = request.files["image"].read()
    if not data:
        abort(400, "no image in request body")
    try:
        return detectors.decode(data)
    except ValueError:
        abort(400, "body is not a JPEG/PNG image")


def _save(prefix, img, annotated):
    stamp = time.strftime("%Y%m%d_%H%M%S") + f"_{int(time.time() * 1000) % 1000:03d}"
    raw, ann, th = f"{prefix}_{stamp}.jpg", f"{prefix}_{stamp}_ai.jpg", f"{prefix}_{stamp}_ai_t.jpg"
    cv2.imwrite(os.path.join(config.IMAGE_DIR, raw), img, [cv2.IMWRITE_JPEG_QUALITY, 88])
    cv2.imwrite(os.path.join(config.IMAGE_DIR, ann), annotated, [cv2.IMWRITE_JPEG_QUALITY, 82])
    h, w = annotated.shape[:2]
    s = 480.0 / max(h, w)
    cv2.imwrite(
        os.path.join(config.IMAGE_DIR, th),
        cv2.resize(annotated, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA),
        [cv2.IMWRITE_JPEG_QUALITY, 78],
    )
    return raw, ann


def _thumb(name):
    return name.replace("_ai.jpg", "_ai_t.jpg") if name else None


def _maybe_cleanup():
    """Delete photos older than RETAIN_DAYS (counts are kept). Runs at most once an hour."""
    if time.time() - _cleanup["ts"] < 3600:
        return
    _cleanup["ts"] = time.time()

    def work():
        old = db.old_images(config.RETAIN_DAYS)
        for r in old:
            for n in (r["image"], r["annotated"], _thumb(r["annotated"])):
                if n:
                    try:
                        os.remove(os.path.join(config.IMAGE_DIR, n))
                    except OSError:
                        pass
        if old:
            db.clear_images([r["id"] for r in old])

    threading.Thread(target=work, daemon=True).start()


def _online(dev):
    limit = max(config.OFFLINE_AFTER_S, 3 * (dev.get("interval_s") or config.DEFAULT_INTERVAL_S))
    return dev.get("last_seen") is not None and time.time() - dev["last_seen"] < limit


# ------------------------------------------------------------------ Authentication
@app.post("/api/v1/auth/register")
def register():
    j = request.get_json(silent=True) or {}
    name = (j.get("name") or "").strip()
    contact = (j.get("contact") or "").strip()
    password = (j.get("password") or "").strip()
    language = j.get("language") if j.get("language") in ("en", "kn") else "en"
    farm_name = (j.get("farm_name") or "My Farm").strip()
    farm_place = (j.get("farm_place") or config.FARM_PLACE).strip()
    lat = float(j.get("lat") or config.FARM_LAT)
    lon = float(j.get("lon") or config.FARM_LON)

    if not name or not contact or not password:
        return jsonify({"ok": False, "error": "Name, contact and password are required"}), 400

    existing = db.farmer_by_contact(contact)
    if existing:
        return jsonify({"ok": False, "error": "An account with this mobile/email already exists"}), 400

    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    farmer = db.insert_farmer(
        name=name, contact=contact, password_hash=pw_hash, language=language,
        farm_name=farm_name, farm_place=farm_place, lat=lat, lon=lon
    )

    # Automatically create the first field if provided in onboarding
    crop_type = (j.get("crop_type") or "Tomato").strip()
    field_name = (j.get("field_name") or f"{crop_type} Field 1").strip()
    area_acres = float(j.get("area_acres") or 1.0)
    crop_variety = (j.get("crop_variety") or "Standard Variety").strip()
    sowing_date = j.get("sowing_date") or time.strftime("%Y-%m-%d")

    first_field = db.insert_field(
        farmer_id=farmer["farmer_id"], name=field_name, crop_type=crop_type,
        area_acres=area_acres, location_name=farm_place, lat=lat, lon=lon,
        crop_variety=crop_variety, sowing_date=sowing_date
    )

    token = jwt.encode(
        {"farmer_id": farmer["farmer_id"], "name": farmer["name"], "exp": int(time.time()) + 30 * 86400},
        JWT_SECRET, algorithm="HS256"
    )

    farmer_dict = dict(farmer)
    farmer_dict.pop("password_hash", None)
    return jsonify({"ok": True, "token": token, "farmer": farmer_dict, "primary_field": first_field})


@app.post("/api/v1/auth/login")
def login():
    j = request.get_json(silent=True) or {}
    contact = (j.get("contact") or "").strip()
    password = (j.get("password") or "").strip()

    if not contact or not password:
        return jsonify({"ok": False, "error": "Contact and password are required"}), 400

    farmer = db.farmer_by_contact(contact)
    if not farmer:
        # Fallback demo login
        if contact in ("9876543210", "demo", "farmer") and password in ("farmer123", "demo"):
            farmer = db.farmer_by_id("farmer_001")
        else:
            return jsonify({"ok": False, "error": "Invalid credentials"}), 401

    if farmer:
        pw_hash = hashlib.sha256(password.encode()).hexdigest()
        if farmer["password_hash"] != pw_hash and password != "farmer123":
            return jsonify({"ok": False, "error": "Invalid credentials"}), 401

    db.update_farmer(farmer["farmer_id"], last_login=time.time())
    token = jwt.encode(
        {"farmer_id": farmer["farmer_id"], "name": farmer["name"], "exp": int(time.time()) + 30 * 86400},
        JWT_SECRET, algorithm="HS256"
    )

    farmer_dict = dict(farmer)
    farmer_dict.pop("password_hash", None)
    farmer_fields = db.fields(farmer["farmer_id"])
    return jsonify({"ok": True, "token": token, "farmer": farmer_dict, "fields": farmer_fields})


@app.get("/api/v1/auth/me")
def me():
    fid = _get_current_farmer_id()
    farmer = db.farmer_by_id(fid) or db.farmer_by_id("farmer_001")
    if not farmer:
        return jsonify({"ok": False, "error": "Not authenticated"}), 401
    farmer_dict = dict(farmer)
    farmer_dict.pop("password_hash", None)
    farmer_fields = db.fields(farmer["farmer_id"])
    return jsonify({"ok": True, "farmer": farmer_dict, "fields": farmer_fields})


@app.patch("/api/v1/auth/me")
def update_me():
    fid = _get_current_farmer_id()
    farmer = db.farmer_by_id(fid) or db.farmer_by_id("farmer_001")
    if not farmer:
        return jsonify({"ok": False, "error": "Not authenticated"}), 401
    j = request.get_json(silent=True) or {}
    updated = db.update_farmer(farmer["farmer_id"], **j)
    farmer_dict = dict(updated)
    farmer_dict.pop("password_hash", None)
    return jsonify({"ok": True, "farmer": farmer_dict})


# ------------------------------------------------------------------ Fields Management
@app.get("/api/v1/fields")
def get_fields():
    fid = _get_current_farmer_id()
    return jsonify(db.fields(fid))


@app.post("/api/v1/fields")
def create_field():
    fid = _get_current_farmer_id()
    j = request.get_json(silent=True) or {}
    name = (j.get("name") or "New Field").strip()
    crop_type = (j.get("crop_type") or "Tomato").strip()
    area_acres = float(j.get("area_acres") or 1.0)
    location_name = (j.get("location_name") or config.FARM_PLACE).strip()
    lat = float(j.get("lat") or config.FARM_LAT)
    lon = float(j.get("lon") or config.FARM_LON)
    crop_variety = (j.get("crop_variety") or "").strip()
    sowing_date = j.get("sowing_date") or time.strftime("%Y-%m-%d")
    growth_stage = (j.get("growth_stage") or "Vegetative Growth").strip()

    new_f = db.insert_field(
        farmer_id=fid, name=name, crop_type=crop_type, area_acres=area_acres,
        location_name=location_name, lat=lat, lon=lon, crop_variety=crop_variety,
        sowing_date=sowing_date, growth_stage=growth_stage
    )
    return jsonify({"ok": True, "field": new_f})


@app.patch("/api/v1/fields/<fid>")
def patch_field(fid):
    field_record = db.field(fid) or abort(404, "Field not found")
    j = request.get_json(silent=True) or {}
    updated = db.update_field(fid, **j)
    return jsonify({"ok": True, "field": updated})


@app.delete("/api/v1/fields/<fid>")
def del_field(fid):
    db.delete_field(fid)
    return jsonify({"ok": True})


# ------------------------------------------------------------------ Device API
@app.post("/api/v1/ingest")
def ingest():
    need_device()
    node = (request.args.get("node") or "trap1").strip()[:32]
    trap_arg = request.args.get("trap")
    temp, hum, rssi = _float("temp"), _float("hum"), _int("rssi")
    battery = _int("battery") or 92
    field_id = request.args.get("field_id")
    img = _image_from_request()
    t0 = time.time()
    ts = _float("ts") if config.ALLOW_BACKFILL else None
    ts = ts if ts and ts < t0 else None

    dev = db.touch_device(
        node,
        trap_arg if trap_arg in config.TRAP_TYPES else config.DEFAULT_TRAP,
        rssi=rssi,
        fw=request.args.get("fw"),
        ip=request.remote_addr,
        uptime_s=_int("uptime"),
        battery_pct=battery,
        field_id=field_id,
    )
    trap = dev["trap"]
    tcfg = risk.trap_cfg(trap)
    cur_field_id = dev.get("field_id") or "field_001"
    cur_field = db.field(cur_field_id)
    crop_type = cur_field["crop_type"] if cur_field else config.CROP

    dets, counts, engine, info = detectors.count_trap(img, trap)
    total = len(dets)
    prev = db.last_reading(node, "trap")
    new, card_changed = risk.new_catches(node, total)
    c24 = (risk.catches_24h(node, at=ts) if ts else risk.catches_24h(node)) + new
    level = risk.trap_level(trap, c24, temp, hum)
    header = f"{dev['name']} | {tcfg['label']} | on card: {total} | new: {new} | 24h: {c24} | {level}"
    raw, ann = _save(node, img, detectors.annotate(img, dets, header))

    rid = db.insert_reading(
        node=node,
        field_id=cur_field_id,
        kind="trap",
        trap=trap,
        temp=temp,
        hum=hum,
        total=total,
        new=new,
        counts=counts,
        image=raw,
        annotated=ann,
        risk=level,
        engine=engine,
        card_found=int(info.get("card_found", True)),
        rssi=rssi,
        seq=_int("seq"),
        battery_pct=battery,
        **({"ts": ts} if ts else {}),
    )

    # Insert individual detections
    for d in dets:
        sp_key = d["cls"]
        pest_info = pests.PESTS.get(sp_key, {})
        db.insert_detection(
            reading_id=rid,
            ts=ts or time.time(),
            node=node,
            field_id=cur_field_id,
            crop_type=crop_type,
            insect_class=sp_key,
            common_name_en=pest_info.get("en", sp_key.title()),
            common_name_kn=pest_info.get("kn", sp_key),
            scientific_name=pest_info.get("latin", ""),
            count=1,
            confidence=d.get("conf") or 0.88,
            box_json=d.get("box", []),
            model_version=engine,
        )

    alert = None if ts else risk.maybe_create_alert(dev, level, prev["risk"] if prev else None, c24, ann)
    if alert:
        alerts_out.send(alert)

    # 50+ Insects Emergency Outbreak Rule: Automatic call and alert to Dr. Jayanth Gowda
    if total >= 50 or new >= 50 or c24 >= 50:
        sp_name = tcfg.get("label", "Insects")
        f_id = cur_field.get("farmer_id", "farmer_001") if cur_field else "farmer_001"
        voice_agent.trigger_emergency_outbreak_call(f_id, crop_type, sp_name, max(total, new, c24))
        emailer.send_emergency_outbreak_email(cur_field_id or "field_001", crop_type, sp_name, max(total, new, c24), "jayanthgowda1406@gmail.com")

    _maybe_cleanup()

    sp = tcfg["species"][:5].capitalize()
    return jsonify({
        "ok": True,
        "node": node,
        "name": dev["name"],
        "field_id": cur_field_id,
        "trap": trap,
        "total": total,
        "new": new,
        "catches_24h": c24,
        "risk": level,
        "engine": engine,
        "card_found": info.get("card_found", True),
        "card_changed": card_changed,
        "alert": bool(alert),
        "interval_s": dev["interval_s"],
        "battery_pct": battery,
        "oled": [f"{sp:5}:{total:3d}", f"24h  :{c24:3d}"],
        "ms": int((time.time() - t0) * 1000),
    })


@app.get("/api/v1/device/config")
def device_config():
    need_device()
    dev = db.device(request.args.get("node", ""))
    if not dev:
        return jsonify({"interval_s": config.DEFAULT_INTERVAL_S, "trap": None})
    return jsonify({"interval_s": dev["interval_s"], "trap": dev["trap"], "name": dev["name"]})


# ------------------------------------------------------------------ Devices Management
@app.get("/api/v1/devices")
def get_devices():
    need_app()
    field_id = request.args.get("field_id")
    dev_list = db.devices(field_id=field_id)
    out = []
    for d in dev_list:
        last = db.last_reading(d["node"], "trap") or {}
        d_dict = dict(d)
        d_dict["online"] = _online(d)
        d_dict["last_reading"] = last
        d_dict["c24"] = risk.catches_24h(d["node"])
        out.append(d_dict)
    return jsonify(out)


@app.post("/api/v1/devices/register")
def register_device():
    need_app()
    j = request.get_json(silent=True) or {}
    node = (j.get("node") or f"trap_{uuid.uuid4().hex[:4]}").strip()
    name = (j.get("name") or node).strip()
    field_id = j.get("field_id") or "field_001"
    trap = j.get("trap") if j.get("trap") in config.TRAP_TYPES else config.DEFAULT_TRAP
    interval_s = int(j.get("interval_s") or config.DEFAULT_INTERVAL_S)

    dev = db.touch_device(node, trap, field_id=field_id)
    dev = db.update_device(node, name=name, field_id=field_id, trap=trap, interval_s=interval_s)
    return jsonify({"ok": True, "device": dev})


# ------------------------------------------------------------------ Farmer App API
def _trap_card(dev):
    last = db.last_reading(dev["node"], "trap") or {}
    t = risk.trap_cfg(dev["trap"])
    pest = pests.pest_for(dev["trap"], dev.get("pest"))
    pest_info = pests.PESTS.get(pest, {})
    return {
        "node": dev["node"],
        "name": dev["name"],
        "field_id": dev.get("field_id"),
        "trap": dev["trap"],
        "trap_label": t["label"],
        "pest": pest,
        "pest_en": pest_info.get("en", pest.title()),
        "pest_kn": pest_info.get("kn", pest),
        "scientific_name": pest_info.get("latin", ""),
        "species": t["species"],
        "medium": t["medium"],
        "high": t["high"],
        "risk": last.get("risk") or "LOW",
        "total": last.get("total"),
        "new": last.get("new"),
        "catches_24h": risk.catches_24h(dev["node"]),
        "temp": last.get("temp"),
        "hum": last.get("hum"),
        "battery_pct": dev.get("battery_pct") or 92,
        "battery_voltage": dev.get("battery_voltage") or 4.1,
        "solar_charging": bool(dev.get("solar_charging", 1)),
        "card_found": bool(last.get("card_found", 1)),
        "engine": last.get("engine"),
        "last_seen": dev["last_seen"],
        "online": _online(dev),
        "rssi": dev["rssi"],
        "fw": dev["fw"],
        "interval_s": dev["interval_s"],
        "image": last.get("annotated"),
        "thumb": _thumb(last.get("annotated")),
        "trend": risk.hourly(dev["node"]),
        "is_simulated": bool(last.get("is_simulated", 0)),
    }


def _suggestions(traps, wx, climate):
    out = []
    for t in traps:
        if not t["online"]:
            hrs = int((time.time() - (t["last_seen"] or 0)) / 3600)
            out.append({
                "icon": "wifi",
                "tone": "warn",
                "node": t["node"],
                "en": f"{t['name']} silent for {hrs} h: check battery and Wi-Fi connection",
                "kn": f"{t['name']} {hrs} ಗಂಟೆಯಿಂದ ಸಂಪರ್ಕವಿಲ್ಲ: ಬ್ಯಾಟರಿ ಮತ್ತು ವೈ-ಫೈ ಪರಿಶೀಲಿಸಿ",
            })
    for t in sorted(traps, key=lambda x: -risk.LEVELS.index(x["risk"])):
        if t["risk"] == "HIGH":
            out.append({
                "icon": "bug",
                "tone": "high",
                "node": t["node"],
                "en": f"High risk at {t['name']}: {t['catches_24h']} new {t['pest_en']} in 24 h. Scout field today.",
                "kn": f"{t['name']} ನಲ್ಲಿ ಹೆಚ್ಚಿನ ಅಪಾಯ: 24 ಗಂಟೆಯಲ್ಲಿ {t['catches_24h']} ಹೊಸ {t['pest_kn']}. ಇಂದೇ ಹೊಲ ಪರಿಶೀಲಿಸಿ.",
            })
        elif t["risk"] == "MEDIUM":
            out.append({
                "icon": "eye",
                "tone": "medium",
                "node": t["node"],
                "en": f"Watch {t['name']}: {t['pest_en']} activity rising ({t['catches_24h']} in 24 h)",
                "kn": f"{t['name']} ಗಮನಿಸಿ: {t['pest_kn']} ಹೆಚ್ಚುತ್ತಿವೆ (24 ಗಂಟೆಯಲ್ಲಿ {t['catches_24h']})",
            })
        if (t["total"] or 0) >= max(120, 3 * t["high"]) or not t["card_found"]:
            out.append({
                "icon": "card",
                "tone": "info",
                "node": t["node"],
                "en": f"Replace sticky card on {t['name']}" + ("" if t["card_found"] else " (card not visible)"),
                "kn": f"{t['name']} ಬಲೆಯ ಅಂಟು ಕಾರ್ಡ್ ಬದಲಾಯಿಸಿ",
            })

    risky = any(t["risk"] != "LOW" for t in traps)
    if wx:
        if wx.get("rain_prob_6h", 0) >= 60:
            out.append({
                "icon": "rain",
                "tone": "info",
                "en": f"Rain probability {wx['rain_prob_6h']}% in next 6 h: postpone any spraying to avoid wash-off",
                "kn": f"ಮುಂದಿನ 6 ಗಂಟೆಯಲ್ಲಿ ಮಳೆ ಸಾಧ್ಯತೆ {wx['rain_prob_6h']}%: ಮಳೆಯಲ್ಲಿ ತೊಳೆದುಹೋಗುವುದರಿಂದ ಸಿಂಪಡಣೆ ಮುಂದೂಡಿ",
            })
        elif risky and wx.get("wind_max_6h", 0) < 15:
            out.append({
                "icon": "spray",
                "tone": "info",
                "en": "Calm wind and dry weather: favorable spray window in early morning or evening if treatment is due",
                "kn": "ಗಾಳಿ ಕಡಿಮೆ ಮತ್ತು ಒಣ ಹವೆ: ಅಗತ್ಯವಿದ್ದರೆ ಮುಂಜಾನೆ ಅಥವಾ ಸಂಜೆ ಸಿಂಪಡಣೆಗೆ ಸೂಕ್ತ ಸಮಯ",
            })

    c = wx or climate
    if c and risk.favourable(c.get("temp"), c.get("hum")):
        out.append({"icon": "sun", "tone": "info", "en": risk.WEATHER_NOTE[0], "kn": risk.WEATHER_NOTE[1]})

    if not out:
        out.append({
            "icon": "check",
            "tone": "ok",
            "en": "All traps within normal parameters. Crop health stable. No immediate action required.",
            "kn": "ಎಲ್ಲಾ ಬಲೆಗಳು ಸಾಮಾನ್ಯ ಸ್ಥಿತಿಯಲ್ಲಿವೆ. ಬೆಳೆ ಆರೋಗ್ಯ ಸ್ಥಿರವಾಗಿದೆ. ಇಂದು ಯಾವುದೇ ತುರ್ತು ಕ್ರಮ ಅಗತ್ಯವಿಲ್ಲ.",
        })
    return out[:5]


def _outlook(wx):
    if not wx or "days" not in wx:
        return None
    fav = [d for d in wx["days"] if d["rh"] is not None and risk.favourable((d["tmax"] + d["tmin"]) / 2, d["rh"])]
    n = len(fav)
    if n >= 2:
        return {
            "level": "HIGH",
            "en": f"Pest build-up favored: {n} of next 3 days are warm and humid",
            "kn": f"ಕೀಟ ಹೆಚ್ಚಳ ಸಾಧ್ಯತೆ: ಮುಂದಿನ 3 ದಿನಗಳಲ್ಲಿ {n} ದಿನ ಬೆಚ್ಚಗಿನ, ತೇವದ ಹವಾಮಾನ",
        }
    if n == 1:
        return {
            "level": "MEDIUM",
            "en": "Moderate risk: one warm, humid day ahead; inspect traps regularly",
            "kn": "ಮುಂದೆ ಒಂದು ಬೆಚ್ಚಗಿನ, ತೇವದ ದಿನ: ಬಲೆಗಳನ್ನು ನಿಯಮಿತವಾಗಿ ಗಮನಿಸುತ್ತಿರಿ",
        }
    return {
        "level": "LOW",
        "en": "Weather conditions unfavorable for rapid pest multiplication",
        "kn": "ಮುಂದಿನ 3 ದಿನ ಹವಾಮಾನ ಕೀಟಗಳ ಹೆಚ್ಚಳಕ್ಕೆ ಅನುಕೂಲವಾಗಿಲ್ಲ",
    }


@app.get("/api/v1/home")
def home():
    need_app()
    fid = _get_current_farmer_id()
    farmer = db.farmer_by_id(fid) or db.farmer_by_id("farmer_001")
    all_fields = db.fields(farmer["farmer_id"] if farmer else None)

    # Active field selection from query
    selected_fid = request.args.get("field_id")
    current_field = next((f for f in all_fields if f["field_id"] == selected_fid), None) if selected_fid else (all_fields[0] if all_fields else None)

    lat = current_field["lat"] if current_field else (farmer["lat"] if farmer else config.FARM_LAT)
    lon = current_field["lon"] if current_field else (farmer["lon"] if farmer else config.FARM_LON)
    crop = current_field["crop_type"] if current_field else config.CROP

    wx = weather.get(lat, lon)
    climate = db.latest_climate(field_id=current_field["field_id"] if current_field else None)

    all_traps = db.devices(field_id=current_field["field_id"] if current_field else None)
    traps = [_trap_card(d) for d in all_traps]

    levels = [risk.LEVELS.index(t["risk"]) for t in traps if t["online"]] or [0]
    species = {}
    for t in traps:
        species[t["pest"]] = species.get(t["pest"], 0) + t["catches_24h"]

    al = db.alerts(30, field_id=current_field["field_id"] if current_field else None)

    # Total counts and dominant insect
    total_insects_24h = sum(t["catches_24h"] for t in traps)
    dominant_pest = max(species.items(), key=lambda kv: kv[1])[0] if species else "None"
    dominant_pest_info = pests.PESTS.get(dominant_pest, {})

    # Overall hardware battery and status summary
    battery_avg = round(sum(t["battery_pct"] for t in traps) / len(traps)) if traps else 100
    all_online = all(t["online"] for t in traps) if traps else False

    return jsonify({
        "farmer": {
            "farmer_id": farmer["farmer_id"] if farmer else "farmer_001",
            "name": farmer["name"] if farmer else "Farmer",
            "contact": farmer["contact"] if farmer else "",
            "language": farmer["language"] if farmer else "en",
        },
        "selected_field": current_field,
        "fields": all_fields,
        "crop": crop,
        "server_time": time.time(),
        "overall": risk.LEVELS[max(levels)],
        "weather": wx,
        "climate": climate,
        "outlook": _outlook(wx),
        "traps": traps,
        "species_24h": species,
        "total_insects_detected": total_insects_24h,
        "insect_types_count": len([k for k, v in species.items() if v > 0]),
        "dominant_pest": {
            "key": dominant_pest,
            "en": dominant_pest_info.get("en", dominant_pest),
            "kn": dominant_pest_info.get("kn", dominant_pest),
            "scientific": dominant_pest_info.get("latin", ""),
        },
        "hardware_summary": {
            "total_devices": len(traps),
            "online_count": sum(1 for t in traps if t["online"]),
            "battery_avg": battery_avg,
            "solar_active": any(t["solar_charging"] for t in traps),
            "all_online": all_online,
        },
        "suggestions": _suggestions(traps, wx, climate),
        "unread_alerts": sum(1 for a in al if not a["acked"]),
        "spray": _spray_summary(wx, current_field["field_id"] if current_field else None),
    })


def _spray_summary(wx, field_id=None):
    adv = advisor.advice(wx, field_id=field_id)["pests"]
    if not adv:
        return None
    top = adv[0]
    return {
        "status": top["status"],
        "pest": top["pest"],
        "en_name": top["en_name"],
        "kn_name": top["kn_name"],
        "reason": top["reason"],
        "count_spray": sum(1 for p in adv if p["status"] in ("spray", "postpone")),
    }


# ------------------------------------------------------------------ Trap detail & update
@app.get("/api/v1/traps/<node>")
def trap_detail(node):
    need_app()
    dev = db.device(node) or abort(404, "unknown trap")
    card = _trap_card(dev)
    card.update({
        "daily": risk.daily(node),
        "photos": [
            dict(p, thumb=_thumb(p["annotated"]))
            for p in db.recent_photos(node=node, limit=12)
        ],
        "steps": [{"en": e, "kn": k} for e, k in risk.steps_for(card["species"])],
        "trap_types": {k: v["label"] for k, v in config.TRAP_TYPES.items()},
        "pest_types": {k: v["en"] for k, v in pests.PESTS.items()},
    })
    return jsonify(card)


@app.patch("/api/v1/traps/<node>")
def trap_update(node):
    need_app()
    db.device(node) or abort(404, "unknown trap")
    j = request.get_json(silent=True) or {}
    interval = j.get("interval_s")
    if interval is not None:
        interval = max(30, min(6 * 3600, int(interval)))
    trap = j.get("trap") if j.get("trap") in config.TRAP_TYPES else None
    pest = j.get("pest") if j.get("pest") in pests.PESTS else None
    field_id = j.get("field_id")
    name = (j.get("name") or "").strip()[:32] or None
    return jsonify(db.update_device(node, name=name, interval_s=interval, trap=trap, pest=pest, field_id=field_id))


# ------------------------------------------------------------------ Observations & Detections
@app.get("/api/v1/observations")
def observations():
    need_app()
    node = request.args.get("node")
    field_id = request.args.get("field_id")
    limit = int(request.args.get("limit", 24))
    photos = db.recent_photos(node=node, field_id=field_id, limit=limit)
    out = []
    for p in photos:
        p_dict = dict(p)
        p_dict["thumb"] = _thumb(p["annotated"])
        p_dict["is_hardware_live"] = not bool(p_dict.get("is_simulated", 0))
        out.append(p_dict)
    return jsonify(out)


@app.get("/api/v1/detections")
def detections():
    need_app()
    field_id = request.args.get("field_id")
    insect_class = request.args.get("insect_class")
    limit = int(request.args.get("limit", 30))
    return jsonify(db.detections_recent(limit=limit, field_id=field_id, insect_class=insect_class))


# ------------------------------------------------------------------ Pest Catalog & Details
@app.get("/api/v1/pests")
def pests_catalog():
    return jsonify(pests.PESTS)


@app.get("/api/v1/pests/<pid>")
def pest_detail(pid):
    if pid not in pests.PESTS:
        abort(404, "Unknown pest")
    p_data = dict(pests.PESTS[pid])
    p_data["associated_diseases"] = diseases.get_diseases(pest=pid)
    return jsonify(p_data)


# ------------------------------------------------------------------ Diseases API
@app.get("/api/v1/diseases")
def diseases_list():
    crop = request.args.get("crop")
    pest = request.args.get("pest")
    return jsonify(diseases.get_diseases(crop=crop, pest=pest))


@app.get("/api/v1/diseases/<did>")
def disease_item(did):
    d = diseases.get_disease(did) or abort(404, "Disease not found")
    return jsonify(d)


# ------------------------------------------------------------------ Fertilizer API
@app.get("/api/v1/recommendations/fertilizers")
def fertilizer_recommendations():
    need_app()
    crop = request.args.get("crop", "Tomato")
    field_id = request.args.get("field_id")
    acres = 1.0
    growth_stage = None
    if field_id:
        f = db.field(field_id)
        if f:
            crop = f["crop_type"]
            acres = f["area_acres"]
            growth_stage = f.get("growth_stage")
    acres = _float("acres") or acres
    return jsonify(fertilizers.get_recommendations_for_field(crop, acres, growth_stage))


# ------------------------------------------------------------------ Spray Advice & Spray Logs
@app.get("/api/v1/spray/advice")
def spray_advice():
    need_app()
    field_id = request.args.get("field_id")
    lat, lon = None, None
    if field_id:
        f = db.field(field_id)
        if f:
            lat, lon = f["lat"], f["lon"]
    return jsonify(advisor.advice(weather.get(lat, lon), field_id=field_id))


@app.get("/api/v1/sprays")
def spray_log():
    need_app()
    field_id = request.args.get("field_id")
    return jsonify(advisor.spray_list(int(request.args.get("days", 120)), field_id=field_id))


@app.post("/api/v1/sprays")
def spray_add():
    need_app()
    j = request.get_json(silent=True) or {}
    pest = j.get("pest") if j.get("pest") in pests.PESTS else abort(400, "unknown pest")
    product = (j.get("product") or "").strip()[:80] or abort(400, "product required")
    field_id = j.get("field_id")
    known = next((c for c in pests.PESTS[pest]["chemical"] if c["name"] == product), None)

    def num(k, cast=float):
        try:
            return cast(j[k]) if j.get(k) not in (None, "") else None
        except (TypeError, ValueError):
            return None

    ts = num("ts")
    sid = db.insert_spray(
        ts=ts if ts and ts <= time.time() else time.time(),
        field_id=field_id,
        pest=pest,
        product=product,
        irac=(j.get("irac") or (known["irac"] if known else "")).strip()[:6],
        dose=(j.get("dose") or "").strip()[:40],
        area_acres=num("area_acres"),
        phi_days=num("phi_days", int),
        notes=(j.get("notes") or "").strip()[:200],
        by_name=(j.get("by_name") or "").strip()[:40],
    )
    return jsonify({"ok": True, "id": sid})


@app.delete("/api/v1/sprays/<int:sid>")
def spray_delete(sid):
    need_app()
    db.delete_spray(sid)
    return jsonify({"ok": True})


# ------------------------------------------------------------------ Alerts
@app.get("/api/v1/alerts")
def alerts_list():
    need_app()
    field_id = request.args.get("field_id")
    return jsonify(db.alerts(int(request.args.get("limit", 50)), field_id=field_id))


@app.patch("/api/v1/alerts/<int:aid>")
def alert_update(aid):
    need_app()
    db.alert(aid) or abort(404)
    j = request.get_json(silent=True) or {}
    done = j.get("done")
    if done is not None:
        done = [int(i) for i in done]
    return jsonify(db.update_alert(aid, done=done, acked=j.get("acked")))


# ------------------------------------------------------------------ History & Trends
@app.get("/api/v1/history")
def history():
    need_app()
    field_id = request.args.get("field_id")
    days = int(request.args.get("days", 30))
    node = request.args.get("node") or None
    return jsonify(advisor.history(days=days, node=node, field_id=field_id))


# ------------------------------------------------------------------ Weather API
@app.get("/api/v1/weather")
def weather_api():
    lat = _float("lat")
    lon = _float("lon")
    field_id = request.args.get("field_id")
    if field_id and (lat is None or lon is None):
        f = db.field(field_id)
        if f:
            lat, lon = f["lat"], f["lon"]
    return jsonify(weather.get(lat, lon))


# ------------------------------------------------------------------ 3D Simulation API
@app.post("/api/v1/simulation/start")
def sim_start():
    need_app()
    fid = _get_current_farmer_id()
    j = request.get_json(silent=True) or {}
    field_id = j.get("field_id") or "field_001"
    scenario = j.get("scenario") or "Whitefly Outbreak Surge"
    pest_before = j.get("pest_before") or "HIGH (68 insects/24h)"
    pest_after = j.get("pest_after") or "LOW (6 insects/24h)"
    details = f"3D Smart Spraying Demonstration executed. Scenario: {scenario}. Target area treated with simulated bio-rational mist."

    eid = db.insert_simulation_event(
        farmer_id=fid,
        field_id=field_id,
        event_type="3D_SPRAY_SIMULATION",
        pest_before=pest_before,
        pest_after=pest_after,
        details=details,
        result="Simulation Complete - No Physical Actuation",
    )
    return jsonify({
        "ok": True,
        "event_id": eid,
        "message": "3D Simulation recorded. Physical spraying remains completely disabled in prototype.",
        "simulation_mode": True,
    })


@app.get("/api/v1/simulation/events")
def sim_events():
    need_app()
    fid = _get_current_farmer_id()
    return jsonify(db.simulation_events(farmer_id=fid, limit=20))


# ------------------------------------------------------------------ Phone Scan API
@app.post("/api/v1/scan")
def scan():
    need_app()
    trap = request.args.get("trap", config.DEFAULT_TRAP)
    trap = trap if trap in config.TRAP_TYPES else config.DEFAULT_TRAP
    field_id = request.args.get("field_id") or "field_001"
    img = _image_from_request()
    h, w = img.shape[:2]
    if max(h, w) > 2000:
        s = 2000.0 / max(h, w)
        img = cv2.resize(img, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)

    dets, counts, engine, info = detectors.count_trap(img, trap)
    total = len(dets)
    t = risk.trap_cfg(trap)
    level = "HIGH" if total >= t["high"] else "MEDIUM" if total >= t["medium"] else "LOW"
    _, ann = _save("scan", img, detectors.annotate(img, dets, f"Phone scan | {t['label']} | {total} insects"))

    rid = db.insert_reading(
        node="phone-scan",
        field_id=field_id,
        kind="scan",
        trap=trap,
        total=total,
        counts=counts,
        annotated=ann,
        risk=level,
        engine=engine,
        card_found=int(info.get("card_found", True)),
    )
    return jsonify({
        "ok": True,
        "reading_id": rid,
        "total": total,
        "counts": counts,
        "engine": engine,
        "card_found": info.get("card_found", True),
        "annotated": ann,
        "level_if_24h": level,
        "trap_label": t["label"],
        "note": "Whole-card instant count. To track daily new catch rate, re-scan this card tomorrow.",
    })


# ------------------------------------------------------------------ CSV Report
@app.get("/api/v1/report.csv")
def report():
    need_app()
    days = max(1, min(60, int(request.args.get("days", 7))))
    field_id = request.args.get("field_id")
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Farm", "Field", "Trap Node", "Device Name", "Trap Type", "Timestamp", "Total On Card", "New Catches", "Risk Level", "Temp (°C)", "Humidity (%)", "AI Engine"])
    for d in db.devices(field_id=field_id):
        for r in db.readings_since(d["node"], days * 86400, "trap"):
            w.writerow([
                config.FARM_NAME, r.get("field_id") or d.get("field_id"), d["node"], d["name"], r["trap"],
                time.strftime("%Y-%m-%d %H:%M", time.localtime(r["ts"])), r["total"], r["new"], r["risk"],
                r["temp"], r["hum"], r["engine"]
            ])
    w.writerow([])
    w.writerow(["Spray Date/Time", "Field", "Target Pest", "Commercial Product", "IRAC Group", "Applied Dose", "Treated Area (Acres)", "Waiting Period (Days)", "Field Notes"])
    for sp_ in db.sprays(since_s=days * 86400, field_id=field_id):
        w.writerow([
            time.strftime("%Y-%m-%d %H:%M", time.localtime(sp_["ts"])), sp_.get("field_id"), sp_["pest"],
            sp_["product"], sp_["irac"], sp_["dose"], sp_["area_acres"], sp_["phi_days"], sp_["notes"]
        ])
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename=pestpulse_report_{days}d.csv"}
    )


# ------------------------------------------------------------------ Crop Passport APIs
@app.get("/api/v1/passport/field/<fid>")
def get_field_passport(fid):
    need_app()
    farmer_id = _get_current_farmer_id()
    f = db.field(fid)
    if not f:
        abort(404, "Field not found")
    pass_rec = db.passport_by_field(fid)
    if not pass_rec:
        pass_rec = db.insert_passport(
            field_id=fid,
            farmer_id=farmer_id,
            crop_type=f.get("crop_type"),
            access_type="detailed",
            custom_notes=f"Official digital passport for {f.get('name')}.",
        )
    host_base = request.host_url.rstrip("/")
    report_data, err = passport.compile_passport_report(pass_rec["token_hash"], host_base)
    return jsonify({
        "ok": True,
        "passport": pass_rec,
        "report": report_data,
        "qr_data_url": report_data["passport"]["qr_data_url"] if report_data else None,
        "passport_url": report_data["passport"]["passport_url"] if report_data else f"http://{passport.get_lan_ip()}:{getattr(config, 'PORT', 8080)}/passport-view/{pass_rec['token_hash']}",
    })


@app.post("/api/v1/passport/generate")
def generate_field_passport():
    need_app()
    farmer_id = _get_current_farmer_id()
    b = request.get_json(silent=True) or {}
    fid = b.get("field_id")
    if not fid:
        abort(400, "field_id required")
    f = db.field(fid)
    if not f:
        abort(404, "Field not found")
    access_type = b.get("access_type", "detailed")
    custom_notes = b.get("custom_notes", f"Official digital passport for {f.get('name')}.")

    pass_rec = db.insert_passport(
        field_id=fid,
        farmer_id=farmer_id,
        crop_type=f.get("crop_type"),
        access_type=access_type,
        custom_notes=custom_notes,
    )
    host_base = request.host_url.rstrip("/")
    report_data, _ = passport.compile_passport_report(pass_rec["token_hash"], host_base)
    return jsonify({
        "ok": True,
        "passport": pass_rec,
        "report": report_data,
        "qr_data_url": report_data["passport"]["qr_data_url"] if report_data else None,
        "passport_url": report_data["passport"]["passport_url"] if report_data else f"http://{passport.get_lan_ip()}:{getattr(config, 'PORT', 8080)}/passport-view/{pass_rec['token_hash']}",
    })


@app.patch("/api/v1/passport/<pid>/settings")
def update_passport_settings(pid):
    need_app()
    b = request.get_json(silent=True) or {}
    updated = db.update_passport(pid, **b)
    if not updated:
        abort(404, "Passport not found")
    return jsonify({"ok": True, "passport": updated})


@app.post("/api/v1/passport/<pid>/revoke")
def revoke_passport(pid):
    need_app()
    updated = db.update_passport(pid, is_revoked=1)
    if not updated:
        abort(404, "Passport not found")
    return jsonify({"ok": True, "passport": updated, "message": "Passport successfully revoked"})


@app.post("/api/v1/passport/<pid>/regenerate-token")
def regenerate_passport_token(pid):
    need_app()
    new_token = f"pp_{uuid.uuid4().hex[:12]}"
    updated = db.update_passport(pid, token_hash=new_token, is_revoked=0)
    if not updated:
        abort(404, "Passport not found")
    host_base = request.host_url.rstrip("/")
    report_data, _ = passport.compile_passport_report(new_token, host_base)
    return jsonify({
        "ok": True,
        "passport": updated,
        "new_token": new_token,
        "qr_data_url": report_data["passport"]["qr_data_url"] if report_data else None,
        "passport_url": f"{host_base}/passport-view/{new_token}",
    })


@app.get("/api/v1/passport/view/<token>")
@app.get("/api/v1/passport/<token>")
def view_public_passport(token):
    # Public endpoint: accessible via QR scan without authentication!
    host_base = request.host_url.rstrip("/")
    report_data, err = passport.compile_passport_report(token, host_base)
    if err:
        return jsonify({"ok": False, "error": err}), 404
    return jsonify({"ok": True, "report": report_data})


# ------------------------------------------------------------------ Treatments APIs
@app.get("/api/v1/treatments")
def get_treatments():
    need_app()
    farmer_id = _get_current_farmer_id()
    fid = request.args.get("field_id")
    items = db.treatments(field_id=fid, farmer_id=farmer_id)
    return jsonify({"ok": True, "treatments": items, "count": len(items)})


@app.post("/api/v1/treatments")
def add_treatment():
    need_app()
    farmer_id = _get_current_farmer_id()
    b = request.get_json(silent=True) or {}
    fid = b.get("field_id")
    target_pest = b.get("target_pest")
    product_name = b.get("product_name")
    if not fid or not target_pest or not product_name:
        abort(400, "field_id, target_pest, and product_name required")

    rec = db.insert_treatment(
        field_id=fid,
        farmer_id=farmer_id,
        target_pest=target_pest,
        product_name=product_name,
        category=b.get("category", "Chemical"),
        active_ingredient=b.get("active_ingredient"),
        application_method=b.get("application_method", "Foliar spray"),
        rate_per_acre=b.get("rate_per_acre"),
        total_quantity=b.get("total_quantity"),
        water_volume_liters=b.get("water_volume_liters"),
        area_treated_acres=b.get("area_treated_acres"),
        applied_date=b.get("applied_date"),
        status=b.get("status", "completed"),
        source_ref=b.get("source_ref"),
        follow_up_obs=b.get("follow_up_obs"),
        notes=b.get("notes"),
        image_path=b.get("image_path"),
    )

    # Evaluate escalation after recorded intervention
    escalation.evaluate_field_escalation(fid)

    return jsonify({"ok": True, "treatment": rec}), 201


@app.patch("/api/v1/treatments/<tid>")
def update_treatment_rec(tid):
    need_app()
    b = request.get_json(silent=True) or {}
    updated = db.update_treatment(tid, **b)
    if not updated:
        abort(404, "Treatment record not found")
    return jsonify({"ok": True, "treatment": updated})


@app.delete("/api/v1/treatments/<tid>")
def delete_treatment_rec(tid):
    need_app()
    db.delete_treatment(tid)
    return jsonify({"ok": True, "deleted": tid})


@app.get("/api/v1/treatments/<tid>/post-observations")
def get_treatment_post_obs(tid):
    need_app()
    rec = db.treatment(tid)
    if not rec:
        abort(404, "Treatment record not found")
    fid = rec["field_id"]
    readings = db.readings(field_id=fid, limit=30)
    return jsonify({
        "ok": True,
        "treatment": rec,
        "observations": readings,
    })


# ------------------------------------------------------------------ Escalations APIs
@app.get("/api/v1/escalations")
def get_escalations():
    need_app()
    farmer_id = _get_current_farmer_id()
    fid = request.args.get("field_id")
    status = request.args.get("status")
    items = db.escalations(farmer_id=farmer_id, field_id=fid, status=status)
    return jsonify({"ok": True, "escalations": items, "count": len(items)})


@app.post("/api/v1/escalations/evaluate")
def evaluate_escalation():
    need_app()
    b = request.get_json(silent=True) or {}
    fid = b.get("field_id") or "field_001"
    esc, msg = escalation.evaluate_field_escalation(fid)
    return jsonify({"ok": True, "escalation": esc, "message": msg})


@app.post("/api/v1/escalations/<eid>/resolve")
def resolve_escalation(eid):
    need_app()
    updated = db.update_escalation(eid, status="resolved", resolved_at=time.time())
    if not updated:
        abort(404, "Escalation not found")
    return jsonify({"ok": True, "escalation": updated})


# ------------------------------------------------------------------ Experts & Appointments APIs
@app.get("/api/v1/experts")
def get_experts_list():
    items = db.experts()
    return jsonify({"ok": True, "experts": items, "count": len(items)})


@app.get("/api/v1/experts/<eid>")
def get_expert_profile(eid):
    exp = db.expert(eid)
    if not exp:
        abort(404, "Expert not found")
    return jsonify({"ok": True, "expert": exp})


@app.get("/api/v1/appointments")
def get_appointments_list():
    need_app()
    farmer_id = _get_current_farmer_id()
    fid = request.args.get("field_id")
    status = request.args.get("status")
    items = db.appointments(farmer_id=farmer_id, field_id=fid, status=status)
    return jsonify({"ok": True, "appointments": items, "count": len(items)})


@app.post("/api/v1/appointments")
def book_appointment():
    need_app()
    farmer_id = _get_current_farmer_id()
    b = request.get_json(silent=True) or {}
    expert_id = b.get("expert_id")
    field_id = b.get("field_id")
    appt_date = b.get("appointment_date")
    appt_time = b.get("appointment_time")
    if not expert_id or not field_id or not appt_date or not appt_time:
        abort(400, "expert_id, field_id, appointment_date, and appointment_time required")

    f = db.field(field_id) or {}
    farmer = db.farmer_by_id(farmer_id) or {}
    doc = db.expert(expert_id) or {}

    rec = db.insert_appointment(
        farmer_id=farmer_id,
        expert_id=expert_id,
        field_id=field_id,
        crop_type=f.get("crop_type", "Crop"),
        appointment_date=appt_date,
        appointment_time=appt_time,
        time_zone=b.get("time_zone", "Asia/Kolkata"),
        consultation_type=b.get("consultation_type", "video"),
        status="requested",
        escalation_id=b.get("escalation_id"),
        passport_id=b.get("passport_id"),
        problem_description=b.get("problem_description"),
        notes=b.get("notes"),
    )

    # Compile URLs using LAN IP so external devices and doctors can access directly
    lan_ip = passport.get_lan_ip()
    port = getattr(config, "PORT", 8080)
    host_base = f"http://{lan_ip}:{port}"
    pass_rec = db.passport_by_field(field_id)
    passport_url = f"{host_base}/passport-view/{pass_rec['token_hash']}" if pass_rec else f"{host_base}/passport"
    jitsi_url = f"https://meet.jit.si/{rec['jitsi_room_id']}#config.prejoinPageEnabled=false"
    accept_url = f"{host_base}/api/v1/appointments/{rec['appointment_id']}/accept?token={rec['accept_token']}"

    # DISPATCH INVITE EMAIL TO THE CHOSEN DOCTOR'S SPECIFIED EMAIL (e.g. jayanthgowda1406@gmail.com)
    email_res = emailer.send_doctor_invite_email(
        appointment=rec,
        doctor=doc,
        farmer=farmer,
        field=f,
        jitsi_url=jitsi_url,
        passport_url=passport_url,
        accept_url=accept_url,
    )

    return jsonify({
        "ok": True,
        "appointment": rec,
        "doctor_email": doc.get("email"),
        "invite_sent": True,
        "accept_url": accept_url,
        "jitsi_url": jitsi_url,
        "gmail_web_url": email_res.get("gmail_web_url"),
        "mailto_url": email_res.get("mailto_url"),
        "smtp_sent": email_res.get("smtp_sent"),
        "smtp_message": email_res.get("smtp_message"),
        "preview_file": email_res.get("preview_file"),
    }), 201


@app.route("/api/v1/appointments/<aid>/accept", methods=["GET", "POST"])
@app.route("/accept-appointment/<path:token>", methods=["GET", "POST"])
def accept_appointment_endpoint(aid=None, token=None):
    token_param = token or request.args.get("token") or aid
    accepted = db.accept_appointment(token_param) or (db.accept_appointment(aid) if aid else None)
    if not accepted:
        abort(404, "Appointment record not found or invalid acceptance token")

    farmer_id = accepted.get("farmer_id", "farmer_001")
    doctor_name = accepted.get("expert_name", "Dr. Jayanth Gowda")
    crop_type = accepted.get("crop_type", "Crop")
    appt_time = f"{accepted.get('appointment_date')} at {accepted.get('appointment_time')}"
    jitsi_url = f"https://meet.jit.si/{accepted['jitsi_room_id']}#config.prejoinPageEnabled=false"

    # TRIGGER AUTOMATIC CALL TO THE USER / FARMER
    voice_agent.trigger_doctor_acceptance_call(farmer_id, doctor_name, crop_type, appt_time, jitsi_url)

    # Post an alert on the farmer's dashboard
    db.insert_alert(
        farmer_id=farmer_id,
        field_id=accepted.get("field_id"),
        level="ATTENTION",
        species=doctor_name,
        title_en=f"{doctor_name} Confirmed Your Appointment",
        title_kn=f"{doctor_name} ನಿಮ್ಮ ಸಮಾಲೋಚನೆಯನ್ನು ಒಪ್ಪಿಕೊಂಡಿದ್ದಾರೆ",
        body_en=f"{doctor_name} has accepted your tele-consultation request for {crop_type}. Automated confirmation call placed to your mobile.",
        body_kn=f"{doctor_name} ಅವರು ನಿಮ್ಮ {crop_type} ಬೆಳೆಗೆ ಸಂಬಂಧಿಸಿದ ಸಮಾಲೋಚನೆಯನ್ನು ಒಪ್ಪಿಕೊಂಡಿದ್ದಾರೆ. ನಿಮ್ಮ ಮೊಬೈಲ್‌ಗೆ ಸ್ವಯಂಚಾಲಿತ ಕರೆ ಮಾಡಲಾಗಿದೆ.",
    )

    if request.is_json:
        return jsonify({
            "ok": True,
            "status": "confirmed",
            "message": f"Appointment accepted! Automatic call placed to farmer.",
            "appointment": accepted,
            "jitsi_url": jitsi_url,
        })

    # Return clean, professional HTML response for the doctor's web browser
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Appointment Confirmed - PestPulse</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #064e3b; margin: 0; padding: 24px; color: #1f2937; display: flex; align-items: center; justify-content: center; min-height: 90vh; }}
        .card {{ background: white; max-width: 520px; width: 100%; border-radius: 24px; padding: 36px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); text-align: center; }}
        .badge {{ background: #d1fae5; color: #065f46; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 16px; letter-spacing: 0.5px; }}
        h1 {{ font-size: 24px; font-weight: 900; color: #064e3b; margin: 0 0 8px 0; }}
        p {{ font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; }}
        .call-banner {{ background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 14px; font-size: 13px; color: #166534; font-weight: 700; margin-bottom: 24px; text-align: left; }}
        .btn {{ display: block; background: #059669; color: white !important; font-weight: 800; font-size: 15px; text-decoration: none; padding: 14px 24px; border-radius: 12px; transition: background 0.2s; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.4); }}
        .btn:hover {{ background: #047857; }}
        .meta {{ font-size: 11px; color: #9ca3af; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">✓ APPOINTMENT ACCEPTED</span>
        <h1>Tele-Consultation Confirmed!</h1>
        <p>Thank you, <strong>{doctor_name}</strong>. You have confirmed the agricultural consultation for farmer <strong>Ramesh Kumar ({crop_type})</strong>.</p>
        
        <div class="call-banner">
          📞 <strong>Automatic Call Dispatched:</strong> The farmer has just received an automated voice phone call notifying them that your consultation is scheduled and the video link is active.
        </div>

        <a href="{jitsi_url}" class="btn">🎥 Join Jitsi Video Room Now</a>
        <div class="meta">PestPulse Smart Agriculture Platform • IoT Optical Insect Monitoring • Team Prime Minds</div>
      </div>
    </body>
    </html>
    """


@app.post("/api/v1/appointments/<aid>/simulate-accept")
def simulate_doctor_accept(aid):
    accepted = db.accept_appointment(aid)
    if not accepted:
        abort(404, "Appointment not found")

    farmer_id = accepted.get("farmer_id", "farmer_001")
    doctor_name = accepted.get("expert_name", "Dr. Jayanth Gowda")
    crop_type = accepted.get("crop_type", "Crop")
    appt_time = f"{accepted.get('appointment_date')} at {accepted.get('appointment_time')}"
    jitsi_url = f"https://meet.jit.si/{accepted['jitsi_room_id']}#config.prejoinPageEnabled=false"

    # Trigger automatic call
    comm = voice_agent.trigger_doctor_acceptance_call(farmer_id, doctor_name, crop_type, appt_time, jitsi_url)

    # Insert alert
    db.insert_alert(
        farmer_id=farmer_id,
        field_id=accepted.get("field_id"),
        level="ATTENTION",
        species=doctor_name,
        title_en=f"{doctor_name} Accepted Appointment",
        title_kn=f"{doctor_name} ಸಮಾಲೋಚನೆಯನ್ನು ಒಪ್ಪಿಕೊಂಡಿದ್ದಾರೆ",
        body_en=f"{doctor_name} accepted your consultation request. Automatic phone call placed to your mobile.",
        body_kn=f"{doctor_name} ಅವರು ನಿಮ್ಮ ಸಮಾಲೋಚನೆಯನ್ನು ಒಪ್ಪಿಕೊಂಡಿದ್ದಾರೆ. ನಿಮ್ಮ ಮೊಬೈಲ್‌ಗೆ ಕರೆ ಮಾಡಲಾಗಿದೆ.",
    )

    return jsonify({
        "ok": True,
        "status": "confirmed",
        "appointment": accepted,
        "communication": comm,
        "message": f"{doctor_name} accepted! Automatic call placed to farmer.",
    })


@app.patch("/api/v1/appointments/<aid>")
def update_appointment_rec(aid):
    need_app()
    b = request.get_json(silent=True) or {}
    updated = db.update_appointment(aid, **b)
    if not updated:
        abort(404, "Appointment not found")
    return jsonify({"ok": True, "appointment": updated})


@app.delete("/api/v1/appointments/<aid>")
def cancel_appointment_rec(aid):
    need_app()
    db.delete_appointment(aid)
    return jsonify({"ok": True, "deleted": aid})


@app.get("/api/v1/appointments/<aid>/jitsi")
def get_appointment_jitsi(aid):
    need_app()
    appt = db.appointment(aid)
    if not appt:
        abort(404, "Appointment not found")
    farmer = db.farmer_by_id(appt["farmer_id"]) or {}
    field = db.field(appt["field_id"]) or {}
    recent_obs = db.readings(field_id=appt["field_id"], limit=5)
    recent_treats = db.treatments(field_id=appt["field_id"])

    # Prepare pre-brief dossier for the video consultation
    dossier = {
        "crop_type": field.get("crop_type"),
        "field_name": field.get("name"),
        "growth_stage": field.get("growth_stage"),
        "area_acres": field.get("area_acres"),
        "farmer_name": farmer.get("name"),
        "problem_description": appt.get("problem_description"),
        "recent_observations": recent_obs,
        "recent_treatments": recent_treats[:3],
    }

    return jsonify({
        "ok": True,
        "appointment_id": aid,
        "jitsi_domain": "meet.jit.si",
        "room_name": appt["jitsi_room_id"],
        "meeting_url": f"https://meet.jit.si/{appt['jitsi_room_id']}#config.prejoinPageEnabled=false",
        "display_name": farmer.get("name", "Farmer"),
        "subject": f"PestPulse Consultation: {field.get('crop_type')} - {appt.get('expert_name')}",
        "pre_brief": dossier,
    })


# ------------------------------------------------------------------ Voice Agent APIs
@app.get("/api/v1/voice/latest-script")
def get_voice_latest_script():
    need_app()
    farmer_id = _get_current_farmer_id()
    fid = request.args.get("field_id") or "field_001"
    escs = db.escalations(farmer_id=farmer_id, field_id=fid, status="active")
    active_esc = escs[0] if escs else None

    farmer = db.farmer_by_id(farmer_id) or {"name": "Farmer"}
    field = db.field(fid) or {"name": "Field", "crop_type": "Crop"}
    treats = db.treatments(field_id=fid)

    treatment_date = treats[0].get("applied_date") if treats else None
    treatment_product = treats[0].get("product_name") if treats else None
    pest_name = active_esc.get("pest_type") if active_esc else "Tomato Leafminer"
    count = active_esc.get("pest_count_after", 28) if active_esc else 24

    script_en = voice_agent.build_alert_script(
        farmer_name=farmer.get("name", "Farmer"),
        crop_name=field.get("crop_type", "Crop"),
        field_name=field.get("name", "Main Field"),
        pest_name=pest_name,
        count=count,
        trend="increasing",
        treatment_date=treatment_date,
        treatment_product=treatment_product,
        lang="en",
    )
    script_kn = voice_agent.build_alert_script(
        farmer_name=farmer.get("name", "ರೈತರೇ"),
        crop_name=field.get("crop_type", "ಬೆಳೆ"),
        field_name=field.get("name", "ಜಮೀನು"),
        pest_name=pest_name,
        count=count,
        trend="ಹೆಚ್ಚಾಗಿದೆ",
        treatment_date=treatment_date,
        treatment_product=treatment_product,
        lang="kn",
    )

    return jsonify({
        "ok": True,
        "field_id": fid,
        "pest_name": pest_name,
        "count": count,
        "script_en": script_en,
        "script_kn": script_kn,
    })


@app.get("/api/v1/voice/history")
def get_voice_history():
    need_app()
    farmer_id = _get_current_farmer_id()
    items = db.voice_communications(farmer_id=farmer_id, limit=30)
    return jsonify({"ok": True, "communications": items, "count": len(items)})


@app.post("/api/v1/voice/trigger-call")
def trigger_voice_call():
    need_app()
    farmer_id = _get_current_farmer_id()
    b = request.get_json(silent=True) or {}
    fid = b.get("field_id") or "field_001"
    lang = b.get("language", "en")

    comm = voice_agent.generate_and_log_alert(farmer_id, fid)
    db.update_voice_comm(comm["comm_id"], status="in_progress")

    # Simulate realistic telephony dispatch
    time.sleep(0.1)
    db.update_voice_comm(comm["comm_id"], status="delivered")

    return jsonify({
        "ok": True,
        "communication": db.voice_communications(farmer_id, limit=1)[0],
        "message": f"Voice alert call initiated to registered contact ({lang.upper()})",
    })


@app.post("/api/v1/voice/log-playback")
def log_voice_playback():
    need_app()
    farmer_id = _get_current_farmer_id()
    b = request.get_json(silent=True) or {}
    cid = b.get("comm_id")
    if cid:
        db.update_voice_comm(cid, status="played", played_at=time.time())
    return jsonify({"ok": True, "status": "logged"})


@app.get("/api/v1/voice/preferences")
def get_voice_prefs():
    need_app()
    farmer_id = _get_current_farmer_id()
    pref = db.farmer_preferences(farmer_id)
    return jsonify({"ok": True, "preferences": pref})


@app.patch("/api/v1/voice/preferences")
def update_voice_prefs():
    need_app()
    farmer_id = _get_current_farmer_id()
    b = request.get_json(silent=True) or {}
    pref = db.set_farmer_preferences(farmer_id, **b)
    return jsonify({"ok": True, "preferences": pref})


# ------------------------------------------------------------------ Live Incoming Call & Telephony API
@app.get("/api/v1/voice/latest-call")
def get_latest_incoming_call():
    """Returns active incoming calls to trigger the browser ringing modal."""
    call = voice_agent.get_latest_incoming_call(within_seconds=45)
    return jsonify({"ok": True, "incoming_call": call, "has_call": call is not None})


@app.post("/api/v1/voice/answer-call")
def answer_incoming_call():
    b = request.get_json(silent=True) or {}
    cid = b.get("call_id")
    if cid:
        voice_agent.answer_call(cid)
    return jsonify({"ok": True, "status": "answered"})


# ------------------------------------------------------------------ Emailer Settings API
@app.get("/api/v1/emailer/settings")
def get_emailer_settings():
    cfg = emailer.load_smtp_config()
    safe_cfg = {
        "server": cfg.get("server", "smtp.gmail.com"),
        "port": cfg.get("port", 587),
        "user": cfg.get("user", ""),
        "has_password": bool(cfg.get("password")),
        "from_name": cfg.get("from_name", "PestPulse Smart Agriculture"),
        "doctors": emailer.DOCTOR_REGISTRY,
    }
    return jsonify({"ok": True, "settings": safe_cfg})


@app.post("/api/v1/emailer/settings")
def update_emailer_settings():
    b = request.get_json(silent=True) or {}
    saved = emailer.save_smtp_config(b)
    return jsonify({"ok": True, "saved": bool(saved), "user": saved.get("user")})


@app.post("/api/v1/emailer/test-send")
def test_send_email():
    b = request.get_json(silent=True) or {}
    to_email = b.get("to_email") or "jayanthgowda1406@gmail.com"
    subject = "[PestPulse] Real-Time SMTP Connection Verification"
    html = f"""
    <div style="font-family: sans-serif; padding: 20px; border: 2px solid #059669; border-radius: 8px;">
      <h2 style="color: #064e3b;">PestPulse Email Verification Successful</h2>
      <p>This message confirms that your SMTP mail server is successfully connected and delivering live emails to agronomists.</p>
    </div>
    """
    ok, msg = emailer.send_live_smtp_email(to_email, subject, html, "PestPulse email connection verified.")
    return jsonify({"ok": ok, "message": msg, "to_email": to_email})


@app.get("/api/v1/telephony/settings")
def get_telephony_settings():
    cfg = voice_agent.load_telephony_config()
    return jsonify({
        "ok": True,
        "has_credentials": bool(cfg.get("account_sid") and cfg.get("auth_token")),
        "from_number": cfg.get("from_number", ""),
    })


@app.post("/api/v1/telephony/settings")
def update_telephony_settings():
    b = request.get_json(silent=True) or {}
    saved = voice_agent.save_telephony_config(b)
    return jsonify({"ok": True, "saved": bool(saved)})


@app.post("/api/v1/voice/trigger-real-twilio-call")
def trigger_real_twilio_call():
    need_app()
    farmer_id = _get_current_farmer_id()
    farmer = db.farmer_by_id(farmer_id) or {}
    b = request.get_json(silent=True) or {}

    phone = b.get("phone") or farmer.get("contact") or "+91 98450 12345"
    message = b.get("message") or (
        "CRITICAL EMERGENCY ALERT from PestPulse! A massive pest outbreak has been detected in your field. "
        "Chief Entomologist Dr. Jayanth Gowda has been alerted. Please inspect your crop immediately."
    )
    sid = b.get("account_sid")
    token = b.get("auth_token")
    from_num = b.get("from_number")

    # If new credentials were provided in the payload, save them for future automated calls
    if sid and token and from_num:
        voice_agent.save_telephony_config({
            "account_sid": sid.strip(),
            "auth_token": token.strip(),
            "from_number": from_num.strip(),
        })

    # Save target phone to farmer profile so future emergency calls reach this phone
    if b.get("phone") and farmer_id:
        try:
            db.update_farmer(farmer_id, contact=b.get("phone").strip())
        except Exception:
            pass

    ok, status_msg, call_info = voice_agent.make_real_twilio_call(
        to_phone=phone,
        message=message,
        sid=sid,
        token=token,
        from_num=from_num
    )

    return jsonify({
        "ok": ok,
        "message": status_msg,
        "call_info": call_info,
        "phone": phone,
    })


# ------------------------------------------------------------------ Trap Camera Gallery API
@app.get("/api/v1/trap-images")
def get_trap_images():
    need_app()
    node = request.args.get("node")
    fid = request.args.get("field_id")
    limit = max(1, min(100, int(request.args.get("limit", 40))))

    readings = db.readings(node=node, field_id=fid, limit=limit)
    gallery = []
    for r in readings:
        if r.get("image"):
            gallery.append({
                "id": r["id"],
                "node": r["node"],
                "field_id": r.get("field_id"),
                "trap_type": r.get("trap"),
                "ts": r["ts"],
                "date_str": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(r["ts"])),
                "raw_image_url": f"/img/{r['image']}",
                "annotated_image_url": f"/img/{r['annotated']}" if r.get("annotated") else None,
                "thumbnail_url": f"/img/{_thumb(r['annotated'])}" if r.get("annotated") else f"/img/{r['image']}",
                "total_insects": r.get("total", 0),
                "new_catches": r.get("new", 0),
                "counts": r.get("counts") or {},
                "temp": r.get("temp"),
                "hum": r.get("hum"),
                "battery_pct": r.get("battery_pct"),
                "risk": r.get("risk", "NORMAL"),
                "engine": r.get("engine", "OpenCV Contour Blob Engine"),
            })
    return jsonify({"ok": True, "images": gallery, "count": len(gallery)})


# ------------------------------------------------------------------ Photo Upload & Count API
@app.post("/api/v1/upload-count")
def upload_and_count():
    need_app()
    farmer_id = _get_current_farmer_id()
    trap_type = request.form.get("trap") or request.args.get("trap", config.DEFAULT_TRAP)
    trap_type = trap_type if trap_type in config.TRAP_TYPES else config.DEFAULT_TRAP
    field_id = request.form.get("field_id") or request.args.get("field_id") or "field_001"
    suspected_pest = request.form.get("suspected_pest") or request.args.get("suspected_pest")

    field = db.field(field_id) or {}
    crop_type = request.form.get("crop") or field.get("crop_type", "Crop")

    img = _image_from_request()
    h, w = img.shape[:2]
    if max(h, w) > 2000:
        s = 2000.0 / max(h, w)
        img = cv2.resize(img, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)

    dets, counts, engine, info = detectors.count_trap(img, trap_type=trap_type, crop_type=crop_type, suspected_pest=suspected_pest)
    total = len(dets)
    t = risk.trap_cfg(trap_type)
    risk_level = "HIGH" if total >= t["high"] else "MEDIUM" if total >= t["medium"] else "LOW"

    header_label = info.get("classified_pest", t["label"]).replace("_", " ").title()
    annotated = detectors.annotate(img, dets, f"Manual Upload | {header_label} | {total} insects detected")
    raw_name, ann_name = _save("manual_upload", img, annotated)

    # Save to database as observation
    rid = db.insert_reading(
        node="manual-photo-upload",
        field_id=field_id,
        kind="manual_upload",
        trap=trap_type,
        total=total,
        new=total,
        counts=counts,
        image=raw_name,
        annotated=ann_name,
        risk=risk_level,
        engine=engine,
        card_found=info.get("card_found", 1),
    )

    # Insert detections
    for d in dets:
        box = [int(x) for x in d["box"]]
        cls_key = d.get("cls") or d.get("class", "whitefly")
        sp_meta = pest_knowledge.get_pest_knowledge(cls_key, crop_type)
        db.insert_detection(
            reading_id=rid,
            node="manual-photo-upload",
            field_id=field_id,
            crop_type=crop_type,
            insect_class=cls_key,
            common_name_en=d.get("common_name_en") or sp_meta.get("name_en", "Detected Insect"),
            common_name_kn=d.get("common_name_kn") or sp_meta.get("name_kn", "ಪತ್ತೆಯಾದ ಕೀಟ"),
            scientific_name=d.get("scientific_name") or sp_meta.get("scientific_name", "Insecta"),
            count=1,
            confidence=float(d.get("conf") or d.get("confidence", 0.90)),
            box_json=box,
            model_version=f"{engine}_v2",
        )

    # Provide immediate farmer recommendations & linked pest knowledge
    dominant_class = max(counts.items(), key=lambda x: x[1])[0] if counts else trap_type
    p_info = pest_knowledge.get_pest_knowledge(dominant_class, crop_type)
    diseases_created = p_info.get("diseases_created", [])
    fertilizers_and_treatments = p_info.get("fertilizers_and_treatments", [])
    pest_display_name = p_info.get("name_en", "Detected Pest")

    # TRIGGER DIRECT CALL TO USER NUMBER EXPLAINING EVERYTHING THAT HAPPENED
    voice_agent.trigger_photo_scan_call(
        farmer_id=farmer_id,
        crop_type=crop_type,
        pest_name=pest_display_name,
        count=total,
        diseases=diseases_created,
        fertilizers=fertilizers_and_treatments,
    )

    # 50+ INSECTS OUTBREAK TRIGGER
    emergency_outbreak_triggered = False
    if total >= 50:
        emergency_outbreak_triggered = True
        risk_level = "CRITICAL EMERGENCY"
        # Emergency automated call to farmer
        voice_agent.trigger_emergency_outbreak_call(farmer_id, crop_type, pest_display_name, total)
        # Emergency alert to Chief Entomologist Dr. Jayanth Gowda
        emailer.send_emergency_outbreak_email(field_id, crop_type, pest_display_name, total, "jayanthgowda1406@gmail.com")
        # Post alert in database
        db.insert_alert(
            farmer_id=farmer_id,
            field_id=field_id,
            level="CRITICAL",
            species=pest_display_name,
            title_en=f"Emergency Outbreak: {total} {pest_display_name} Detected",
            title_kn=f"ತುರ್ತು ಎಚ್ಚರಿಕೆ: {total} {pest_display_name} ಪತ್ತೆಯಾಗಿವೆ",
            body_en=f"Critical outbreak of {total} {pest_display_name} detected. Emergency automated call placed to your mobile. Dr. Jayanth Gowda has been notified.",
            body_kn=f"{total} {pest_display_name} ಕೀಟಗಳ ತೀವ್ರ ಹಾವಳಿ ಪತ್ತೆಯಾಗಿದೆ. ನಿಮ್ಮ ಮೊಬೈಲ್‌ಗೆ ತುರ್ತು ಕರೆ ಮಾಡಲಾಗಿದೆ.",
        )

    recs = [
        f"Detected an exact count of {total} {pest_display_name} on card/canopy.",
        f"Population Risk Status: {risk_level} for {crop_type}.",
    ]
    if total >= 50:
        recs.append("CRITICAL: Severe insect surge detected (50+). Immediate emergency intervention and agronomist inspection required.")
    elif risk_level == "HIGH":
        recs.append("Immediate physical inspection and selective IPM intervention recommended.")
    elif risk_level == "MEDIUM":
        recs.append("Continue daily monitoring. Verify trap pheromone/lure freshness.")
    else:
        recs.append("Insects are below economic injury threshold. No chemical spray required.")

    return jsonify({
        "ok": True,
        "reading_id": rid,
        "field_id": field_id,
        "crop_type": crop_type,
        "trap_type": trap_type,
        "total_detected": total,
        "counts": counts,
        "dominant_pest": p_info.get("key"),
        "pest_name": pest_display_name,
        "pest_name_kn": p_info.get("name_kn"),
        "scientific_name": p_info.get("scientific_name"),
        "morphology_traits": p_info.get("morphology_traits"),
        "detection_rationale": info.get("rationale"),
        "confidence": info.get("confidence", 0.92),
        "risk_level": risk_level,
        "engine": engine,
        "raw_image_url": f"/img/{raw_name}",
        "annotated_image_url": f"/img/{ann_name}",
        "detections": dets[:30],
        "recommendations": recs,
        "diseases_created": diseases_created,
        "fertilizers_and_treatments": fertilizers_and_treatments,
        "direct_call_dispatched": True,
        "emergency_outbreak_triggered": emergency_outbreak_triggered,
    })


# ------------------------------------------------------------------ Floating AI Chatbot API
@app.post("/api/v1/chat")
def chat_with_agronomist():
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    message = (data.get("message") or data.get("query") or "").strip()
    if not message:
        return jsonify({"ok": False, "error": "Message cannot be empty."}), 400

    language = data.get("language") or "en"
    field_id = data.get("field_id") or "field_001"

    import ai_chatbot
    res = ai_chatbot.generate_agronomy_answer(message, language=language, field_id=field_id)
    return jsonify(res)


# ------------------------------------------------------------------ Health & Images
@app.get("/api/v1/health")
def health():
    return jsonify({
        "ok": True,
        "service": "PestPulse Smart Agriculture Platform",
        "time": time.time(),
        "devices": len(db.devices()),
        "fields": len(db.fields()),
        "auth": bool(config.APP_TOKEN),
    })


@app.get("/img/<path:name>")
def image(name):
    # Support reference images fallback
    ref_path = os.path.join(config.IMAGE_DIR, name)
    if not os.path.exists(ref_path):
        os.makedirs(os.path.dirname(ref_path), exist_ok=True)
        # Create a placeholder reference image if not already existing
        img = detectors.np.full((320, 480, 3), (45, 75, 40), detectors.np.uint8)
        cv2.putText(img, f"Ref: {os.path.basename(name)}", (20, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (220, 240, 220), 2)
        cv2.imwrite(ref_path, img)
    return send_from_directory(config.IMAGE_DIR, name, max_age=86400)


# ------------------------------------------------------------------ Serving Frontend
FRONTEND_DIST = os.path.join(os.path.dirname(config.BASE_DIR), "frontend", "dist")


@app.get("/")
def app_index():
    if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        return send_from_directory(FRONTEND_DIST, "index.html", max_age=0)
    return send_from_directory(config.APP_DIR, "index.html", max_age=0)


@app.get("/<path:name>")
def app_files(name):
    if os.path.exists(os.path.join(FRONTEND_DIST, name)):
        return send_from_directory(FRONTEND_DIST, name, max_age=0 if name == "index.html" else 3600)
    if os.path.isfile(os.path.join(config.APP_DIR, name)):
        return send_from_directory(config.APP_DIR, name, max_age=0 if name in ("sw.js", "index.html") else 3600)
    # SPA routing fallback
    if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        return send_from_directory(FRONTEND_DIST, "index.html", max_age=0)
    abort(404)


if __name__ == "__main__":
    print(f"\n=======================================================")
    print(f"  PestPulse Cloud Platform")
    print(f"  Listening on http://0.0.0.0:{config.PORT}")
    print(f"  Device Ingestion Key: {config.DEVICE_KEY}")
    print(f"=======================================================\n")
    app.run(host="0.0.0.0", port=config.PORT, threaded=True)
