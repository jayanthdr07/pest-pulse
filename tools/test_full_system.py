import sys, os, cv2
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'cloud'))
sys.stdout.reconfigure(encoding='utf-8')
import detectors
import pest_knowledge

test_cases = [
    # (filename, trap_type, crop_type, suspected_pest, expected_count_approx, expected_dominant_pest)
    ('manual_upload_20261104_145614_420.jpg', 'auto', 'Maize', 'fall_armyworm', 1, 'fall_armyworm'),
    ('manual_upload_20261104_191959_217.jpg', 'auto', 'Tomato', 'auto', 1, 'tuta'),
    ('manual_upload_20261105_000923_903.jpg', 'sticky_yellow', 'Tomato', 'auto', 100, 'whitefly'),
    ('manual_upload_20261104_180451_102.jpg', 'sticky_yellow', 'Tomato', 'auto', 100, 'whitefly'),
    ('manual_upload_20261104_155047_367.jpg', 'blue', 'Chilli', 'thrips', 6, 'thrips'),
]

print("======================================================================")
print("             PESTPULSE ACCURACY & COUNT EVALUATION TEST               ")
print("======================================================================")

all_passed = True

for fn, trap_t, crop_t, susp_p, exp_count, exp_pest in test_cases:
    p = os.path.join(os.path.dirname(__file__), '..', 'cloud', 'data', 'images', fn)
    if not os.path.exists(p):
        print(f"Skipping {fn} (not found)")
        continue
    img = cv2.imread(p)
    dets, counts, engine, info = detectors.count_trap(img, trap_type=trap_t, crop_type=crop_t, suspected_pest=susp_p)
    total = len(dets)
    dom_pest = info.get("classified_pest", "unknown")
    
    # Check pest knowledge
    pk = pest_knowledge.get_pest_knowledge(dom_pest, crop_t)
    fert = pk.get("fertilizers_and_treatments", [])
    dis = pk.get("diseases_created", [])

    print(f"\n[IMAGE] {fn}")
    print(f"  Inputs: Trap='{trap_t}', Crop='{crop_t}', Suspected='{susp_p}'")
    print(f"  Result: Count={total} (Expected ~{exp_count}), Dominant Pest='{dom_pest}' (Expected '{exp_pest}')")
    print(f"  Engine: {engine} | Mode: {info.get('mode')} | Conf: {info.get('confidence')}")
    print(f"  Rationale: {info.get('rationale')}")
    print(f"  Diseases Created ({len(dis)}): {[d.get('name') for d in dis[:2]]}")
    print(f"  Fertilizers/Treatments ({len(fert)}): {[f.get('product_name') + ' (' + f.get('dilution_percentage', '') + ')' for f in fert[:2]]}")

    # Validate single insect precision
    if exp_count == 1:
        if total != 1:
            print(f"  FAIL: Expected EXACT count of 1, got {total}")
            all_passed = False
        else:
            print("  PASS: Exact count of 1 successfully verified!")
    elif exp_count >= 50:
        if total < 50:
            print(f"  FAIL: Expected dense card count >= 50, got {total}")
            all_passed = False
        else:
            print(f"  PASS: Dense sticky card count {total} >= 50 (Emergency outbreak trigger verified!)")

    if exp_pest in dom_pest.lower():
        print(f"  PASS: Correct pest species '{dom_pest}' identified!")
    else:
        print(f"  FAIL: Expected '{exp_pest}', got '{dom_pest}'")
        all_passed = False

print("\n======================================================================")
print(f"ALL TESTS PASSED: {all_passed}")
print("======================================================================")
