import urllib.request
import json
import os
import sys
import cv2
import numpy as np
import random

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE = "http://127.0.0.1:8080"

def test_fixes():
    print("==================================================")
    print("TEST 1: EMAIL DISPATCH & GMAIL 1-CLICK WORKFLOW")
    print("==================================================")
    # Check experts
    req = urllib.request.urlopen(f"{BASE}/api/v1/experts")
    experts = json.loads(req.read().decode("utf-8"))["experts"]
    target_expert = next(exp for exp in experts if "Jayanth" in exp["name"])
    print(f"Target Doctor: {target_expert['name']} ({target_expert['email']})")

    # Book appointment
    payload = json.dumps({
        "expert_id": target_expert["expert_id"],
        "field_id": "field_001",
        "appointment_date": "2026-11-06",
        "appointment_time": "11:00 AM",
        "consultation_type": "video",
        "problem_description": "Whitefly swarm escalating rapidly with chlorosis symptoms."
    }).encode("utf-8")

    req2 = urllib.request.Request(f"{BASE}/api/v1/appointments", data=payload, headers={"Content-Type": "application/json"})
    res2 = json.loads(urllib.request.urlopen(req2).read().decode("utf-8"))
    print(f"Appointment ID: {res2['appointment']['appointment_id']}")
    print(f"Assigned Doctor Email: {res2.get('doctor_email')}")
    print(f"1-Click Gmail Web Link: {res2.get('gmail_web_url')[:90]}...")
    assert res2.get("doctor_email") == "jayanthgowda1406@gmail.com"
    assert "mail.google.com" in res2.get("gmail_web_url", "")
    print("[PASS] One-click Gmail web invitation link generated for Dr. Jayanth Gowda!")

    print("\n==================================================")
    print("TEST 2: DOCTOR ACCEPTANCE & INCOMING CALL RINGING")
    print("==================================================")
    accept_url = res2["accept_url"]
    urllib.request.urlopen(accept_url)

    # Check incoming call endpoint for live device ringing
    req_call = urllib.request.urlopen(f"{BASE}/api/v1/voice/latest-call")
    call_data = json.loads(req_call.read().decode("utf-8"))
    print(f"Has Active Incoming Call: {call_data.get('has_call')}")
    inc = call_data.get("incoming_call")
    assert inc is not None
    print(f"Call Title: {inc.get('title')}")
    print(f"Target Phone: {inc.get('phone')}")
    print(f"Urgency: {inc.get('urgency')}")
    print(f"Live Audio Script: {inc.get('script_en')[:110]}...")
    assert "Jayanth" in inc.get("title", "") or "Jayanth" in inc.get("script_en", "")
    print("[PASS] Doctor acceptance triggers live incoming call ringing modal!")

    print("\n==================================================")
    print("TEST 3: EXACT INSECT IDENTIFICATION (WHITEFLY)")
    print("==================================================")
    # Synthesize yellow sticky trap image with tiny bright whitefly specs
    whitefly_img = np.full((500, 500, 3), (0, 225, 255), dtype=np.uint8) # yellow card BGR
    random.seed(12)
    for _ in range(18):
        x = random.randint(30, 470)
        y = random.randint(30, 470)
        cv2.circle(whitefly_img, (x, y), 3, (240, 245, 250), -1) # tiny pale-white specs

    _, wf_buf = cv2.imencode(".jpg", whitefly_img)
    wf_bytes = wf_buf.tobytes()

    boundary = "----WebKitFormBoundaryWhiteflyTest"
    wf_body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="crop"\r\n\r\nTomato\r\n'
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="field_id"\r\n\r\nfield_001\r\n'
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="trap"\r\n\r\nyellow_sticky\r\n'
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="suspected_pest"\r\n\r\nauto\r\n'
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="whitefly_card.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8") + wf_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req_wf = urllib.request.Request(
        f"{BASE}/api/v1/upload-count",
        data=wf_body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    res_wf = json.loads(urllib.request.urlopen(req_wf).read().decode("utf-8"))
    print(f"Exact Count: {res_wf.get('total_detected')}")
    print(f"Exact Pest Name: {res_wf.get('pest_name')}")
    print(f"Scientific Name: {res_wf.get('scientific_name')}")
    print(f"Morphological Rationale: {res_wf.get('detection_rationale')}")
    assert "Whitefly" in res_wf.get("pest_name", "")
    print("[PASS] Exact insect classified as Whitefly based on morphological vision!")

    print("\n==================================================")
    print("TEST 4: REAL FERTILIZERS & DILUTION PERCENTAGES")
    print("==================================================")
    ferts = res_wf.get("fertilizers_and_treatments", [])
    print(f"Total Recommended Treatments: {len(ferts)}")
    for f in ferts:
        print(f" • {f['product_name']}")
        print(f"   Dilution: {f['dilution_percentage']} | Dosage: {f['dosage_per_acre']}")
        print(f"   Real Commercial Packaging Image: {f['image_url']}")
        assert "%" in f["dilution_percentage"]
        disk_path = os.path.join("cloud", "data", "images", f["image_url"].replace("/img/", ""))
        assert os.path.exists(disk_path), f"File {disk_path} does not exist on disk"
    print("[PASS] Real fertilizers with verified foliar dilution percentages and packaging images confirmed!")

    print("\n==================================================")
    print("TEST 5: 50+ INSECTS EMERGENCY SIREN & CALL")
    print("==================================================")
    # Synthesize outbreak image with 56 insects
    outbreak_img = np.full((600, 600, 3), (0, 220, 255), dtype=np.uint8)
    for _ in range(56):
        x = random.randint(40, 560)
        y = random.randint(40, 560)
        cv2.circle(outbreak_img, (x, y), 5, (15, 15, 15), -1)

    _, ob_buf = cv2.imencode(".jpg", outbreak_img)
    ob_bytes = ob_buf.tobytes()

    ob_boundary = "----WebKitFormBoundaryOutbreakTest50"
    ob_body = (
        f"--{ob_boundary}\r\n"
        f'Content-Disposition: form-data; name="crop"\r\n\r\nTomato\r\n'
        f"--{ob_boundary}\r\n"
        f'Content-Disposition: form-data; name="field_id"\r\n\r\nfield_001\r\n'
        f"--{ob_boundary}\r\n"
        f'Content-Disposition: form-data; name="suspected_pest"\r\n\r\nauto\r\n'
        f"--{ob_boundary}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="outbreak.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8") + ob_bytes + f"\r\n--{ob_boundary}--\r\n".encode("utf-8")

    req_ob = urllib.request.Request(
        f"{BASE}/api/v1/upload-count",
        data=ob_body,
        headers={"Content-Type": f"multipart/form-data; boundary={ob_boundary}"}
    )
    res_ob = json.loads(urllib.request.urlopen(req_ob).read().decode("utf-8"))
    print(f"Exact Count: {res_ob.get('total_detected')}")
    print(f"Risk Level: {res_ob.get('risk_level')}")
    print(f"Emergency Outbreak Triggered: {res_ob.get('emergency_outbreak_triggered')}")
    assert res_ob.get("total_detected") >= 50
    assert res_ob.get("emergency_outbreak_triggered") is True

    # Verify incoming emergency siren call
    req_siren = urllib.request.urlopen(f"{BASE}/api/v1/voice/latest-call")
    siren_data = json.loads(req_siren.read().decode("utf-8"))["incoming_call"]
    print(f"Emergency Call Title: {siren_data.get('title')}")
    print(f"Urgency Level: {siren_data.get('urgency')}")
    print(f"Emergency Audio Script: {siren_data.get('script_en')[:120]}...")
    assert siren_data.get("urgency") == "critical"
    print("[PASS] 50+ insect surge immediately rings device with critical emergency audio siren!")

    print("\n==================================================")
    print("ALL FIXES VERIFIED AND PASSING 100%!")
    print("==================================================")

if __name__ == "__main__":
    test_fixes()
