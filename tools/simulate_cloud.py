"""
Test the cloud WITHOUT hardware: acts like 3 ESP32-CAM trap nodes and uploads computer-generated
trap-card photos to PestPulse Cloud with the device key, exactly like the firmware does.

    python simulate_cloud.py --server https://your-app.onrender.com --key YOUR_DEVICE_KEY
    python simulate_cloud.py --server http://localhost:8080 --key change-me-device-key --rounds 5 --interval 10
    python simulate_cloud.py ... --history 7     # also fill the past 7 days (cloud needs PP_ALLOW_BACKFILL=1)

These images are synthetic. They prove the pipeline works; they are not field results.
"""
import argparse
import random
import time

import cv2
import numpy as np
import requests

TRAPS = [("trap1", "sticky_yellow", 4.0), ("trap2", "pheromone", 1.2), ("trap3", "sticky_yellow", 1.5)]


def trap_image(n_insects, kind="sticky_yellow", seed=0, w=1280, h=1024):
    rng = random.Random(seed)
    img = np.full((h, w, 3), (70, 95, 120), np.uint8)                     # background (stand / box)
    img[:] = img + np.random.default_rng(seed).integers(0, 18, (h, w, 3), dtype=np.uint8)
    x0, y0, x1, y1 = 140, 90, w - 140, h - 90
    card = (20, 215, 240) if kind in ("sticky_yellow", "lirio_sticky") else (215, 235, 245)   # BGR
    cv2.rectangle(img, (x0, y0), (x1, y1), card, -1)
    grid = tuple(int(c * 0.85) for c in card)
    for x in range(x0, x1, 64):
        cv2.line(img, (x, y0), (x, y1), grid, 1)
    for y in range(y0, y1, 64):
        cv2.line(img, (x0, y), (x1, y), grid, 1)
    for _ in range(n_insects):
        cx, cy = rng.randint(x0 + 25, x1 - 25), rng.randint(y0 + 25, y1 - 25)
        ang = rng.uniform(0, 180)
        if kind == "tuta_delta":     # brown moths, ~7 mm
            cv2.ellipse(img, (cx, cy), (rng.randint(13, 17), rng.randint(5, 6)), ang, 0, 360, (60, 80, 105), -1)
        else:                        # small dark flies with pale wings
            s = rng.randint(5, 9)
            cv2.ellipse(img, (cx, cy), (s + 3, s - 1), ang + 40, 0, 360, (190, 195, 185), -1)
            cv2.ellipse(img, (cx, cy), (s, max(3, s // 2)), ang, 0, 360, (25, 25, 25), -1)
    img = cv2.GaussianBlur(img, (3, 3), 0)
    return img



def upload(a, node, trap, n, seed, temp, hum, ts=None):
    img = trap_image(n, "tuta_delta" if trap == "pheromone" else "sticky_yellow", seed=seed)
    ok, jpg = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 88])
    params = {"node": node, "trap": trap, "temp": temp, "hum": hum, "rssi": random.randint(-75, -52),
              "battery": random.randint(85, 98), "seq": seed, "fw": "sim-1.0", "uptime": seed * 60}
    if ts:
        params["ts"] = ts
    r = requests.post(f"{a.server.rstrip('/')}/api/v1/ingest", params=params, data=jpg.tobytes(),
                      headers={"Content-Type": "image/jpeg", "X-Device-Key": a.key}, timeout=90)
    r.raise_for_status()
    return r.json()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--server", default="http://localhost:8080")
    ap.add_argument("--key", default="change-me-device-key")
    ap.add_argument("--rounds", type=int, default=6)
    ap.add_argument("--interval", type=float, default=5)
    ap.add_argument("--history", type=int, default=0, help="days of past data to back-fill first")
    ap.add_argument("--demo-sprays", action="store_true",
                    help="with --history: log 2 example sprays and lower catches after them (synthetic demo)")
    a = ap.parse_args()
    totals = {n: random.randint(2, 6) for n, _, _ in TRAPS}
    seed = 1
    SPRAYS = {"trap1": (9, "whitefly", "Imidacloprid 17.8 SL", "0.3 ml/L"),
              "trap2": (5, "fruit_borer", "Chlorantraniliprole 18.5 SC", "0.3 ml/L")}

    def factor(node, d):            # catches drop after a spray, then slowly recover (synthetic)
        if not a.demo_sprays or node not in SPRAYS:
            return 1.0
        since = SPRAYS[node][0] - d
        return 1.0 if since < 0 else min(1.0, 0.35 + 0.1 * since)

    if a.history:
        now = time.time()
        if a.demo_sprays:
            for node, (ago, pest, product, dose) in SPRAYS.items():
                if ago < a.history:
                    requests.post(f"{a.server.rstrip('/')}/api/v1/sprays", timeout=30, json={
                        "pest": pest, "product": product, "dose": dose, "area_acres": 1, "phi_days": 3,
                        "ts": now - ago * 86400 + 4 * 3600, "notes": "simulated demo spray"})
        for d in range(a.history, 0, -1):
            for h in (7, 13, 19):                         # 3 photos a day
                ts = now - d * 86400 + (h - 12) * 3600
                for node, trap, rate in TRAPS:
                    if totals[node] > 110:              # card replaced
                        totals[node] = random.randint(0, 3)
                    trend = rate * min(2.5, 1 + 0.08 * (a.history - d)) * factor(node, d)
                    totals[node] += max(0, int(random.gauss(trend, 1.5)))
                    res = upload(a, node, trap, totals[node], seed, round(random.uniform(24, 31), 1),
                                 round(random.uniform(55, 82), 1), ts)
                    seed += 1
            print(f"back-filled day -{d}  last: {res['node']} total {res['total']} risk {res['risk']}")
    for r in range(a.rounds):
        temp, hum = round(random.uniform(26, 31), 1), round(random.uniform(62, 80), 1)
        for node, trap, rate in TRAPS:
            totals[node] += random.randint(0, int(rate * 3) + 1)
            res = upload(a, node, trap, totals[node], seed, temp, hum)
            seed += 1
            print(f"[{r + 1}] {node}  placed {totals[node]:3}  counted {res['total']:3}  new {res['new']:2}  "
                  f"24h {res['catches_24h']:3}  risk {res['risk']:6}  alert {res['alert']}  {res['ms']} ms")
        if r < a.rounds - 1:
            time.sleep(a.interval)
    print("\nOpen the app:", a.server)


if __name__ == "__main__":
    main()
