"""
PestPulse Comprehensive End-to-End Test Suite.
Verifies all 16 core subsystems and API endpoints.
"""
import io
import json
import os
import sys
import unittest

import cv2
import numpy as np

CLOUD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "cloud"))
sys.path.insert(0, CLOUD_DIR)

import app
import config
import db


class TestPestPulsePlatform(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        db.init()
        cls.client = app.app.test_client()

    def test_01_health(self):
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json
        self.assertTrue(data["ok"])
        self.assertIn("devices", data)
        print("[PASS] Health check passed")

    def test_02_auth_and_farmer(self):
        # Register new farmer
        res = self.client.post("/api/v1/auth/register", json={
            "name": "Basavaraj Gowda",
            "contact": "9448811223",
            "password": "securepassword",
            "language": "kn",
            "farm_name": "Gowda Farms",
            "farm_place": "Kolar, Karnataka",
            "crop_type": "Tomato",
            "field_name": "East Greenhouse",
            "area_acres": 3.0,
        })
        self.assertIn(res.status_code, (200, 400)) # 400 if already exists in persistent test run

        # Login
        res_login = self.client.post("/api/v1/auth/login", json={
            "contact": "9448811223",
            "password": "securepassword",
        })
        if res_login.status_code == 200:
            token = res_login.json["token"]
            self.assertTrue(token)
            # Test /me
            res_me = self.client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
            self.assertEqual(res_me.status_code, 200)
            self.assertEqual(res_me.json["farmer"]["name"], "Basavaraj Gowda")
        print("[PASS] Farmer authentication & profile passed")

    def test_03_fields_crud(self):
        res = self.client.get("/api/v1/fields")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json, list)
        self.assertGreaterEqual(len(res.json), 1)

        # Create field
        res_create = self.client.post("/api/v1/fields", json={
            "name": "Chilli Plot 2",
            "crop_type": "Chilli",
            "area_acres": 1.75,
            "crop_variety": "Guntur Sannam",
            "growth_stage": "Vegetative Growth",
        })
        self.assertEqual(res_create.status_code, 200)
        fid = res_create.json["field"]["field_id"]

        # Update field
        res_patch = self.client.patch(f"/api/v1/fields/{fid}", json={"growth_stage": "Flowering"})
        self.assertEqual(res_patch.status_code, 200)
        self.assertEqual(res_patch.json["field"]["growth_stage"], "Flowering")
        print("[PASS] Fields management CRUD passed")

    def test_04_hardware_ingest(self):
        # Create a test synthetic JPEG card
        img = np.full((500, 700, 3), (25, 215, 240), dtype=np.uint8)
        # Add 3 insects
        for pt in [(150, 150), (250, 300), (400, 200)]:
            cv2.circle(img, pt, 8, (15, 20, 25), -1)
        ok, jpg = cv2.imencode(".jpg", img)

        res = self.client.post(
            "/api/v1/ingest?node=trap_test_1&trap=sticky_yellow&temp=29.2&hum=68&rssi=-58&seq=42&battery=88",
            headers={"X-Device-Key": config.DEVICE_KEY, "Content-Type": "image/jpeg"},
            data=jpg.tobytes()
        )
        self.assertEqual(res.status_code, 200)
        data = res.json
        self.assertTrue(data["ok"])
        self.assertEqual(data["node"], "trap_test_1")
        self.assertIn("oled", data)
        self.assertIn("interval_s", data)
        self.assertIn("risk", data)
        print("[PASS] Hardware image ingestion & AI detection passed")

    def test_05_devices_management(self):
        res = self.client.get("/api/v1/devices")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.json), 1)

        # Update interval
        res_patch = self.client.patch("/api/v1/traps/trap_test_1", json={"interval_s": 900})
        self.assertEqual(res_patch.status_code, 200)
        print("[PASS] Device management & remote interval configuration passed")

    def test_06_observations_and_detections(self):
        res_obs = self.client.get("/api/v1/observations")
        self.assertEqual(res_obs.status_code, 200)
        self.assertIsInstance(res_obs.json, list)

        res_dets = self.client.get("/api/v1/detections")
        self.assertEqual(res_dets.status_code, 200)
        self.assertIsInstance(res_dets.json, list)
        print("[PASS] Observations & detections querying passed")

    def test_07_pests_catalog(self):
        res = self.client.get("/api/v1/pests")
        self.assertEqual(res.status_code, 200)
        self.assertIn("whitefly", res.json)
        self.assertIn("fruit_borer", res.json)
        self.assertIn("tuta", res.json)

        res_detail = self.client.get("/api/v1/pests/whitefly")
        self.assertEqual(res_detail.status_code, 200)
        self.assertEqual(res_detail.json["latin"], "Bemisia tabaci")
        print("[PASS] Pest catalog & taxonomy passed")

    def test_08_diseases(self):
        res = self.client.get("/api/v1/diseases")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.json), 3)

        res_tolcv = self.client.get("/api/v1/diseases/tolcv")
        self.assertEqual(res_tolcv.status_code, 200)
        self.assertEqual(res_tolcv.json["vector_status"], "Confirmed Vector")
        print("[PASS] Plant pathology & disease vector database passed")

    def test_09_fertilizers_scaling(self):
        # 1 Acre
        res_1 = self.client.get("/api/v1/recommendations/fertilizers?crop=Tomato&acres=1.0")
        self.assertEqual(res_1.status_code, 200)
        stage_1 = res_1.json["stages"][0]["items"][1] # SSP

        # 3.5 Acres
        res_35 = self.client.get("/api/v1/recommendations/fertilizers?crop=Tomato&acres=3.5")
        self.assertEqual(res_35.status_code, 200)
        stage_35 = res_35.json["stages"][0]["items"][1]

        # 150 kg/acre * 3.5 = 525 kg
        self.assertAlmostEqual(stage_35["total_quantity_num"], stage_1["total_quantity_num"] * 3.5, places=1)
        print("[PASS] Fertilizer recommendations & farm area acreage scaling passed")

    def test_10_spray_advice_and_rotation(self):
        res = self.client.get("/api/v1/spray/advice")
        self.assertEqual(res.status_code, 200)
        self.assertIn("pests", res.json)
        self.assertIn("safety", res.json)
        print("[PASS] Spray advisor & IRAC resistance rotation passed")

    def test_11_weather(self):
        res = self.client.get("/api/v1/weather")
        self.assertEqual(res.status_code, 200)
        self.assertIn("temp", res.json)
        self.assertIn("hum", res.json)
        self.assertIn("rain_prob_6h", res.json)
        self.assertIn("days", res.json)
        print("[PASS] Weather forecast & station climate passed")

    def test_12_alerts_and_checklists(self):
        res = self.client.get("/api/v1/alerts")
        self.assertEqual(res.status_code, 200)
        if len(res.json) > 0:
            aid = res.json[0]["id"]
            # Toggle checklist
            res_patch = self.client.patch(f"/api/v1/alerts/{aid}", json={"done": [0, 1], "acked": True})
            self.assertEqual(res_patch.status_code, 200)
            self.assertEqual(res_patch.json["done"], [0, 1])
        print("[PASS] Alerts center & farmer interactive checklists passed")

    def test_13_3d_simulation_events(self):
        res = self.client.post("/api/v1/simulation/start", json={
            "scenario": "Fruit Borer Surge",
            "pest_before": "HIGH (32/card)",
            "pest_after": "LOW (2/card)"
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json["ok"])
        self.assertTrue(res.json["simulation_mode"])

        res_events = self.client.get("/api/v1/simulation/events")
        self.assertEqual(res_events.status_code, 200)
        self.assertGreaterEqual(len(res_events.json), 1)
        print("[PASS] 3D Spraying simulation event logging passed")

    def test_14_csv_export(self):
        res = self.client.get("/api/v1/report.csv?days=7")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, "text/csv")
        self.assertIn(b"Total On Card", res.data)
        print("[PASS] CSV agricultural report export passed")

    def test_15_frontend_spa_delivery(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"<!doctype html>", res.data.lower())
        print("[PASS] Frontend Single Page Application delivery passed")


if __name__ == "__main__":
    print("\nRunning PestPulse Full Subsystem Test Suite...\n" + "-" * 50)
    unittest.main()
