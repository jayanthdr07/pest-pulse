"""
Automated End-to-End Verification of PestPulse Feature Extensions:
1. QR-Based Crop Passport & Public Visitor Report
2. Pest Escalation Engine, Expert Consultations & Jitsi Video
3. Multilingual Voice Agent & Proactive Alerts
4. Trap Camera Gallery & Live Hardware Captures
5. Count via Photo Upload (OpenCV AI)
"""
import io
import json
import urllib.request
import urllib.parse
import sys

BASE_URL = "http://localhost:8080"


def test_get(endpoint):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers={"Authorization": "Bearer test"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode("utf-8")
            return resp.status, json.loads(data) if "json" in resp.headers.get("Content-Type", "") else data
    except Exception as e:
        print(f"FAILED GET {endpoint}: {e}")
        return getattr(e, "code", 500), str(e)


def test_post(endpoint, payload):
    url = f"{BASE_URL}{endpoint}"
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json", "Authorization": "Bearer test"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode("utf-8")
            return resp.status, json.loads(data)
    except Exception as e:
        print(f"FAILED POST {endpoint}: {e}")
        return getattr(e, "code", 500), str(e)


def run_all_tests():
    print("============================================================")
    print("  PESTPULSE EXTENSION TEST SUITE (PASSPORT, EXPERTS, VOICE)  ")
    print("============================================================\n")
    passed = 0
    total = 0

    # 1. Health
    total += 1
    status, res = test_get("/api/v1/health")
    assert status == 200 and res.get("ok"), "Health check failed"
    print("[PASS] 1. Cloud server health check OK")
    passed += 1

    # 2. Crop Passport for Field
    total += 1
    status, res = test_get("/api/v1/passport/field/field_001")
    assert status == 200 and res.get("ok"), "Passport fetch failed"
    token = res["passport"]["token_hash"]
    assert "data:image/png;base64" in res["qr_data_url"], "QR data URL missing"
    print(f"[PASS] 2. Crop Passport generated (Token: {token}) with QR base64 data URL")
    passed += 1

    # 3. Public Visitor Passport View
    total += 1
    status, res = test_get(f"/api/v1/passport/view/{token}")
    assert status == 200 and res.get("ok"), "Public passport view failed"
    report = res["report"]
    assert report["crop_identity"]["crop_type"] == "Tomato", "Crop identity incorrect"
    assert len(report["treatments"]) >= 1, "Treatments missing from report"
    assert "regulatory_statement" in report["integrity"], "Regulatory integrity missing"
    print(f"[PASS] 3. Public Visitor Report accessible via QR link ({len(report['hardware_observations'])} photos, {len(report['treatments'])} treatments)")
    passed += 1

    # 4. Treatments API
    total += 1
    status, res = test_get("/api/v1/treatments?field_id=field_001")
    assert status == 200 and res.get("count") >= 1, "Treatments API failed"
    print(f"[PASS] 4. Treatment Audit Trail returned {res['count']} recorded interventions")
    passed += 1

    # 5. Add Treatment Record
    total += 1
    status, res = test_post("/api/v1/treatments", {
        "field_id": "field_001",
        "target_pest": "Tomato Leafminer",
        "product_name": "Tricho-Pest Bio-Control",
        "category": "Bio-pesticide",
        "active_ingredient": "Trichogramma pretiosum",
        "rate_per_acre": "50,000 eggs/acre",
        "total_quantity": "125,000 parasitoids",
        "applied_date": "2026-11-04",
        "notes": "Field release for biological pest suppression"
    })
    assert status == 201 and res.get("ok"), "Create treatment failed"
    print("[PASS] 5. Recorded new treatment: Tricho-Pest Bio-Control")
    passed += 1

    # 6. Escalations API
    total += 1
    status, res = test_get("/api/v1/escalations?field_id=field_001")
    assert status == 200, "Escalations fetch failed"
    print(f"[PASS] 6. Pest Escalation Engine returned {res.get('count', 0)} active escalation events")
    passed += 1

    # 7. Agricultural Experts Directory
    total += 1
    status, res = test_get("/api/v1/experts")
    assert status == 200 and res.get("count") >= 3, "Experts directory missing"
    experts = res["experts"]
    print(f"[PASS] 7. Verified Experts Directory ({len(experts)} agronomists: {experts[0]['name']}, {experts[1]['name']}, {experts[2]['name']})")
    passed += 1

    # 8. Appointments & Jitsi Room API
    total += 1
    status, res = test_get("/api/v1/appointments")
    assert status == 200 and res.get("count") >= 1, "Appointments fetch failed"
    aid = res["appointments"][0]["appointment_id"]
    status, jitsi = test_get(f"/api/v1/appointments/{aid}/jitsi")
    assert status == 200 and "meet.jit.si" in jitsi["meeting_url"], "Jitsi URL invalid"
    print(f"[PASS] 8. Appointment #{aid} Jitsi Video Room created: {jitsi['meeting_url']}")
    passed += 1

    # 9. Voice Agent Latest Script (Bilingual)
    total += 1
    status, res = test_get("/api/v1/voice/latest-script?field_id=field_001")
    assert status == 200 and res.get("ok"), "Voice script fetch failed"
    assert "PestPulse" in res["script_en"], "English voice script invalid"
    assert "ಪೆಸ್ಟ್‌ಪಲ್ಸ್" in res["script_kn"], "Kannada voice script invalid"
    print(f"[PASS] 9. Multilingual Voice Agent generated verified EN & KN broadcast transcripts")
    passed += 1

    # 10. Outbound Voice Call Simulation
    total += 1
    status, res = test_post("/api/v1/voice/trigger-call", {"field_id": "field_001", "language": "kn"})
    assert status == 200 and res.get("ok"), "Trigger voice call failed"
    print(f"[PASS] 10. Simulated proactive IVR telephone dispatch: {res.get('message')}")
    passed += 1

    # 11. Trap Images Gallery API
    total += 1
    status, res = test_get("/api/v1/trap-images?limit=10")
    assert status == 200 and res.get("count") >= 1, "Trap images gallery failed"
    first_img = res["images"][0]
    assert first_img.get("raw_image_url"), "Raw image URL missing"
    print(f"[PASS] 11. Trap Camera Gallery loaded {res['count']} hardware captures from optical nodes")
    passed += 1

    # 12. Public SPA Fallback Route
    total += 1
    status, html = test_get(f"/passport-view/{token}")
    assert status == 200 and ("<!DOCTYPE html>" in html or "html" in html.lower()), "SPA fallback failed"
    print("[PASS] 12. Public URL routing fallback serves responsive SPA landing page")
    passed += 1

    print("\n------------------------------------------------------------")
    print(f"ALL TESTS PASSED: {passed}/{total} features verified successfully!")
    print("------------------------------------------------------------\n")


if __name__ == "__main__":
    run_all_tests()
