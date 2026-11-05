import cv2, numpy as np, sys
sys.stdout.reconfigure(encoding='utf-8')

def test_detect(img, trap_type="sticky_yellow"):
    h, w = img.shape[:2]
    scale = 1000.0 / max(h, w) if max(h, w) > 1000 else 1.0
    small = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA) if scale < 1.0 else img.copy()
    wh, ww = small.shape[:2]

    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    H, S, V = cv2.split(hsv)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

    total_px = wh * ww
    yellow_ratio = np.count_nonzero((H >= 12) & (H <= 45) & (S >= 40) & (V >= 60)) / total_px
    blue_ratio = np.count_nonzero((H >= 90) & (H <= 140) & (S >= 45) & (V >= 50)) / total_px
    green_ratio = np.count_nonzero((H >= 28) & (H <= 95) & (S >= 35)) / total_px
    mean_v = float(np.mean(V))

    is_yellow_trap = yellow_ratio > 0.18 or "yellow" in trap_type.lower()
    is_blue_trap = blue_ratio > 0.12 or "blue" in trap_type.lower()
    is_leaf = green_ratio > 0.20

    print(f"Ratios: Y={yellow_ratio:.2f}, B={blue_ratio:.2f}, G={green_ratio:.2f}, MeanV={mean_v:.1f}")

    # Case 1: Sticky Trap Card
    if is_yellow_trap or is_blue_trap:
        # Illumination normalized card count
        bg = cv2.medianBlur(gray, 31)
        diff = cv2.absdiff(gray, bg)
        card_mask = ((H >= 12) & (H <= 45) & (S >= 40) & (V >= 60)).astype(np.uint8) * 255 if is_yellow_trap else ((H >= 90) & (H <= 140) & (S >= 45) & (V >= 50)).astype(np.uint8) * 255
        card_mask = cv2.morphologyEx(card_mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25)))
        diff[card_mask == 0] = 0
        thresh_val = max(30, int(np.mean(diff[card_mask > 0]) + 1.6 * np.std(diff[card_mask > 0])))
        _, bin_img = cv2.threshold(diff, thresh_val, 255, cv2.THRESH_BINARY)
        bin_img = cv2.morphologyEx(bin_img, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
        n, _, stats, _ = cv2.connectedComponentsWithStats(bin_img, 8)
        specks = []
        for i in range(1, n):
            x, y, bw, bh, a = stats[i]
            if a < 25 or a > (wh * ww * 0.05): continue
            aspect = max(bw, bh) / max(1, min(bw, bh))
            if aspect > 4.2: continue
            specks.append((x, y, bw, bh, a))
        species = "whitefly" if is_yellow_trap else "thrips"
        return len(specks), species, "sticky_trap", specks[:5]

    # Case 2: Light / Studio Background Macro Specimen
    elif mean_v > 170 and green_ratio < 0.15:
        # Background is light sheet/table. Threshold directly on background!
        _, bin_img = cv2.threshold(gray, 205, 255, cv2.THRESH_BINARY_INV)
        bin_img = cv2.morphologyEx(bin_img, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
        cnts, _ = cv2.findContours(bin_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        valid = []
        for c in cnts:
            a = cv2.contourArea(c)
            if a < 100: continue
            x, y, bw, bh = cv2.boundingRect(c)
            if bw > 0.95 * ww and bh > 0.95 * wh: continue
            valid.append((x, y, bw, bh, a))

        if valid:
            max_a = max(v[4] for v in valid)
            # Saliency filter: only keep objects at least 10% of largest object
            prominent = [v for v in valid if v[4] >= max(150, max_a * 0.10)]
            return len(prominent), "macro_pest", "macro_specimen", prominent
        return 0, "none", "macro_specimen", []

    # Case 3: Foliage Macro Scan
    else:
        bg = cv2.medianBlur(gray, 31)
        diff = cv2.absdiff(gray, bg)
        t_leaf = max(35, int(np.mean(diff) + 1.7 * np.std(diff)))
        _, bin_img = cv2.threshold(diff, t_leaf, 255, cv2.THRESH_BINARY)
        bin_img = cv2.morphologyEx(bin_img, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
        cnts, _ = cv2.findContours(bin_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        valid = []
        for c in cnts:
            a = cv2.contourArea(c)
            if a < 80: continue
            x, y, bw, bh = cv2.boundingRect(c)
            if bw > 0.95 * ww and bh > 0.95 * wh: continue
            valid.append((x, y, bw, bh, a))
        if valid:
            max_a = max(v[4] for v in valid)
            prominent = [v for v in valid if v[4] >= max(100, max_a * 0.08)]
            return len(prominent), "fall_armyworm", "foliage_macro_scan", prominent
        return 0, "none", "foliage_macro_scan", []

# Run tests
test_files = [
    ('manual_upload_20261104_145614_420.jpg', 'auto'),
    ('manual_upload_20261104_191959_217.jpg', 'auto'),
    ('manual_upload_20261105_000835_388.jpg', 'auto'),
    ('manual_upload_20261105_000923_903.jpg', 'sticky_yellow'),
]

for fn, tt in test_files:
    p = f'cloud/data/images/{fn}'
    im = cv2.imread(p)
    cnt, pest, mode, sample = test_detect(im, tt)
    print(f"--> {fn}: Count={cnt}, Species={pest}, Mode={mode}, FirstSample={sample[:1]}\n")
