import re

# 1. Update config.py
config_path = r"C:\Users\JAYANTH DR\.gemini\antigravity\scratch\pestpulse\cloud\config.py"
with open(config_path, "r", encoding="utf-8") as f:
    cfg = f.read()

cfg = re.sub(r"YOLO_CONF\s*=\s*[0-9.]+", "YOLO_CONF = 0.35", cfg)
cfg = re.sub(r"YOLO_IMGSZ\s*=\s*[0-9]+", "YOLO_IMGSZ = 512", cfg)
cfg = re.sub(r"YOLO_IOU\s*=\s*[0-9.]+", "YOLO_IOU = 0.30", cfg)

with open(config_path, "w", encoding="utf-8") as f:
    f.write(cfg)
print("Updated config.py")

# 2. Update detectors.py
detectors_path = r"C:\Users\JAYANTH DR\.gemini\antigravity\scratch\pestpulse\cloud\detectors.py"
with open(detectors_path, "r", encoding="utf-8") as f:
    code = f.read()

old_run_pattern = re.compile(r"    def run\(self, img\):.*?return dets\n", re.DOTALL)

new_run = """    def run(self, img):
        h, w = img.shape[:2]
        iou_val = getattr(config, "YOLO_IOU", 0.30)
        imgsz_val = getattr(config, "YOLO_IMGSZ", 512)
        conf_val = getattr(config, "YOLO_CONF", 0.35)
        res = self.model.predict(
            img,
            conf=conf_val,
            imgsz=imgsz_val,
            iou=iou_val,
            agnostic_nms=True,
            verbose=False,
        )[0]
        names = res.names
        dets = []
        masks = res.masks.data.cpu().numpy() if res.masks is not None else None
        for i, b in enumerate(res.boxes):
            x1, y1, x2, y2 = [int(v) for v in b.xyxy[0].tolist()]
            bw, bh = x2 - x1, y2 - y1
            # Morphological constraint: Insects on cards/leaves are never > 25% of image width/height
            # and never tiny single dead pixels (< 5 px)
            if bw > 0.25 * w or bh > 0.25 * h or bw < 5 or bh < 5:
                continue
            cls_name = names[int(b.cls[0])]
            score = round(float(b.conf[0]), 3)
            d = {
                "cls": cls_name,
                "class": cls_name,
                "conf": score,
                "confidence": score,
                "box": [x1, y1, x2, y2],
            }
            if masks is not None:
                m = cv2.resize(masks[i], (w, h)) > 0.5
                d["area"] = int(m.sum())
            else:
                d["area"] = int(bw * bh * 0.6)
            dets.append(d)

        return dets
"""

code = old_run_pattern.sub(new_run, code)

with open(detectors_path, "w", encoding="utf-8") as f:
    f.write(code)
print("Updated detectors.py with precision YOLO run!")
