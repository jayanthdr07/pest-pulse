"""
Direct database and image seeder for PestPulse.
Creates realistic hardware readings, sticky card photos with bounding boxes,
alerts, and historical trends for the demo fields and traps.
"""
import json
import math
import os
import random
import sys
import time

import cv2
import numpy as np

# Add cloud to path
CLOUD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "cloud"))
sys.path.insert(0, CLOUD_DIR)

import config
import db
import pests
import risk

db.init()
os.makedirs(config.IMAGE_DIR, exist_ok=True)


def generate_card_image(node, trap_type, count, seed=42):
    rng = random.Random(seed)
    w, h = 1024, 768
    # Background (housing box)
    img = np.full((h, w, 3), (55, 75, 95), dtype=np.uint8)
    # Add subtle texture
    noise = np.random.default_rng(seed).integers(0, 15, (h, w, 3), dtype=np.uint8)
    img = cv2.add(img, noise)

    # Sticky Card
    x0, y0, x1, y1 = 100, 70, w - 100, h - 70
    card_color = (25, 215, 240) if trap_type in ("sticky_yellow", "lirio_sticky") else (225, 235, 245)
    cv2.rectangle(img, (x0, y0), (x1, y1), card_color, -1)

    # Grid lines on card
    grid_col = tuple(int(c * 0.82) for c in card_color)
    for x in range(x0, x1, 50):
        cv2.line(img, (x, y0), (x, y1), grid_col, 1)
    for y in range(y0, y1, 50):
        cv2.line(img, (x0, y), (x1, y), grid_col, 1)

    # Card border
    cv2.rectangle(img, (x0, y0), (x1, y1), (20, 30, 20), 2)

    # Insect blobs and bounding boxes
    dets = []
    species = "whitefly" if trap_type == "sticky_yellow" else ("moth" if trap_type == "pheromone" else "tuta")

    for i in range(count):
        cx = rng.randint(x0 + 20, x1 - 20)
        cy = rng.randint(y0 + 20, y1 - 20)
        angle = rng.uniform(0, 180)

        if trap_type == "pheromone":  # moths
            rx, ry = rng.randint(14, 18), rng.randint(6, 8)
            cv2.ellipse(img, (cx, cy), (rx, ry), angle, 0, 360, (40, 50, 75), -1)
            cv2.ellipse(img, (cx, cy), (rx - 4, ry - 2), angle, 0, 360, (25, 30, 45), -1)
            box = [cx - rx - 3, cy - ry - 3, cx + rx + 3, cy + ry + 3]
        elif trap_type == "tuta_delta":
            rx, ry = rng.randint(11, 15), rng.randint(4, 6)
            cv2.ellipse(img, (cx, cy), (rx, ry), angle, 0, 360, (45, 60, 85), -1)
            box = [cx - rx - 2, cy - ry - 2, cx + rx + 2, cy + ry + 2]
        else:  # whiteflies
            rx, ry = rng.randint(5, 8), rng.randint(3, 5)
            # Pale translucent wings
            cv2.ellipse(img, (cx, cy), (rx + 2, ry + 1), angle + 35, 0, 360, (210, 215, 205), -1)
            # Body
            cv2.ellipse(img, (cx, cy), (rx, ry), angle, 0, 360, (20, 25, 25), -1)
            box = [cx - rx - 2, cy - ry - 2, cx + rx + 2, cy + ry + 2]

        dets.append({
            "cls": species,
            "conf": round(rng.uniform(0.85, 0.98), 2),
            "box": box,
        })

    # Header on annotated
    ann = img.copy()
    for d in dets:
        bx1, by1, bx2, by2 = d["box"]
        cv2.rectangle(ann, (bx1, by1), (bx2, by2), (0, 140, 255) if species == "tuta" else (0, 200, 0), 2)

    header = f"{node} | {trap_type} | Count: {count} | {species.upper()}"
    cv2.rectangle(ann, (0, 0), (w, 36), (20, 35, 20), -1)
    cv2.putText(ann, header, (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    return img, ann, dets


def seed():
    print("Seeding PestPulse database and generating realistic hardware observations...")
    now = time.time()
    day_s = 86400

    # Ensure devices exist
    devices = [
        ("trap1", "Trap 1 - Polyhouse North (Yellow)", "sticky_yellow", "whitefly", "field_001", 1800, 94, 4.18),
        ("trap2", "Trap 2 - Polyhouse South (Pheromone)", "pheromone", "fruit_borer", "field_001", 1800, 89, 4.08),
        ("trap3", "Trap 3 - West Delta (Tuta)", "tuta_delta", "tuta", "field_001", 1800, 91, 4.12),
        ("trap4", "Trap 4 - Chilli Plot (Blue/Yellow)", "sticky_yellow", "thrips", "field_002", 3600, 96, 4.22),
    ]

    for node, name, trap, pest, fid, iv, bp, bv in devices:
        db.touch_device(node, trap, rssi=random.randint(-68, -55), fw="1.1.0", ip="192.168.1.105", uptime_s=86400, battery_pct=bp, field_id=fid)
        db.update_device(node, name=name, trap=trap, pest=pest, interval_s=iv, field_id=fid, battery_pct=bp)

    # Generate 14 days of historical readings
    seed_idx = 100
    for d_ago in range(13, -1, -1):
        day_ts = now - d_ago * day_s
        for hour in (8, 12, 16, 20):
            ts = day_ts + (hour - 12) * 3600
            for node, name, trap, pest, fid, iv, bp, bv in devices:
                seed_idx += 1
                base_count = {
                    "trap1": 18 + int(12 * math.sin(d_ago * 0.4)) + random.randint(0, 4),
                    "trap2": 4 + int(3 * math.sin(d_ago * 0.5)) + random.randint(0, 2),
                    "trap3": 2 + int(2 * math.cos(d_ago * 0.3)) + random.randint(0, 2),
                    "trap4": 8 + int(5 * math.sin(d_ago * 0.45)) + random.randint(0, 3),
                }[node]

                total_on_card = base_count * 2 + random.randint(0, 5)
                new_catches = max(0, int(base_count / 3) + random.randint(0, 2))

                # Environmental variation
                temp = round(25.0 + 5.0 * math.sin((hour - 8) / 12 * math.pi) + random.uniform(-1, 1), 1)
                hum = round(75.0 - 18.0 * math.sin((hour - 8) / 12 * math.pi) + random.uniform(-3, 3), 1)

                tcfg = risk.trap_cfg(trap)
                lvl = "HIGH" if new_catches * 3 >= tcfg["high"] else ("MEDIUM" if new_catches * 3 >= tcfg["medium"] else "LOW")

                # Only generate image files for recent 3 days to keep disk light
                raw_filename, ann_filename = None, None
                if d_ago <= 3:
                    raw_img, ann_img, dets = generate_card_image(node, trap, total_on_card, seed=seed_idx)
                    raw_filename = f"{node}_{int(ts)}_raw.jpg"
                    ann_filename = f"{node}_{int(ts)}_ai.jpg"
                    th_filename = f"{node}_{int(ts)}_ai_t.jpg"
                    cv2.imwrite(os.path.join(config.IMAGE_DIR, raw_filename), raw_img, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    cv2.imwrite(os.path.join(config.IMAGE_DIR, ann_filename), ann_img, [cv2.IMWRITE_JPEG_QUALITY, 82])
                    cv2.imwrite(os.path.join(config.IMAGE_DIR, th_filename), cv2.resize(ann_img, (320, 240)), [cv2.IMWRITE_JPEG_QUALITY, 75])
                else:
                    dets = []

                counts_dict = {pest: total_on_card}
                rid = db.insert_reading(
                    ts=ts,
                    node=node,
                    field_id=fid,
                    kind="trap",
                    trap=trap,
                    temp=temp,
                    hum=hum,
                    total=total_on_card,
                    new=new_catches,
                    counts=counts_dict,
                    image=raw_filename,
                    annotated=ann_filename,
                    risk=lvl,
                    engine="opencv",
                    card_found=1,
                    rssi=random.randint(-72, -58),
                    seq=seed_idx,
                    battery_pct=max(70, bp - int(d_ago * 0.4)),
                    is_simulated=0,
                )

                # Insert detections
                if d_ago <= 3 and dets:
                    pest_data = pests.PESTS.get(pest, {})
                    db.insert_detection(
                        reading_id=rid,
                        ts=ts,
                        node=node,
                        field_id=fid,
                        crop_type="Tomato" if fid == "field_001" else "Chilli",
                        insect_class=pest,
                        common_name_en=pest_data.get("en", pest.title()),
                        common_name_kn=pest_data.get("kn", pest),
                        scientific_name=pest_data.get("latin", ""),
                        count=total_on_card,
                        confidence=0.92,
                        box_json=dets[:5],
                        model_version="opencv-v1",
                    )

    # Seed alerts
    db.insert_alert(
        farmer_id="farmer_001",
        field_id="field_001",
        node="trap1",
        level="MEDIUM",
        species="whitefly",
        catches_24h=28,
        title_en="Rising Whitefly Activity at Trap 1 - Polyhouse North",
        title_kn="ಪಾಲಿಹೌಸ್ ಉತ್ತರ ಬಲೆ 1: ಬಿಳಿ ನೊಣಗಳ ಸಂಖ್ಯೆ ಹೆಚ್ಚಳ",
        body_en="28 new whiteflies caught in the last 24 h (Action threshold: 20 medium / 50 high). Inspect undersides of young leaves for curling symptoms.",
        body_kn="ಕಳೆದ 24 ಗಂಟೆಗಳಲ್ಲಿ 28 ಹೊಸ ಬಿಳಿ ನೊಣಗಳು ದಾಖಲಾಗಿವೆ (ಕ್ರಮದ ಮಟ್ಟ: 20 ಮಧ್ಯಮ / 50 ಹೆಚ್ಚು). ಎಲೆ ಮುದುಡು ರೋಗದ ಲಕ್ಷಣಗಳಿಗೆ ಹೊಲ ಪರಿಶೀಲಿಸಿ.",
        steps=[
            {"en": "Inspect young leaves for upward curling and yellow vein clearing.", "kn": "ಎಲೆ ಮುದುಡುವ ಲಕ್ಷಣಗಳಿವೆಯೇ ಎಂದು ಎಳೆಯ ಎಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ."},
            {"en": "Ensure yellow sticky traps are clean; wipe off heavy dust or replace card.", "kn": "ಹಳದಿ ಅಂಟು ಬಲೆಗಳನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಿ ಅಥವಾ ಬದಲಾಯಿಸಿ."},
            {"en": "Spray Neem Oil 2% (20 ml/L) as a deterrent if count increases tomorrow.", "kn": "ನಾಳೆಯೂ ಹೆಚ್ಚಳ ಮುಂದುವರಿದರೆ ಬೇವಿನ ಎಣ್ಣೆ 2% ಸಿಂಪಡಿಸಿ."},
        ],
        done=[0],
        image=None,
        acked=0,
    )

    db.insert_alert(
        farmer_id="farmer_001",
        field_id="field_001",
        node="trap2",
        level="LOW",
        species="moth",
        catches_24h=4,
        title_en="Fruit Borer Monitoring Normal",
        title_kn="ಕಾಯಿ ಕೊರಕ ಪತಂಗಗಳ ಸಂಖ್ಯೆ ಸಾಮಾನ್ಯ",
        body_en="4 moths caught in 24 h. Population remains safely below the economic action threshold of 15 moths/day.",
        body_kn="24 ಗಂಟೆಗಳಲ್ಲಿ 4 ಪತಂಗಗಳು ದಾಖಲಾಗಿವೆ. ಸಂಖ್ಯೆ ಆರ್ಥಿಕ ಮಿತಿಯೊಳಗಿದೆ. ಸಿಂಪಡಣೆ ಅಗತ್ಯವಿಲ್ಲ.",
        steps=[
            {"en": "Continue routine trap monitoring.", "kn": "ನಿಯಮಿತವಾಗಿ ಬಲೆ ಗಮನಿಸುತ್ತಿರಿ."},
            {"en": "Check pheromone septa lure expiry (replace every 21 days).", "kn": "ಫೆರೋಮೋನ್ ಲೂರ್ ಅವಧಿ ಮುಗಿದಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ (21 ದಿನಕ್ಕೊಮ್ಮೆ ಬದಲಾಯಿಸಿ)."},
        ],
        done=[],
        image=None,
        acked=1,
    )

    # Seed an example spray log
    db.insert_spray(
        ts=now - 5 * day_s,
        field_id="field_001",
        pest="whitefly",
        product="Imidacloprid 17.8 SL",
        irac="4A",
        dose="0.3 ml/L (60 ml/acre)",
        area_acres=2.5,
        phi_days=5,
        notes="Applied in evening with 200 L water/acre as per KAU guidance. Good coverage on lower leaf canopy.",
        by_name="Ramesh Kumar",
    )

    # Seed an example 3D simulation event
    db.insert_simulation_event(
        farmer_id="farmer_001",
        field_id="field_001",
        event_type="3D_SPRAY_SIMULATION",
        pest_before="HIGH (64 insects/24h)",
        pest_after="LOW (8 insects/24h)",
        details="3D Smart Spraying Demonstration completed. Field area treated with precision targeted micro-mist. Simulation Only - No physical actuators triggered.",
        result="Success",
    )

    print("Database seeding completed successfully.")


if __name__ == "__main__":
    seed()
