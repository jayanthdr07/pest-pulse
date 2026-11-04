/* PestPulse farmer app: talks to PestPulse Cloud (same server by default), falls back to demo data. */
(function () {
  "use strict";

  // ------------------------------------------------------------------ settings (per phone)
  const DEFAULTS = { server: "", token: "", lang: "en", voice: true, demo: false, notify: false };
  function loadSettings() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("pp_settings") || "{}") }; } catch (e) { return { ...DEFAULTS }; }
  }
  function saveSettings() {
    try { localStorage.setItem("pp_settings", JSON.stringify(S)); } catch (e) { /* private mode: keep in memory */ }
  }
  const S = loadSettings();
  if (window.PP_FORCE_DEMO) S.demo = true;
  const state = { demoActive: false, home: null, seenAlerts: null, timer: null };

  // ------------------------------------------------------------------ text (English / Kannada)
  const TXT = {
    en: {
      home: "Home", traps: "Traps", scan: "Scan", alerts: "Alerts", settings: "Settings",
      ai_today: "Today's AI suggestions", farm_risk: "Farm risk", new24: "New in 24 h", online: "Traps online",
      my_traps: "My traps", scan_card: "Scan a trap card", on_card: "on card", new_today: "new in 24 h",
      last_seen: "Last photo", signal: "Signal", interval: "Photo every", firmware: "Firmware", temp: "Temperature", hum: "Humidity",
      trend7: "New catches – last 7 days", trend24: "Last 24 hours", photos: "Recent AI photos", what_to_do: "What to do",
      trap_settings: "Trap settings", name: "Name", trap_type: "Trap type", save: "Save", saved: "Saved",
      offline: "Offline", live: "Live", no_traps: "No traps yet. Power on an ESP32-CAM node with your cloud URL and device key and it appears here by itself.",
      no_alerts: "No alerts. Traps are below the action level.", listen: "Listen", mark_done: "Mark done", done: "Done",
      take_photo: "Take or choose a photo", scan_hint: "Photograph a sticky card or pheromone liner flat, in good light, filling the frame.",
      count_now: "Count insects", counting: "Counting…", insects: "insects", result: "AI result",
      server: "Cloud server URL", server_hint: "Leave empty when the app is opened from your cloud address.",
      token: "App token (if set on the cloud)", language: "Language", voice: "Voice alerts", demo: "Demo data (no cloud)",
      notify: "Phone notifications", report: "Download 7-day report (CSV)", test: "Test connection",
      demo_banner: "Demo data – connect your cloud in Settings for live traps.", conn_ok: "Connected to cloud", conn_bad: "Cannot reach the cloud",
      outlook: "3-day pest outlook", min: "min", h: "h", ago: "ago", just_now: "just now", every: "every",
      LOW: "Low", MEDIUM: "Medium", HIGH: "High", wind: "Wind", rain6: "Rain (6 h)", feels: "Farm weather",
      sensor_wx: "From trap sensors", no_voice_kn: "No Kannada voice on this phone – reading in English.",
      new_per_day: "New insects per day", history: "History", spray: "Spray", spray_advisor: "Spray advisor", insect_history: "Insect history",
      total_caught: "Insects caught", avg_day: "Average / day", peak_day: "Peak day", vs_prev: "vs previous period",
      all_traps: "All traps", by_pest: "By pest", events: "Events", readings: "Every photo", show_more: "Show more",
      days_n: "days", time: "Time", trap: "Trap", risk: "Risk", spray_marker: "Spray",
      st_none: "No spray", st_non_chemical: "Non-chemical first", st_watch_spray: "Watch – spray tomorrow if high",
      st_spray: "Spray advised", st_postpone: "Postpone spray", st_wait: "Wait – last spray acting",
      first_no_chem: "First, without chemicals", if_spraying: "If spraying (sourced options)", per_l: "per litre",
      per_tank: "per 10 L tank", for_area: "for your", acres: "acres", area: "Your crop area (acres)", suggested: "Suggested next",
      same_group: "Same group as last spray – avoid", source: "Source", log_spray: "Log a spray", log_this: "Log this spray",
      spray_history: "Spray history", product: "Product", dose: "Dose", waiting: "Waiting days before harvest (from label)",
      date: "Date", notes: "Notes", pest: "Pest", other_product: "Other / bio-product", safe_harvest: "Safe to harvest from",
      dont_harvest: "Do not harvest before", effect: "Catches after spray", no_sprays: "No sprays logged yet.",
      delete: "Delete", safety: "Safety", disclaimer: "Advice only. Confirm with your agriculture officer / KVK and follow the product label.",
      last_spray: "Last spray", days_ago: "days ago", irac: "IRAC group", colour: "Label colour", watched_pest: "Pest watched",
      cancel: "Cancel", spray_card: "Spray today?", open_advisor: "Open spray advisor",
      new_alert: "New pest alert", species: { insect: "insects", moth: "moths", tuta: "Tuta moths", liriomyza: "leaf miners" },
    },
    kn: {
      home: "ಮುಖಪುಟ", traps: "ಬಲೆಗಳು", scan: "ಸ್ಕ್ಯಾನ್", alerts: "ಎಚ್ಚರಿಕೆಗಳು", settings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
      ai_today: "ಇಂದಿನ AI ಸಲಹೆಗಳು", farm_risk: "ಹೊಲದ ಅಪಾಯ", new24: "24 ಗಂಟೆಯಲ್ಲಿ ಹೊಸ", online: "ಆನ್‌ಲೈನ್ ಬಲೆಗಳು",
      my_traps: "ನನ್ನ ಬಲೆಗಳು", scan_card: "ಬಲೆ ಕಾರ್ಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ", on_card: "ಕಾರ್ಡ್‌ನಲ್ಲಿ", new_today: "24 ಗಂಟೆಯಲ್ಲಿ ಹೊಸ",
      last_seen: "ಕೊನೆಯ ಫೋಟೋ", signal: "ಸಿಗ್ನಲ್", interval: "ಫೋಟೋ ಪ್ರತಿ", firmware: "ಫರ್ಮ್‌ವೇರ್", temp: "ತಾಪಮಾನ", hum: "ತೇವಾಂಶ",
      trend7: "ಹೊಸ ಕೀಟಗಳು – ಕಳೆದ 7 ದಿನ", trend24: "ಕಳೆದ 24 ಗಂಟೆ", photos: "ಇತ್ತೀಚಿನ AI ಫೋಟೋಗಳು", what_to_do: "ಏನು ಮಾಡಬೇಕು",
      trap_settings: "ಬಲೆ ಸೆಟ್ಟಿಂಗ್ಸ್", name: "ಹೆಸರು", trap_type: "ಬಲೆಯ ಪ್ರಕಾರ", save: "ಉಳಿಸಿ", saved: "ಉಳಿಸಲಾಗಿದೆ",
      offline: "ಆಫ್‌ಲೈನ್", live: "ಲೈವ್", no_traps: "ಇನ್ನೂ ಬಲೆಗಳಿಲ್ಲ. ESP32-CAM ಆನ್ ಮಾಡಿದಾಗ ಇಲ್ಲಿ ತಾನಾಗಿ ಕಾಣಿಸುತ್ತದೆ.",
      no_alerts: "ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ. ಬಲೆಗಳು ಕ್ರಮದ ಮಟ್ಟಕ್ಕಿಂತ ಕೆಳಗಿವೆ.", listen: "ಕೇಳಿ", mark_done: "ಮುಗಿದಿದೆ", done: "ಮುಗಿದಿದೆ",
      take_photo: "ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಆರಿಸಿ", scan_hint: "ಅಂಟು ಕಾರ್ಡ್ ಅನ್ನು ಸಮತಟ್ಟಾಗಿ, ಒಳ್ಳೆಯ ಬೆಳಕಿನಲ್ಲಿ ಫೋಟೋ ತೆಗೆಯಿರಿ.",
      count_now: "ಕೀಟಗಳನ್ನು ಎಣಿಸಿ", counting: "ಎಣಿಸಲಾಗುತ್ತಿದೆ…", insects: "ಕೀಟಗಳು", result: "AI ಫಲಿತಾಂಶ",
      server: "ಕ್ಲೌಡ್ ಸರ್ವರ್ URL", server_hint: "ಕ್ಲೌಡ್ ವಿಳಾಸದಿಂದ ತೆರೆದಾಗ ಖಾಲಿ ಬಿಡಿ.",
      token: "ಆ್ಯಪ್ ಟೋಕನ್", language: "ಭಾಷೆ", voice: "ಧ್ವನಿ ಎಚ್ಚರಿಕೆ", demo: "ಡೆಮೊ ಡೇಟಾ",
      notify: "ಫೋನ್ ಅಧಿಸೂಚನೆ", report: "7 ದಿನದ ವರದಿ (CSV)", test: "ಸಂಪರ್ಕ ಪರೀಕ್ಷಿಸಿ",
      demo_banner: "ಡೆಮೊ ಡೇಟಾ – ಲೈವ್ ಬಲೆಗಳಿಗೆ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಕ್ಲೌಡ್ ಸೇರಿಸಿ.", conn_ok: "ಕ್ಲೌಡ್‌ಗೆ ಸಂಪರ್ಕವಾಗಿದೆ", conn_bad: "ಕ್ಲೌಡ್ ಸಿಗುತ್ತಿಲ್ಲ",
      outlook: "3 ದಿನದ ಕೀಟ ಮುನ್ಸೂಚನೆ", min: "ನಿ", h: "ಗಂ", ago: "ಹಿಂದೆ", just_now: "ಈಗ", every: "ಪ್ರತಿ",
      LOW: "ಕಡಿಮೆ", MEDIUM: "ಮಧ್ಯಮ", HIGH: "ಹೆಚ್ಚು", wind: "ಗಾಳಿ", rain6: "ಮಳೆ (6 ಗಂ)", feels: "ಹೊಲದ ಹವಾಮಾನ",
      sensor_wx: "ಬಲೆ ಸೆನ್ಸರ್‌ನಿಂದ", no_voice_kn: "ಈ ಫೋನ್‌ನಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಇಲ್ಲ – ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಓದುತ್ತಿದೆ.",
      new_per_day: "ದಿನಕ್ಕೆ ಹೊಸ ಕೀಟಗಳು", history: "ಇತಿಹಾಸ", spray: "ಸಿಂಪಡಣೆ", spray_advisor: "ಸಿಂಪಡಣೆ ಸಲಹೆಗಾರ", insect_history: "ಕೀಟಗಳ ಇತಿಹಾಸ",
      total_caught: "ಸಿಕ್ಕ ಕೀಟಗಳು", avg_day: "ದಿನಕ್ಕೆ ಸರಾಸರಿ", peak_day: "ಗರಿಷ್ಠ ದಿನ", vs_prev: "ಹಿಂದಿನ ಅವಧಿಗೆ ಹೋಲಿಸಿ",
      all_traps: "ಎಲ್ಲಾ ಬಲೆಗಳು", by_pest: "ಕೀಟವಾರು", events: "ಘಟನೆಗಳು", readings: "ಪ್ರತಿ ಫೋಟೋ", show_more: "ಇನ್ನಷ್ಟು",
      days_n: "ದಿನ", time: "ಸಮಯ", trap: "ಬಲೆ", risk: "ಅಪಾಯ", spray_marker: "ಸಿಂಪಡಣೆ",
      st_none: "ಸಿಂಪಡಣೆ ಬೇಡ", st_non_chemical: "ಮೊದಲು ರಾಸಾಯನಿಕವಲ್ಲದ ಕ್ರಮ", st_watch_spray: "ಗಮನಿಸಿ – ನಾಳೆಯೂ ಹೆಚ್ಚಿದ್ದರೆ ಸಿಂಪಡಿಸಿ",
      st_spray: "ಸಿಂಪಡಣೆ ಸಲಹೆ", st_postpone: "ಸಿಂಪಡಣೆ ಮುಂದೂಡಿ", st_wait: "ಕಾಯಿರಿ – ಹಿಂದಿನ ಸಿಂಪಡಣೆ ಕೆಲಸ ಮಾಡುತ್ತಿದೆ",
      first_no_chem: "ಮೊದಲು, ರಾಸಾಯನಿಕವಿಲ್ಲದೆ", if_spraying: "ಸಿಂಪಡಿಸುವುದಾದರೆ (ಆಧಾರಸಹಿತ ಆಯ್ಕೆಗಳು)", per_l: "ಲೀಟರಿಗೆ",
      per_tank: "10 ಲೀ ಟ್ಯಾಂಕಿಗೆ", for_area: "ನಿಮ್ಮ", acres: "ಎಕರೆ", area: "ನಿಮ್ಮ ಬೆಳೆ ವಿಸ್ತೀರ್ಣ (ಎಕರೆ)", suggested: "ಮುಂದಿನ ಸಲಹೆ",
      same_group: "ಹಿಂದಿನ ಸಿಂಪಡಣೆಯ ಗುಂಪು – ಬೇಡ", source: "ಆಧಾರ", log_spray: "ಸಿಂಪಡಣೆ ದಾಖಲಿಸಿ", log_this: "ಇದನ್ನು ದಾಖಲಿಸಿ",
      spray_history: "ಸಿಂಪಡಣೆ ಇತಿಹಾಸ", product: "ಔಷಧಿ", dose: "ಪ್ರಮಾಣ", waiting: "ಕೊಯ್ಲಿಗೆ ಮೊದಲು ಕಾಯುವ ದಿನಗಳು (ಲೇಬಲ್)",
      date: "ದಿನಾಂಕ", notes: "ಟಿಪ್ಪಣಿ", pest: "ಕೀಟ", other_product: "ಇತರೆ / ಜೈವಿಕ ಔಷಧಿ", safe_harvest: "ಕೊಯ್ಲಿಗೆ ಸುರಕ್ಷಿತ",
      dont_harvest: "ಇದಕ್ಕೂ ಮೊದಲು ಕೊಯ್ಲು ಬೇಡ", effect: "ಸಿಂಪಡಣೆ ನಂತರ ಕೀಟಗಳು", no_sprays: "ಇನ್ನೂ ಸಿಂಪಡಣೆ ದಾಖಲಾಗಿಲ್ಲ.",
      delete: "ಅಳಿಸಿ", safety: "ಸುರಕ್ಷತೆ", disclaimer: "ಇದು ಸಲಹೆ ಮಾತ್ರ. ಕೃಷಿ ಅಧಿಕಾರಿ / KVK ಅವರನ್ನು ಕೇಳಿ, ಲೇಬಲ್ ಪಾಲಿಸಿ.",
      last_spray: "ಕೊನೆಯ ಸಿಂಪಡಣೆ", days_ago: "ದಿನಗಳ ಹಿಂದೆ", irac: "IRAC ಗುಂಪು", colour: "ಲೇಬಲ್ ಬಣ್ಣ", watched_pest: "ಗಮನಿಸುವ ಕೀಟ",
      cancel: "ರದ್ದು", spray_card: "ಇಂದು ಸಿಂಪಡಿಸಬೇಕೇ?", open_advisor: "ಸಿಂಪಡಣೆ ಸಲಹೆಗಾರ ತೆರೆಯಿರಿ",
      new_alert: "ಹೊಸ ಕೀಟ ಎಚ್ಚರಿಕೆ", species: { insect: "ಕೀಟಗಳು", moth: "ಪತಂಗಗಳು", tuta: "ಟ್ಯೂಟಾ", liriomyza: "ಎಲೆ ಸುರಂಗ ಕೀಟ" },
    },
  };
  const t = (k) => (TXT[S.lang] && TXT[S.lang][k]) ?? TXT.en[k] ?? k;
  const pick = (o) => (S.lang === "kn" ? o.kn || o.en : o.en);

  // ------------------------------------------------------------------ icons
  const P = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    traps: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    scan: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3.5"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>',
    wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>',
    bug: '<rect x="8" y="7" width="8" height="12" rx="4"/><path d="M12 7V4M9 4l1.5 3M15 4l-1.5 3M4 12h4M16 12h4M5 18l3-2M19 18l-3-2M5 6l3 2M19 6l-3 2"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    card: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    rain: '<path d="M7 15a4 4 0 0 1-.5-8A6 6 0 0 1 18 8a3.5 3.5 0 0 1 0 7z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
    spray: '<path d="M9 9h6v12H9z"/><path d="M10 9V6h4v3M14 6h3M19 4v1M19 7v1M21 5.5h-1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', speaker: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>', therm: '<path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19 14 10"/>', signal: '<path d="M4 20v-3M9 20v-7M14 20v-11M19 20V5"/>',
  };
  const ic = (n, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${P[n] || P.leaf}</svg>`;

  // ------------------------------------------------------------------ helpers
  const $app = document.getElementById("app");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const base = () => (S.server || "").replace(/\/+$/, "");
  const imgUrl = (n) => (!n ? "" : n.startsWith("data:") || n.startsWith("http") ? n : `${base()}/img/${encodeURIComponent(n)}${S.token ? `?t=${encodeURIComponent(S.token)}` : ""}`);
  const ago = (ts) => {
    if (!ts) return "—";
    const s = Date.now() / 1000 - ts;
    if (s < 60) return t("just_now");
    if (s < 3600) return `${Math.round(s / 60)} ${t("min")} ${t("ago")}`;
    if (s < 86400) return `${Math.round(s / 3600)} ${t("h")} ${t("ago")}`;
    return new Date(ts * 1000).toLocaleDateString(S.lang === "kn" ? "kn-IN" : "en-IN", { day: "numeric", month: "short" });
  };
  const riskPill = (r, off) => `<span class="risk-pill r-${off ? "OFF" : r}">${off ? t("offline") : t(r)}</span>`;
  const sp = (s) => (t("species")[s] || s);
  const every = (sec) => (sec >= 3600 ? `${(sec / 3600).toFixed(sec % 3600 ? 1 : 0)} ${t("h")}` : `${Math.round(sec / 60)} ${t("min")}`);
  function toast(msg, ms = 2600) {
    const el = document.getElementById("toast");
    el.textContent = msg; el.classList.add("show");
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), ms);
  }

  // ------------------------------------------------------------------ API (cloud, or demo fallback)
  async function http(path, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (S.token) headers.Authorization = `Bearer ${S.token}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeout || 12000);
    try {
      const r = await fetch(base() + path, { ...opts, headers, signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    } finally { clearTimeout(timer); }
  }
  const forcedDemo = () => S.demo || (!/^https?:$/.test(location.protocol) && !S.server);
  const useDemo = () => forcedDemo() || state.demoActive;
  const API = {
    async home() {
      if (forcedDemo()) { state.demoActive = true; return DemoAPI.home(); }
      try { const d = await http("/api/v1/home"); state.demoActive = false; return d; }
      catch (e) { console.warn("cloud unreachable, using demo", e); state.demoActive = true; return DemoAPI.home(); }
    },
    trap: (n) => (useDemo() ? DemoAPI.trap(n) : http(`/api/v1/traps/${encodeURIComponent(n)}`)),
    patchTrap: (n, b) => (useDemo() ? DemoAPI.patchTrap(n, b) : http(`/api/v1/traps/${encodeURIComponent(n)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })),
    alerts: () => (useDemo() ? DemoAPI.alerts() : http("/api/v1/alerts")),
    patchAlert: (id, b) => (useDemo() ? DemoAPI.patchAlert(id, b) : http(`/api/v1/alerts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })),
    history: (days, node) => (useDemo() ? DemoAPI.history(days, node) : http(`/api/v1/history?days=${days}${node ? `&node=${encodeURIComponent(node)}` : ""}`)),
    advice: () => (useDemo() ? DemoAPI.advice() : http("/api/v1/spray/advice")),
    sprays: () => (useDemo() ? DemoAPI.sprays() : http("/api/v1/sprays")),
    addSpray: (b) => (useDemo() ? DemoAPI.addSpray(b) : http("/api/v1/sprays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })),
    delSpray: (id) => (useDemo() ? DemoAPI.delSpray(id) : http(`/api/v1/sprays/${id}`, { method: "DELETE" })),
    scan: (file, trap) => (useDemo() ? DemoAPI.scan(file, trap) : http(`/api/v1/scan?trap=${trap}`, { method: "POST", headers: { "Content-Type": file.type || "image/jpeg" }, body: file, timeout: 60000 })),
  };

  // ------------------------------------------------------------------ voice
  function speak(text) {
    if (!("speechSynthesis" in window)) return toast("Voice not supported on this browser");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    if (S.lang === "kn") {
      const v = voices.find((x) => /^kn/i.test(x.lang));
      if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = "kn-IN"; if (voices.length) toast(t("no_voice_kn")); }
    } else {
      const v = voices.find((x) => x.lang === "en-IN") || voices.find((x) => /^en/i.test(x.lang));
      if (v) u.voice = v; u.lang = (v && v.lang) || "en-IN";
    }
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }

  // ------------------------------------------------------------------ chrome (top bar + nav)
  function topbar(title, sub, left) {
    const unread = state.home ? state.home.unread_alerts : 0;
    return `<header class="topbar">
      ${left || `<div class="brand"><div class="logo">${ic("leaf")}</div></div>`}
      <div class="grow"><div class="h2 ellipsis">${esc(title)}</div>${sub ? `<div class="small muted ellipsis">${esc(sub)}</div>` : ""}</div>
      <button class="lang-btn" data-act="lang">${S.lang === "kn" ? "EN" : "ಕನ್ನಡ"}</button>
      <a class="icon-btn badge-dot" href="#/alerts" ${unread ? `data-n="${unread}"` : ""} aria-label="${t("alerts")}">${ic("bell")}</a>
      <a class="icon-btn" href="#/settings" aria-label="${t("settings")}">${ic("gear")}</a>
    </header>`;
  }
  function nav(active) {
    const items = [["home", "#/home", "home"], ["traps", "#/traps", "traps"], ["history", "#/history", "chart"], ["spray", "#/spray", "spray"], ["alerts", "#/alerts", "bell"]];
    document.getElementById("nav").innerHTML = items.map(([k, h, i]) => `<a href="${h}" class="${active === k ? "on" : ""}" aria-label="${t(k)}">${ic(i)}</a>`).join("");
  }
  const demoBanner = () => (state.demoActive ? `<div class="banner mt">${t("demo_banner")}</div>` : "");
  const loading = () => `<div class="empty"><div class="spin" style="margin:40px auto"></div></div>`;

  // ------------------------------------------------------------------ charts
  function bars(daily) {
    const W = 340, Hh = 150, max = Math.max(1, ...daily.map((d) => d.new)), bw = W / daily.length;
    return `<svg class="chart" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" role="img" aria-label="${t("trend7")}">
      ${daily.map((d, i) => {
        const h = Math.max(3, (d.new / max) * (Hh - 42)), x = i * bw + bw * 0.22, w = bw * 0.56, y = Hh - 22 - h, last = i === daily.length - 1;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(10, w / 2)}" fill="${last ? "#c6ec7a" : "rgba(255,255,255,.28)"}"/>
          <text x="${x + w / 2}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="${last ? "#c6ec7a" : "rgba(242,247,238,.75)"}">${d.new}</text>
          <text x="${x + w / 2}" y="${Hh - 6}" text-anchor="middle" font-size="10.5" fill="rgba(242,247,238,.55)">${esc(d.day)}</text>`;
      }).join("")}
    </svg>`;
  }
  function spark(arr, stroke = "#c6ec7a") {
    const W = 340, Hh = 70, max = Math.max(1, ...arr), step = W / (arr.length - 1 || 1);
    const pts = arr.map((v, i) => `${(i * step).toFixed(1)},${(Hh - 8 - (v / max) * (Hh - 16)).toFixed(1)}`);
    return `<svg class="chart" style="height:70px" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" role="img" aria-label="${t("trend24")}">
      <polygon points="0,${Hh} ${pts.join(" ")} ${W},${Hh}" fill="rgba(198,236,122,.14)"/>
      <polyline points="${pts.join(" ")}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  }

  // ------------------------------------------------------------------ screens
  async function viewHome() {
    nav("home");
    if (!state.home) $app.innerHTML = topbar("PestPulse") + loading();
    const d = await API.home();
    state.home = d;
    checkNewAlerts(d);
    const w = d.weather, c = d.climate;
    const temp = w ? w.temp : c ? c.temp : null, hum = w ? w.hum : c ? c.hum : null;
    const cond = w ? pick({ en: w.cond, kn: w.cond_kn }) : c ? t("sensor_wx") : "—";
    const today = new Date().toLocaleDateString(S.lang === "kn" ? "kn-IN" : "en-IN", { weekday: "long", day: "numeric", month: "short" });
    $app.innerHTML = `${topbar(d.farm.name, d.farm.place)}
      <section class="hero fade-in">
        <div class="small muted">${esc(today)} · ${esc(d.farm.crop || "")}</div>
        <div class="row between" style="align-items:flex-end">
          <div class="temp">${temp != null ? Math.round(temp) : "--"}<sup>°C</sup></div>
          <div style="text-align:right;padding-bottom:12px"><div class="small muted">${t("farm_risk")}</div><div style="margin-top:6px">${riskPill(d.overall)}</div></div>
        </div>
        <div class="h2" style="font-weight:600">${esc(cond)}</div>
        <div class="chips mt">
          ${hum != null ? `<span class="chip">${ic("drop")} ${Math.round(hum)}%</span>` : ""}
          ${w ? `<span class="chip">${ic("wind")} ${Math.round(w.wind)} km/h</span><span class="chip">${ic("rain")} ${t("rain6")} ${w.rain_prob_6h}%</span>` : ""}
        </div>
        ${demoBanner()}
      </section>
      <div class="tiles fade-in">
        <div class="tile glass"><div class="num">${d.catches_24h}</div><div class="lbl">${t("new24")}</div></div>
        <div class="tile glass"><div class="num">${d.online}/${d.traps.length}</div><div class="lbl">${t("online")}</div></div>
        <div class="tile glass"><div class="num">${d.unread_alerts}</div><div class="lbl">${t("alerts")}</div></div>
      </div>
      <section class="glass pad mt fade-in">
        <div class="row between" style="margin-bottom:12px"><div class="h2">${t("ai_today")}</div>${ic("leaf")}</div>
        ${d.suggestions.map((s) => `<a class="sugg t-${s.tone}" href="${s.node ? `#/trap/${encodeURIComponent(s.node)}` : "#/home"}" style="text-decoration:none">
            <div class="ic">${ic(s.icon)}</div><div class="txt">${esc(pick(s))}</div>
            <button class="go" data-say="${esc(pick(s))}" aria-label="${t("listen")}">${ic("speaker")}</button></a>`).join("")}
      </section>
      ${d.spray ? `<a class="glass pad mt fade-in" href="#/spray" style="display:block;text-decoration:none">
        <div class="row between"><div class="row"><div class="sugg-ic" style="width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:rgba(159,211,230,.2)">${ic("spray")}</div><div class="h2">${t("spray_card")}</div></div>
          <span class="risk-pill r-${{ spray: "HIGH", postpone: "MEDIUM", watch_spray: "MEDIUM", wait: "OFF", non_chemical: "LOW", none: "LOW" }[d.spray.status]}">${t("st_" + d.spray.status)}</span></div>
        <div style="margin-top:10px;font-weight:600;font-size:14.5px;line-height:1.45">${esc(pick(d.spray.reason))}</div>
        <div class="small" style="margin-top:8px;color:var(--lime)">${t("open_advisor")} ›</div></a>` : ""}
      ${d.outlook ? `<section class="glass pad mt fade-in"><div class="row between"><div class="small muted">${t("outlook")}</div>${riskPill(d.outlook.level)}</div>
        <div style="margin-top:8px;font-weight:600;font-size:14.5px">${esc(pick(d.outlook))}</div></section>` : ""}
      <div class="section-title"><div class="h2">${t("my_traps")}</div><a class="small muted" href="#/traps">${t("traps")} ›</a></div>
      <div class="stack">${d.traps.slice(0, 3).map(trapCard).join("") || `<div class="glass empty">${t("no_traps")}</div>`}</div>`;
  }

  function trapCard(x) {
    return `<a class="trap-card glass fade-in" href="#/trap/${encodeURIComponent(x.node)}">
      ${x.thumb ? `<img class="ph" src="${imgUrl(x.thumb)}" alt="AI photo of ${esc(x.name)}" loading="lazy">` : `<div class="ph"></div>`}
      <div class="body">
        <div><div class="row between"><div class="h2 ellipsis">${esc(x.name)}</div>${riskPill(x.risk, !x.online)}</div>
          <div class="small muted ellipsis" style="margin-top:3px">${esc(x.trap_label)} · ${ago(x.last_seen)}</div></div>
        <div class="mini-chips">
          <span class="mini">${ic("bug", "")} ${x.catches_24h} ${t("new_today")}</span>
          <span class="mini">${x.total ?? 0} ${t("on_card")}</span>
          ${x.temp != null ? `<span class="mini">${Math.round(x.temp)}° · ${Math.round(x.hum)}%</span>` : ""}
        </div>
      </div></a>`;
  }

  async function viewTraps() {
    nav("traps");
    $app.innerHTML = topbar(t("my_traps")) + loading();
    const d = state.home && Date.now() / 1000 - state.home.server_time < 30 ? state.home : await API.home();
    state.home = d;
    $app.innerHTML = `${topbar(t("my_traps"), `${d.online}/${d.traps.length} ${t("online").toLowerCase()}`)}
      ${demoBanner()}
      <div class="stack mt">${d.traps.map(trapCard).join("") || `<div class="glass empty">${t("no_traps")}</div>`}</div>
      <a class="btn primary block mt" href="#/scan">${ic("camera")} ${t("scan_card")}</a>`;
    fixIcons();
  }

  async function viewTrap(node) {
    nav("traps");
    $app.innerHTML = loading();
    const x = await API.trap(node);
    let sel = 0;
    const draw = () => {
      const ph = x.photos[sel] || {};
      $app.innerHTML = `<div class="photo-hero">
          <img src="${imgUrl(ph.annotated || x.image)}" alt="AI-annotated trap photo">
          <div class="over top"><a class="icon-btn" href="#/traps" aria-label="back">${ic("back")}</a>${riskPill(x.risk, !x.online)}</div>
          <div class="over bottom"><div class="h1">${esc(x.name)}</div>
            <div class="small muted">${esc(x.trap_label)} · ${ph.ts ? ago(ph.ts) : ago(x.last_seen)} · AI: ${esc(x.engine || "—")}</div></div>
        </div>
        <section class="glass pad mt fade-in">
          <div class="row between">
            <div><div class="big-num">${x.catches_24h}<small>${t("new_today")}</small></div>
              <div class="small muted" style="margin-top:6px">${t("MEDIUM")} ≥ ${x.medium} · ${t("HIGH")} ≥ ${x.high}</div></div>
            <div style="text-align:right"><div class="h1">${ph.total ?? x.total ?? 0}</div><div class="small muted">${t("on_card")}</div></div>
          </div>
          <div class="small muted mt">${t("trend24")}</div>${spark(x.trend)}
        </section>
        <section class="glass pad mt fade-in"><div class="h2" style="margin-bottom:8px">${t("trend7")}</div>${bars(x.daily)}</section>
        <section class="glass pad mt fade-in"><div class="h2" style="margin-bottom:10px">${t("photos")}</div>
          <div class="thumbs">${x.photos.map((p, i) => `<img src="${imgUrl(p.thumb || p.annotated)}" data-sel="${i}" class="${i === sel ? "sel" : ""}" alt="photo ${i + 1}">`).join("")}</div></section>
        <section class="kv mt fade-in">
          <div class="glass"><div class="k">${t("last_seen")}</div><div class="v">${ago(x.last_seen)}</div></div>
          <div class="glass"><div class="k">${t("signal")}</div><div class="v">${x.rssi != null ? `${x.rssi} dBm` : "—"}</div></div>
          <div class="glass"><div class="k">${t("temp")} / ${t("hum")}</div><div class="v">${x.temp != null ? `${x.temp}° / ${Math.round(x.hum)}%` : "—"}</div></div>
          <div class="glass"><div class="k">${t("interval")}</div><div class="v">${every(x.interval_s)}</div></div>
        </section>
        <section class="glass pad mt fade-in"><div class="row between"><div class="h2">${t("what_to_do")}</div>
          <button class="chip" data-say="${esc(x.steps.map(pick).join(". "))}">${ic("speaker")} ${t("listen")}</button></div>
          <div class="mt">${x.steps.map((s) => `<div class="check"><div class="box">${ic("check")}</div><div class="t">${esc(pick(s))}</div></div>`).join("")}</div></section>
        <section class="glass pad mt fade-in stack"><div class="h2">${t("trap_settings")}</div>
          <div class="field"><label>${t("name")}</label><input class="input" id="f-name" value="${esc(x.name)}" maxlength="24"></div>
          <div class="field"><label>${t("trap_type")}</label><select class="input" id="f-type">${Object.entries(x.trap_types).map(([k, v]) => `<option value="${k}" ${k === x.trap ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></div>
          ${x.pest_types ? `<div class="field"><label>${t("watched_pest")}</label><select class="input" id="f-pest">${Object.entries(x.pest_types).map(([k, v]) => `<option value="${k}" ${k === x.pest ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></div>` : ""}
          <div class="field"><label>${t("interval")}</label><select class="input" id="f-int">${[60, 300, 900, 1800, 3600, 7200].map((s) => `<option value="${s}" ${s === x.interval_s ? "selected" : ""}>${every(s)}</option>`).join("")}</select></div>
          <button class="btn primary block" id="f-save">${t("save")}</button>
          <div class="tiny faint">${t("firmware")}: ${esc(x.fw || "—")} · ID: ${esc(x.node)}</div></section>`;
      $app.querySelectorAll("[data-sel]").forEach((el) => el.addEventListener("click", () => { sel = +el.dataset.sel; draw(); window.scrollTo({ top: 0, behavior: "smooth" }); }));
      document.getElementById("f-save").addEventListener("click", async () => {
        try {
          await API.patchTrap(x.node, { name: document.getElementById("f-name").value, trap: document.getElementById("f-type").value, pest: (document.getElementById("f-pest") || {}).value, interval_s: +document.getElementById("f-int").value });
          toast(t("saved")); state.home = null;
        } catch (e) { toast(t("conn_bad")); }
      });
    };
    draw();
  }

  async function viewAlerts() {
    nav("alerts");
    $app.innerHTML = topbar(t("alerts")) + loading();
    const list = await API.alerts();
    const draw = () => {
      $app.innerHTML = `${topbar(t("alerts"))}${demoBanner()}
        <div class="stack mt">${list.length ? list.map((a) => `
          <article class="glass pad alert-card ${a.level} ${a.acked ? "acked" : ""} fade-in">
            <div class="row between"><div class="small muted">${ago(a.ts)}</div>${riskPill(a.level)}</div>
            <div class="h2" style="margin-top:8px">${esc(pick({ en: a.title_en, kn: a.title_kn }))}</div>
            <div class="muted" style="margin-top:4px;font-size:14px;line-height:1.45">${esc(pick({ en: a.body_en, kn: a.body_kn }))}</div>
            ${a.image ? `<img src="${imgUrl(a.image.replace("_ai.jpg", "_ai_t.jpg"))}" alt="trap photo" style="width:100%;height:150px;object-fit:cover;border-radius:16px;margin-top:12px" loading="lazy">` : ""}
            <div class="mt">${a.steps.map((s, i) => `<div class="check ${a.done.includes(i) ? "done" : ""}" data-alert="${a.id}" data-step="${i}" role="checkbox" aria-checked="${a.done.includes(i)}">
              <div class="box">${ic("check")}</div><div class="t">${esc(pick(s))}</div></div>`).join("")}</div>
            <div class="row mt">
              <button class="btn grow" data-say="${esc(pick({ en: a.title_en + ". " + a.body_en, kn: a.title_kn + ". " + a.body_kn }) + ". " + a.steps.map(pick).join(". "))}">${ic("speaker")} ${t("listen")}</button>
              <button class="btn primary grow" data-ack="${a.id}" ${a.acked ? "disabled" : ""}>${ic("check")} ${a.acked ? t("done") : t("mark_done")}</button>
            </div></article>`).join("") : `<div class="glass empty">${t("no_alerts")}</div>`}</div>`;
      $app.querySelectorAll("[data-step]").forEach((el) => el.addEventListener("click", async () => {
        const a = list.find((z) => z.id === +el.dataset.alert), i = +el.dataset.step;
        a.done = a.done.includes(i) ? a.done.filter((z) => z !== i) : [...a.done, i];
        draw();
        try { await API.patchAlert(a.id, { done: a.done }); } catch (e) { toast(t("conn_bad")); }
      }));
      $app.querySelectorAll("[data-ack]").forEach((el) => el.addEventListener("click", async () => {
        const a = list.find((z) => z.id === +el.dataset.ack);
        a.acked = 1; if (state.home) state.home.unread_alerts = Math.max(0, state.home.unread_alerts - 1);
        draw();
        try { await API.patchAlert(a.id, { acked: true }); } catch (e) { toast(t("conn_bad")); }
      }));
    };
    draw();
  }

  function viewScan() {
    nav("traps");
    let file = null;
    $app.innerHTML = `${topbar(t("scan_card"))}${demoBanner()}
      <section class="glass pad mt stack fade-in">
        <label class="drop" id="drop"><input type="file" accept="image/*" capture="environment" id="pick" hidden>
          <div><div class="cam">${ic("camera")}</div><div class="h2">${t("take_photo")}</div><div class="small muted" style="margin-top:6px">${t("scan_hint")}</div></div></label>
        <div class="field"><label>${t("trap_type")}</label><select class="input" id="s-type">
          <option value="sticky_yellow">Yellow sticky card</option><option value="pheromone">Pheromone trap</option>
          <option value="tuta_delta">Tuta delta trap</option><option value="lirio_sticky">Liriomyza sticky card</option></select></div>
        <button class="btn primary block" id="s-go" disabled>${ic("scan")} ${t("count_now")}</button>
      </section><div id="s-out"></div>`;
    const pickEl = document.getElementById("pick"), go = document.getElementById("s-go");
    pickEl.addEventListener("change", () => {
      file = pickEl.files[0]; if (!file) return;
      const u = URL.createObjectURL(file);
      document.getElementById("drop").insertAdjacentHTML("beforeend", `<img src="${u}" alt="your photo">`);
      go.disabled = false;
    });
    go.addEventListener("click", async () => {
      go.disabled = true; go.innerHTML = `<div class="spin"></div> ${t("counting")}`;
      try {
        const r = await API.scan(file, document.getElementById("s-type").value);
        document.getElementById("s-out").innerHTML = `<section class="glass pad mt fade-in">
          <div class="row between"><div class="h2">${t("result")}</div>${riskPill(r.level_if_24h)}</div>
          <div class="big-num" style="margin:10px 0">${r.total}<small>${t("insects")}</small></div>
          <img src="${imgUrl(r.annotated)}" alt="AI-annotated scan" style="width:100%;border-radius:16px">
          <div class="small muted mt">${esc(r.trap_label)} · AI: ${esc(r.engine)}${r.card_found ? "" : " · card not found – retake closer"}</div>
          <div class="small faint" style="margin-top:6px">${esc(r.note)}</div></section>`;
        document.getElementById("s-out").scrollIntoView({ behavior: "smooth" });
      } catch (e) { toast(t("conn_bad")); }
      go.disabled = false; go.innerHTML = `${ic("scan")} ${t("count_now")}`;
    });
  }

  function viewSettings() {
    nav("");
    const sw = (k) => `<button class="switch ${S[k] ? "on" : ""}" data-sw="${k}" role="switch" aria-checked="${!!S[k]}" aria-label="${t(k)}"></button>`;
    $app.innerHTML = `${topbar(t("settings"), "", `<a class="icon-btn" href="#/home" aria-label="back">${ic("back")}</a>`)}
      <section class="glass pad stack fade-in">
        <div class="field"><label>${t("server")}</label><input class="input" id="st-server" placeholder="https://your-app.onrender.com" value="${esc(S.server)}" inputmode="url" autocomplete="off">
          <div class="tiny faint">${t("server_hint")}</div></div>
        <div class="field"><label>${t("token")}</label><input class="input" id="st-token" value="${esc(S.token)}" autocomplete="off"></div>
        <div class="row"><button class="btn grow" id="st-test">${ic("wifi")} ${t("test")}</button><button class="btn primary grow" id="st-save">${t("save")}</button></div>
      </section>
      <section class="glass pad stack mt fade-in">
        <div class="row between"><div>${t("language")}</div><div class="tabs" style="width:170px"><button class="${S.lang === "en" ? "on" : ""}" data-lang="en">English</button><button class="${S.lang === "kn" ? "on" : ""}" data-lang="kn">ಕನ್ನಡ</button></div></div>
        <div class="row between"><div>${t("voice")}</div>${sw("voice")}</div>
        <div class="row between"><div>${t("notify")}</div>${sw("notify")}</div>
        <div class="row between"><div>${t("demo")}</div>${sw("demo")}</div>
      </section>
      <a class="btn block mt" id="st-report" href="${base()}/api/v1/report.csv?days=7${S.token ? `&t=${encodeURIComponent(S.token)}` : ""}">${ic("download")} ${t("report")}</a>
      <p class="tiny faint" style="text-align:center;margin-top:18px">PestPulse · Team Prime Minds · CHIP TO CROP PS1</p>`;
    document.getElementById("st-save").addEventListener("click", () => {
      S.server = document.getElementById("st-server").value.trim(); S.token = document.getElementById("st-token").value.trim();
      state.demoActive = false; state.home = null; saveSettings(); toast(t("saved"));
    });
    document.getElementById("st-test").addEventListener("click", async () => {
      const old = { ...S };
      S.server = document.getElementById("st-server").value.trim(); S.token = document.getElementById("st-token").value.trim();
      try { const h = await http("/api/v1/health"); toast(`${t("conn_ok")} · ${h.devices} ${t("traps").toLowerCase()}`); }
      catch (e) { toast(`${t("conn_bad")} (${e.message})`); }
      Object.assign(S, old);
    });
    $app.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
    $app.querySelectorAll("[data-sw]").forEach((b) => b.addEventListener("click", async () => {
      const k = b.dataset.sw; S[k] = !S[k];
      if (k === "notify" && S[k] && "Notification" in window && Notification.permission !== "granted") {
        const p = await Notification.requestPermission(); if (p !== "granted") S[k] = false;
      }
      if (k === "demo") { state.demoActive = S.demo; state.home = null; }
      saveSettings(); viewSettings();
    }));
  }

  // ------------------------------------------------------------------ history
  const TRAP_COLORS = ["#c6ec7a", "#9fd3e6", "#f2c14e", "#ff9f80", "#c9a7ff", "#7fe0c0"];
  const fmtDay = (ts) => new Date(ts * 1000).toLocaleDateString(S.lang === "kn" ? "kn-IN" : "en-IN", { day: "numeric", month: "short" });
  const fmtTime = (ts) => new Date(ts * 1000).toLocaleString(S.lang === "kn" ? "kn-IN" : "en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  function stackChart(h) {
    const W = 340, Hh = 190, top = 18, bottom = 26, n = h.days, bw = W / n;
    const tot = h.labels.map((_, i) => h.series.reduce((a, s) => a + s.values[i], 0));
    const max = Math.max(1, ...tot);
    let bars = "";
    for (let i = 0; i < n; i++) {
      let y = Hh - bottom;
      h.series.forEach((s, k) => {
        const v = s.values[i]; if (!v) return;
        const hh = (v / max) * (Hh - top - bottom);
        y -= hh;
        bars += `<rect x="${(i * bw + bw * 0.15).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${hh.toFixed(1)}" fill="${TRAP_COLORS[k % 6]}" opacity=".9"/>`;
      });
    }
    const marks = h.sprays.filter((s) => s.day_index >= 0 && s.day_index < n).map((s) => {
      const x = (s.day_index * bw + bw / 2).toFixed(1);
      return `<line x1="${x}" x2="${x}" y1="${top - 6}" y2="${Hh - bottom}" stroke="#ffffff" stroke-dasharray="3 3" stroke-width="1.2" opacity=".75"/>
        <circle cx="${x}" cy="${top - 8}" r="6" fill="#0d1f14" stroke="#fff" stroke-width="1.2"/><text x="${x}" y="${top - 4.5}" text-anchor="middle" font-size="8" font-weight="800" fill="#fff">S</text>`;
    }).join("");
    const step = Math.ceil(n / 6);
    const xl = h.labels.map((l, i) => (i % step === 0 || i === n - 1) && !(i !== n - 1 && n - 1 - i < step / 2)
      ? `<text x="${i === 0 ? 1 : i === n - 1 ? W - 1 : (i * bw + bw / 2).toFixed(1)}" y="${Hh - 8}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}" font-size="9.5" fill="rgba(242,247,238,.55)">${esc(l)}</text>` : "").join("");
    const grid = [0.5, 1].map((f) => { const y = Hh - bottom - f * (Hh - top - bottom); return `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.08)"/><text x="${W}" y="${y - 3}" text-anchor="end" font-size="9" fill="rgba(242,247,238,.45)">${Math.round(max * f)}</text>`; }).join("");
    return `<svg class="chart" style="height:190px" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" role="img" aria-label="${t("insect_history")}">${grid}${bars}${marks}${xl}</svg>`;
  }

  async function viewHistory() {
    nav("history");
    const st = (state.hist ||= { days: 30, node: "", more: false });
    $app.innerHTML = topbar(t("insect_history")) + loading();
    const h = await API.history(st.days, st.node);
    const traps = (state.home && state.home.traps) || [];
    const sm = h.summary;
    const chg = sm.change_pct;
    const evIcon = { alert: "bell", spray: "spray", card: "card" };
    const log = st.more ? h.log : h.log.slice(0, 25);
    $app.innerHTML = `${topbar(t("insect_history"), `${h.days} ${t("days_n")}`)}${demoBanner()}
      <div class="tabs mt">${[7, 30, 90].map((d) => `<button class="${st.days === d ? "on" : ""}" data-days="${d}">${d} ${t("days_n")}</button>`).join("")}</div>
      <select class="input mt" id="h-node" aria-label="${t("trap")}"><option value="">${t("all_traps")}</option>${traps.map((x) => `<option value="${esc(x.node)}" ${st.node === x.node ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
      <div class="kv mt">
        <div class="glass"><div class="k">${t("total_caught")}</div><div class="v" style="font-size:22px">${sm.total}</div></div>
        <div class="glass"><div class="k">${t("avg_day")}</div><div class="v" style="font-size:22px">${sm.avg_per_day}</div></div>
        <div class="glass"><div class="k">${t("peak_day")}</div><div class="v">${sm.peak_day ? `${esc(sm.peak_day)} · ${sm.peak_value}` : "—"}</div></div>
        <div class="glass"><div class="k">${t("vs_prev")}</div><div class="v" style="color:${chg == null ? "inherit" : chg > 0 ? "var(--high)" : "var(--low)"}">${chg == null ? "—" : `${chg > 0 ? "▲" : "▼"} ${Math.abs(chg)}%`}</div></div>
      </div>
      <section class="glass pad mt fade-in">
        <div class="row between"><div class="h2">${t("new_per_day")}</div><span class="chip"><b>S</b> = ${t("spray_marker")}</span></div>
        ${stackChart(h)}
        <div class="row" style="flex-wrap:wrap;gap:10px;margin-top:6px">${h.series.map((s, k) => `<span class="small"><span class="dot" style="background:${TRAP_COLORS[k % 6]}"></span> ${esc(s.name)} · ${s.total}</span>`).join("")}</div>
      </section>
      ${h.by_pest.length ? `<section class="glass pad mt fade-in"><div class="h2" style="margin-bottom:10px">${t("by_pest")}</div>
        ${h.by_pest.map((p) => { const w = Math.max(4, (100 * p.total) / Math.max(1, h.by_pest[0].total)); return `<div style="margin:8px 0"><div class="row between small"><span>${esc(pick(p))}</span><b>${p.total}</b></div>
          <div style="height:8px;border-radius:4px;background:rgba(255,255,255,.1);margin-top:5px"><div style="width:${w}%;height:100%;border-radius:4px;background:var(--lime)"></div></div></div>`; }).join("")}</section>` : ""}
      <section class="glass pad mt fade-in"><div class="h2" style="margin-bottom:6px">${t("events")}</div>
        ${h.events.length ? h.events.slice(0, 20).map((e) => `<div class="check"><div class="sugg-ic" style="width:32px;height:32px;border-radius:50%;display:grid;place-items:center;flex:none;background:${e.type === "alert" ? "rgba(255,122,89,.22)" : e.type === "spray" ? "rgba(159,211,230,.2)" : "rgba(255,255,255,.1)"}">${ic(evIcon[e.type] || "leaf")}</div>
          <div class="grow"><div style="font-weight:600">${esc(pick(e))}</div><div class="small muted">${fmtTime(e.ts)}${e.effect ? ` · ${t("effect")}: <b style="color:${e.effect.change_pct < 0 ? "var(--low)" : "var(--high)"}">${e.effect.change_pct > 0 ? "+" : ""}${e.effect.change_pct}%</b>` : ""}</div></div></div>`).join("") : `<div class="small muted">—</div>`}
      </section>
      <section class="glass pad mt fade-in"><div class="h2" style="margin-bottom:8px">${t("readings")}</div>
        <div style="overflow-x:auto"><table class="tbl"><tr><th>${t("time")}</th><th>${t("trap")}</th><th>${t("on_card")}</th><th>+</th><th>${t("risk")}</th></tr>
          ${log.map((r) => `<tr><td>${fmtTime(r.ts)}</td><td>${esc(r.name)}</td><td>${r.total ?? "—"}</td><td><b>${r.new ?? 0}</b></td><td><span class="risk-pill r-${r.risk || "LOW"}" style="padding:2px 8px">${t(r.risk || "LOW")}</span></td></tr>`).join("")}</table></div>
        ${!st.more && h.log.length > 25 ? `<button class="btn block mt" id="h-more">${t("show_more")}</button>` : ""}
      </section>
      <a class="btn block mt" href="${base()}/api/v1/report.csv?days=${st.days}${S.token ? `&t=${encodeURIComponent(S.token)}` : ""}">${ic("download")} CSV · ${st.days} ${t("days_n")}</a>`;
    $app.querySelectorAll("[data-days]").forEach((b) => b.addEventListener("click", () => { st.days = +b.dataset.days; st.more = false; viewHistory(); }));
    document.getElementById("h-node").addEventListener("change", (e) => { st.node = e.target.value; viewHistory(); });
    const more = document.getElementById("h-more"); if (more) more.addEventListener("click", () => { st.more = true; viewHistory(); });
  }

  // ------------------------------------------------------------------ spray advisor
  const ST_TONE = { spray: "HIGH", postpone: "MEDIUM", watch_spray: "MEDIUM", wait: "OFF", non_chemical: "LOW", none: "LOW" };
  const COLOUR_HEX = { green: "#4caf50", blue: "#3f7fd8", yellow: "#f2c14e", red: "#e5484d" };
  function getArea() { try { return parseFloat(localStorage.getItem("pp_area")) || 1; } catch (e) { return 1; } }
  function setArea(v) { try { localStorage.setItem("pp_area", String(v)); } catch (e) { /* ignore */ } }

  async function viewSpray() {
    nav("spray");
    $app.innerHTML = topbar(t("spray_advisor")) + loading();
    const [adv, log] = await Promise.all([API.advice(), API.sprays()]);
    const area = getArea();
    const amt = (c) => { const v = c.per_acre * area; return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${c.unit}`; };
    $app.innerHTML = `${topbar(t("spray_advisor"))}${demoBanner()}
      <div class="banner mt" style="background:rgba(159,211,230,.16);color:#d7f0f8">${t("disclaimer")}</div>
      <div class="row mt"><label class="grow small muted" for="sp-area">${t("area")}</label>
        <input class="input" id="sp-area" type="number" min="0.1" step="0.1" value="${area}" style="width:110px;text-align:center"></div>
      ${adv.pests.length ? adv.pests.map((p) => `
      <section class="glass pad mt fade-in stack" style="gap:10px">
        <div class="row between" style="align-items:flex-start"><div><div class="h2">${esc(S.lang === "kn" ? p.kn_name : p.en_name)}</div><div class="tiny faint"><i>${esc(p.latin)}</i> · ${esc(pick(p.why))}</div></div>
          <span class="risk-pill r-${ST_TONE[p.status]}" style="white-space:nowrap">${t("st_" + p.status)}</span></div>
        <div style="font-weight:600;font-size:14.5px;line-height:1.45">${esc(pick(p.reason))}</div>
        ${p.window ? `<div class="chip" style="white-space:normal;${p.window.ok ? "" : "background:rgba(242,193,78,.18)"}">${ic(p.window.ok ? "sun" : "rain")} ${esc(pick(p.window))}</div>` : ""}
        <div class="mini-chips">${p.traps.map((x) => `<span class="mini">${esc(x.name)}: ${x.c24}/24h</span>`).join("")}${p.last_spray ? `<span class="mini">${t("last_spray")}: ${esc(p.last_spray.product)} · ${Math.round(p.days_since_spray)} ${t("days_ago")}</span>` : ""}</div>
        <div class="small muted" style="margin-top:4px;font-weight:700">${t("first_no_chem")}</div>
        ${p.non_chemical.map((n) => `<div class="row small" style="align-items:flex-start;gap:8px"><span style="color:var(--lime)">${ic("leaf")}</span><span>${esc(pick(n))} <a class="faint" href="${esc(n.source)}" target="_blank" rel="noopener">${t("source")}</a></span></div>`).join("")}
        ${p.status !== "none" ? `<div class="small muted" style="margin-top:4px;font-weight:700">${t("if_spraying")}</div>
        ${p.chemical.map((c) => `<div style="padding:12px;border-radius:16px;background:${c.suggested ? "rgba(198,236,122,.14)" : "rgba(255,255,255,.07)"};border:1px solid ${c.suggested ? "rgba(198,236,122,.5)" : "transparent"}">
          <div class="row between" style="align-items:flex-start"><div class="grow"><div style="font-weight:700;overflow-wrap:anywhere">${esc(c.name)}</div><div class="tiny faint">${esc(c.trade)}</div></div>
            ${c.suggested ? `<span class="chip solid" style="padding:4px 10px">${t("suggested")}</span>` : c.same_group_as_last ? `<span class="chip" style="padding:4px 10px;color:#ffd2c4;white-space:normal;max-width:52%;text-align:right">${t("same_group")}</span>` : ""}</div>
          <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:8px">
            <span class="mini">${c.per_l} ${c.unit} ${t("per_l")}</span><span class="mini">${c.per_tank10} ${c.unit} ${t("per_tank")}</span>
            <span class="mini" style="background:rgba(198,236,122,.2)">${amt(c)} · ${area} ${area === 1 && S.lang !== "kn" ? "acre" : t("acres")}</span>
            <span class="mini">${t("irac")} ${esc(c.irac)}</span>${c.colour ? `<span class="mini"><span class="dot" style="background:${COLOUR_HEX[c.colour] || "#999"}"></span> ${esc(c.colour)}</span>` : ""}</div>
          ${c.note ? `<div class="tiny" style="margin-top:6px;color:#ffe7a8">${esc(c.note)}</div>` : ""}
          <div class="row between" style="margin-top:8px"><a class="tiny faint" href="${esc(c.source)}" target="_blank" rel="noopener">${t("source")} ↗</a>
            <button class="chip" data-log='${esc(JSON.stringify({ pest: p.pest, product: c.name, dose: `${c.per_l} ${c.unit}/L` }))}'>${ic("plus")} ${t("log_this")}</button></div>
        </div>`).join("")}` : ""}
      </section>`).join("") : `<div class="glass empty mt">${t("no_traps")}</div>`}
      <section class="glass pad mt fade-in"><div class="row between"><div class="h2">${t("spray_history")}</div><button class="chip solid" data-log='{}'>${ic("plus")} ${t("log_spray")}</button></div>
        <div id="sp-form"></div>
        ${log.length ? log.map((s) => { const future = s.safe_harvest_ts && s.safe_harvest_ts > Date.now() / 1000; return `<div class="check">
          <div style="width:32px;height:32px;border-radius:50%;display:grid;place-items:center;flex:none;background:rgba(159,211,230,.2)">${ic("spray")}</div>
          <div class="grow"><div style="font-weight:700">${esc(s.product)}</div>
            <div class="small muted">${fmtDay(s.ts)} · ${esc(S.lang === "kn" ? s.pest_kn : s.pest_en)}${s.dose ? ` · ${esc(s.dose)}` : ""}${s.area_acres ? ` · ${s.area_acres} ${t("acres")}` : ""}${s.irac ? ` · IRAC ${esc(s.irac)}` : ""}</div>
            ${s.safe_harvest_ts ? `<div class="small" style="margin-top:3px;color:${future ? "#ffd2c4" : "var(--low)"}">${future ? t("dont_harvest") : t("safe_harvest")}: <b>${fmtDay(s.safe_harvest_ts)}</b></div>` : ""}
            ${s.effect ? `<div class="small" style="margin-top:3px">${t("effect")}: <b style="color:${s.effect.change_pct < 0 ? "var(--low)" : "var(--high)"}">${s.effect.change_pct > 0 ? "+" : ""}${s.effect.change_pct}%</b> <span class="faint">(${s.effect.before_per_day} → ${s.effect.after_per_day} / ${S.lang === "kn" ? "ದಿನ" : "day"})</span></div>` : ""}
          </div><button class="icon-btn" style="width:34px;height:34px" data-del="${s.id}" aria-label="${t("delete")}">${ic("trash")}</button></div>`; }).join("") : `<div class="small muted mt">${t("no_sprays")}</div>`}
      </section>
      <section class="glass pad mt fade-in"><div class="h2" style="margin-bottom:6px">${t("safety")}</div>
        ${adv.safety.map((x) => `<div class="check"><div class="box" style="border-color:var(--lime)">${ic("check")}</div><div class="t" style="text-decoration:none;color:inherit">${esc(pick(x))}</div></div>`).join("")}</section>`;

    document.getElementById("sp-area").addEventListener("change", (e) => { const v = parseFloat(e.target.value); if (v > 0) { setArea(v); viewSpray(); } });
    $app.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => {
      if (b.dataset.armed) { try { await API.delSpray(+b.dataset.del); viewSpray(); } catch (e) { toast(t("conn_bad")); } return; }
      b.dataset.armed = "1"; b.style.background = "var(--high)"; toast(S.lang === "kn" ? "ಅಳಿಸಲು ಮತ್ತೆ ಒತ್ತಿ" : "Tap again to delete");
    }));
    $app.querySelectorAll("[data-log]").forEach((b) => b.addEventListener("click", () => sprayForm(JSON.parse(b.dataset.log || "{}"), adv)));
  }

  function sprayForm(pre, adv) {
    const box = document.getElementById("sp-form");
    const pestsList = adv.pests.length ? adv.pests : [];
    const pest = pre.pest || (pestsList[0] && pestsList[0].pest) || "whitefly";
    const products = (pestsList.find((p) => p.pest === pest) || { chemical: [] }).chemical;
    const today = new Date().toISOString().slice(0, 10);
    box.innerHTML = `<div class="stack mt" style="padding:14px;border-radius:18px;background:rgba(0,0,0,.18)">
      <div class="field"><label for="lf-pest">${t("pest")}</label><select class="input" id="lf-pest">${pestsList.map((p) => `<option value="${p.pest}" ${p.pest === pest ? "selected" : ""}>${esc(S.lang === "kn" ? p.kn_name : p.en_name)}</option>`).join("")}</select></div>
      <div class="field"><label for="lf-prod">${t("product")}</label><select class="input" id="lf-prod">${products.map((c) => `<option ${c.name === pre.product ? "selected" : ""}>${esc(c.name)}</option>`).join("")}<option value="__other">${t("other_product")}</option></select>
        <input class="input" id="lf-other" placeholder="${t("other_product")}" hidden></div>
      <div class="row"><div class="field grow"><label for="lf-dose">${t("dose")}</label><input class="input" id="lf-dose" value="${esc(pre.dose || "")}"></div>
        <div class="field" style="width:110px"><label for="lf-area">${t("acres")}</label><input class="input" id="lf-area" type="number" step="0.1" value="${getArea()}"></div></div>
      <div class="row"><div class="field grow"><label for="lf-date">${t("date")}</label><input class="input" id="lf-date" type="date" value="${today}" max="${today}"></div>
        <div class="field" style="width:110px"><label for="lf-phi">${S.lang === "kn" ? "ಕಾಯುವ ದಿನ" : "Wait days"}</label><input class="input" id="lf-phi" type="number" min="0" placeholder="label"></div></div>
      <div class="tiny faint">${t("waiting")}</div>
      <div class="field"><label for="lf-notes">${t("notes")}</label><input class="input" id="lf-notes"></div>
      <div class="row"><button class="btn grow" id="lf-cancel">${t("cancel")}</button><button class="btn primary grow" id="lf-save">${t("save")}</button></div></div>`;
    const prod = document.getElementById("lf-prod"), other = document.getElementById("lf-other");
    prod.addEventListener("change", () => { other.hidden = prod.value !== "__other"; });
    document.getElementById("lf-pest").addEventListener("change", (e) => sprayForm({ pest: e.target.value }, adv));
    document.getElementById("lf-cancel").addEventListener("click", () => { box.innerHTML = ""; });
    document.getElementById("lf-save").addEventListener("click", async () => {
      const product = prod.value === "__other" ? other.value.trim() : prod.value;
      if (!product) return toast(t("product") + "?");
      const d = document.getElementById("lf-date").value;
      const ts = d === today ? Date.now() / 1000 : new Date(d + "T09:00:00").getTime() / 1000;
      try {
        await API.addSpray({ pest: document.getElementById("lf-pest").value, product, dose: document.getElementById("lf-dose").value,
          area_acres: document.getElementById("lf-area").value, phi_days: document.getElementById("lf-phi").value, notes: document.getElementById("lf-notes").value, ts });
        toast(t("saved")); viewSpray();
      } catch (e) { toast(t("conn_bad")); }
    });
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // ------------------------------------------------------------------ alerts while the app is open
  function checkNewAlerts(d) {
    if (state.demoActive) return;
    const n = d.unread_alerts;
    if (state.seenAlerts !== null && n > state.seenAlerts) {
      toast(`🐛 ${t("new_alert")}`, 4000);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if (S.notify && "Notification" in window && Notification.permission === "granted") {
        const hi = d.traps.find((x) => x.risk === "HIGH") || d.traps.find((x) => x.risk === "MEDIUM");
        try { new Notification("PestPulse", { body: hi ? `${hi.name}: ${hi.catches_24h} ${sp(hi.species)} / 24 h` : t("new_alert"), icon: "icons/icon-192.png" }); } catch (e) { /* ignore */ }
      }
    }
    state.seenAlerts = n;
  }

  // ------------------------------------------------------------------ router
  function setLang(l) { S.lang = l; saveSettings(); document.body.classList.toggle("kn", l === "kn"); document.documentElement.lang = l; route(); }
  function fixIcons() { /* icons are inline SVG; hook kept for future tweaks */ }
  async function route() {
    const h = location.hash || "#/home";
    const [, page, arg] = h.split("/");
    clearInterval(state.timer);
    try {
      if (page === "traps") await viewTraps();
      else if (page === "trap") await viewTrap(decodeURIComponent(arg || ""));
      else if (page === "alerts") await viewAlerts();
      else if (page === "scan") viewScan();
      else if (page === "history") await viewHistory();
      else if (page === "spray") await viewSpray();
      else if (page === "settings") viewSettings();
      else { await viewHome(); state.timer = setInterval(() => { if (!document.hidden) viewHome(); }, 20000); }
    } catch (e) {
      console.error(e);
      $app.innerHTML = `${topbar("PestPulse")}<div class="glass empty mt">${t("conn_bad")}<br><span class="tiny">${esc(e.message)}</span></div>`;
    }
    if (page !== "trap") window.scrollTo(0, 0);
  }
  document.addEventListener("click", (e) => {
    const say = e.target.closest("[data-say]");
    if (say) { e.preventDefault(); e.stopPropagation(); if (S.voice) speak(say.dataset.say); return; }
    const l = e.target.closest("[data-act=lang]");
    if (l) setLang(S.lang === "kn" ? "en" : "kn");
  });
  window.addEventListener("hashchange", route);
  document.body.classList.toggle("kn", S.lang === "kn");
  if ("speechSynthesis" in window) speechSynthesis.getVoices();
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && !window.PP_FORCE_DEMO) navigator.serviceWorker.register("sw.js").catch(() => {});
  route();
})();
