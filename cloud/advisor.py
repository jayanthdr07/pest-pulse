"""Insect history + spray advisor."""
import time

import config
import db
import pests
import risk

DAY = 86400


def _trap_pest(dev):
    return pests.pest_for(dev["trap"], dev.get("pest"))


def _midnight(ts=None):
    lt = time.localtime(ts or time.time())
    return time.mktime((lt.tm_year, lt.tm_mon, lt.tm_mday, 0, 0, 0, 0, 0, -1))


def history(days=30, node=None, field_id=None):
    days = max(1, min(120, days))
    end = _midnight() + DAY
    start = end - days * DAY
    all_devs = db.devices(field_id=field_id)
    devs = [d for d in all_devs if not node or d["node"] == node]
    labels = [time.strftime("%d %b", time.localtime(start + i * DAY)) for i in range(days)]
    series, totals_pest, events, log = [], {}, [], []
    daily_all = [0] * days

    for d in devs:
        rows = db.readings_between(start, end, d["node"], field_id=field_id)
        vals = [0] * days
        prev_total = None
        for r in rows:
            i = int((r["ts"] - start) // DAY)
            if 0 <= i < days:
                vals[i] += r["new"] or 0
            if prev_total and r["total"] is not None and r["total"] < prev_total * config.CARD_RESET_FRACTION:
                events.append({
                    "ts": r["ts"], "type": "card", "node": d["node"], "name": d["name"],
                    "en": f"Card replaced on {d['name']}", "kn": f"{d['name']} ಕಾರ್ಡ್ ಬದಲಾಯಿಸಲಾಗಿದೆ"
                })
            prev_total = r["total"] if r["total"] is not None else prev_total
        pest = _trap_pest(d)
        totals_pest[pest] = totals_pest.get(pest, 0) + sum(vals)
        daily_all = [a + b for a, b in zip(daily_all, vals)]
        t = risk.trap_cfg(d["trap"])
        series.append({
            "node": d["node"], "name": d["name"], "pest": pest, "values": vals, "total": sum(vals),
            "medium": t["medium"], "high": t["high"], "field_id": d.get("field_id")
        })
        for r in rows[-60:]:
            log.append({
                "ts": r["ts"], "node": d["node"], "name": d["name"], "total": r["total"], "new": r["new"],
                "risk": r["risk"], "temp": r["temp"], "hum": r["hum"], "field_id": r.get("field_id")
            })

    for a in db.alerts_between(start, end, field_id=field_id):
        if node and a["node"] != node:
            continue
        events.append({
            "ts": a["ts"], "type": "alert", "node": a["node"], "level": a["level"],
            "en": a["title_en"], "kn": a["title_kn"]
        })

    spray_rows = [s for s in db.sprays(field_id=field_id) if start <= s["ts"] < end]
    for s in spray_rows:
        events.append({
            "ts": s["ts"], "type": "spray", "pest": s["pest"], "en": f"Sprayed {s['product']}",
            "kn": f"{s['product']} ಸಿಂಪಡಿಸಲಾಗಿದೆ", "effect": spray_effect(s)
        })

    events.sort(key=lambda e: -e["ts"])
    log.sort(key=lambda r: -r["ts"])

    total = sum(daily_all)
    half = days // 2
    prev_rows = []
    for d in devs:
        prev_rows += db.readings_between(start - days * DAY, start, d["node"], field_id=field_id)
    prev_total = sum((r["new"] or 0) for r in prev_rows)
    covered = bool(prev_rows) and min(r["ts"] for r in prev_rows) <= start - 0.8 * days * DAY
    peak_i = max(range(days), key=lambda i: daily_all[i]) if total else None

    # Trend direction:
    trend_direction = "stable"
    if len(daily_all) >= 6:
        first_half = sum(daily_all[:len(daily_all)//2])
        second_half = sum(daily_all[len(daily_all)//2:])
        if second_half > first_half * 1.2:
            trend_direction = "increasing"
        elif second_half < first_half * 0.8:
            trend_direction = "decreasing"

    return {
        "days": days,
        "labels": labels,
        "start": start,
        "series": series,
        "daily_all": daily_all,
        "trend_direction": trend_direction,
        "summary": {
            "total": total,
            "avg_per_day": round(total / days, 1),
            "peak_day": labels[peak_i] if peak_i is not None else None,
            "peak_value": daily_all[peak_i] if peak_i is not None else 0,
            "prev_total": prev_total,
            "change_pct": round(100 * (total - prev_total) / prev_total) if prev_total and covered else None,
            "second_half_vs_first": (round(100 * (sum(daily_all[half:]) - sum(daily_all[:half])) /
                                           sum(daily_all[:half])) if sum(daily_all[:half]) else None),
        },
        "by_pest": [
            {"pest": k, "en": pests.PESTS[k]["en"], "kn": pests.PESTS[k]["kn"], "total": v}
            for k, v in sorted(totals_pest.items(), key=lambda kv: -kv[1]) if k in pests.PESTS
        ],
        "sprays": [
            {"ts": s["ts"], "day_index": int((s["ts"] - start) // DAY), "product": s["product"], "pest": s["pest"]}
            for s in spray_rows
        ],
        "events": events[:80],
        "log": log[:150],
    }


def spray_effect(s, window=3):
    """Average daily new catches for 3 days before vs 3 days after a spray."""
    devs = [d for d in db.devices() if _trap_pest(d) == s["pest"]]
    if not devs:
        return None
    before = after = 0
    for d in devs:
        before += sum((r["new"] or 0) for r in db.readings_between(s["ts"] - window * DAY, s["ts"], d["node"]))
        after += sum((r["new"] or 0) for r in db.readings_between(s["ts"], s["ts"] + window * DAY, d["node"]))
    days_after = min(window, (time.time() - s["ts"]) / DAY)
    if days_after < 1 or before == 0:
        return None
    b, a = before / window, after / days_after
    return {"before_per_day": round(b, 1), "after_per_day": round(a, 1), "change_pct": round(100 * (a - b) / b)}


def _days_high(dev, high):
    d = risk.daily(dev["node"], 2)
    return sum(1 for x in d if x["new"] >= high)


def advice(wx=None, field_id=None):
    now = time.time()
    by_pest = {}
    target_devs = db.devices(field_id=field_id)

    # Get field info if available to compute acreage dose
    current_field = db.field(field_id) if field_id else None
    acres = current_field["area_acres"] if current_field and current_field.get("area_acres") else 1.0

    for dev in target_devs:
        pest = _trap_pest(dev)
        t = risk.trap_cfg(dev["trap"])
        c24 = risk.catches_24h(dev["node"])
        last = db.last_reading(dev["node"], "trap") or {}
        online = dev["last_seen"] and now - dev["last_seen"] < max(config.OFFLINE_AFTER_S, 3 * (dev["interval_s"] or 1800))
        g = by_pest.setdefault(pest, {"traps": [], "c24": 0, "level": 0, "days_high": 0, "hot": False})
        lvl = risk.LEVELS.index(last.get("risk") or "LOW") if online else 0
        g["traps"].append({
            "node": dev["node"], "name": dev["name"], "c24": c24, "risk": last.get("risk") or "LOW",
            "online": bool(online), "medium": t["medium"], "high": t["high"]
        })
        g["c24"] += c24
        g["level"] = max(g["level"], lvl)
        g["days_high"] = max(g["days_high"], _days_high(dev, t["high"]))
        g["hot"] = g["hot"] or c24 >= 1.5 * t["high"]

    rain = wx["rain_prob_6h"] if wx else None
    wind = wx["wind_max_6h"] if wx else None
    out = []

    for pest, g in by_pest.items():
        if pest not in pests.PESTS:
            continue
        kb = pests.PESTS[pest]
        log = db.sprays(pest=pest, field_id=field_id)
        last = log[0] if log else None
        days_since = (now - last["ts"]) / DAY if last else None
        hottest = max(g["traps"], key=lambda x: x["c24"]) if g["traps"] else {"name": "Trap", "c24": 0}
        lvl = risk.LEVELS[g["level"]]
        name_en, name_kn = kb["en"], kb["kn"]

        if lvl == "LOW":
            status, en, kn = (
                "none",
                f"{name_en} below the action level ({g['c24']} in 24 h). No spray needed; keep monitoring.",
                f"{name_kn} ಕ್ರಮದ ಮಟ್ಟಕ್ಕಿಂತ ಕಡಿಮೆ (24 ಗಂಟೆಯಲ್ಲಿ {g['c24']}). ಸಿಂಪಡಣೆ ಬೇಡ; ಗಮನಿಸುತ್ತಿರಿ."
            )
        elif lvl == "MEDIUM":
            status, en, kn = (
                "non_chemical",
                f"{name_en} rising ({g['c24']} in 24 h at {hottest['name']}). Start non-chemical measures now.",
                f"{name_kn} ಹೆಚ್ಚುತ್ತಿದೆ (24 ಗಂಟೆಯಲ್ಲಿ {g['c24']}). ಈಗಲೇ ರಾಸಾಯನಿಕವಲ್ಲದ ಕ್ರಮ ಆರಂಭಿಸಿ."
            )
        elif days_since is not None and days_since < pests.MIN_DAYS_BETWEEN_SPRAYS:
            again = time.strftime("%d %b", time.localtime(last["ts"] + pests.MIN_DAYS_BETWEEN_SPRAYS * DAY))
            status, en, kn = (
                "wait",
                f"{name_en} still high, but you sprayed {last['product']} {int(days_since)} days ago. Give it time; re-check on {again} or ask your officer.",
                f"{name_kn} ಇನ್ನೂ ಹೆಚ್ಚು, ಆದರೆ {int(days_since)} ದಿನದ ಹಿಂದೆ {last['product']} ಸಿಂಪಡಿಸಿದ್ದೀರಿ. {again} ರಂದು ಮತ್ತೆ ನೋಡಿ."
            )
        elif g["days_high"] >= 2 or g["hot"]:
            why = "high for 2 days in a row" if g["days_high"] >= 2 else "1.5 times the action level"
            why_kn = "ಸತತ 2 ದಿನ ಹೆಚ್ಚು" if g["days_high"] >= 2 else "ಕ್ರಮದ ಮಟ್ಟದ 1.5 ಪಟ್ಟು"
            status, en, kn = (
                "spray",
                f"{name_en}: {g['c24']} in 24 h, {why}. A spray is advised.",
                f"{name_kn}: 24 ಗಂಟೆಯಲ್ಲಿ {g['c24']}, {why_kn}. ಸಿಂಪಡಣೆ ಸಲಹೆ."
            )
        else:
            status, en, kn = (
                "watch_spray",
                f"{name_en} crossed the action level today ({g['c24']} in 24 h). Use non-chemical measures; spray if still high tomorrow.",
                f"{name_kn} ಇಂದು ಕ್ರಮದ ಮಟ್ಟ ದಾಟಿದೆ. ರಾಸಾಯನಿಕವಲ್ಲದ ಕ್ರಮ ಬಳಸಿ; ನಾಳೆಯೂ ಹೆಚ್ಚಿದ್ದರೆ ಸಿಂಪಡಿಸಿ."
            )

        window = None
        if wx:
            if rain is not None and rain >= 60:
                window = {
                    "ok": False,
                    "en": f"Rain likely ({rain}%) in 6 h: postpone spraying.",
                    "kn": f"6 ಗಂಟೆಯಲ್ಲಿ ಮಳೆ ಸಾಧ್ಯತೆ ({rain}%): ಸಿಂಪಡಣೆ ಮುಂದೂಡಿ."
                }
            elif wind is not None and wind >= 15:
                window = {
                    "ok": False,
                    "en": f"Windy ({round(wind)} km/h): spray drift risk, wait for calm.",
                    "kn": f"ಗಾಳಿ ಹೆಚ್ಚು ({round(wind)} ಕಿಮೀ/ಗಂ): ಶಾಂತವಾದಾಗ ಸಿಂಪಡಿಸಿ."
                }
            else:
                window = {
                    "ok": True,
                    "en": "Good spray window: dry and calm for 6 h. Spray early morning or evening.",
                    "kn": "6 ಗಂಟೆ ಒಣ ಮತ್ತು ಶಾಂತ: ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ಸಿಂಪಡಿಸಲು ಸೂಕ್ತ."
                }

        if status == "spray" and window and not window["ok"]:
            status = "postpone"

        chem = [dict(c) for c in kb["chemical"]]
        pick = next((c for c in chem if not last or c["irac"] != last.get("irac")), chem[0] if chem else None)

        # Scale per acre doses to field's exact registered acreage
        for c in chem:
            c["suggested"] = (c is pick and status in ("spray", "postpone", "watch_spray"))
            c["same_group_as_last"] = bool(last and c["irac"] == last.get("irac"))
            c["field_acres"] = acres
            c["total_for_field"] = round(c["per_acre"] * acres, 2)
            c["water_volume_field_l"] = round(200 * acres)

        out.append({
            "pest": pest,
            "en_name": name_en,
            "kn_name": name_kn,
            "latin": kb["latin"],
            "why": kb["why"],
            "status": status,
            "reason": {"en": en, "kn": kn},
            "level": lvl,
            "catches_24h": g["c24"],
            "traps": g["traps"],
            "window": window,
            "non_chemical": kb["non_chemical"],
            "chemical": chem,
            "last_spray": last,
            "days_since_spray": round(days_since, 1) if days_since is not None else None,
        })

    order = {"spray": 0, "postpone": 1, "watch_spray": 2, "wait": 3, "non_chemical": 4, "none": 5}
    out.sort(key=lambda x: order.get(x["status"], 9))
    return {
        "pests": out,
        "safety": pests.SAFETY,
        "min_days_between": pests.MIN_DAYS_BETWEEN_SPRAYS,
        "spray_volume_l_per_acre": 200,
        "field_acres": acres,
        "weather": wx
    }


def spray_list(days=120, field_id=None):
    out = []
    for s in db.sprays(since_s=days * DAY, field_id=field_id):
        s = dict(s)
        if s.get("phi_days") is not None:
            s["safe_harvest_ts"] = s["ts"] + s["phi_days"] * DAY
        s["effect"] = spray_effect(s)
        kb = pests.PESTS.get(s["pest"])
        s["pest_en"], s["pest_kn"] = (kb["en"], kb["kn"]) if kb else (s["pest"], s["pest"])
        out.append(s)
    return out
