"""SQLite storage: devices, readings, alerts, farmers, fields, detections, simulation events."""
import json
import sqlite3
import threading
import time
import uuid

import config

_lock = threading.Lock()


def _conn():
    c = sqlite3.connect(config.DB_PATH, check_same_thread=False, timeout=15)
    c.row_factory = sqlite3.Row
    return c


def init():
    with _lock, _conn() as c:
        c.executescript("""
        PRAGMA journal_mode=WAL;

        CREATE TABLE IF NOT EXISTS farmers(
            farmer_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contact TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            language TEXT DEFAULT 'en',
            farm_name TEXT,
            farm_place TEXT,
            lat REAL,
            lon REAL,
            created_at REAL,
            last_login REAL
        );

        CREATE TABLE IF NOT EXISTS fields(
            field_id TEXT PRIMARY KEY,
            farmer_id TEXT NOT NULL,
            name TEXT NOT NULL,
            location_name TEXT,
            lat REAL,
            lon REAL,
            crop_type TEXT NOT NULL,
            crop_variety TEXT,
            sowing_date TEXT,
            growth_stage TEXT,
            area_acres REAL DEFAULT 1.0,
            created_at REAL,
            is_active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS devices(
            node TEXT PRIMARY KEY,
            name TEXT,
            field_id TEXT,
            trap TEXT,
            pest TEXT,
            interval_s INTEGER,
            created REAL,
            last_seen REAL,
            rssi INTEGER,
            fw TEXT,
            ip TEXT,
            uptime_s INTEGER,
            battery_pct INTEGER DEFAULT 95,
            battery_voltage REAL DEFAULT 4.15,
            solar_charging INTEGER DEFAULT 1,
            status TEXT DEFAULT 'online'
        );

        CREATE TABLE IF NOT EXISTS readings(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts REAL,
            node TEXT,
            field_id TEXT,
            kind TEXT,
            trap TEXT,
            temp REAL,
            hum REAL,
            total INTEGER,
            new INTEGER,
            counts TEXT,
            damage REAL,
            image TEXT,
            annotated TEXT,
            risk TEXT,
            engine TEXT,
            card_found INTEGER,
            rssi INTEGER,
            seq INTEGER,
            battery_pct INTEGER,
            is_simulated INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS ix_readings_node_ts ON readings(node, ts);
        CREATE INDEX IF NOT EXISTS ix_readings_field_ts ON readings(field_id, ts);

        CREATE TABLE IF NOT EXISTS insect_detections(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reading_id INTEGER,
            ts REAL,
            node TEXT,
            field_id TEXT,
            crop_type TEXT,
            insect_class TEXT,
            common_name_en TEXT,
            common_name_kn TEXT,
            scientific_name TEXT,
            count INTEGER,
            confidence REAL,
            box_json TEXT,
            model_version TEXT
        );
        CREATE INDEX IF NOT EXISTS ix_detections_reading ON insect_detections(reading_id);

        CREATE TABLE IF NOT EXISTS alerts(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts REAL,
            farmer_id TEXT,
            field_id TEXT,
            node TEXT,
            level TEXT,
            species TEXT,
            catches_24h INTEGER,
            title_en TEXT,
            title_kn TEXT,
            body_en TEXT,
            body_kn TEXT,
            steps TEXT,
            done TEXT,
            image TEXT,
            acked INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sprays(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts REAL,
            field_id TEXT,
            pest TEXT,
            product TEXT,
            irac TEXT,
            dose TEXT,
            area_acres REAL,
            phi_days INTEGER,
            notes TEXT,
            by_name TEXT
        );

        CREATE TABLE IF NOT EXISTS simulation_events(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id TEXT,
            field_id TEXT,
            event_type TEXT,
            timestamp REAL,
            result TEXT,
            pest_level_before TEXT,
            pest_level_after TEXT,
            details TEXT
        );

        CREATE TABLE IF NOT EXISTS crop_passports(
            passport_id TEXT PRIMARY KEY,
            field_id TEXT NOT NULL,
            farmer_id TEXT NOT NULL,
            crop_type TEXT,
            token_hash TEXT UNIQUE NOT NULL,
            access_type TEXT DEFAULT 'detailed',
            created_at REAL,
            expires_at REAL,
            is_revoked INTEGER DEFAULT 0,
            views_count INTEGER DEFAULT 0,
            last_viewed_at REAL,
            custom_notes TEXT
        );
        CREATE INDEX IF NOT EXISTS ix_passports_token ON crop_passports(token_hash);
        CREATE INDEX IF NOT EXISTS ix_passports_field ON crop_passports(field_id);

        CREATE TABLE IF NOT EXISTS treatments(
            treatment_id TEXT PRIMARY KEY,
            field_id TEXT NOT NULL,
            farmer_id TEXT NOT NULL,
            target_pest TEXT NOT NULL,
            product_name TEXT NOT NULL,
            category TEXT DEFAULT 'Chemical',
            active_ingredient TEXT,
            application_method TEXT DEFAULT 'Foliar spray',
            rate_per_acre TEXT,
            total_quantity TEXT,
            water_volume_liters REAL,
            area_treated_acres REAL,
            applied_date TEXT NOT NULL,
            status TEXT DEFAULT 'completed',
            source_ref TEXT,
            follow_up_obs TEXT,
            notes TEXT,
            image_path TEXT,
            created_at REAL
        );
        CREATE INDEX IF NOT EXISTS ix_treatments_field ON treatments(field_id);

        CREATE TABLE IF NOT EXISTS escalations(
            escalation_id TEXT PRIMARY KEY,
            farmer_id TEXT NOT NULL,
            field_id TEXT NOT NULL,
            crop_type TEXT,
            pest_type TEXT,
            reading_id INTEGER,
            severity TEXT DEFAULT 'warning',
            reason_en TEXT,
            reason_kn TEXT,
            pest_count_before INTEGER,
            pest_count_after INTEGER,
            status TEXT DEFAULT 'active',
            suggested_action_en TEXT,
            suggested_action_kn TEXT,
            created_at REAL,
            resolved_at REAL
        );
        CREATE INDEX IF NOT EXISTS ix_escalations_field ON escalations(field_id);

        CREATE TABLE IF NOT EXISTS experts(
            expert_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            title TEXT,
            institution TEXT,
            qualifications TEXT,
            specialization TEXT,
            languages TEXT,
            experience_years INTEGER DEFAULT 10,
            rating REAL DEFAULT 4.9,
            avatar_url TEXT,
            available_days TEXT,
            available_hours TEXT,
            is_verified INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS appointments(
            appointment_id TEXT PRIMARY KEY,
            farmer_id TEXT NOT NULL,
            expert_id TEXT NOT NULL,
            expert_email TEXT,
            accept_token TEXT,
            accepted_at REAL,
            field_id TEXT NOT NULL,
            crop_type TEXT,
            appointment_date TEXT NOT NULL,
            appointment_time TEXT NOT NULL,
            time_zone TEXT DEFAULT 'Asia/Kolkata',
            consultation_type TEXT DEFAULT 'video',
            status TEXT DEFAULT 'confirmed',
            jitsi_room_id TEXT NOT NULL,
            escalation_id TEXT,
            passport_id TEXT,
            problem_description TEXT,
            notes TEXT,
            expert_recommendations TEXT,
            created_at REAL
        );

        CREATE TABLE IF NOT EXISTS voice_communications(
            comm_id TEXT PRIMARY KEY,
            farmer_id TEXT NOT NULL,
            field_id TEXT,
            alert_id INTEGER,
            escalation_id TEXT,
            channel TEXT DEFAULT 'in_app',
            language TEXT DEFAULT 'en',
            script_en TEXT,
            script_kn TEXT,
            status TEXT DEFAULT 'delivered',
            duration_s INTEGER DEFAULT 45,
            created_at REAL,
            played_at REAL
        );

        CREATE TABLE IF NOT EXISTS farmer_preferences(
            farmer_id TEXT PRIMARY KEY,
            auto_voice_alerts INTEGER DEFAULT 1,
            auto_schedule_consultation INTEGER DEFAULT 0,
            preferred_language TEXT DEFAULT 'en',
            preferred_hours TEXT DEFAULT '08:00 - 18:00',
            preferred_expert_id TEXT,
            attach_passport_default INTEGER DEFAULT 1,
            voice_provider TEXT DEFAULT 'in_app_tts'
        );
        """)

        # Migration safety checks for existing databases
        dev_cols = [r[1] for r in c.execute("PRAGMA table_info(devices)").fetchall()]
        for col, col_type in [
            ("pest", "TEXT"),
            ("field_id", "TEXT"),
            ("battery_pct", "INTEGER DEFAULT 95"),
            ("battery_voltage", "REAL DEFAULT 4.15"),
            ("solar_charging", "INTEGER DEFAULT 1"),
            ("status", "TEXT DEFAULT 'online'"),
        ]:
            if col not in dev_cols:
                try:
                    c.execute(f"ALTER TABLE devices ADD COLUMN {col} {col_type}")
                except Exception:
                    pass

        read_cols = [r[1] for r in c.execute("PRAGMA table_info(readings)").fetchall()]
        for col, col_type in [
            ("field_id", "TEXT"),
            ("battery_pct", "INTEGER"),
            ("is_simulated", "INTEGER DEFAULT 0"),
        ]:
            if col not in read_cols:
                try:
                    c.execute(f"ALTER TABLE readings ADD COLUMN {col} {col_type}")
                except Exception:
                    pass

        alert_cols = [r[1] for r in c.execute("PRAGMA table_info(alerts)").fetchall()]
        for col, col_type in [("farmer_id", "TEXT"), ("field_id", "TEXT")]:
            if col not in alert_cols:
                try:
                    c.execute(f"ALTER TABLE alerts ADD COLUMN {col} {col_type}")
                except Exception:
                    pass

        # Seed default demo farmer and fields if empty
        r = c.execute("SELECT COUNT(*) FROM farmers").fetchone()
        if r[0] == 0:
            now = time.time()
            import hashlib
            default_pw_hash = hashlib.sha256("farmer123".encode()).hexdigest()
            c.execute("""
            INSERT INTO farmers(farmer_id, name, contact, password_hash, language, farm_name, farm_place, lat, lon, created_at, last_login)
            VALUES(?,?,?,?,?,?,?,?,?,?,?)
            """, ("farmer_001", "Ramesh Kumar", "9876543210", default_pw_hash, "en",
                  config.FARM_NAME, config.FARM_PLACE, config.FARM_LAT, config.FARM_LON, now, now))

            c.execute("""
            INSERT INTO fields(field_id, farmer_id, name, location_name, lat, lon, crop_type, crop_variety, sowing_date, growth_stage, area_acres, created_at, is_active)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, ("field_001", "farmer_001", "North Polyhouse - Tomato Block A", "Hesaraghatta, Bengaluru Rural",
                  13.1357, 77.4950, "Tomato", "Arka Rakshak (F1 Hybrid)", "2026-09-10", "Flowering & Early Fruiting", 2.5, now, 1))

            c.execute("""
            INSERT INTO fields(field_id, farmer_id, name, location_name, lat, lon, crop_type, crop_variety, sowing_date, growth_stage, area_acres, created_at, is_active)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, ("field_002", "farmer_001", "South Open Field - Chilli & Brinjal", "Hesaraghatta, Bengaluru Rural",
                  13.1360, 77.4962, "Chilli", "Arka Harita", "2026-10-01", "Vegetative Growth", 1.5, now, 1))

            # Associate default traps if they exist or will be registered
            c.execute("UPDATE devices SET field_id='field_001' WHERE field_id IS NULL OR field_id=''")

        # Migration safety checks for experts and appointments
        exp_cols = [r[1] for r in c.execute("PRAGMA table_info(experts)").fetchall()]
        if "email" not in exp_cols:
            try:
                c.execute("ALTER TABLE experts ADD COLUMN email TEXT")
            except Exception:
                pass

        appt_cols = [r[1] for r in c.execute("PRAGMA table_info(appointments)").fetchall()]
        for col, col_type in [("expert_email", "TEXT"), ("accept_token", "TEXT"), ("accepted_at", "REAL")]:
            if col not in appt_cols:
                try:
                    c.execute(f"ALTER TABLE appointments ADD COLUMN {col} {col_type}")
                except Exception:
                    pass

        # Seed or refresh the 3 designated agricultural doctors
        doctors_data = [
            ("exp_jayanth", "Dr. Jayanth Gowda", "jayanthgowda1406@gmail.com",
             "Senior Agronomist & Chief Entomologist",
             "ICAR - Indian Institute of Horticultural Research, Hesaraghatta",
             "Ph.D. in Agricultural Entomology & Precision Crop Protection (UAS GKVK)",
             "Integrated Pest Management, Fall Armyworm, Tuta absoluta, Precision Spraying & Bio-inputs",
             "Kannada, English, Hindi", 16, 4.98, "Mon, Tue, Wed, Thu, Fri, Sat", "09:00 - 18:30 IST", 1),
            ("exp_srujan", "Dr. Srujan R", "srujanr173@gmail.com",
             "Crop Protection & Plant Pathology Specialist",
             "University of Agricultural Sciences, GKVK Bangalore",
             "Ph.D. in Plant Pathology & Vector-Borne Virology",
             "Vector-Borne Plant Viruses, Whitefly, Leaf Curl Virus, Bacterial Blight & Chemical Stewardship",
             "Kannada, English, Telugu", 14, 4.95, "Mon, Tue, Wed, Fri", "10:00 - 17:30 IST", 1),
            ("exp_hruthik", "Dr. Hruthik Gowda", "hruthikgowda.200521@gmail.com",
             "Horticulture Consultant & Biological Control Specialist",
             "Karnataka Agricultural Extension Network & UAS Dharwad",
             "Ph.D. in Horticulture & Biological Pest Suppression",
             "Pheromone Mass Trapping, Nutrient Buffering, Thrips & Sucking Pest Complex",
             "Kannada, English, Marathi", 12, 4.96, "Mon, Wed, Thu, Sat", "09:30 - 18:00 IST", 1),
        ]
        for d in doctors_data:
            c.execute("""
            INSERT INTO experts(expert_id, name, email, title, institution, qualifications, specialization, languages, experience_years, rating, available_days, available_hours, is_verified)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(expert_id) DO UPDATE SET
                name=excluded.name,
                email=excluded.email,
                title=excluded.title,
                institution=excluded.institution,
                qualifications=excluded.qualifications,
                specialization=excluded.specialization,
                languages=excluded.languages,
                experience_years=excluded.experience_years,
                rating=excluded.rating,
                available_days=excluded.available_days,
                available_hours=excluded.available_hours,
                is_verified=excluded.is_verified
            """, d)

        # Seed initial treatments if empty
        t_count = c.execute("SELECT COUNT(*) FROM treatments").fetchone()[0]
        if t_count == 0:
            now = time.time()
            day_s = 86400
            c.execute("""
            INSERT INTO treatments(treatment_id, field_id, farmer_id, target_pest, product_name, category, active_ingredient, application_method, rate_per_acre, total_quantity, water_volume_liters, area_treated_acres, applied_date, status, source_ref, follow_up_obs, notes, created_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, ("treat_001", "field_001", "farmer_001", "Tomato Leafminer (Tuta absoluta)",
                  "Neem Baan 10000 ppm", "Botanical", "Azadirachtin 1%", "Foliar spray",
                  "600 ml/acre", "1.5 Liters", 500.0, 2.5, time.strftime("%Y-%m-%d", time.localtime(now - 5 * day_s)),
                  "completed", "ICAR-IIHR Organic Management Schedule", "Infestation remained high; new mines spotted on upper canopy",
                  "Sprayed with motorized knapsack sprayer in late evening to avoid UV degradation.", now - 5 * day_s))

            c.execute("""
            INSERT INTO treatments(treatment_id, field_id, farmer_id, target_pest, product_name, category, active_ingredient, application_method, rate_per_acre, total_quantity, water_volume_liters, area_treated_acres, applied_date, status, source_ref, follow_up_obs, notes, created_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, ("treat_002", "field_001", "farmer_001", "Fruit Borer (Helicoverpa armigera)",
                  "Coragen 18.5% SC", "Chemical", "Chlorantraniliprole 18.5%", "Targeted spray",
                  "60 ml/acre", "150 ml", 450.0, 2.5, time.strftime("%Y-%m-%d", time.localtime(now - 14 * day_s)),
                  "completed", "UAS Package of Practices", "Larval count dropped by 85% within 72 hours; excellent control",
                  "Adhered to 3-day pre-harvest interval (PHI).", now - 14 * day_s))

        # Seed initial escalation if empty
        esc_count = c.execute("SELECT COUNT(*) FROM escalations").fetchone()[0]
        if esc_count == 0:
            now = time.time()
            c.execute("""
            INSERT INTO escalations(escalation_id, farmer_id, field_id, crop_type, pest_type, severity, reason_en, reason_kn, pest_count_before, pest_count_after, status, suggested_action_en, suggested_action_kn, created_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, ("esc_001", "farmer_001", "field_001", "Tomato", "Tomato Leafminer", "high",
                  "Pest activity increased from 14 to 28 catches after the recorded Neem Baan intervention on 5 days ago. Follow-up observations show persistent upper canopy leaf mines.",
                  "5 ದಿನಗಳ ಹಿಂದೆ ಬೇವು ಬಾಣ ಚಿಕಿತ್ಸೆಯ ನಂತರ ಕೀಟ ಚಟುವಟಿಕೆ 14 ರಿಂದ 28 ಕ್ಕೆ ಹೆಚ್ಚಾಗಿದೆ. ಮೇಲ್ವಿಚಾರಣಾ ವೀಕ್ಷಣೆಗಳು ತೀವ್ರ ಮರಿಹುಳು ಹಾನಿಯನ್ನು ತೋರಿಸುತ್ತವೆ.",
                  14, 28, "active",
                  "Schedule an expert consultation with Dr. R. Manjunatha (ICAR-IIHR) for selective biorational rotation.",
                  "ಸೂಕ್ತ ಜೈವಿಕ ನಿಯಂತ್ರಣ ಕ್ರಮಗಳಿಗಾಗಿ ಡಾ. ಆರ್. ಮಂಜುನಾಥ (ICAR-IIHR) ಅವರೊಂದಿಗೆ ಸಮಾಲೋಚನೆಯನ್ನು ಕಾಯ್ದಿರಿಸಿ.",
                  now - 86400))

        # Seed initial appointment if empty
        appt_count = c.execute("SELECT COUNT(*) FROM appointments").fetchone()[0]
        if appt_count == 0:
            now = time.time()
            c.execute("""
            INSERT INTO appointments(appointment_id, farmer_id, expert_id, field_id, crop_type, appointment_date, appointment_time, time_zone, consultation_type, status, jitsi_room_id, escalation_id, passport_id, problem_description, notes, expert_recommendations, created_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, ("appt_001", "farmer_001", "exp_001", "field_001", "Tomato",
                  time.strftime("%Y-%m-%d", time.localtime(now + 86400 * 2)), "10:30 AM", "Asia/Kolkata",
                  "video", "confirmed", "pestpulse-icar-consult-f841a0e2", "esc_001", "pass_demo_tomato_2026",
                  "Tomato leafminer count escalated after botanical spray. Need guidance on pheromone mass trapping and biorational rotation.",
                  "Farmer has authorized Crop Passport sharing.",
                  "Pending consultation. Pre-call data package attached.", now))

        # Seed initial Crop Passport if empty
        pass_count = c.execute("SELECT COUNT(*) FROM crop_passports").fetchone()[0]
        if pass_count == 0:
            now = time.time()
            c.execute("""
            INSERT INTO crop_passports(passport_id, field_id, farmer_id, crop_type, token_hash, access_type, created_at, is_revoked, views_count, custom_notes)
            VALUES(?,?,?,?,?,?,?,?,?,?)
            """, ("pass_demo_tomato_2026", "field_001", "farmer_001", "Tomato",
                  "pass_demo_tomato_2026", "detailed", now, 0, 14,
                  "Certified monitoring record for Arka Rakshak F1 crop cycle. ICAR-IIHR technical oversight."))

        # Seed farmer preferences if empty
        pref_count = c.execute("SELECT COUNT(*) FROM farmer_preferences").fetchone()[0]
        if pref_count == 0:
            c.execute("""
            INSERT INTO farmer_preferences(farmer_id, auto_voice_alerts, auto_schedule_consultation, preferred_language, preferred_hours, preferred_expert_id, attach_passport_default)
            VALUES(?,?,?,?,?,?,?)
            """, ("farmer_001", 1, 0, "en", "08:00 - 18:00", "exp_001", 1))


def _row(r):
    if r is None:
        return None
    d = dict(r)
    for k in ("counts", "steps", "done", "box_json"):
        if k in d:
            if isinstance(d[k], str) and d[k]:
                try:
                    d[k] = json.loads(d[k])
                except Exception:
                    d[k] = {} if k == "counts" else []
            elif not d[k]:
                d[k] = {} if k == "counts" else []
    return d


def _exec(q, args=()):
    with _lock, _conn() as c:
        return c.execute(q, args).lastrowid


def _all(q, args=()):
    with _lock, _conn() as c:
        return [_row(r) for r in c.execute(q, args).fetchall()]


def _one(q, args=()):
    with _lock, _conn() as c:
        return _row(c.execute(q, args).fetchone())


# ---------------------------------------------------------------- farmers
def farmer_by_id(fid):
    return _one("SELECT * FROM farmers WHERE farmer_id=?", (fid,))


def farmer_by_contact(contact):
    return _one("SELECT * FROM farmers WHERE contact=?", (contact,))


def insert_farmer(name, contact, password_hash, language="en", farm_name=None, farm_place=None, lat=None, lon=None):
    fid = f"farmer_{uuid.uuid4().hex[:8]}"
    now = time.time()
    _exec("""
    INSERT INTO farmers(farmer_id, name, contact, password_hash, language, farm_name, farm_place, lat, lon, created_at, last_login)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)
    """, (fid, name, contact, password_hash, language, farm_name or config.FARM_NAME,
          farm_place or config.FARM_PLACE, lat or config.FARM_LAT, lon or config.FARM_LON, now, now))
    return farmer_by_id(fid)


def update_farmer(fid, **fields):
    allowed = {k: v for k, v in fields.items() if k in (
        "name", "contact", "language", "farm_name", "farm_place", "lat", "lon", "last_login") and v is not None}
    if not allowed:
        return farmer_by_id(fid)
    sets = ",".join(f"{k}=?" for k in allowed)
    _exec(f"UPDATE farmers SET {sets} WHERE farmer_id=?", (*allowed.values(), fid))
    return farmer_by_id(fid)


# ---------------------------------------------------------------- fields
def fields(farmer_id=None):
    if farmer_id:
        return _all("SELECT * FROM fields WHERE farmer_id=? AND is_active=1 ORDER BY name", (farmer_id,))
    return _all("SELECT * FROM fields WHERE is_active=1 ORDER BY name")


def field(fid):
    return _one("SELECT * FROM fields WHERE field_id=?", (fid,))


def insert_field(farmer_id, name, crop_type, area_acres=1.0, location_name=None, lat=None, lon=None,
                 crop_variety=None, sowing_date=None, growth_stage="Vegetative Growth"):
    fid = f"field_{uuid.uuid4().hex[:8]}"
    now = time.time()
    _exec("""
    INSERT INTO fields(field_id, farmer_id, name, location_name, lat, lon, crop_type, crop_variety, sowing_date, growth_stage, area_acres, created_at, is_active)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1)
    """, (fid, farmer_id, name, location_name or config.FARM_PLACE, lat or config.FARM_LAT, lon or config.FARM_LON,
          crop_type, crop_variety, sowing_date, growth_stage, float(area_acres), now))
    return field(fid)


def update_field(fid, **fields_dict):
    allowed = {k: v for k, v in fields_dict.items() if k in (
        "name", "crop_type", "crop_variety", "sowing_date", "growth_stage", "area_acres", "location_name", "lat", "lon") and v is not None}
    if not allowed:
        return field(fid)
    sets = ",".join(f"{k}=?" for k in allowed)
    _exec(f"UPDATE fields SET {sets} WHERE field_id=?", (*allowed.values(), fid))
    return field(fid)


def delete_field(fid):
    _exec("UPDATE fields SET is_active=0 WHERE field_id=?", (fid,))


# ---------------------------------------------------------------- devices
def device(node):
    return _one("SELECT * FROM devices WHERE node=?", (node,))


def devices(field_id=None):
    if field_id:
        return _all("SELECT * FROM devices WHERE field_id=? ORDER BY node", (field_id,))
    return _all("SELECT * FROM devices ORDER BY node")


def _pretty(node):
    import re
    m = re.fullmatch(r"(?i)(trap|node)[-_ ]?(\w+)", node)
    return f"Trap {m.group(2).upper() if len(m.group(2)) == 1 else m.group(2)}" if m else node


def touch_device(node, trap, rssi=None, fw=None, ip=None, uptime_s=None, battery_pct=None, field_id=None):
    """Register a node the first time it uploads, then keep its status fresh."""
    now = time.time()
    existing = device(node)
    bp = battery_pct if battery_pct is not None else (existing["battery_pct"] if existing and existing["battery_pct"] else 92)
    voltage = round(3.4 + (bp / 100.0) * 0.8, 2)
    if existing is None:
        # Default field if available
        first_field = _one("SELECT field_id FROM fields WHERE is_active=1 LIMIT 1")
        fid = field_id or (first_field["field_id"] if first_field else "field_001")
        _exec("INSERT INTO devices(node,name,field_id,trap,interval_s,created,last_seen,rssi,fw,ip,uptime_s,battery_pct,battery_voltage,solar_charging,status) "
              "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
              (node, _pretty(node), fid, trap, config.DEFAULT_INTERVAL_S,
               now, now, rssi, fw, ip, uptime_s, bp, voltage, 1, "online"))
    else:
        _exec("UPDATE devices SET last_seen=?, rssi=?, fw=COALESCE(?,fw), ip=?, uptime_s=?, battery_pct=?, battery_voltage=?, status='online' WHERE node=?",
              (now, rssi, fw, ip, uptime_s, bp, voltage, node))
    return device(node)


def update_device(node, **fields_dict):
    allowed = {k: v for k, v in fields_dict.items() if k in (
        "name", "trap", "interval_s", "pest", "field_id", "battery_pct", "solar_charging", "status") and v not in (None, "")}
    if not allowed:
        return device(node)
    sets = ",".join(f"{k}=?" for k in allowed)
    _exec(f"UPDATE devices SET {sets} WHERE node=?", (*allowed.values(), node))
    return device(node)


# ---------------------------------------------------------------- readings
def insert_reading(**row):
    row.setdefault("ts", time.time())
    if isinstance(row.get("counts"), dict):
        row["counts"] = json.dumps(row["counts"])
    keys, q = ",".join(row), ",".join("?" for _ in row)
    return _exec(f"INSERT INTO readings({keys}) VALUES({q})", list(row.values()))


def reading(rid):
    return _one("SELECT * FROM readings WHERE id=?", (rid,))


def last_reading(node, kind=None):
    q = "SELECT * FROM readings WHERE node=?" + (" AND kind=?" if kind else "") + " ORDER BY ts DESC LIMIT 1"
    return _one(q, (node, kind) if kind else (node,))


def readings_since(node, seconds, kind=None):
    t0 = time.time() - seconds
    q = "SELECT * FROM readings WHERE node=? AND ts>=?" + (" AND kind=?" if kind else "") + " ORDER BY ts"
    return _all(q, (node, t0, kind) if kind else (node, t0))


def recent_photos(node=None, field_id=None, limit=12):
    q = "SELECT id, ts, node, field_id, total, new, risk, counts, annotated, image, is_simulated FROM readings WHERE annotated IS NOT NULL"
    args = []
    if node:
        q += " AND node=?"
        args.append(node)
    if field_id:
        q += " AND field_id=?"
        args.append(field_id)
    q += " ORDER BY ts DESC LIMIT ?"
    args.append(limit)
    return _all(q, args)


def latest_climate(max_age_s=3 * 3600, field_id=None):
    q = "SELECT temp, hum, ts, node, field_id FROM readings WHERE temp IS NOT NULL AND ts>=?"
    args = [time.time() - max_age_s]
    if field_id:
        q += " AND field_id=?"
        args.append(field_id)
    q += " ORDER BY ts DESC LIMIT 1"
    return _one(q, args)


def old_images(days):
    return _all("SELECT id, image, annotated FROM readings WHERE ts < ? AND image IS NOT NULL",
                (time.time() - days * 86400,))


def clear_images(ids):
    with _lock, _conn() as c:
        c.executemany("UPDATE readings SET image=NULL, annotated=NULL WHERE id=?", [(i,) for i in ids])


# ---------------------------------------------------------------- insect detections
def insert_detection(**row):
    row.setdefault("ts", time.time())
    if isinstance(row.get("box_json"), (list, dict)):
        row["box_json"] = json.dumps(row["box_json"])
    keys, q = ",".join(row), ",".join("?" for _ in row)
    return _exec(f"INSERT INTO insect_detections({keys}) VALUES({q})", list(row.values()))


def detections_recent(limit=30, field_id=None, insect_class=None):
    q = "SELECT * FROM insect_detections WHERE 1=1"
    args = []
    if field_id:
        q += " AND field_id=?"
        args.append(field_id)
    if insect_class:
        q += " AND insect_class=?"
        args.append(insect_class)
    q += " ORDER BY ts DESC LIMIT ?"
    args.append(limit)
    return _all(q, args)


# ---------------------------------------------------------------- alerts
def insert_alert(**row):
    row.setdefault("ts", time.time())
    for k in ("steps", "done"):
        if isinstance(row.get(k), list):
            row[k] = json.dumps(row[k], ensure_ascii=False)
    keys, q = ",".join(row), ",".join("?" for _ in row)
    return _exec(f"INSERT INTO alerts({keys}) VALUES({q})", list(row.values()))


def alerts(limit=50, field_id=None):
    q = "SELECT * FROM alerts WHERE 1=1"
    args = []
    if field_id:
        q += " AND (field_id=? OR field_id IS NULL)"
        args.append(field_id)
    q += " ORDER BY ts DESC LIMIT ?"
    args.append(limit)
    return _all(q, args)


def alert(aid):
    return _one("SELECT * FROM alerts WHERE id=?", (aid,))


def last_alert(node):
    return _one("SELECT * FROM alerts WHERE node=? ORDER BY ts DESC LIMIT 1", (node,))


def update_alert(aid, done=None, acked=None):
    if done is not None:
        _exec("UPDATE alerts SET done=? WHERE id=?", (json.dumps(done), aid))
    if acked is not None:
        _exec("UPDATE alerts SET acked=? WHERE id=?", (1 if acked else 0, aid))
    return alert(aid)


# ---------------------------------------------------------------- history
def readings_between(t0, t1, node=None, kinds=("trap",), field_id=None):
    q = f"SELECT * FROM readings WHERE ts>=? AND ts<? AND kind IN ({','.join('?' for _ in kinds)})"
    args = [t0, t1, *kinds]
    if node:
        q += " AND node=?"
        args.append(node)
    if field_id:
        q += " AND (field_id=? OR field_id IS NULL)"
        args.append(field_id)
    return _all(q + " ORDER BY ts", args)


def readings(node=None, field_id=None, limit=100, since_s=None):
    q, args = "SELECT * FROM readings WHERE 1=1", []
    if node:
        q += " AND node=?"
        args.append(node)
    if field_id:
        q += " AND (field_id=? OR field_id IS NULL)"
        args.append(field_id)
    if since_s:
        q += " AND ts>=?"
        args.append(time.time() - since_s)
    q += " ORDER BY ts DESC LIMIT ?"
    args.append(limit)
    return _all(q, args)


def alerts_between(t0, t1, field_id=None):
    q = "SELECT id, ts, node, field_id, level, species, catches_24h, title_en, title_kn FROM alerts WHERE ts>=? AND ts<?"
    args = [t0, t1]
    if field_id:
        q += " AND (field_id=? OR field_id IS NULL)"
        args.append(field_id)
    return _all(q + " ORDER BY ts", args)


# ---------------------------------------------------------------- spray log
def insert_spray(**row):
    row.setdefault("ts", time.time())
    keys, q = ",".join(row), ",".join("?" for _ in row)
    return _exec(f"INSERT INTO sprays({keys}) VALUES({q})", list(row.values()))


def sprays(since_s=None, pest=None, field_id=None):
    q, args = "SELECT * FROM sprays WHERE 1=1", []
    if since_s:
        q += " AND ts>=?"
        args.append(time.time() - since_s)
    if pest:
        q += " AND pest=?"
        args.append(pest)
    if field_id:
        q += " AND (field_id=? OR field_id IS NULL)"
        args.append(field_id)
    return _all(q + " ORDER BY ts DESC", args)


def delete_spray(sid):
    _exec("DELETE FROM sprays WHERE id=?", (sid,))


# ---------------------------------------------------------------- simulation events
def insert_simulation_event(farmer_id, field_id, event_type, pest_before, pest_after, details, result="Success"):
    now = time.time()
    return _exec("""
    INSERT INTO simulation_events(farmer_id, field_id, event_type, timestamp, result, pest_level_before, pest_level_after, details)
    VALUES(?,?,?,?,?,?,?,?)
    """, (farmer_id, field_id, event_type, now, result, pest_before, pest_after, details))


def simulation_events(farmer_id=None, limit=20):
    q = "SELECT * FROM simulation_events WHERE 1=1"
    args = []
    if farmer_id:
        q += " AND farmer_id=?"
        args.append(farmer_id)
    q += " ORDER BY timestamp DESC LIMIT ?"
    args.append(limit)
    return _all(q, args)


# ---------------------------------------------------------------- crop passports
def passport_by_token(token_hash):
    return _one("SELECT * FROM crop_passports WHERE token_hash=?", (token_hash,))


def passport_by_field(field_id):
    return _one("SELECT * FROM crop_passports WHERE field_id=? ORDER BY created_at DESC LIMIT 1", (field_id,))


def passport_by_id(pid):
    return _one("SELECT * FROM crop_passports WHERE passport_id=?", (pid,))


def insert_passport(field_id, farmer_id, crop_type=None, access_type="detailed", custom_notes=None):
    token = f"pp_{uuid.uuid4().hex[:12]}"
    pid = f"pass_{uuid.uuid4().hex[:8]}"
    now = time.time()
    _exec("""
    INSERT INTO crop_passports(passport_id, field_id, farmer_id, crop_type, token_hash, access_type, created_at, is_revoked, views_count, custom_notes)
    VALUES(?,?,?,?,?,?,?,?,?,?)
    """, (pid, field_id, farmer_id, crop_type, token, access_type, now, 0, 0, custom_notes))
    return passport_by_id(pid)


def update_passport(pid, **kwargs):
    allowed = {k: v for k, v in kwargs.items() if k in ("access_type", "is_revoked", "custom_notes", "token_hash") and v is not None}
    if not allowed:
        return passport_by_id(pid)
    sets = ",".join(f"{k}=?" for k in allowed)
    _exec(f"UPDATE crop_passports SET {sets} WHERE passport_id=?", (*allowed.values(), pid))
    return passport_by_id(pid)


def increment_passport_views(pid):
    _exec("UPDATE crop_passports SET views_count=views_count+1, last_viewed_at=? WHERE passport_id=?", (time.time(), pid))


# ---------------------------------------------------------------- treatments
def treatments(field_id=None, farmer_id=None):
    q, args = "SELECT * FROM treatments WHERE 1=1", []
    if field_id:
        q += " AND field_id=?"
        args.append(field_id)
    if farmer_id:
        q += " AND farmer_id=?"
        args.append(farmer_id)
    q += " ORDER BY applied_date DESC, created_at DESC"
    return _all(q, args)


def treatment(tid):
    return _one("SELECT * FROM treatments WHERE treatment_id=?", (tid,))


def insert_treatment(field_id, farmer_id, target_pest, product_name, category="Chemical",
                     active_ingredient=None, application_method="Foliar spray", rate_per_acre=None,
                     total_quantity=None, water_volume_liters=None, area_treated_acres=None,
                     applied_date=None, status="completed", source_ref=None, follow_up_obs=None,
                     notes=None, image_path=None):
    tid = f"treat_{uuid.uuid4().hex[:8]}"
    now = time.time()
    applied_date = applied_date or time.strftime("%Y-%m-%d", time.localtime(now))
    _exec("""
    INSERT INTO treatments(treatment_id, field_id, farmer_id, target_pest, product_name, category,
                           active_ingredient, application_method, rate_per_acre, total_quantity,
                           water_volume_liters, area_treated_acres, applied_date, status, source_ref,
                           follow_up_obs, notes, image_path, created_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (tid, field_id, farmer_id, target_pest, product_name, category, active_ingredient,
          application_method, rate_per_acre, total_quantity, water_volume_liters, area_treated_acres,
          applied_date, status, source_ref, follow_up_obs, notes, image_path, now))
    return treatment(tid)


def update_treatment(tid, **kwargs):
    allowed = {k: v for k, v in kwargs.items() if k in (
        "target_pest", "product_name", "category", "active_ingredient", "application_method",
        "rate_per_acre", "total_quantity", "water_volume_liters", "area_treated_acres",
        "applied_date", "status", "source_ref", "follow_up_obs", "notes", "image_path") and v is not None}
    if not allowed:
        return treatment(tid)
    sets = ",".join(f"{k}=?" for k in allowed)
    _exec(f"UPDATE treatments SET {sets} WHERE treatment_id=?", (*allowed.values(), tid))
    return treatment(tid)


def delete_treatment(tid):
    _exec("DELETE FROM treatments WHERE treatment_id=?", (tid,))


# ---------------------------------------------------------------- escalations
def escalations(farmer_id=None, field_id=None, status=None):
    q, args = "SELECT * FROM escalations WHERE 1=1", []
    if farmer_id:
        q += " AND farmer_id=?"
        args.append(farmer_id)
    if field_id:
        q += " AND field_id=?"
        args.append(field_id)
    if status:
        q += " AND status=?"
        args.append(status)
    q += " ORDER BY created_at DESC"
    return _all(q, args)


def escalation(eid):
    return _one("SELECT * FROM escalations WHERE escalation_id=?", (eid,))


def insert_escalation(farmer_id, field_id, crop_type, pest_type, severity="warning",
                      reason_en=None, reason_kn=None, pest_count_before=0, pest_count_after=0,
                      status="active", suggested_action_en=None, suggested_action_kn=None):
    eid = f"esc_{uuid.uuid4().hex[:8]}"
    now = time.time()
    _exec("""
    INSERT INTO escalations(escalation_id, farmer_id, field_id, crop_type, pest_type, severity,
                            reason_en, reason_kn, pest_count_before, pest_count_after, status,
                            suggested_action_en, suggested_action_kn, created_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (eid, farmer_id, field_id, crop_type, pest_type, severity, reason_en, reason_kn,
          pest_count_before, pest_count_after, status, suggested_action_en, suggested_action_kn, now))
    return escalation(eid)


def update_escalation(eid, **kwargs):
    allowed = {k: v for k, v in kwargs.items() if k in (
        "status", "severity", "suggested_action_en", "suggested_action_kn", "resolved_at") and v is not None}
    if not allowed:
        return escalation(eid)
    sets = ",".join(f"{k}=?" for k in allowed)
    _exec(f"UPDATE escalations SET {sets} WHERE escalation_id=?", (*allowed.values(), eid))
    return escalation(eid)


# ---------------------------------------------------------------- experts
def experts():
    return _all("SELECT * FROM experts WHERE is_verified=1 ORDER BY rating DESC, experience_years DESC")


def expert(eid):
    return _one("SELECT * FROM experts WHERE expert_id=?", (eid,))


# ---------------------------------------------------------------- appointments
def appointments(farmer_id=None, field_id=None, status=None):
    q, args = "SELECT a.*, e.name as expert_name, e.email as expert_email, e.title as expert_title, e.institution, e.languages, e.rating as expert_rating FROM appointments a LEFT JOIN experts e ON a.expert_id = e.expert_id WHERE 1=1", []
    if farmer_id:
        q += " AND a.farmer_id=?"
        args.append(farmer_id)
    if field_id:
        q += " AND a.field_id=?"
        args.append(field_id)
    if status:
        q += " AND a.status=?"
        args.append(status)
    q += " ORDER BY a.appointment_date ASC, a.created_at DESC"
    return _all(q, args)


def appointment(aid):
    return _one("""
    SELECT a.*, e.name as expert_name, e.email as expert_email, e.title as expert_title, e.institution, e.languages, e.rating as expert_rating
    FROM appointments a
    LEFT JOIN experts e ON a.expert_id = e.expert_id
    WHERE a.appointment_id=?
    """, (aid,))


def appointment_by_accept_token(token):
    return _one("""
    SELECT a.*, e.name as expert_name, e.email as expert_email, e.title as expert_title, e.institution, e.languages, e.rating as expert_rating
    FROM appointments a
    LEFT JOIN experts e ON a.expert_id = e.expert_id
    WHERE a.accept_token=?
    """, (token,))


def insert_appointment(farmer_id, expert_id, field_id, crop_type, appointment_date, appointment_time,
                       time_zone="Asia/Kolkata", consultation_type="video", status="requested",
                       escalation_id=None, passport_id=None, problem_description=None, notes=None):
    aid = f"appt_{uuid.uuid4().hex[:8]}"
    room_id = f"pestpulse-icar-consult-{uuid.uuid4().hex[:8]}"
    accept_token = f"acc_{uuid.uuid4().hex[:16]}"
    now = time.time()
    
    # Lookup doctor email
    exp = expert(expert_id) or {}
    expert_email = exp.get("email") or "jayanthgowda1406@gmail.com"

    _exec("""
    INSERT INTO appointments(appointment_id, farmer_id, expert_id, expert_email, accept_token, field_id, crop_type,
                            appointment_date, appointment_time, time_zone, consultation_type,
                            status, jitsi_room_id, escalation_id, passport_id, problem_description, notes, created_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (aid, farmer_id, expert_id, expert_email, accept_token, field_id, crop_type, appointment_date, appointment_time,
          time_zone, consultation_type, status, room_id, escalation_id, passport_id,
          problem_description, notes, now))
    return appointment(aid)


def accept_appointment(aid_or_token):
    now = time.time()
    # Check by token first, then by appointment_id
    rec = appointment_by_accept_token(aid_or_token) or appointment(aid_or_token)
    if not rec:
        return None
    _exec("UPDATE appointments SET status='confirmed', accepted_at=? WHERE appointment_id=?", (now, rec["appointment_id"]))
    return appointment(rec["appointment_id"])


def update_appointment(aid, **kwargs):
    allowed = {k: v for k, v in kwargs.items() if k in (
        "appointment_date", "appointment_time", "status", "notes", "expert_recommendations", "consultation_type", "accepted_at") and v is not None}
    if not allowed:
        return appointment(aid)
    sets = ",".join(f"{k}=?" for k in allowed)
    _exec(f"UPDATE appointments SET {sets} WHERE appointment_id=?", (*allowed.values(), aid))
    return appointment(aid)


def delete_appointment(aid):
    _exec("DELETE FROM appointments WHERE appointment_id=?", (aid,))


# ---------------------------------------------------------------- voice communications
def voice_communications(farmer_id=None, limit=30):
    q, args = "SELECT * FROM voice_communications WHERE 1=1", []
    if farmer_id:
        q += " AND farmer_id=?"
        args.append(farmer_id)
    q += " ORDER BY created_at DESC LIMIT ?"
    args.append(limit)
    return _all(q, args)


def insert_voice_comm(farmer_id, field_id=None, alert_id=None, escalation_id=None,
                      channel="in_app", language="en", script_en=None, script_kn=None,
                      status="delivered", duration_s=45):
    cid = f"vcomm_{uuid.uuid4().hex[:8]}"
    now = time.time()
    _exec("""
    INSERT INTO voice_communications(comm_id, farmer_id, field_id, alert_id, escalation_id,
                                     channel, language, script_en, script_kn, status, duration_s,
                                     created_at, played_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (cid, farmer_id, field_id, alert_id, escalation_id, channel, language, script_en,
          script_kn, status, duration_s, now, now if status == "played" else None))
    return _one("SELECT * FROM voice_communications WHERE comm_id=?", (cid,))


def update_voice_comm(cid, **kwargs):
    allowed = {k: v for k, v in kwargs.items() if k in ("status", "played_at") and v is not None}
    if not allowed:
        return _one("SELECT * FROM voice_communications WHERE comm_id=?", (cid,))
    sets = ",".join(f"{k}=?" for k in allowed)
    _exec(f"UPDATE voice_communications SET {sets} WHERE comm_id=?", (*allowed.values(), cid))
    return _one("SELECT * FROM voice_communications WHERE comm_id=?", (cid,))


# ---------------------------------------------------------------- farmer preferences
def farmer_preferences(farmer_id):
    pref = _one("SELECT * FROM farmer_preferences WHERE farmer_id=?", (farmer_id,))
    if not pref:
        _exec("""
        INSERT INTO farmer_preferences(farmer_id, auto_voice_alerts, auto_schedule_consultation, preferred_language, preferred_hours, preferred_expert_id, attach_passport_default)
        VALUES(?, 1, 0, 'en', '08:00 - 18:00', 'exp_001', 1)
        """, (farmer_id,))
        pref = _one("SELECT * FROM farmer_preferences WHERE farmer_id=?", (farmer_id,))
    return pref


def set_farmer_preferences(farmer_id, **kwargs):
    allowed = {k: v for k, v in kwargs.items() if k in (
        "auto_voice_alerts", "auto_schedule_consultation", "preferred_language",
        "preferred_hours", "preferred_expert_id", "attach_passport_default", "voice_provider") and v is not None}
    if not allowed:
        return farmer_preferences(farmer_id)
    sets = ",".join(f"{k}=?" for k in allowed)
    _exec(f"UPDATE farmer_preferences SET {sets} WHERE farmer_id=?", (*allowed.values(), farmer_id))
    return farmer_preferences(farmer_id)
