import re

detectors_path = r"C:\Users\JAYANTH DR\.gemini\antigravity\scratch\pestpulse\cloud\detectors.py"
with open(detectors_path, "r", encoding="utf-8") as f:
    code = f.read()

old_yolo_run = re.compile(r"    def run\(self, img\):.*?return dets\n", re.DOTALL)

new_yolo_run = """    def run(self, img):
        iou_val = getattr(config, "YOLO_IOU", 0.30)
        res = self.model.predict(img, conf=0.35, imgsz=config.YOLO_IMGSZ, iou=iou_val, verbose=False)[0]
        names = res.names
        raw_dets = []
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
            raw_dets.append(d)

        if not raw_dets:
            return []

        # Saliency Gating: Suppress faint jitter specks when clear dominant specimens are detected
        max_c = max(d["conf"] for d in raw_dets)
        dets = [d for d in raw_dets if not (d["conf"] < 0.45 and d["conf"] < max_c * 0.55)]
        return dets
"""

code = old_yolo_run.sub(new_yolo_run, code)

with open(detectors_path, "w", encoding="utf-8") as f:
    f.write(code)

print("detectors.py updated with Saliency Gating YOLO run!")
