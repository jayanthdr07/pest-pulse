"""
PestPulse Emailer Service:
Dispatches tele-consultation invitations and emergency outbreak alerts
to verified doctors (Dr. Jayanth Gowda, Dr. Srujan R, Dr. Hruthik Gowda).
Provides both live SMTP delivery, Gmail Web one-click prefilled links,
and persistent HTML archiving.
"""
import os
import json
import smtplib
import time
import urllib.parse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import make_msgid, formatdate

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
EMAIL_DIR = os.path.join(DATA_DIR, "emails")
CONFIG_FILE = os.path.join(DATA_DIR, "smtp_config.json")
os.makedirs(EMAIL_DIR, exist_ok=True)

# Pre-seeded verified agronomists
DOCTOR_REGISTRY = {
    "exp_jayanth": {
        "name": "Dr. Jayanth Gowda",
        "email": "jayanthgowda1406@gmail.com",
        "title": "Senior Agronomist & Chief Entomologist",
        "institution": "ICAR - Indian Institute of Horticultural Research & UAS",
    },
    "exp_srujan": {
        "name": "Dr. Srujan R",
        "email": "srujanr173@gmail.com",
        "title": "Crop Protection & Plant Pathology Specialist",
        "institution": "University of Agricultural Sciences, GKVK Bangalore",
    },
    "exp_hruthik": {
        "name": "Dr. Hruthik Gowda",
        "email": "hruthikgowda.200521@gmail.com",
        "title": "Horticulture Consultant & Biological Control Specialist",
        "institution": "Karnataka Agricultural Extension Network & UAS Dharwad",
    },
}

def load_smtp_config():
    """Loads SMTP configuration from config file or environment variables."""
    cfg = {
        "server": os.environ.get("PP_SMTP_SERVER", "smtp.gmail.com"),
        "port": int(os.environ.get("PP_SMTP_PORT", 587)),
        "user": os.environ.get("PP_SMTP_USER", ""),
        "password": os.environ.get("PP_SMTP_PASSWORD", ""),
        "from_name": os.environ.get("PP_SMTP_FROM_NAME", "PestPulse Smart Agriculture"),
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                cfg.update(saved)
        except Exception as e:
            print(f"[Emailer] Could not read {CONFIG_FILE}: {e}")
    return cfg

def save_smtp_config(cfg: dict):
    """Saves SMTP credentials to disk for seamless background sending."""
    current = load_smtp_config()
    current.update(cfg)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2)
    return current

def build_gmail_web_url(to_email: str, subject: str, plain_text_body: str) -> str:
    """Builds a pre-filled direct Gmail Web link so farmers/users can send with 1 click."""
    params = {
        "view": "cm",
        "fs": "1",
        "to": to_email,
        "su": subject,
        "body": plain_text_body,
    }
    return f"https://mail.google.com/mail/?{urllib.parse.urlencode(params)}"

def build_mailto_url(to_email: str, subject: str, plain_text_body: str) -> str:
    """Standard mailto fallback for desktop/mobile mail clients."""
    params = {
        "subject": subject,
        "body": plain_text_body,
    }
    return f"mailto:{to_email}?{urllib.parse.urlencode(params)}"

def send_live_smtp_email(to_email: str, subject: str, html_content: str, plain_text: str = "") -> tuple[bool, str]:
    """Transmits real internet email via authenticated SMTP (e.g. Gmail App Password)."""
    cfg = load_smtp_config()
    if not cfg.get("user") or not cfg.get("password"):
        return False, "SMTP user/password not configured. Live email skipped (Gmail Web 1-click link generated)."

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{cfg.get('from_name', 'PestPulse Platform')} <{cfg['user']}>"
        msg["To"] = to_email
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain="pestpulse.org")

        if plain_text:
            msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        with smtplib.SMTP(cfg["server"], int(cfg["port"]), timeout=12) as server:
            server.starttls()
            server.login(cfg["user"], cfg["password"])
            server.sendmail(cfg["user"], [to_email], msg.as_string())

        print(f"[Emailer] Transmitted real email to {to_email} via {cfg['server']}:{cfg['port']}")
        return True, f"Successfully delivered to {to_email} via SMTP"
    except Exception as e:
        err_msg = f"SMTP transmission failed: {e}"
        print(f"[Emailer] {err_msg}")
        return False, err_msg

def send_doctor_invite_email(appointment: dict, doctor: dict, farmer: dict, field: dict,
                             jitsi_url: str, passport_url: str, accept_url: str) -> dict:
    """
    Sends an official Jitsi video consultation invite to the doctor.
    Returns delivery status, file path, and instant 1-click Gmail Web / mailto links.
    """
    doc_email = doctor.get("email") or "jayanthgowda1406@gmail.com"
    doc_name = doctor.get("name") or "Dr. Jayanth Gowda"
    farmer_name = farmer.get("name") or "Ramesh Kumar"
    farmer_contact = farmer.get("contact") or "+91 98450 12345"
    crop_name = field.get("crop_type") or "Tomato"
    field_name = field.get("name") or "Main Field"
    appt_date = appointment.get("appointment_date") or "2026-11-05"
    appt_time = appointment.get("appointment_time") or "10:30 AM"
    problem = appointment.get("problem_description") or "Pest population escalation. Requires agronomist review."

    subject = f"[PestPulse] Agronomist Video Consultation: {farmer_name} ({crop_name} - {field_name})"

    plain_text = (
        f"Dear {doc_name},\n\n"
        f"Farmer {farmer_name} has requested an urgent agricultural video consultation for their {crop_name} crop.\n\n"
        f"APPOINTMENT DETAILS:\n"
        f" • Farmer Name: {farmer_name}\n"
        f" • Phone Number: {farmer_contact}\n"
        f" • Crop & Field: {crop_name} ({field_name})\n"
        f" • Date & Time: {appt_date} at {appt_time}\n"
        f" • Field Issue: {problem}\n\n"
        f"ACTION REQUIRED:\n"
        f"Click the link below to accept the consultation and automatically trigger a confirmation call to the farmer:\n"
        f"👉 Accept Consultation & Call Farmer: {accept_url}\n\n"
        f"PRE-BRIEFING RESOURCES:\n"
        f" • Farmer Crop Passport: {passport_url}\n"
        f" • Encrypted Jitsi Video Room: {jitsi_url}\n\n"
        f"— PestPulse Smart Agriculture Platform (IoT + AI Insect Monitoring)"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fa; margin: 0; padding: 24px; color: #24292f; }}
        .card {{ background: #ffffff; max-width: 620px; margin: 0 auto; border-radius: 16px; border: 1px solid #d0d7de; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }}
        .header {{ background: linear-gradient(135deg, #064e3b, #0f766e); padding: 28px 24px; color: #ffffff; }}
        .header h1 {{ margin: 0 0 6px 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }}
        .header p {{ margin: 0; font-size: 13px; color: #a7f3d0; }}
        .content {{ padding: 24px; font-size: 13px; line-height: 1.6; }}
        .info-table {{ width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }}
        .info-table td {{ padding: 8px 12px; border-bottom: 1px solid #eaeef2; }}
        .info-table td.label {{ color: #57606a; font-weight: 600; width: 35%; }}
        .info-table td.val {{ color: #1f2328; font-weight: 700; }}
        .btn {{ display: inline-block; background-color: #059669; color: #ffffff !important; padding: 14px 28px; font-weight: 800; font-size: 14px; text-decoration: none; border-radius: 10px; margin: 16px 0; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.4); }}
        .btn-secondary {{ display: inline-block; background-color: #f1f5f9; color: #0f172a !important; padding: 10px 18px; font-weight: 700; font-size: 12px; text-decoration: none; border-radius: 8px; border: 1px solid #cbd5e1; margin-right: 8px; margin-bottom: 8px; }}
        .problem-box {{ background: #f8fafc; border-left: 4px solid #059669; padding: 12px 16px; border-radius: 0 8px 8px 0; font-style: italic; margin: 16px 0; }}
        .footer {{ background: #f8fafc; padding: 16px 24px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>PestPulse Agronomist Tele-Consultation</h1>
          <p>Verified ICAR & University Agricultural Extension Network</p>
        </div>
        <div class="content">
          <p>Dear <strong>{doc_name}</strong>,</p>
          <p>Farmer <strong>{farmer_name}</strong> has submitted an urgent agricultural consultation request for their <strong>{crop_name}</strong> field and requested your specialist review.</p>
          
          <table class="info-table">
            <tr><td class="label">Farmer Name:</td><td class="val">{farmer_name}</td></tr>
            <tr><td class="label">Contact Number:</td><td class="val">{farmer_contact}</td></tr>
            <tr><td class="label">Crop & Variety:</td><td class="val">{crop_name} ({field.get('crop_variety', 'Commercial Hybrid')})</td></tr>
            <tr><td class="label">Field Location:</td><td class="val">{field_name} • {field.get('area_acres', 2.0)} Acres</td></tr>
            <tr><td class="label">Appointment Time:</td><td class="val">{appt_date} at {appt_time}</td></tr>
            <tr><td class="label">Consultation Channel:</td><td class="val">Jitsi Video Conference (HD Encrypted)</td></tr>
          </table>

          <div class="problem-box">
            <strong>Field Issue Reported:</strong><br>
            "{problem}"
          </div>

          <p style="text-align: center; margin: 24px 0;">
            <a href="{accept_url}" class="btn">
              ✓ Accept Appointment & Trigger Automatic Farmer Call
            </a>
          </p>

          <p style="font-size: 11px; color: #64748b; text-align: center;">
            Clicking <em>Accept</em> automatically places an automated phone call to the farmer notifying them that you have confirmed the slot.
          </p>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <strong>Pre-Briefing Resources:</strong><br><br>
            <a href="{passport_url}" target="_blank" class="btn-secondary">📜 View Farmer Crop Passport</a>
            <a href="{jitsi_url}" target="_blank" class="btn-secondary">🎥 Open Jitsi Meeting Room</a>
          </div>
        </div>
        <div class="footer">
          PestPulse Smart Agriculture Platform • IoT Optical Insect Monitoring<br>
          Automated consultation dispatch system.
        </div>
      </div>
    </body>
    </html>
    """

    # Persist HTML for browser preview
    aid = appointment.get("appointment_id", f"appt_{int(time.time())}")
    email_file = os.path.join(EMAIL_DIR, f"invite_{aid}.html")
    with open(email_file, "w", encoding="utf-8") as f:
        f.write(html_content)

    gmail_url = build_gmail_web_url(doc_email, subject, plain_text)
    mailto_url = build_mailto_url(doc_email, subject, plain_text)

    # Attempt live SMTP if configured
    smtp_ok, smtp_msg = send_live_smtp_email(doc_email, subject, html_content, plain_text)

    return {
        "ok": True,
        "doctor_email": doc_email,
        "doctor_name": doc_name,
        "subject": subject,
        "smtp_sent": smtp_ok,
        "smtp_message": smtp_msg,
        "gmail_web_url": gmail_url,
        "mailto_url": mailto_url,
        "preview_file": email_file,
        "accept_url": accept_url,
        "jitsi_url": jitsi_url,
    }

def send_emergency_outbreak_email(field_id: str, crop_type: str, pest_name: str, count: int,
                                  doctor_email: str = "jayanthgowda1406@gmail.com") -> dict:
    """
    Sends a high-priority emergency outbreak warning to Dr. Jayanth Gowda when 50+ insects are identified.
    """
    subject = f"🚨 [CRITICAL OUTBREAK ALERT] {count}+ {pest_name} detected in {crop_type} (Field #{field_id})"
    plain_text = (
        f"CRITICAL EMERGENCY OUTBREAK ALERT\n\n"
        f"Dr. Jayanth Gowda,\n\n"
        f"A critical threshold surge of {count} {pest_name} has been identified by PestPulse computer vision for {crop_type} (Field #{field_id}).\n\n"
        f"This count severely exceeds the economic injury threshold and indicates rapid swarm multiplication or mass oviposition.\n"
        f"An automated emergency telephone call has been placed to the farmer's mobile.\n\n"
        f"Agronomist review is urgently requested."
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff5f5; padding: 24px;">
      <div style="background: white; border: 2px solid #e53e3e; border-radius: 12px; padding: 28px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 14px rgba(229,62,62,0.15);">
        <h2 style="color: #c53030; margin-top: 0; font-size: 22px;">🚨 CRITICAL EMERGENCY OUTBREAK ALERT</h2>
        <p>Dear <strong>Dr. Jayanth Gowda</strong>,</p>
        <p>A critical surge of <strong>{count} {pest_name}</strong> has been identified by the PestPulse vision model for <strong>Field #{field_id} ({crop_type})</strong>.</p>
        <p>This count severely exceeds the economic injury threshold and indicates mass oviposition or secondary swarm invasion.</p>
        <div style="background: #fed7d7; border-left: 4px solid #e53e3e; padding: 14px; border-radius: 0 8px 8px 0; color: #9b2c2c; font-weight: bold; margin: 16px 0;">
          Automated Emergency Call placed to farmer. Agronomist intervention urgently recommended.
        </div>
        <p style="font-size: 12px; color: #718096; margin-top: 24px;">PestPulse Smart Agriculture Monitoring System</p>
      </div>
    </body>
    </html>
    """

    email_file = os.path.join(EMAIL_DIR, f"emergency_outbreak_{int(time.time())}.html")
    with open(email_file, "w", encoding="utf-8") as f:
        f.write(html_content)

    gmail_url = build_gmail_web_url(doctor_email, subject, plain_text)
    smtp_ok, smtp_msg = send_live_smtp_email(doctor_email, subject, html_content, plain_text)

    return {
        "ok": True,
        "doctor_email": doctor_email,
        "subject": subject,
        "smtp_sent": smtp_ok,
        "smtp_message": smtp_msg,
        "gmail_web_url": gmail_url,
        "preview_file": email_file,
    }
