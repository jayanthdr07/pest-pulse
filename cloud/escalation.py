"""
PestPulse Pest Escalation Engine.
Monitors pest population dynamics post-intervention, checks biological damage thresholds,
detects control failures or resurgence, and automatically triggers agronomist recommendations.
"""
import time
import db
import pests


def evaluate_field_escalation(field_id: str, trigger_reading_id: int = None):
    """
    Evaluates recent pest dynamics for a field.
    Returns (escalation_dict or None, reason).
    """
    field = db.field(field_id)
    if not field:
        return None, "Field not found"

    farmer_id = field.get("farmer_id", "farmer_001")
    crop_type = field.get("crop_type", "Tomato")

    # Fetch recent treatments for this field
    treats = db.treatments(field_id=field_id)
    recent_readings = db.readings(field_id=field_id, limit=25)
    if not recent_readings:
        return None, "No observations to evaluate"

    latest_reading = recent_readings[0]
    latest_counts = latest_reading.get("counts") or {}
    total_latest = latest_reading.get("new", 0)

    # Check against active treatments
    escalation_triggered = False
    reason_en = ""
    reason_kn = ""
    target_pest = ""
    pest_before = 0
    pest_after = 0
    severity = "warning"

    # 1. Post-treatment resurgence check
    if treats:
        latest_treatment = treats[0]
        target_pest = latest_treatment.get("target_pest", "")
        # Look for pest match in latest counts
        matched_pest_count = 0
        for p_name, cnt in latest_counts.items():
            if any(part.lower() in p_name.lower() for part in target_pest.split() if len(part) > 3):
                matched_pest_count += cnt

        # If after treatment we still have significant counts
        if matched_pest_count >= 10:
            escalation_triggered = True
            severity = "high"
            pest_before = 12
            pest_after = matched_pest_count
            reason_en = (
                f"{target_pest} activity remained elevated ({matched_pest_count} catches) "
                f"after the recorded intervention ({latest_treatment.get('product_name')}). "
                f"System detects post-treatment persistence or resistance risk."
            )
            reason_kn = (
                f"ದಾಖಲಾದ ಚಿಕಿತ್ಸೆಯ ({latest_treatment.get('product_name')}) ನಂತರವೂ {target_pest} ಕೀಟ ಚಟುವಟಿಕೆ "
                f"ಹೆಚ್ಚಾಗಿದೆ ({matched_pest_count} ಕೀಟಗಳು). ತಜ್ಞರ ತಕ್ಷಣದ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ."
            )

    # 2. Threshold check if not triggered by treatment
    if not escalation_triggered:
        for p_name, cnt in latest_counts.items():
            if cnt >= 15:  # Significant single-trap surge
                escalation_triggered = True
                severity = "high" if cnt >= 25 else "warning"
                target_pest = p_name
                pest_before = 5
                pest_after = cnt
                reason_en = (
                    f"Sharp increase in {p_name} population ({cnt} catches in latest cycle). "
                    f"Exceeds economic injury threshold for {crop_type}."
                )
                reason_kn = (
                    f"{crop_type} ಬೆಳೆಯಲ್ಲಿ {p_name} ಕೀಟಗಳ ಸಂಖ್ಯೆ ಗಣನೀಯವಾಗಿ ಹೆಚ್ಚಾಗಿದೆ ({cnt} ಕೀಟಗಳು). "
                    f"ಆರ್ಥಿಕ ಹಾನಿ ಮಟ್ಟವನ್ನು ಮೀರಿದೆ."
                )
                break

    if not escalation_triggered:
        return None, "Pest population within normal monitoring limits"

    # Check if there is already an active unresolved escalation for this field & pest
    existing_escs = db.escalations(field_id=field_id, status="active")
    for e in existing_escs:
        if e.get("pest_type") == target_pest:
            # Already active, avoid duplicate spam
            return e, "Active escalation already exists"

    # Insert new escalation
    action_en = f"Schedule an expert consultation with an ICAR/UAS entomologist to review chemical rotation and IPM tactics."
    action_kn = f"ಕೀಟನಾಶಕಗಳ ಬದಲಾವಣೆ ಮತ್ತು ಸಮಗ್ರ ಕೀಟ ನಿರ್ವಹಣಾ ಸಲಹೆಗಾಗಿ ಕೃಷಿ ವಿಜ್ಞಾನಿಗಳೊಂದಿಗೆ ಸಮಾಲೋಚಿಸಿ."

    esc = db.insert_escalation(
        farmer_id=farmer_id,
        field_id=field_id,
        crop_type=crop_type,
        pest_type=target_pest or "Insect Pest",
        severity=severity,
        reason_en=reason_en,
        reason_kn=reason_kn,
        pest_count_before=pest_before,
        pest_count_after=pest_after,
        status="active",
        suggested_action_en=action_en,
        suggested_action_kn=action_kn,
    )

    # Check farmer preferences for auto-scheduling
    pref = db.farmer_preferences(farmer_id)
    if pref and pref.get("auto_schedule_consultation"):
        exp_id = pref.get("preferred_expert_id") or "exp_001"
        now = time.time()
        appt_date = time.strftime("%Y-%m-%d", time.localtime(now + 86400 * 2))
        db.insert_appointment(
            farmer_id=farmer_id,
            expert_id=exp_id,
            field_id=field_id,
            crop_type=crop_type,
            appointment_date=appt_date,
            appointment_time="11:00 AM",
            consultation_type="video",
            status="requested",
            escalation_id=esc["escalation_id"],
            problem_description=reason_en,
            notes="Auto-requested via farmer preference upon high pest escalation.",
        )

    # Insert voice communication entry
    import voice_agent
    voice_agent.generate_and_log_alert(farmer_id, field_id, esc)

    return esc, "Escalation created successfully"
