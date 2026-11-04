import re

app_p = r"C:\Users\JAYANTH DR\.gemini\antigravity\scratch\pestpulse\cloud\app.py"
with open(app_p, "r", encoding="utf-8") as f:
    code = f.read()

target = "# ------------------------------------------------------------------ Health & Images"

chat_route = """# ------------------------------------------------------------------ Floating AI Chatbot API
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


# ------------------------------------------------------------------ Health & Images"""

if target in code and '@app.post("/api/v1/chat")' not in code:
    code = code.replace(target, chat_route)
    with open(app_p, "w", encoding="utf-8") as f:
        f.write(code)
    print("Successfully added /api/v1/chat route to app.py")
else:
    print("Target not found or route already exists")
