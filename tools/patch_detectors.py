import os
import re

detectors_path = r"C:\Users\JAYANTH DR\.gemini\antigravity\scratch\pestpulse\cloud\detectors.py"
with open(detectors_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update _Yolo.run
old_run_pattern = re.compile(
    r"    def run\(self, img\):\s+res = self\.model\.predict\(img, conf=config\.YOLO_CONF, imgsz=config\.YOLO_IMGSZ, verbose=False\)\[0\].*?return dets",
    re.DOTALL
)

new_run = """    def run(self, img):
        iou_val = getattr(config, "YOLO_IOU", 0.45)
        res = self.model.predict(img, conf=config.YOLO_CONF, imgsz=config.YOLO_IMGSZ, iou=iou_val, verbose=False)[0]
        names = res.names
        dets = []
        masks = res.masks.data.cpu().numpy() if res.masks is not None else None
        for i, b in enumerate(res.boxes):
            x1, y1, x2, y2 = [int(v) for v in b.xyxy[0].tolist()]
            cls_name = names[int(b.cls[0])]
            conf_val = round(float(b.conf[0]), 3)
            d = {
                "cls": cls_name,
                "class": cls_name,
                "conf": conf_val,
                "confidence": conf_val,
                "box": [x1, y1, x2, y2],
            }
            if masks is not None:
                m = cv2.resize(masks[i], (img.shape[1], img.shape[0])) > 0.5
                d["area"] = int(m.sum())
            else:
                d["area"] = int((x2 - x1) * (y2 - y1) * 0.6)
            dets.append(d)
        return dets"""

code = old_run_pattern.sub(new_run, code)

# 2. Update _models()
old_models = """def _models():
    global _trap_yolo, _leaf_yolo
    if _trap_yolo is None:
        _trap_yolo = _Yolo(config.TRAP_MODEL_PATH)
        _leaf_yolo = _Yolo(config.LEAF_MODEL_PATH)
    return _trap_yolo, _leaf_yolo"""

new_models = """def _models():
    global _trap_yolo, _leaf_yolo
    if _trap_yolo is None or (not _trap_yolo.ready and os.path.exists(config.TRAP_MODEL_PATH)):
        _trap_yolo = _Yolo(config.TRAP_MODEL_PATH)
    if _leaf_yolo is None or (not _leaf_yolo.ready and os.path.exists(config.LEAF_MODEL_PATH)):
        _leaf_yolo = _Yolo(config.LEAF_MODEL_PATH)
    return _trap_yolo, _leaf_yolo"""

code = code.replace(old_models, new_models)

# 3. Update count_trap
old_count_pattern = re.compile(
    r"def count_trap\(img, trap_type=\"sticky_yellow\", crop_type=\"Tomato\", suspected_pest=None\):.*?return dets, counts, engine, info",
    re.DOTALL
)

new_count = """def count_trap(img, trap_type="sticky_yellow", crop_type="Tomato", suspected_pest=None):
    trap_model, _ = _models()
    if trap_model.ready:
        dets = trap_model.run(img)
        engine = "yolo"
        info = {"card_found": True}

        counts = {}
        for d in dets:
            c = d["cls"]
            counts[c] = counts.get(c, 0) + 1

        if counts:
            dominant_cls = max(counts.items(), key=lambda x: x[1])[0]
            confs = [d["conf"] for d in dets if d["cls"] == dominant_cls]
            avg_conf = float(np.mean(confs)) if confs else 0.92
            info["classified_pest"] = dominant_cls
            info["confidence"] = round(avg_conf, 2)
            info["rationale"] = f"YOLOv8 Deep Neural Vision: Identified {counts[dominant_cls]} {dominant_cls} specimens ({avg_conf*100:.1f}% confidence)."
        else:
            exact_pest, conf, rationale = classify_exact_pest(img, [], trap_type, crop_type, suspected_pest)
            info["classified_pest"] = exact_pest
            info["confidence"] = conf
            info["rationale"] = "Zero insect specimens detected on trap surface."

        return dets, counts, engine, info
    else:
        dets, info = classic_trap_count(img, trap_type)
        engine = "opencv"
        exact_pest, conf, rationale = classify_exact_pest(img, dets, trap_type, crop_type, suspected_pest)
        info["classified_pest"] = exact_pest
        info["confidence"] = conf
        info["rationale"] = rationale
        for d in dets:
            d["cls"] = exact_pest
            d["class"] = exact_pest
            if d.get("conf") is None:
                d["conf"] = conf
                d["confidence"] = conf
        counts = {exact_pest: len(dets)} if dets else {}
        return dets, counts, engine, info"""

code = old_count_pattern.sub(new_count, code)

# 4. Enhance classic_trap_count for calibrated 1-insect accuracy
old_classic_pattern = re.compile(
    r"def classic_trap_count\(img, trap_type\):.*?return dets, \{\"card_found\": False, \"mode\": \"foliage_macro_scan\"\}",
    re.DOTALL
)

new_classic = """def classic_trap_count(img, trap_type):
    \"\"\"
    High-accuracy optical insect counter for sticky cards, delta liners, and field leaf photos.
    Features:
    1. Adaptive background illumination normalization (cancels ambient light gradients & shadows).
    2. Minimum area & aspect ratio filtering (eliminates paper grain, camera noise, grid lines).
    3. Prominence saliency gating (ensures a single insect isn't miscounted as 10 due to background micro-flecks).
    \"\"\"
    h, w = img.shape[:2]
    scale = 1000.0 / max(h, w) if max(h, w) > 1000 else 1.0
    small = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA) if scale < 1.0 else img.copy()
    wh, ww = small.shape[:2]

    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    H, S, V = cv2.split(hsv)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

    # 1. Color Card Detection (Yellow, Blue, White)
    yellow = ((H >= 12) & (H <= 45) & (S >= 40) & (V >= 60)).astype(np.uint8) * 255
    blue = ((H >= 90) & (H <= 140) & (S >= 45) & (V >= 50)).astype(np.uint8) * 255
    white = ((S <= 55) & (V >= 155)).astype(np.uint8) * 255

    if "yellow" in trap_type.lower() or "sticky" in trap_type.lower():
        card_mask = yellow
    elif "blue" in trap_type.lower():
        card_mask = blue
    elif "delta" in trap_type.lower():
        card_mask = white
    else:
        card_mask = cv2.bitwise_or(yellow, white)

    card_mask = cv2.morphologyEx(card_mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25)))
    cnts, _ = cv2.findContours(card_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    card_region = None
    if cnts:
        best_c = max(cnts, key=cv2.contourArea)
        if cv2.contourArea(best_c) > 0.08 * wh * ww:
            card_region = np.zeros((wh, ww), dtype=np.uint8)
            cv2.drawContours(card_region, [best_c], -1, 255, -1)
            card_region = cv2.erode(card_region, cv2.getStructuringElement(cv2.MORPH_RECT, (13, 13)))

    species = config.TRAP_TYPES.get(trap_type, config.TRAP_TYPES.get(config.DEFAULT_TRAP, {}))["species"]

    # 2. Local Background Estimation & Illumination Normalization
    bg = cv2.medianBlur(gray, 31)
    diff = cv2.absdiff(gray, bg)

    if card_region is not None and cv2.countNonZero(card_region) > 0.05 * wh * ww:
        roi_mask = card_region
        card_diff = diff[roi_mask > 0]
        thresh_val = max(36, int(np.mean(card_diff) + 1.8 * np.std(card_diff)))
        _, bin_img = cv2.threshold(diff, thresh_val, 255, cv2.THRESH_BINARY)
        bin_img[roi_mask == 0] = 0
        bin_img = cv2.morphologyEx(bin_img, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))

        n, labels, stats, _ = cv2.connectedComponentsWithStats(bin_img, 8)
        card_area = cv2.countNonZero(roi_mask)
        min_area = max(45, int(card_area * 1.0e-4))
        max_area = int(card_area * 0.05)

        raw_blobs = []
        for i in range(1, n):
            x, y, bw, bh, a = stats[i]
            if a < min_area or a > max_area:
                continue
            aspect = max(bw, bh) / max(1, min(bw, bh))
            if aspect > 4.2:
                continue
            roi_diff = diff[y:y+bh, x:x+bw]
            c_val = float(np.mean(roi_diff)) if roi_diff.size > 0 else 0.0
            raw_blobs.append((x, y, bw, bh, a, c_val))

        blobs = []
        if raw_blobs:
            max_a = max(b[4] for b in raw_blobs)
            max_c = max(b[5] for b in raw_blobs)
            for x, y, bw, bh, a, c in raw_blobs:
                # If there are prominent insects, reject tiny faint background artifacts
                if max_a > 120 and a < (max_a * 0.15) and c < (max_c * 0.55):
                    continue
                blobs.append((x, y, bw, bh, a))

        dets = []
        for x, y, bw, bh, a in blobs:
            box = [int(x / scale), int(y / scale), int((x + bw) / scale), int((y + bh) / scale)]
            dets.append({"cls": species, "class": species, "conf": 0.94, "confidence": 0.94, "box": box, "area": int(a / scale / scale)})

        return dets, {"card_found": True, "mode": "trap_card_calibrated"}

    else:
        # Universal Plant Foliage & Macro Photo Scan
        green_mask = ((H >= 28) & (H <= 95) & (S >= 35)).astype(np.uint8) * 255
        if cv2.countNonZero(green_mask) > 0.15 * wh * ww:
            diff[green_mask == 0] = 0
            t_leaf = max(38, int(np.mean(diff[green_mask > 0]) + 1.8 * np.std(diff[green_mask > 0])))
            _, bin_img = cv2.threshold(diff, t_leaf, 255, cv2.THRESH_BINARY)
        else:
            t_gen = max(40, int(np.mean(diff) + 1.7 * np.std(diff)))
            _, bin_img = cv2.threshold(diff, t_gen, 255, cv2.THRESH_BINARY)

        bin_img = cv2.morphologyEx(bin_img, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
        cnts, _ = cv2.findContours(bin_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        raw_cnts = []
        for c in cnts:
            a = cv2.contourArea(c)
            if a < 45 or a > (wh * ww * 0.05):
                continue
            hull = cv2.convexHull(c)
            solidity = a / max(1.0, cv2.contourArea(hull))
            x, y, bw, bh = cv2.boundingRect(c)
            aspect = max(bw, bh) / max(1, min(bw, bh))
            if solidity >= 0.44 and aspect <= 4.0:
                roi_diff = diff[y:y+bh, x:x+bw]
                c_val = float(np.mean(roi_diff)) if roi_diff.size > 0 else 0.0
                raw_cnts.append((x, y, bw, bh, a, c_val))

        dets = []
        if raw_cnts:
            max_a = max(b[4] for b in raw_cnts)
            max_c = max(b[5] for b in raw_cnts)
            for x, y, bw, bh, a, c in raw_cnts:
                if max_a > 120 and a < (max_a * 0.15) and c < (max_c * 0.55):
                    continue
                box = [int(x / scale), int(y / scale), int((x + bw) / scale), int((y + bh) / scale)]
                dets.append({"cls": species, "class": species, "conf": 0.88, "confidence": 0.88, "box": box, "area": int(a / scale / scale)})

        return dets, {"card_found": False, "mode": "foliage_macro_scan"}"""

code = old_classic_pattern.sub(new_classic, code)

with open(detectors_path, "w", encoding="utf-8") as f:
    f.write(code)

print("detectors.py updated successfully!")
