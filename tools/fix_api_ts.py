p = r"C:\Users\JAYANTH DR\.gemini\antigravity\scratch\pestpulse\frontend\src\services\api.ts"
with open(p, "r", encoding="utf-8") as f:
    code = f.read()

bad = "const res = await fetch(${API_BASE}/chat, {"
good = "const res = await fetch(`${API_BASE}/chat`, {"

code = code.replace(bad, good)

with open(p, "w", encoding="utf-8") as f:
    f.write(code)

print("api.ts corrected!")
