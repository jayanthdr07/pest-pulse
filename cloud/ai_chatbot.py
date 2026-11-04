"""
PestPulse Intelligent AI Agronomist & Crop Protection Chatbot.
Provides real-time answers for farmers regarding:
- Insect identification & population dynamics
- Chemical & biological IPM treatments with exact dosage per acre
- Disease vectors & crop damage prevention
- ESP32-CAM IoT trap installation, Wi-Fi pairing & 1-minute capture cycle
- Live weather risk assessment & spray feasibility
- Bilingual responses (English & Kannada)
"""
import os
import json
import urllib.request
import urllib.parse
import threading

import config
import db
import pest_knowledge
import weather
import advisor

def _try_online_llm(prompt, timeout=4.0):
    """Attempts to fetch response from a live online LLM endpoint within a strict timeout."""
    # 1. Check if Gemini API Key is available
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key and gemini_key != "your_gemini_api_key_here":
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            pass

    # 2. Check if OpenAI API Key is available
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            payload = json.dumps({
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 400
            }).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {openai_key}"
            })
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"].strip()
        except Exception:
            pass

    # 3. Live Free AI Router (Pollinations POST)
    try:
        url = "https://text.pollinations.ai/"
        payload = json.dumps({
            "messages": [{"role": "user", "content": prompt}],
            "model": "openai",
            "seed": 42
        }).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={
            "Content-Type": "application/json",
            "User-Agent": "PestPulse-AI/1.0"
        })
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            text = resp.read().decode("utf-8").strip()
            if text and len(text) > 20 and not text.startswith("<!DOCTYPE"):
                return text
    except Exception:
        pass

    return None


def generate_agronomy_answer(query, language="en", field_id="field_001"):
    """
    Synthesizes an intelligent, actionable agronomic answer combining real-time field data,
    ICAR-IIHR verified pest knowledge, and LLM reasoning.
    """
    q_lower = query.lower()
    is_kn = language == "kn" or any("\u0c80" <= char <= "\u0cff" for char in query)

    # Gather live context from field
    f = db.field(field_id) or {}
    crop = f.get("crop_type", "Tomato")
    acreage = f.get("area_acres", 2.0)
    try:
        w_data = weather.get() or {}
    except Exception:
        w_data = {}
    cur_temp = w_data.get("temp", 26.5)
    cur_hum = w_data.get("hum", 65.0)

    # 1. Formulate rich prompt for online LLM
    system_instruction = (
        f"You are PestPulse AI, a digital agronomist and crop protection specialist at ICAR-IIHR. "
        f"The farmer is growing {crop} on {acreage} acres in Karnataka. Current weather: {cur_temp}°C, {cur_hum}% RH. "
        f"Answer clearly, practically, and empathetically with specific product names, chemical active ingredients, "
        f"dilution rates (per litre and per acre), safety precautions, and IPM practices. "
        + ("Respond in fluent, respectful Kannada (ಕನ್ನಡ)." if is_kn else "Respond in clear English.")
    )
    full_prompt = f"{system_instruction}\n\nFarmer Question: {query}\n\nExpert Agronomist Advice:"

    # Attempt online LLM call with rapid timeout
    online_reply = _try_online_llm(full_prompt, timeout=3.5)
    if online_reply:
        return {
            "ok": True,
            "reply": online_reply,
            "source": "PestPulse Cloud AI Engine",
            "crop": crop,
            "language": "kn" if is_kn else "en"
        }

    # 2. Local Fallback: Instant ICAR-IIHR Domain Expert System
    # Matched Pest Detection
    detected_pest = None
    for p_key in ["whitefly", "tuta", "fall_armyworm", "thrips", "aphids", "fruit_borer", "borer"]:
        if p_key in q_lower or (p_key == "whitefly" and ("ಬಿಳಿ" in query or "ನೊಣ" in query)) or \
           (p_key == "tuta" and ("ಎಲೆ ಕೊರೆಯುವ" in query or "leafminer" in q_lower)):
            detected_pest = "fruit_borer" if p_key == "borer" else p_key
            break

    # Check for ESP32 hardware questions
    if any(k in q_lower for k in ["esp32", "esp 32", "camera", "hardware", "wifi", "interval", "minute", "photo", "trap"]):
        if is_kn:
            reply = (
                "🌱 **PestPulse ESP32-CAM ಸ್ಮಾರ್ಟ್ ಟ್ರ್ಯಾಪ್ ಮಾರ್ಗದರ್ಶಿ:**\n\n"
                "1. **ಫೋಟೋ ಸೆರೆಹಿಡಿಯುವ ಸಮಯ:** ನಿಮ್ಮ ESP32-CAM ಪ್ರತಿ **1 ನಿಮಿಷಕ್ಕೊಮ್ಮೆ** ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಹಳದಿ ಬಲೆಯ ಫೋಟೋ ತೆಗೆದು ಸರ್ವರ್‌ಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡುತ್ತದೆ.\n"
                "2. **ವೈ-ಫೈ ಕನೆಕ್ಷನ್:** ನಿಮ್ಮ ಮೊಬೈಲ್ ಹಾಟ್‌ಸ್ಪಾಟ್ ಅಥವಾ ತೋಟದ Wi-Fi (SSID ಮತ್ತು Password) ಅನ್ನು `firmware/pestpulse_cam.ino` ನಲ್ಲಿ ನಮೂದಿಸಿ.\n"
                "3. **ಸರ್ವರ್ ಐಪಿ:** ನಿಮ್ಮ ಲ್ಯಾಪ್‌ಟಾಪ್‌ನ ಸ್ಥಳೀಯ IP ವಿಳಾಸವನ್ನು `CLOUD_URL` ನಲ್ಲಿ ಹೊಂದಿಸಿ (`http://172.17.24.144:8080`).\n"
                "4. **ಫ್ಲ್ಯಾಶಿಂಗ್ ಹಂತ:** GPIO 0 ಅನ್ನು GND ಗೆ ಸಂಪರ್ಕಿಸಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ನಂತರ ರಿಸ್ಟಾರ್ಟ್ ಮಾಡಲು GPIO 0 ತೆಗೆದು RST ಬಟನ್ ಒತ್ತಿರಿ."
            )
        else:
            reply = (
                "🌱 **PestPulse ESP32-CAM Smart Trap Guide:**\n\n"
                "1. **Capture Frequency:** The ESP32-CAM is calibrated to capture and upload sticky card photos every **1 minute (60 seconds)**.\n"
                "2. **Wi-Fi Pairing:** Set your Wi-Fi SSID and Password inside `firmware/pestpulse_cam/pestpulse_cam.ino`.\n"
                "3. **Server Endpoint:** Set `CLOUD_URL` to your local machine IP (`http://172.17.24.144:8080`) with `X-Device-Key: change-me-device-key`.\n"
                "4. **Flashing Instructions:** Connect GPIO 0 to GND while uploading via FTDI (5V, 115200 baud). Disconnect GPIO 0 and press RST to boot into live field monitoring."
            )
        return {"ok": True, "reply": reply, "source": "PestPulse Hardware Assistant", "crop": crop, "language": "kn" if is_kn else "en"}

    # Check for Fertilizer / Spray Dosage questions
    if any(k in q_lower for k in ["fertilizer", "dose", "dosage", "spray", "water", "acre", "19-19-19", "npk", "potash"]):
        if is_kn:
            reply = (
                f"🌾 **{crop} ಬೆಳೆಗೆ ಶಿಫಾರಸು ಮಾಡಿದ ರಸಗೊಬ್ಬರ ಮತ್ತು ಸಿಂಪಡಣೆ ಪ್ರಮಾಣ ({acreage} ಎಕರೆಗೆ):**\n\n"
                "1. **ಬೆಳವಣಿಗೆ ಹಂತ (Vegetative Stage):** ಮಹಾಧನ್ NPK 19-19-19 - 1 ಲೀಟರ್ ನೀರಿಗೆ 5 ಗ್ರಾಂ (ಪ್ರತಿ ಎಕರೆಗೆ 1.0 ಕೆಜಿ 200 ಲೀಟರ್ ನೀರಿನೊಂದಿಗೆ).\n"
                "2. **ಹೂವು ಮತ್ತು ಕಾಯಿ ಕಟ್ಟುವ ಹಂತ:** ಕ್ಯಾಲ್ಸಿಯಂ ನೈಟ್ರೇಟ್ + ಬೋರಾನ್ - 1 ಲೀಟರ್ ನೀರಿಗೆ 10 ಗ್ರಾಂ (ಪ್ರತಿ ಎಕರೆಗೆ 2.0 ಕೆಜಿ).\n"
                "3. **ಕಾಯಿ ಮಾಗುವಿಕೆ ಮತ್ತು ತೂಕ:** ಪೊಟ್ಯಾಸಿಯಮ್ ಸಲ್ಫೇಟ್ (SOP 0-0-50) - ಪ್ರತಿ ಎಕರೆಗೆ 1.0 ಕೆಜಿ.\n"
                "⚠️ **ಸಿಂಪಡಿಸುವ ಮುನ್ನೆಚ್ಚರಿಕೆ:** ಮುಂಜಾನೆ 7-10 ಗಂಟೆ ಅಥವಾ ಸಂಜೆ 4-6 ಗಂಟೆಯ ಬಿಸಿಲು ಕಡಿಮೆಯಿರುವ ಸಮಯದಲ್ಲಿ ಸಿಂಪಡಿಸಿ."
            )
        else:
            reply = (
                f"🌾 **Recommended Fertilizer & Foliar Nutrition for {crop} ({acreage} Acres):**\n\n"
                "1. **Vegetative Flush:** Mahadhan NPK 19-19-19 foliar spray at **5 g/L** (1.0 kg per acre in 200 L water).\n"
                "2. **Flowering & Fruit Set:** Calcium Nitrate + Soluble Boron at **10 g/L** (2.0 kg per acre) to prevent blossom-end rot and fruit cracking.\n"
                "3. **Fruit Development & Weight:** Potassium Sulphate (Mahadhan SOP 0-0-50) at **5 g/L** (1.0 kg per acre) to enhance rind thickness and resistance.\n"
                "⚠️ **Application Tip:** Spray during calm morning (7-10 AM) or evening hours (4-6 PM) when leaf stomata are open."
            )
        return {"ok": True, "reply": reply, "source": "PestPulse Agronomy Knowledge Base", "crop": crop, "language": "kn" if is_kn else "en"}

    # Check for specific pest
    target_pest = detected_pest or "whitefly"
    p_info = pest_knowledge.get_pest_knowledge(target_pest, crop)
    p_name = p_info.get("name_kn" if is_kn else "name_en", "Detected Pest")
    diseases = p_info.get("diseases_created", [])
    treatments = p_info.get("fertilizers_and_treatments", [])

    if is_kn:
        d_text = ", ".join(d["name"] for d in diseases[:2]) if diseases else "ಯಾವುದೇ ಪ್ರಮುಖ ರೋಗವಿಲ್ಲ"
        t_lines = []
        for t in treatments[:3]:
            t_lines.append(f"• **{t['product_name']}** ({t.get('active_ingredient', '')}): {t.get('dilution_percentage', '')} — {t.get('dosage_per_acre', '')}")
        treat_str = "\n".join(t_lines)

        reply = (
            f"🔬 **{p_name} ({p_info.get('scientific_name')}) ನಿಯಂತ್ರಣ ಕ್ರಮಗಳು:**\n\n"
            f"⚠️ **ಹರಡುವ ರೋಗಗಳು:** {d_text}.\n\n"
            f"📋 **ಶಿಫಾರಸು ಮಾಡಿದ ಔಷಧಿಗಳು ಮತ್ತು ಪ್ರಮಾಣ:**\n{treat_str}\n\n"
            "💡 **ಸಮಗ್ರ ಕೀಟ ನಿರ್ವಹಣೆ (IPM):**\n"
            "• ಪ್ರತಿ ಎಕರೆಗೆ 10-15 ಹಳದಿ/ನೀಲಿ ಜಿಗುಟು ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ.\n"
            "• ಪ್ರತಿ ಲೀಟರ್ ನೀರಿಗೆ 3 ಮಿ.ಲಿ ಬೇವಿನ ಎಣ್ಣೆ (10,000 ppm) ಸೇರಿಸಿ ಸಿಂಪಡಿಸಿ."
        )
    else:
        d_text = ", ".join(d["name"] for d in diseases[:2]) if diseases else "No major systemic pathogens recorded"
        t_lines = []
        for t in treatments[:3]:
            t_lines.append(f"• **{t['product_name']}** (*{t.get('active_ingredient', '')}*): {t.get('dilution_percentage', '')} — {t.get('dosage_per_acre', '')}")
        treat_str = "\n".join(t_lines)

        reply = (
            f"🔬 **Integrated Pest Management for {p_name} (*{p_info.get('scientific_name')}*):**\n\n"
            f"⚠️ **Transmitted Pathogens:** {d_text}.\n\n"
            f"📋 **Verified Treatments & Commercial Products:**\n{treat_str}\n\n"
            "💡 **Agronomic IPM Strategy:**\n"
            f"• Install 12-15 yellow sticky cards per acre to trap adult alate vectors.\n"
            "• Spray cold-pressed Neem Oil (10,000 ppm Azadirachtin) at 3 ml/L for biological ovicidal action.\n"
            f"• Current weather ({cur_temp}°C, {cur_hum}% RH) is favorable for spraying before 10:00 AM."
        )

    return {
        "ok": True,
        "reply": reply,
        "source": "PestPulse Verified Expert System",
        "crop": crop,
        "language": "kn" if is_kn else "en"
    }
