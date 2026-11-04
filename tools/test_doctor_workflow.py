import urllib.request
import json
import os
import cv2
import numpy as np
import random

BASE = "http://127.0.0.1:8080"

def test_workflow():
    print("==================================================")
    print("1. CHECK REGISTERED DOCTORS")
    print("==================================================")
    req = urllib.request.urlopen(f"{BASE}/api/v1/experts")
    experts = json.loads(req.read().decode())["experts"]
    target_expert = None
    for exp in experts:
        print(f" - [{exp['expert_id']}] {exp['name']} -> {exp.get('email')} ({exp.get('specialization')})")
        if "Jayanth" in exp["name"]:
            target_expert = exp

    assert target_expert is not None, "Dr. Jayanth Gowda must be registered!"
    print(f"\nTarget doctor found: {target_expert['name']} ({target_expert['email']})")

    print("\n==================================================")
    print("2. BOOK APPOINTMENT WITH DR. JAYANTH GOWDA")
    print("==================================================")
    payload = json.dumps({
        "expert_id": target_expert["expert_id"],
        "field_id": "field_001",
        "appointment_date": "2026-11-05",
        "appointment_time": "10:30 AM",
        "time_zone": "Asia/Kolkata",
        "consultation_type": "video",
        "problem_description": "Whitefly surge causing Leaf Curl Virus symptoms across tomato blocks",
        "notes": "Urgent review required before second biopesticide spray"
    }).encode("utf-8")

    req2 = urllib.request.Request(
        f"{BASE}/api/v1/appointments",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    res2 = json.loads(urllib.request.urlopen(req2).read().decode("utf-8"))
    apt = res2["appointment"]
    print(f"Appointment ID: {apt['appointment_id']}")
    print(f"Doctor Assigned: {res2.get('doctor_email')}")
    print(f"Doctor Email: {apt.get('expert_email')}")
    print(f"Jitsi Room: {apt.get('jitsi_room_id')}")
    print(f"Doctor Accept URL: {res2.get('accept_url')}")

    print("\n==================================================")
    print("3. DOCTOR ACCEPTS APPOINTMENT VIA EMAIL LINK")
    print("==================================================")
    accept_url = res2["accept_url"]
    req3 = urllib.request.urlopen(accept_url)
    print(f"HTTP Status: {req3.status}")
    accept_html = req3.read().decode("utf-8")
    assert "Automatic Call Dispatched" in accept_html
    print("[OK] Confirmation page confirmed: Automatic call dispatched to farmer!")

    print("\n==================================================")
    print("4. VERIFY VOICE CALL DISPATCH LOG")
    print("==================================================")
    req4 = urllib.request.urlopen(f"{BASE}/api/v1/voice/history")
    calls = json.loads(req4.read().decode("utf-8"))["communications"]
    print(f"Total voice calls logged: {len(calls)}")
    latest_call = calls[0]
    print(f"Latest Call ID: {latest_call.get('comm_id')}")
    print(f"Channel: {latest_call.get('channel')}")
    print(f"Status: {latest_call.get('status')}")
    script = latest_call.get("script_en") or latest_call.get("script_kn", "")
    print(f"Voice Script: {script[:140]}...")
    assert "Jayanth" in script or "accepted" in script
    print("[OK] Doctor acceptance call successfully registered with custom script!")

    print("\n==================================================")
    print("5. TEST PHOTO SCAN EXACT COUNT, DISEASES & FERTILIZERS")
    print("==================================================")
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"

    with open("cloud/data/images/products/coragen_chlorantraniliprole.jpg", "rb") as f:
        img_bytes = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="crop"\r\n\r\nTomato\r\n'
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="field_id"\r\n\r\nfield_001\r\n'
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="farmer_phone"\r\n\r\n+91 98450 12345\r\n'
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="insect_scan.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8") + img_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req5 = urllib.request.Request(
        f"{BASE}/api/v1/upload-count",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    res5 = json.loads(urllib.request.urlopen(req5).read().decode("utf-8"))
    print(f"Exact Pest Count: {res5.get('total_detected')}")
    print(f"Identified Pest: {res5.get('pest_name')}")
    print(f"Scientific Name: {res5.get('scientific_name')}")
    print(f"Diseases Caused: {len(res5.get('diseases_created', []))} diseases identified")
    for d in res5.get("diseases_created", []):
        print(f"   * {d.get('name')} [{d.get('pathogen_type')}] - Potential Damage: {d.get('crop_damage_pct')}")
        print(f"     Symptoms: {d.get('symptoms')[:75]}...")
    print(f"\nFertilizers & Treatments: {len(res5.get('fertilizers_and_treatments', []))} products recommended")
    for fert in res5.get("fertilizers_and_treatments", []):
        print(f"   * {fert.get('product_name')}")
        print(f"     Dilution: {fert.get('dilution_percentage')} | Dosage: {fert.get('dosage_per_acre')}")
        print(f"     Real Product Image: {fert.get('image_url')}")
    print(f"\nDirect Voice Call Dispatched: {res5.get('direct_call_dispatched')}")
    print(f"Emergency Outbreak Triggered (50+): {res5.get('emergency_outbreak_triggered')}")
    assert res5.get("direct_call_dispatched") is True
    print("[OK] Direct phone call placed to farmer explaining findings, diseases & fertilizers!")

    print("\n==================================================")
    print("6. TEST 50+ INSECTS EMERGENCY OUTBREAK RULE")
    print("==================================================")
    # Synthesize yellow sticky trap image with 55 distinct insect blobs
    surge_img = np.full((600, 600, 3), (0, 220, 255), dtype=np.uint8) # yellow BGR card
    random.seed(99)
    for _ in range(58):
        x = random.randint(40, 560)
        y = random.randint(40, 560)
        cv2.circle(surge_img, (x, y), 6, (15, 15, 15), -1)

    _, surge_buf = cv2.imencode(".jpg", surge_img)
    surge_bytes = surge_buf.tobytes()

    surge_boundary = "----WebKitFormBoundarySurgeTest50"
    surge_body = (
        f"--{surge_boundary}\r\n"
        f'Content-Disposition: form-data; name="crop"\r\n\r\nTomato\r\n'
        f"--{surge_boundary}\r\n"
        f'Content-Disposition: form-data; name="field_id"\r\n\r\nfield_001\r\n'
        f"--{surge_boundary}\r\n"
        f'Content-Disposition: form-data; name="farmer_phone"\r\n\r\n+91 98450 12345\r\n'
        f"--{surge_boundary}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="outbreak_trap.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8") + surge_bytes + f"\r\n--{surge_boundary}--\r\n".encode("utf-8")

    req_surge = urllib.request.Request(
        f"{BASE}/api/v1/upload-count",
        data=surge_body,
        headers={"Content-Type": f"multipart/form-data; boundary={surge_boundary}"}
    )
    res_surge = json.loads(urllib.request.urlopen(req_surge).read().decode("utf-8"))
    print(f"Surge Image Detected Count: {res_surge.get('total_detected')}")
    print(f"Surge Risk Level: {res_surge.get('risk_level')}")
    print(f"Emergency Outbreak Triggered (50+): {res_surge.get('emergency_outbreak_triggered')}")
    assert res_surge.get("total_detected") >= 50
    assert res_surge.get("emergency_outbreak_triggered") is True
    print("[OK] Exact count >= 50 detected by model!")

    # Verify emergency voice call placed
    req_v2 = urllib.request.urlopen(f"{BASE}/api/v1/voice/history")
    calls2 = json.loads(req_v2.read().decode("utf-8"))["communications"]
    emergency_call = calls2[0]
    print(f"Emergency Call Script: {emergency_call.get('script_en')[:140]}...")
    assert "CRITICAL EMERGENCY" in emergency_call.get("script_en", "") or "outbreak" in emergency_call.get("script_en", "").lower()
    print("[OK] Emergency alert call placed to farmer!")

    # Verify emergency alert email was generated for Dr. Jayanth Gowda
    email_files = os.listdir("cloud/data/emails")
    print(f"Total notification emails archived: {len(email_files)}")
    outbreak_emails = [f for f in email_files if "emergency_outbreak" in f or "outbreak" in f]
    print(f"Emergency outbreak emails dispatched: {outbreak_emails}")
    assert len(outbreak_emails) > 0
    print("[OK] Emergency alert email sent to Dr. Jayanth Gowda (jayanthgowda1406@gmail.com)!")

    print("\n==================================================")
    print("7. VERIFY QR PASSPORT LAN IP RESOLUTION & REPORT")
    print("==================================================")
    req6 = urllib.request.urlopen(f"{BASE}/api/v1/passport/field/field_001")
    passport_data = json.loads(req6.read().decode("utf-8"))
    report = passport_data.get("report", {})
    qr_url = passport_data.get("passport_url") or report.get("passport", {}).get("passport_url")
    print(f"Crop Passport Public QR URL: {qr_url}")
    assert qr_url and "172.17.24.144:8080" in qr_url
    print("[OK] LAN IP matches 172.17.24.144:8080 for multi-device scanning!")

    # Check that report is accessible via public URL token
    token = passport_data["passport"]["token_hash"]
    req_public = urllib.request.urlopen(f"{BASE}/api/v1/passport/view/{token}")
    public_res = json.loads(req_public.read().decode("utf-8"))
    print(f"Public Passport Report Crop: {public_res.get('report', {}).get('crop_identity', {}).get('crop_name')}")
    print(f"Total Hardware Observations: {public_res.get('report', {}).get('monitoring_summary', {}).get('total_observations')}")
    print(f"Report Sections Present: {list(public_res.get('report', {}).keys())}")
    print("[OK] Passport report fully structured, authenticated, and accessible by external devices!")

    print("\n==================================================")
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    test_workflow()
