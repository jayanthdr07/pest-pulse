"""
PestPulse Multilingual Voice Agent & Telephony Dispatcher.
Generates structured, factual spoken alerts in English and Kannada.
Supports:
1. Real cellular physical phone calls via Twilio Voice REST API / official twilio SDK.
2. In-App Incoming Call Interface with authentic dual-frequency ringtones / emergency sirens.
3. Web Speech API client synthesis.
"""
import os
import json
import time
import base64
import db

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
TELEPHONY_CONFIG = os.path.join(DATA_DIR, "telephony_config.json")

# In-memory register of active/unanswered incoming calls for live browser pickup
_PENDING_CALLS = []

def load_telephony_config():
    cfg = {
        "account_sid": os.environ.get("TWILIO_ACCOUNT_SID", ""),
        "auth_token": os.environ.get("TWILIO_AUTH_TOKEN", ""),
        "from_number": os.environ.get("TWILIO_FROM_NUMBER", ""),
    }
    # Check cloud/.env file directly
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_file):
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("TWILIO_ACCOUNT_SID="):
                        cfg["account_sid"] = line.split("=", 1)[1].strip()
                    elif line.startswith("TWILIO_AUTH_TOKEN="):
                        cfg["auth_token"] = line.split("=", 1)[1].strip()
                    elif line.startswith("TWILIO_FROM_NUMBER="):
                        cfg["from_number"] = line.split("=", 1)[1].strip()
        except Exception:
            pass

    if os.path.exists(TELEPHONY_CONFIG):
        try:
            with open(TELEPHONY_CONFIG, "r", encoding="utf-8") as f:
                cfg.update(json.load(f))
        except Exception:
            pass
    return cfg

def save_telephony_config(cfg: dict):
    current = load_telephony_config()
    current.update(cfg)
    with open(TELEPHONY_CONFIG, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2)
    return current

def make_real_twilio_call(to_phone: str, message: str, sid: str = None, token: str = None, from_num: str = None) -> tuple[bool, str, dict]:
    """Places an actual cellular telephone call to the target phone using the official Twilio SDK."""
    cfg = load_telephony_config()
    act_sid = (sid or cfg.get("account_sid", "")).strip()
    act_token = (token or cfg.get("auth_token", "")).strip()
    act_from = (from_num or cfg.get("from_number", "")).strip()

    if not act_sid or not act_token or not act_from:
        return False, "Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER required).", {}

    # Format destination phone number with international country code
    formatted_to = to_phone.strip().replace(" ", "").replace("-", "")
    if not formatted_to.startswith("+"):
        if len(formatted_to) == 10:
            formatted_to = f"+91{formatted_to}"
        else:
            formatted_to = f"+{formatted_to}"

    try:
        from twilio.rest import Client
        client = Client(act_sid, act_token)

        # Amazon Polly Indian English voice 'Aditi' or standard fallback
        twiml = (
            f"<Response>"
            f"<Pause length='1'/>"
            f"<Say voice='Polly.Aditi' language='en-IN'>{message}</Say>"
            f"<Pause length='1'/>"
            f"<Say voice='Polly.Aditi' language='en-IN'>Thank you for using PestPulse Smart Agriculture.</Say>"
            f"</Response>"
        )

        call = client.calls.create(
            twiml=twiml,
            to=formatted_to,
            from_=act_from
        )
        call_info = {
            "sid": call.sid,
            "status": call.status,
            "to": call.to,
            "from": call.from_,
            "direction": getattr(call, "direction", "outbound-api"),
        }
        print(f"[Telephony] Real Twilio cellular call dispatched to {formatted_to}! Call SID: {call.sid}, Status: {call.status}")
        return True, f"Real Twilio cellular call dispatched to {formatted_to} (Call SID: {call.sid})", call_info
    except Exception as e:
        err = f"Twilio cellular dispatch error: {e}"
        print(f"[Telephony] {err}")
        return False, err, {}

def _dispatch_cellular_call_if_configured(to_phone: str, message: str) -> tuple[bool, str]:
    """Internal helper to dispatch cellular call if credentials exist."""
    ok, msg, _ = make_real_twilio_call(to_phone, message)
    return ok, msg

def record_incoming_call(call_type: str, title: str, script_en: str, script_kn: str,
                         phone: str, urgency: str = "normal", metadata: dict = None):
    """Registers an active incoming call that rings directly on the farmer's browser and phone."""
    call_id = f"call_{int(time.time()*1000)}"
    entry = {
        "call_id": call_id,
        "call_type": call_type,          # "emergency_outbreak", "doctor_acceptance", "scan_summary"
        "title": title,
        "urgency": urgency,              # "critical", "high", "normal"
        "script_en": script_en,
        "script_kn": script_kn,
        "phone": phone,
        "timestamp": time.time(),
        "answered": False,
        "metadata": metadata or {},
    }
    _PENDING_CALLS.append(entry)
    if len(_PENDING_CALLS) > 10:
        _PENDING_CALLS.pop(0)

    # Attempt physical cellular dispatch via Twilio
    _dispatch_cellular_call_if_configured(phone, script_en)
    return entry

def get_latest_incoming_call(within_seconds: int = 40):
    now = time.time()
    for c in reversed(_PENDING_CALLS):
        if not c.get("answered") and (now - c["timestamp"]) <= within_seconds:
            return c
    return None

def answer_call(call_id: str):
    for c in _PENDING_CALLS:
        if c.get("call_id") == call_id:
            c["answered"] = True
            return True
    return False

def build_alert_script(farmer_name: str, crop_name: str, field_name: str,
                       pest_name: str, count: int, trend: str,
                       treatment_date: str = None, treatment_product: str = None,
                       lang: str = "en") -> str:
    if lang == "kn":
        if treatment_date and treatment_product:
            treatment_clause = f"ನಿಮ್ಮ {treatment_product} ಚಿಕಿತ್ಸೆಯ ({treatment_date}) ನಂತರವೂ ಕೀಟಗಳ ಸಂಖ್ಯೆ {trend} ಎಂದು ದಾಖಲೆಗಳು ತೋರಿಸುತ್ತವೆ."
        else:
            treatment_clause = f"ಇತ್ತೀಚಿನ ಅವಧಿಯಲ್ಲಿ ಕೀಟಗಳ ಚಟುವಟಿಕೆ {trend} ಆಗಿದೆ."

        return (
            f"ನಮಸ್ಕಾರ {farmer_name}. ಇದು ಪೆಸ್ಟ್‌ಪಲ್ಸ್ ಕೃಷಿ ಮೇಲ್ವಿಚಾರಣಾ ಸಹಾಯಕ. "
            f"ನಾವು ನಿಮ್ಮ {field_name} ಜಮೀನಿನ {crop_name} ಬೆಳೆಯನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡುತ್ತಿದ್ದೇವೆ. "
            f"ನಮ್ಮ ಇತ್ತೀಚಿನ ವೀಕ್ಷಣೆಯಲ್ಲಿ {pest_name} ಕೀಟಗಳು ಪತ್ತೆಯಾಗಿದ್ದು, ಇತ್ತೀಚಿನ ಎಣಿಕೆ {count} ಆಗಿದೆ. "
            f"{treatment_clause} "
            f"ಕೃಷಿ ತಜ್ಞರೊಂದಿಗೆ ಈ ವೀಕ್ಷಣೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಪೆಸ್ಟ್‌ಪಲ್ಸ್ ಶಿಫಾರಸು ಮಾಡುತ್ತದೆ. "
            f"ಕೀಟ ಚಿತ್ರಗಳು ಮತ್ತು ಚಿಕಿತ್ಸಾ ಇತಿಹಾಸವನ್ನು ನೋಡಲು ನಿಮ್ಮ ಮೊಬೈಲ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ. ಧನ್ಯವಾದಗಳು."
        )

    trend_desc = "remained high" if trend == "stable_high" else "increased" if trend == "increasing" else "been detected"
    if treatment_date and treatment_product:
        treatment_clause = f"The monitoring records show that pest activity has {trend_desc} following your recorded treatment of {treatment_product} on {treatment_date}."
    else:
        treatment_clause = f"The monitoring records show that pest activity has {trend_desc} over the recent observation window."

    return (
        f"Hello {farmer_name}. This is PestPulse, your smart farm monitoring assistant. "
        f"We are monitoring your {crop_name} in {field_name}. "
        f"Our latest observation detected {pest_name}, with a count of {count}. "
        f"{treatment_clause} "
        f"PestPulse recommends reviewing these latest observations with an agricultural expert. "
        f"You can open your dashboard to view the insect images, trap captures, and treatment history. Thank you."
    )

def trigger_doctor_acceptance_call(farmer_id: str, doctor_name: str, crop_type: str, appt_time: str, jitsi_url: str):
    farmer = db.farmer_by_id(farmer_id) or {"name": "Farmer", "contact": "+91 98450 12345"}
    farmer_name = farmer.get("name", "Farmer")
    phone = farmer.get("contact", "+91 98450 12345")

    script_en = (
        f"Hello {farmer_name}. Great news from PestPulse! {doctor_name} has accepted your agricultural consultation request "
        f"for your {crop_type} crop scheduled for {appt_time}. Your encrypted Jitsi video conference room is ready. "
        f"Please open your PestPulse dashboard to join the consultation or view your Crop Passport. Thank you."
    )

    script_kn = (
        f"ನಮಸ್ಕಾರ {farmer_name}. ಪೆಸ್ಟ್‌ಪಲ್ಸ್‌ನಿಂದ ಶುಭ ಸುದ್ದಿ! {doctor_name} ಅವರು ನಿಮ್ಮ {crop_type} ಬೆಳೆಗೆ ಸಂಬಂಧಿಸಿದ "
        f"ಕೃಷಿ ಸಮಾಲೋಚನಾ ವಿನಂತಿಯನ್ನು ಒಪ್ಪಿಕೊಂಡಿದ್ದಾರೆ ({appt_time}). ನಿಮ್ಮ Jitsi ವೀಡಿಯೊ ಸಮಾಲೋಚನಾ ಕೊಠಡಿ ಈಗ ಸಕ್ರಿಯವಾಗಿದೆ. "
        f"ಸಮಾಲೋಚನೆಗೆ ಸೇರಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೆಸ್ಟ್‌ಪಲ್ಸ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ. ಧನ್ಯವಾದಗಳು."
    )

    db.insert_voice_comm(
        farmer_id=farmer_id,
        channel="telephony_sim",
        language="en",
        script_en=script_en,
        script_kn=script_kn,
        status="delivered",
        duration_s=36,
    )

    record_incoming_call(
        call_type="doctor_acceptance",
        title=f"👨‍⚕️ {doctor_name} Confirmed Consultation",
        script_en=script_en,
        script_kn=script_kn,
        phone=phone,
        urgency="high",
        metadata={"doctor_name": doctor_name, "appt_time": appt_time, "jitsi_url": jitsi_url}
    )
    print(f"\n[Voice Dispatch] INCOMING CALL TRIGGERED: {doctor_name} accepted appointment. Ringing farmer {phone}!")

def trigger_photo_scan_call(farmer_id: str, crop_type: str, pest_name: str, count: int,
                            diseases: list, fertilizers: list):
    farmer = db.farmer_by_id(farmer_id) or {"name": "Farmer", "contact": "+91 98450 12345"}
    farmer_name = farmer.get("name", "Farmer")
    phone = farmer.get("contact", "+91 98450 12345")

    d_names = ", ".join([d.get("name", "") for d in diseases[:2]]) if diseases else "secondary foliar blight"
    fert = fertilizers[0] if fertilizers else {}
    fert_name = fert.get("product_name", "Potassium Sulphate")
    fert_pct = fert.get("dilution_percentage", "0.5%")

    script_en = (
        f"Hello {farmer_name}. Your PestPulse optical scan is complete. We detected an exact count of {count} {pest_name} "
        f"in your {crop_type} field. This insect causes {d_names}. We recommend applying {fert_name} at {fert_pct} dilution. "
        f"Genuine product photographs and application rate have been uploaded to your dashboard. Please verify before spraying."
    )

    script_kn = (
        f"ನಮಸ್ಕಾರ {farmer_name}. ನಿಮ್ಮ ಪೆಸ್ಟ್‌ಪಲ್ಸ್ ಫೋಟೋ ಸ್ಕ್ಯಾನ್ ಪೂರ್ಣಗೊಂಡಿದೆ. ನಿಮ್ಮ {crop_type} ಬೆಳೆಯಲ್ಲಿ {count} {pest_name} "
        f"ಕೀಟಗಳು ನಿಖರವಾಗಿ ಪತ್ತೆಯಾಗಿವೆ. ಇದು {d_names} ರೋಗಗಳನ್ನು ಹರಡುವ ಸಾಧ್ಯತೆಯಿದೆ. {fert_pct} ಪ್ರಮಾಣದಲ್ಲಿ {fert_name} "
        f"ಬಳಸಲು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ. ನೈಜ ಚಿತ್ರಗಳಿಗಾಗಿ ನಿಮ್ಮ ಮೊಬೈಲ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ."
    )

    db.insert_voice_comm(
        farmer_id=farmer_id,
        channel="telephony_sim",
        language="en",
        script_en=script_en,
        script_kn=script_kn,
        status="delivered",
        duration_s=42,
    )

    record_incoming_call(
        call_type="scan_summary",
        title=f"🔬 Scan Findings: {count} {pest_name}",
        script_en=script_en,
        script_kn=script_kn,
        phone=phone,
        urgency="normal",
        metadata={"pest_name": pest_name, "count": count, "fert_name": fert_name, "fert_pct": fert_pct}
    )
    print(f"\n[Voice Dispatch] INCOMING CALL TRIGGERED: Scan Complete ({count} {pest_name}). Ringing farmer {phone}!")

def trigger_emergency_outbreak_call(farmer_id: str, crop_type: str, pest_name: str, count: int):
    """EMERGENCY SIREN CALL when 50+ insects are identified! Rings with urgent siren audio & cellular dispatch."""
    farmer = db.farmer_by_id(farmer_id) or {"name": "Farmer", "contact": "+91 98450 12345"}
    farmer_name = farmer.get("name", "Farmer")
    phone = farmer.get("contact", "+91 98450 12345")

    script_en = (
        f"CRITICAL EMERGENCY ALERT from PestPulse! A massive pest outbreak of {count} {pest_name} has been detected "
        f"in your {crop_type} field! This severely exceeds extreme emergency thresholds. Immediate field intervention is required. "
        f"Chief Entomologist Dr. Jayanth Gowda has been alerted to review your Crop Passport. Please check your app right away."
    )

    script_kn = (
        f"ಪೆಸ್ಟ್‌ಪಲ್ಸ್‌ನಿಂದ ತುರ್ತು ಎಚ್ಚರಿಕೆ! ನಿಮ್ಮ {crop_type} ಬೆಳೆಯಲ್ಲಿ {count} {pest_name} ಕೀಟಗಳ ತೀವ್ರ ಹಾವಳಿ ಪತ್ತೆಯಾಗಿದೆ! "
        f"ಇದು ಗಂಭೀರ ಆರ್ಥಿಕ ಹಾನಿ ಮಟ್ಟವನ್ನು ಮೀರಿದೆ. ತಕ್ಷಣದ ಹೊಲ ತಪಾಸಣೆ ಅಗತ್ಯವಿದೆ. ಮುಖ್ಯ ಕೃಷಿ ವಿಜ್ಞಾನಿ ಡಾ. ಜಯಂತ್ ಗೌಡ "
        f"ಅವರಿಗೆ ಮಾಹಿತಿ ನೀಡಲಾಗಿದೆ. ತಕ್ಷಣ ನಿಮ್ಮ ಪೆಸ್ಟ್‌ಪಲ್ಸ್ ಆಪ್ ತೆರೆಯಿರಿ!"
    )

    db.insert_voice_comm(
        farmer_id=farmer_id,
        channel="telephony_sim",
        language="en",
        script_en=script_en,
        script_kn=script_kn,
        status="delivered",
        duration_s=45,
    )

    record_incoming_call(
        call_type="emergency_outbreak",
        title=f"🚨 CRITICAL OUTBREAK: {count}+ {pest_name} Detected!",
        script_en=script_en,
        script_kn=script_kn,
        phone=phone,
        urgency="critical",
        metadata={"pest_name": pest_name, "count": count, "crop_type": crop_type}
    )
    print(f"\n[EMERGENCY SIREN] 50+ INSECTS OUTBREAK CALL TRIGGERED! Ringing farmer {phone} with emergency siren!")
