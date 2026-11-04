import re

app_path = r"C:\Users\JAYANTH DR\.gemini\antigravity\scratch\pestpulse\cloud\app.py"
with open(app_path, "r", encoding="utf-8") as f:
    code = f.read()

old_insert = """    # Insert detections
    for d in dets:
        box = [int(x) for x in d["box"]]
        db.insert_detection(
            reading_id=rid,
            node="manual-photo-upload",
            field_id=field_id,
            crop_type=crop_type,
            insect_class=d.get("class", "insect"),
            common_name_en=d.get("common_name_en", "Detected Insect"),
            common_name_kn=d.get("common_name_kn", "ಪತ್ತೆಯಾದ ಕೀಟ"),
            scientific_name=d.get("scientific_name"),
            count=1,
            confidence=float(d.get("confidence", 0.85)),
            box_json=box,
            model_version=f"{engine}_v2",
        )"""

new_insert = """    # Insert detections
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
        )"""

if old_insert in code:
    code = code.replace(old_insert, new_insert)
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("app.py updated successfully!")
else:
    print("Could not find exact old_insert block")
