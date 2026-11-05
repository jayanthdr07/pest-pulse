import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'cloud'))
sys.stdout.reconfigure(encoding='utf-8')
import pest_knowledge

pests = [
    "whitefly",
    "fall_armyworm",
    "tuta",
    "thrips",
    "aphids",
    "fruit_borer",
    "brown_planthopper",
    "liriomyza",
]

print("==========================================================================")
print("          VERIFYING ALL 8 PESTS, SECONDARY DISEASES & TREATMENTS          ")
print("==========================================================================")

all_ok = True
img_dir = pest_knowledge.PRODUCT_IMG_DIR

for p_key in pests:
    p = pest_knowledge.get_pest_knowledge(p_key)
    print(f"\n[{p_key.upper()}] - {p['name_en']}")
    print(f"  Scientific: {p['scientific_name']}")
    
    print("  Secondary Diseases:")
    for d in p['diseases_created']:
        print(f"    * {d['name']} ({d['pathogen_type']})")
    
    print("  Fungicides / Bactericides / Treatments:")
    for t in p['fertilizers_and_treatments']:
        rel_img = t['image_url'].replace('/img/products/', '')
        full_img_p = os.path.join(img_dir, rel_img)
        img_exists = os.path.exists(full_img_p)
        print(f"    - {t['product_name']}: {t['dilution_percentage']} | Image: {rel_img} (Exists: {img_exists})")
        print(f"      Action: {t['action']}")
        if not img_exists:
            all_ok = False
            print(f"      [ERROR] Image not found: {full_img_p}")

print("\n==========================================================================")
print(f"ALL 8 PESTS VERIFIED SUCCESSFULLY: {all_ok}")
print("==========================================================================")
