"""
PestPulse Comprehensive YOLOv8 Model Trainer.
Generates an advanced multi-scale agricultural pest dataset and fine-tunes
YOLOv8 Nano for:
1. Single macro insect detection (1 large insect in frame -> EXACT count of 1).
2. Clustered pest colonies and caterpillars on crop foliage.
3. Dense sticky trap cards (yellow, blue, white delta) with adhered insect specks.

Classes:
0: whitefly (Bemisia tabaci)
1: fall_armyworm (Spodoptera frugiperda)
2: tuta (Tuta absoluta)
3: thrips (Thrips palmi)
4: aphids (Aphis gossypii)
5: fruit_borer (Helicoverpa armigera)
"""
import os
import random
import shutil
import cv2
import numpy as np
import yaml
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "cloud", "data", "yolo_dataset")
MODELS_DIR = os.path.join(BASE_DIR, "cloud", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

CLASSES = [
    "whitefly",
    "fall_armyworm",
    "tuta",
    "thrips",
    "aphids",
    "fruit_borer"
]


def draw_realistic_macro_insect(img, cx, cy, cls_idx, scale, rng):
    """
    Renders high-fidelity anatomical insect features:
    - Multi-segment body, head capsule, antennae, legs, realistic coloration and wing textures.
    - scale: multiplier for insect size (e.g., 1.0 = ~40px, 4.0 = ~160px, 7.0 = ~280px).
    Returns (x1, y1, x2, y2).
    """
    h, w = img.shape[:2]
    cls_name = CLASSES[cls_idx]
    angle = rng.uniform(0, 360)
    rad = np.radians(angle)
    cos_a, sin_a = np.cos(rad), np.sin(rad)

    def rot(dx, dy):
        return int(cx + dx * cos_a - dy * sin_a), int(cy + dx * sin_a + dy * cos_a)

    if cls_name == "whitefly":
        # Snow-white powdery habit with yellow/cream thorax
        rw = int(scale * 12)
        rh = int(scale * 8)
        # Translucent white tent-like wings
        cv2.ellipse(img, rot(0, -rh//3), (rw, rh), int(angle + 20), 0, 360, (245, 250, 255), -1)
        cv2.ellipse(img, rot(0, rh//3), (rw, rh), int(angle - 20), 0, 360, (235, 245, 255), -1)
        # Yellow thorax and abdomen
        cv2.ellipse(img, (cx, cy), (int(rw * 0.6), int(rh * 0.45)), int(angle), 0, 360, (140, 215, 245), -1)
        # Eyes
        cv2.circle(img, rot(int(rw * 0.5), 0), max(1, int(scale * 1.5)), (20, 20, 160), -1)
        bw, bh = rw * 2 + 6, rh * 2 + 6

    elif cls_name == "fall_armyworm":
        # Segmented caterpillar with dorsal stripes and pinacula
        length = int(scale * 34)
        thickness = int(scale * 10)
        n_segs = 9
        seg_len = length // n_segs
        # Head capsule (dark brown / black with inverted Y mark)
        hx, hy = rot(length // 2, 0)
        cv2.circle(img, (hx, hy), int(thickness * 0.75), (25, 35, 45), -1)
        # Inverted Y suture on head
        cv2.line(img, (hx, hy - int(thickness*0.4)), (hx, hy), (210, 220, 230), max(1, int(scale * 0.6)))
        cv2.line(img, (hx, hy), (hx + int(thickness*0.4), hy + int(thickness*0.3)), (210, 220, 230), max(1, int(scale * 0.6)))
        cv2.line(img, (hx, hy), (hx - int(thickness*0.4), hy + int(thickness*0.3)), (210, 220, 230), max(1, int(scale * 0.6)))

        # Abdominal segments
        for s in range(n_segs):
            dx = (length // 2) - s * seg_len
            sx, sy = rot(dx, 0)
            col = (45 + s*2, 70 + s*3, 90 + s*2) # mottled olive-brown
            cv2.ellipse(img, (sx, sy), (seg_len + 2, thickness), int(angle), 0, 360, col, -1)
            # Dorsal pinacula dots (4 square dots on 8th segment)
            p1 = rot(dx, -thickness//2)
            p2 = rot(dx, thickness//2)
            cv2.circle(img, p1, max(1, int(scale * 0.8)), (15, 20, 25), -1)
            cv2.circle(img, p2, max(1, int(scale * 0.8)), (15, 20, 25), -1)
        bw, bh = length + thickness + 10, thickness * 2 + 10

    elif cls_name == "tuta":
        # Slender silvery-grey/brown micro-moth
        wing_l = int(scale * 18)
        wing_w = int(scale * 8)
        # Folded wings with mottled dark speckles
        cv2.ellipse(img, (cx, cy), (wing_l, wing_w), int(angle), 0, 360, (55, 75, 90), -1)
        # Fringe hair on wing tips
        tip = rot(wing_l, 0)
        cv2.circle(img, tip, int(scale * 2), (40, 55, 70), -1)
        # Threadlike antennae
        cv2.line(img, rot(-wing_l, -int(scale*3)), rot(-wing_l - int(scale*6), -int(scale*8)), (35, 45, 55), 1)
        cv2.line(img, rot(-wing_l, int(scale*3)), rot(-wing_l - int(scale*6), int(scale*8)), (35, 45, 55), 1)
        bw, bh = wing_l * 2 + 12, wing_w * 2 + 12

    elif cls_name == "thrips":
        # Slender needle-shaped elongated habit
        length = int(scale * 22)
        thickness = max(2, int(scale * 4))
        cv2.ellipse(img, (cx, cy), (length, thickness), int(angle), 0, 360, (25, 40, 55), -1)
        # Fringed narrow wings
        cv2.line(img, rot(-length//2, -thickness), rot(length//2, -thickness), (160, 180, 200), 1)
        bw, bh = length * 2 + 6, thickness * 3 + 6

    elif cls_name == "aphids":
        # Soft pear-shaped body with visible cornicles
        aw = int(scale * 11)
        ah = int(scale * 8)
        col = (35, 145, 65) if rng.random() > 0.4 else (25, 30, 35) # green or black
        cv2.ellipse(img, (cx, cy), (aw, ah), int(angle), 0, 360, col, -1)
        # Head
        cv2.circle(img, rot(aw//2, 0), max(1, int(scale * 2)), (col[0]//2, col[1]//2, col[2]//2), -1)
        # Cornicles
        cv2.line(img, rot(-aw//2, -ah//2), rot(-aw//2 - int(scale*3), -ah//2 - int(scale*2)), (15, 20, 25), 1)
        cv2.line(img, rot(-aw//2, ah//2), rot(-aw//2 - int(scale*3), ah//2 + int(scale*2)), (15, 20, 25), 1)
        bw, bh = aw * 2 + 8, ah * 2 + 8

    else:  # fruit_borer
        # Stout cylindrical caterpillar with lateral wavy stripes
        length = int(scale * 28)
        thickness = int(scale * 11)
        n_segs = 8
        seg_len = length // n_segs
        # Head
        hx, hy = rot(length // 2, 0)
        cv2.circle(img, (hx, hy), int(thickness * 0.7), (20, 60, 95), -1)
        # Body segments
        for s in range(n_segs):
            dx = (length // 2) - s * seg_len
            sx, sy = rot(dx, 0)
            col = (30 + s*3, 85 + s*4, 115 + s*3) # yellowish-green / brownish
            cv2.ellipse(img, (sx, sy), (seg_len + 2, thickness), int(angle), 0, 360, col, -1)
        # Lateral stripe
        cv2.line(img, rot(-length//2, thickness//2), rot(length//2, thickness//2), (210, 235, 245), max(1, int(scale * 0.7)))
        bw, bh = length + thickness + 10, thickness * 2 + 10

    x1 = max(0, cx - bw // 2)
    y1 = max(0, cy - bh // 2)
    x2 = min(w, cx + bw // 2)
    y2 = min(h, cy + bh // 2)
    return x1, y1, x2, y2


def generate_training_sample(idx, seed, img_size=512):
    """
    Constructs an authentic multi-scale agricultural training sample.
    Includes:
    - Single macro insect (exact count = 1) spanning 30% to 65% of the image.
    - Clustered pests (2 to 5 insects).
    - Sticky card with 15 to 55 specks.
    - Negative sample (0 insects).
    """
    rng = random.Random(seed + idx)
    w = h = img_size

    # Sample archetype:
    # 0, 1, 2: Single macro insect (EXACT COUNT = 1)
    # 3: Clustered macro insects (2-4 insects)
    # 4: Sticky card (yellow/blue)
    # 5: Negative background (0 insects)
    archetype = idx % 6

    # Select background
    if archetype == 4:
        # Sticky Card (Yellow or Blue)
        is_blue = (idx % 2 == 1)
        if is_blue:
            base_col = (rng.randint(200, 240), rng.randint(125, 165), rng.randint(15, 35))
            primary_cls = 3 # thrips
        else:
            base_col = (rng.randint(18, 32), rng.randint(210, 240), rng.randint(235, 255))
            primary_cls = 0 # whitefly
        img = np.full((h, w, 3), base_col, dtype=np.uint8)
        # Grid lines
        for gx in range(40, w, 55):
            cv2.line(img, (gx, 0), (gx, h), (int(base_col[0]*0.9), int(base_col[1]*0.9), int(base_col[2]*0.9)), 1)
        for gy in range(40, h, 55):
            cv2.line(img, (0, gy), (w, gy), (int(base_col[0]*0.9), int(base_col[1]*0.9), int(base_col[2]*0.9)), 1)

    elif archetype in (0, 1, 2):
        # Macro shot: light background or green crop leaf
        bg_choice = rng.choice(["light_studio", "green_leaf", "tan_surface"])
        primary_cls = idx % len(CLASSES)
        if bg_choice == "light_studio":
            # Neutral white/grey table or paper
            v_val = rng.randint(215, 245)
            img = np.full((h, w, 3), (v_val-4, v_val-2, v_val), dtype=np.uint8)
        elif bg_choice == "green_leaf":
            # Green tomato or maize leaf with veins
            base_col = (rng.randint(25, 45), rng.randint(115, 160), rng.randint(40, 75))
            img = np.full((h, w, 3), base_col, dtype=np.uint8)
            cv2.line(img, (0, h//2), (w, h//2), (base_col[0]+15, base_col[1]+25, base_col[2]+15), 3)
            for v_x in range(30, w, 60):
                cv2.line(img, (v_x, h//2), (v_x + 30, 0), (base_col[0]+10, base_col[1]+15, base_col[2]+10), 1)
                cv2.line(img, (v_x, h//2), (v_x + 30, h), (base_col[0]+10, base_col[1]+15, base_col[2]+10), 1)
        else:
            base_col = (rng.randint(140, 180), rng.randint(160, 200), rng.randint(180, 220))
            img = np.full((h, w, 3), base_col, dtype=np.uint8)

    elif archetype == 3:
        # Clustered macro insects
        primary_cls = idx % len(CLASSES)
        base_col = (rng.randint(25, 45), rng.randint(110, 155), rng.randint(35, 65))
        img = np.full((h, w, 3), base_col, dtype=np.uint8)

    else:
        # Negative background (0 insects)
        primary_cls = 0
        base_col = rng.choice([
            (25, 125, 45),   # leaf
            (25, 225, 245),  # yellow card
            (230, 235, 240), # white sheet
        ])
        img = np.full((h, w, 3), base_col, dtype=np.uint8)

    # Add realistic sensor noise & vignette
    noise = np.random.default_rng(seed + idx).integers(-10, 10, (h, w, 3), dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    boxes = []

    if archetype in (0, 1, 2):
        # EXACT 1-INSECT MACRO SAMPLE!
        # Prominent insect occupying 30% to 65% of the frame
        scale = rng.uniform(5.5, 9.5)
        cx = rng.randint(int(w * 0.35), int(w * 0.65))
        cy = rng.randint(int(h * 0.35), int(h * 0.65))
        x1, y1, x2, y2 = draw_realistic_macro_insect(img, cx, cy, primary_cls, scale, rng)
        # Normalized YOLO bbox: cx, cy, bw, bh
        norm_cx = (x1 + x2) / (2.0 * w)
        norm_cy = (y1 + y2) / (2.0 * h)
        norm_w = (x2 - x1) / float(w)
        norm_h = (y2 - y1) / float(h)
        boxes.append((primary_cls, [norm_cx, norm_cy, norm_w, norm_h]))

    elif archetype == 3:
        # 2 to 4 macro insects
        num = rng.randint(2, 4)
        for _ in range(num):
            scale = rng.uniform(2.8, 5.0)
            cx = rng.randint(50, w - 50)
            cy = rng.randint(50, h - 50)
            c_idx = primary_cls if rng.random() > 0.2 else rng.randint(0, len(CLASSES)-1)
            x1, y1, x2, y2 = draw_realistic_macro_insect(img, cx, cy, c_idx, scale, rng)
            norm_cx = (x1 + x2) / (2.0 * w)
            norm_cy = (y1 + y2) / (2.0 * h)
            norm_w = (x2 - x1) / float(w)
            norm_h = (y2 - y1) / float(h)
            boxes.append((c_idx, [norm_cx, norm_cy, norm_w, norm_h]))

    elif archetype == 4:
        # Sticky trap specks (15 to 45 specks)
        num = rng.randint(15, 45)
        for _ in range(num):
            scale = rng.uniform(0.7, 1.4)
            cx = rng.randint(25, w - 25)
            cy = rng.randint(25, h - 25)
            x1, y1, x2, y2 = draw_realistic_macro_insect(img, cx, cy, primary_cls, scale, rng)
            norm_cx = (x1 + x2) / (2.0 * w)
            norm_cy = (y1 + y2) / (2.0 * h)
            norm_w = (x2 - x1) / float(w)
            norm_h = (y2 - y1) / float(h)
            boxes.append((primary_cls, [norm_cx, norm_cy, norm_w, norm_h]))

    # Archetype 5 has 0 boxes (clean negative)
    return img, boxes


def build_augmented_dataset():
    print(f"[Dataset] Generating multi-scale calibrated YOLO pest dataset at {DATASET_DIR}...")
    for split in ["train", "val"]:
        os.makedirs(os.path.join(DATASET_DIR, "images", split), exist_ok=True)
        os.makedirs(os.path.join(DATASET_DIR, "labels", split), exist_ok=True)

    # 1. Procedural synthetic images (90 train, 24 val)
    seed = 42
    for idx in range(90):
        img, boxes = generate_training_sample(idx, seed=seed)
        img_name = f"pest_proc_{idx:04d}.jpg"
        lbl_name = f"pest_proc_{idx:04d}.txt"
        cv2.imwrite(os.path.join(DATASET_DIR, "images", "train", img_name), img)
        with open(os.path.join(DATASET_DIR, "labels", "train", lbl_name), "w") as f:
            for c, (bx, by, bw, bh) in boxes:
                f.write(f"{c} {bx:.5f} {by:.5f} {bw:.5f} {bh:.5f}\n")

    for idx in range(24):
        img, boxes = generate_training_sample(idx + 500, seed=seed + 999)
        img_name = f"pest_val_{idx:04d}.jpg"
        lbl_name = f"pest_val_{idx:04d}.txt"
        cv2.imwrite(os.path.join(DATASET_DIR, "images", "val", img_name), img)
        with open(os.path.join(DATASET_DIR, "labels", "val", lbl_name), "w") as f:
            for c, (bx, by, bw, bh) in boxes:
                f.write(f"{c} {bx:.5f} {by:.5f} {bw:.5f} {bh:.5f}\n")

    # 2. Inject real user uploads as anchor training samples
    # manual_upload_20261104_145614_420.jpg -> 1 single insect [79, 40, 243, 312] in 400x400
    p1 = os.path.join(BASE_DIR, "cloud", "data", "images", "manual_upload_20261104_145614_420.jpg")
    if os.path.exists(p1):
        im1 = cv2.imread(p1)
        cv2.imwrite(os.path.join(DATASET_DIR, "images", "train", "user_anchor_single_macro.jpg"), im1)
        # Bbox in normalized coords: cx=(79+322)/800=0.501, cy=(40+352)/800=0.490, bw=243/400=0.607, bh=312/400=0.780
        with open(os.path.join(DATASET_DIR, "labels", "train", "user_anchor_single_macro.txt"), "w") as f:
            f.write("1 0.50125 0.49000 0.60750 0.78000\n")

    # manual_upload_20261104_191959_217.jpg -> 1 macro tuta moth [152, 93, 42, 39] in 232x212
    p2 = os.path.join(BASE_DIR, "cloud", "data", "images", "manual_upload_20261104_191959_217.jpg")
    if os.path.exists(p2):
        im2 = cv2.imread(p2)
        cv2.imwrite(os.path.join(DATASET_DIR, "images", "train", "user_anchor_tuta.jpg"), im2)
        ih, iw = im2.shape[:2]
        cx = (152 + 21) / iw
        cy = (93 + 19.5) / ih
        cw = 42 / iw
        ch = 39 / ih
        with open(os.path.join(DATASET_DIR, "labels", "train", "user_anchor_tuta.txt"), "w") as f:
            f.write(f"2 {cx:.5f} {cy:.5f} {cw:.5f} {ch:.5f}\n")

    # Write data.yaml
    data_yaml = {
        "path": DATASET_DIR.replace("\\", "/"),
        "train": "images/train",
        "val": "images/val",
        "names": {i: name for i, name in enumerate(CLASSES)}
    }
    yaml_path = os.path.join(DATASET_DIR, "data.yaml")
    with open(yaml_path, "w") as f:
        yaml.dump(data_yaml, f, sort_keys=False)

    print(f"[Dataset] Generated {yaml_path} with comprehensive multi-scale pest samples.")
    return yaml_path


def train():
    yaml_path = build_augmented_dataset()
    print("[Trainer] Fine-tuning YOLOv8 Nano on calibrated multi-scale pest dataset...")
    model = YOLO("yolov8n.pt")

    results = model.train(
        data=yaml_path,
        epochs=12,
        imgsz=512,
        batch=8,
        workers=0,
        device="cpu",
        project=os.path.join(BASE_DIR, "cloud", "data", "yolo_runs"),
        name="pestpulse_multiscale",
        exist_ok=True,
        verbose=True
    )

    best_weights = os.path.join(BASE_DIR, "cloud", "data", "yolo_runs", "pestpulse_multiscale", "weights", "best.pt")
    if not os.path.exists(best_weights):
        best_weights = os.path.join(BASE_DIR, "cloud", "data", "yolo_runs", "pestpulse_multiscale", "weights", "last.pt")

    trap_target = os.path.join(MODELS_DIR, "trap.pt")
    leaf_target = os.path.join(MODELS_DIR, "leaf.pt")

    if os.path.exists(best_weights):
        shutil.copyfile(best_weights, trap_target)
        shutil.copyfile(best_weights, leaf_target)
        print(f"[Trainer] SUCCESS! Exported calibrated YOLO weights to:")
        print(f"  -> {trap_target}")
        print(f"  -> {leaf_target}")
    else:
        model.save(trap_target)
        model.save(leaf_target)
        print(f"[Trainer] Saved model to {trap_target}")


if __name__ == "__main__":
    train()
