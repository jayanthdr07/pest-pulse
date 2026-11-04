"""
PestPulse - One-Click Launcher
Starts the PestPulse Smart Agriculture Platform.
"""
import os
import subprocess
import sys
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CLOUD_DIR = os.path.join(BASE_DIR, "cloud")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
DIST_DIR = os.path.join(FRONTEND_DIR, "dist")

sys.path.insert(0, CLOUD_DIR)


def check_and_build():
    if not os.path.exists(os.path.join(DIST_DIR, "index.html")):
        print("[Launcher] Building modern React frontend...")
        subprocess.run(["npm", "run", "build"], cwd=FRONTEND_DIR, check=True, shell=True)
        print("[Launcher] Frontend build complete.")


def seed_data():
    tools_dir = os.path.join(BASE_DIR, "tools")
    seeder = os.path.join(tools_dir, "seed_demo_data.py")
    if os.path.exists(seeder):
        import seed_demo_data
        seed_demo_data.seed()


def run():
    print("=" * 60)
    print("  PESTPULSE SMART AGRICULTURE PLATFORM")
    print("  AI + IoT Insect Monitoring and Crop Protection System")
    print("=" * 60)

    check_and_build()

    import app
    import config

    print(f"\n[Server] Listening at http://localhost:{config.PORT}")
    print(f"[Server] ESP32-CAM Ingestion Key: {config.DEVICE_KEY}")
    print(f"[Server] Open http://localhost:{config.PORT} in your web browser.")
    print("=" * 60 + "\n")

    app.app.run(host="0.0.0.0", port=config.PORT, threaded=True)


if __name__ == "__main__":
    run()
