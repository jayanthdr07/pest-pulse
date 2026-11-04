/* Demo data for PestPulse: lets the app run with no cloud server (preview, pitch fallback).
   Returns the same JSON shapes as the real cloud API. All numbers here are simulated. */
(function () {
  const H = 3600, now = () => Date.now() / 1000;
  const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function cardImage(n, kind, seed, w = 480, h = 384) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d"), r = rnd(seed + 7);
    g.fillStyle = "#4a5f46"; g.fillRect(0, 0, w, h);
    const x0 = 34, y0 = 44, x1 = w - 34, y1 = h - 26;
    g.fillStyle = kind === "pheromone" ? "#eef0e8" : "#efd51d"; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.strokeStyle = kind === "pheromone" ? "#d7dacf" : "#d6bd17"; g.lineWidth = 1;
    for (let x = x0; x < x1; x += 24) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
    for (let y = y0; y < y1; y += 24) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
    for (let i = 0; i < n; i++) {
      const cx = x0 + 10 + r() * (x1 - x0 - 20), cy = y0 + 10 + r() * (y1 - y0 - 20), a = r() * Math.PI;
      g.save(); g.translate(cx, cy); g.rotate(a);
      if (kind === "pheromone") { g.fillStyle = "#6b5440"; g.beginPath(); g.ellipse(0, 0, 6, 2.4, 0, 0, 7); g.fill(); }
      else {
        g.fillStyle = "rgba(200,205,195,.9)"; g.beginPath(); g.ellipse(0, 0, 4.5, 2.4, 0.7, 0, 7); g.fill();
        g.fillStyle = "#1c1c1c"; g.beginPath(); g.ellipse(0, 0, 3.2, 1.8, 0, 0, 7); g.fill();
      }
      g.restore();
      g.strokeStyle = "#d42c1c"; g.lineWidth = 1.4; g.strokeRect(cx - 7, cy - 7, 14, 14);
    }
    g.fillStyle = "#1e3016"; g.fillRect(0, 0, w, 26);
    g.fillStyle = "#fff"; g.font = "600 12px sans-serif";
    g.fillText(`AI count: ${n} insects  (demo image)`, 10, 17);
    return c.toDataURL("image/jpeg", 0.8);
  }

  const TRAPS = [
    { node: "trap1", name: "Tomato Block A", trap: "sticky_yellow", species: "insect", medium: 20, high: 50, base: 96, rate: 5.2, rssi: -58 },
    { node: "trap2", name: "Pheromone Gate", trap: "pheromone", species: "moth", medium: 5, high: 15, base: 31, rate: 0.9, rssi: -66 },
    { node: "trap3", name: "Nursery Shed", trap: "sticky_yellow", species: "insect", medium: 20, high: 50, base: 22, rate: 0.6, rssi: -71 },
  ];
  const LABELS = { sticky_yellow: "Yellow sticky card", pheromone: "Pheromone trap", tuta_delta: "Tuta delta trap", lirio_sticky: "Liriomyza sticky card" };
  const imgCache = {};
  const img = (t, n, s) => (imgCache[t.node + n + s] ||= cardImage(n, t.trap, s));

  function trend(t) {
    const r = rnd(t.node.charCodeAt(4) * 13), out = [];
    for (let i = 0; i < 24; i++) out.push(Math.max(0, Math.round(t.rate * (0.4 + r() * 1.3) * (i > 8 && i < 19 ? 1.4 : 0.5))));
    return out;
  }
  function card(t) {
    const tr = trend(t), c24 = tr.reduce((a, b) => a + b, 0);
    const risk = c24 >= t.high ? "HIGH" : c24 >= t.medium ? "MEDIUM" : "LOW";
    const online = t.node !== "trap3" || true;
    return {
      node: t.node, name: t.name, trap: t.trap, trap_label: LABELS[t.trap], species: t.species, medium: t.medium, high: t.high,
      risk, total: t.base + c24, new: tr[23], catches_24h: c24, temp: 29.4, hum: 74, card_found: true, engine: "opencv",
      last_seen: now() - (t.node === "trap3" ? 22 * 60 : 6 * 60), online, rssi: t.rssi, fw: "1.0.0", interval_s: 1800,
      image: img(t, t.base + c24, 1), thumb: img(t, t.base + c24, 1), trend: tr,
    };
  }
  const STEPS = {
    insect: [["Scout the field today to confirm which pest it is.", "ಯಾವ ಕೀಟ ಎಂದು ತಿಳಿಯಲು ಇಂದೇ ಹೊಲವನ್ನು ಪರಿಶೀಲಿಸಿ."],
      ["Replace the sticky card when it is more than half covered.", "ಅಂಟು ಕಾರ್ಡ್ ಅರ್ಧಕ್ಕಿಂತ ಹೆಚ್ಚು ತುಂಬಿದರೆ ಬದಲಾಯಿಸಿ."],
      ["Ask your agriculture officer / ICAR-IIHR before any spray; use only label-approved products.", "ಯಾವುದೇ ಸಿಂಪಡಣೆಗೆ ಮೊದಲು ಕೃಷಿ ಅಧಿಕಾರಿ / ICAR-IIHR ಅವರನ್ನು ಕೇಳಿ; ಅನುಮೋದಿತ ಔಷಧಿ ಮಾತ್ರ ಬಳಸಿ."]],
    moth: [["Check plants for eggs and young larvae.", "ಗಿಡಗಳಲ್ಲಿ ಮೊಟ್ಟೆ ಮತ್ತು ಮರಿಹುಳುಗಳಿವೆಯೇ ಎಂದು ನೋಡಿ."],
      ["Add more pheromone traps for mass trapping.", "ಸಾಮೂಹಿಕ ಹಿಡಿತಕ್ಕಾಗಿ ಹೆಚ್ಚು ಫೆರೋಮೋನ್ ಬಲೆಗಳನ್ನು ಇಡಿ."],
      ["Ask your agriculture officer / ICAR-IIHR before any spray; use only label-approved products.", "ಯಾವುದೇ ಸಿಂಪಡಣೆಗೆ ಮೊದಲು ಕೃಷಿ ಅಧಿಕಾರಿ / ICAR-IIHR ಅವರನ್ನು ಕೇಳಿ; ಅನುಮೋದಿತ ಔಷಧಿ ಮಾತ್ರ ಬಳಸಿ."]],
  };
  const steps = (sp) => (STEPS[sp] || STEPS.insect).map(([en, kn]) => ({ en, kn }));
  let alerts = null;
  function makeAlerts() {
    const cs = TRAPS.map(card);
    return [
      { id: 2, ts: now() - 40 * 60, node: "trap1", level: cs[0].risk === "HIGH" ? "HIGH" : "MEDIUM", species: "insect", catches_24h: cs[0].catches_24h,
        title_en: `${cs[0].risk === "HIGH" ? "High" : "Medium"} pest risk at Tomato Block A`, title_kn: `Tomato Block A: ಕೀಟ ಅಪಾಯ ${cs[0].risk === "HIGH" ? "ಹೆಚ್ಚು" : "ಮಧ್ಯಮ"}`,
        body_en: `${cs[0].catches_24h} new insects caught in the last 24 h (action level 20 / 50).`,
        body_kn: `ಕಳೆದ 24 ಗಂಟೆಗಳಲ್ಲಿ ${cs[0].catches_24h} ಹೊಸ ಕೀಟಗಳು ಸಿಕ್ಕಿವೆ (ಕ್ರಮದ ಮಟ್ಟ 20 / 50).`,
        steps: steps("insect"), done: [], image: cs[0].image, acked: 0 },
      { id: 1, ts: now() - 26 * H, node: "trap2", level: "MEDIUM", species: "moth", catches_24h: 7,
        title_en: "Medium pest risk at Pheromone Gate", title_kn: "Pheromone Gate: ಕೀಟ ಅಪಾಯ ಮಧ್ಯಮ",
        body_en: "7 new moths caught in the last 24 h (action level 5 / 15).", body_kn: "ಕಳೆದ 24 ಗಂಟೆಗಳಲ್ಲಿ 7 ಹೊಸ ಪತಂಗಗಳು ಸಿಕ್ಕಿವೆ (ಕ್ರಮದ ಮಟ್ಟ 5 / 15).",
        steps: steps("moth"), done: [0], image: cs[1].image, acked: 1 },
    ];
  }
  const days = () => {
    const out = [], d0 = new Date();
    for (let i = 6; i >= 0; i--) { const d = new Date(d0 - i * 864e5); out.push({ day: d.toLocaleDateString("en", { weekday: "short" }), date: d.toLocaleDateString("en", { day: "2-digit", month: "short" }) }); }
    return out;
  };

  window.DemoAPI = {
    async home() {
      const traps = TRAPS.map(card);
      alerts ||= makeAlerts();
      const lv = traps.map((t) => ["LOW", "MEDIUM", "HIGH"].indexOf(t.risk));
      const sugg = [];
      traps.forEach((t) => {
        if (t.risk === "HIGH") sugg.push({ icon: "bug", tone: "high", node: t.node, en: `Scout around ${t.name} today: ${t.catches_24h} new ${t.species === "moth" ? "moths" : "insects"} in 24 h`, kn: `ಇಂದೇ ${t.name} ಸುತ್ತ ಪರಿಶೀಲಿಸಿ: 24 ಗಂಟೆಯಲ್ಲಿ ${t.catches_24h} ಹೊಸ ಕೀಟ` });
        else if (t.risk === "MEDIUM") sugg.push({ icon: "eye", tone: "medium", node: t.node, en: `Watch ${t.name}: catches rising (${t.catches_24h} in 24 h)`, kn: `${t.name} ಗಮನಿಸಿ: ಕೀಟಗಳು ಹೆಚ್ಚುತ್ತಿವೆ (24 ಗಂಟೆಯಲ್ಲಿ ${t.catches_24h})` });
        if (t.total >= 120) sugg.push({ icon: "card", tone: "info", node: t.node, en: `Replace the card on ${t.name}`, kn: `${t.name} ಬಲೆಯ ಕಾರ್ಡ್ ಬದಲಾಯಿಸಿ` });
      });
      sugg.push({ icon: "spray", tone: "info", en: "Calm and dry for 6 h: good spray window if your officer advises a spray", kn: "6 ಗಂಟೆ ಗಾಳಿ ಕಡಿಮೆ, ಮಳೆ ಇಲ್ಲ: ಅಧಿಕಾರಿ ಸಲಹೆ ನೀಡಿದರೆ ಸಿಂಪಡಣೆಗೆ ಸೂಕ್ತ ಸಮಯ" });
      const species = {};
      traps.forEach((t) => (species[t.species] = (species[t.species] || 0) + t.catches_24h));
      return {
        demo: true,
        farm: { name: "Prime Minds Demo Farm", place: "Hesaraghatta, Bengaluru", crop: "Tomato" },
        server_time: now(), overall: ["LOW", "MEDIUM", "HIGH"][Math.max(...lv)],
        weather: { source: "demo", temp: 29.4, hum: 74, wind: 6.1, cond: "Partly cloudy", cond_kn: "ಭಾಗಶಃ ಮೋಡ", rain_prob_6h: 18, wind_max_6h: 9,
          days: [{ tmax: 31, tmin: 21, rh: 72, rain_prob: 20 }, { tmax: 30, tmin: 21, rh: 76, rain_prob: 45 }, { tmax: 29, tmin: 20, rh: 80, rain_prob: 70 }] },
        outlook: { level: "HIGH", en: "Pest build-up likely: 3 of next 3 days warm and humid", kn: "ಕೀಟ ಹೆಚ್ಚಳ ಸಾಧ್ಯತೆ: ಮುಂದಿನ 3 ದಿನಗಳಲ್ಲಿ 3 ದಿನ ಬೆಚ್ಚಗಿನ, ತೇವದ ಹವಾಮಾನ" },
        traps, species_24h: species, catches_24h: traps.reduce((a, t) => a + t.catches_24h, 0), online: traps.length,
        suggestions: sugg.slice(0, 5), unread_alerts: alerts.filter((a) => !a.acked).length,
        spray: await (async () => { const a = (await window.DemoAPI.advice()).pests[0]; return a ? { status: a.status, pest: a.pest, en_name: a.en_name, kn_name: a.kn_name, reason: a.reason } : null; })(),
      };
    },
    async trap(node) {
      const t = TRAPS.find((x) => x.node === node) || TRAPS[0];
      const c = card(t), r = rnd(t.node.charCodeAt(4) * 31);
      const daily = days().map((d, i) => ({ ...d, new: i === 6 ? c.catches_24h : Math.round(t.rate * 24 * (0.55 + 0.08 * i + r() * 0.3)) }));
      const photos = [0, 1, 2, 3, 4, 5].map((k) => { const n = Math.max(0, c.total - k * Math.round(t.rate * 3)); const im = img(t, n, k + 2); return { id: k, ts: now() - k * 1800, total: n, new: Math.round(t.rate * 2), risk: c.risk, annotated: im, thumb: im }; });
      photos[0].annotated = photos[0].thumb = c.image;
      const kbp = (window.PP_KB || { pests: {} }).pests;
      const pest = t.node === "trap2" ? "fruit_borer" : "whitefly";
      return { ...c, daily, photos, steps: steps(t.species), trap_types: LABELS, pest, pest_types: Object.fromEntries(Object.entries(kbp).map(([k, v]) => [k, v.en])) };
    },
    async patchTrap(node, body) {
      const t = TRAPS.find((x) => x.node === node);
      if (t && body.name) t.name = body.name;
      if (t && body.trap) { t.trap = body.trap; t.species = body.trap === "sticky_yellow" ? "insect" : "moth"; }
      return card(t);
    },
    async alerts() { alerts ||= makeAlerts(); return alerts; },
    async patchAlert(id, body) {
      const a = alerts.find((x) => x.id === id);
      if (body.done) a.done = body.done;
      if (body.acked !== undefined) a.acked = body.acked ? 1 : 0;
      return a;
    },
    async scan(file, trap) {
      const n = 20 + Math.floor(Math.random() * 40);
      const im = cardImage(n, trap, Math.floor(Math.random() * 999), 640, 512);
      await new Promise((r) => setTimeout(r, 900));
      return { total: n, counts: { insect: n }, engine: "demo", card_found: true, annotated: im, trap_label: LABELS[trap],
        level_if_24h: n >= 50 ? "HIGH" : n >= 20 ? "MEDIUM" : "LOW", note: "Demo mode: this count is simulated. Connect to your cloud for real AI counting." };
    },
  };

  // ---------------- history + spray advisor (demo) ----------------
  const DAY = 86400;
  const KB = window.PP_KB || { pests: {}, safety: [] };
  const PEST_OF = { trap1: "whitefly", trap2: "fruit_borer", trap3: "whitefly" };
  let SPRAYS = [
    { id: 2, ts: now() - 5 * DAY + 4 * H, pest: "fruit_borer", product: "Chlorantraniliprole 18.5 SC", irac: "28", dose: "0.3 ml/L", area_acres: 1, phi_days: 3, notes: "demo" },
    { id: 1, ts: now() - 9 * DAY + 4 * H, pest: "whitefly", product: "Imidacloprid 17.8 SL", irac: "4A", dose: "0.3 ml/L", area_acres: 1, phi_days: 3, notes: "demo" },
  ];
  const sprayAgo = { trap1: 9, trap2: 5 };
  function dailySeries(t, days) {
    const r = rnd(t.node.charCodeAt(4) * 97 + days), out = [];
    for (let i = days - 1; i >= 0; i--) {
      const grow = Math.min(2.5, 1 + 0.06 * (days - i));
      const since = sprayAgo[t.node] != null ? sprayAgo[t.node] - i : -1;
      const f = since < 0 ? 1 : Math.min(1, 0.35 + 0.1 * since);
      out.push(Math.max(0, Math.round(t.rate * 24 * 0.32 * grow * f * (0.8 + r() * 0.4))));
    }
    return out;
  }
  function effect(sp) {
    const tr = TRAPS.filter((t) => PEST_OF[t.node] === sp.pest);
    const ago = Math.round((now() - sp.ts) / DAY);
    let b = 0, a = 0;
    tr.forEach((t) => { const v = dailySeries(t, 40); const idx = 39 - ago; b += v.slice(Math.max(0, idx - 3), idx).reduce((x, y) => x + y, 0); a += v.slice(idx, idx + 3).reduce((x, y) => x + y, 0); });
    if (!b) return null;
    return { before_per_day: +(b / 3).toFixed(1), after_per_day: +(a / 3).toFixed(1), change_pct: Math.round((100 * (a - b)) / b) };
  }
  Object.assign(window.DemoAPI, {
    async history(days, node) {
      const d0 = new Date(); d0.setHours(0, 0, 0, 0);
      const start = d0.getTime() / 1000 + DAY - days * DAY;
      const labels = []; for (let i = 0; i < days; i++) labels.push(new Date((start + i * DAY) * 1000).toLocaleDateString("en", { day: "2-digit", month: "short" }));
      const traps = TRAPS.filter((t) => !node || t.node === node);
      const series = traps.map((t) => { const v = dailySeries(t, days); return { node: t.node, name: t.name, pest: PEST_OF[t.node], values: v, total: v.reduce((a, b) => a + b, 0), medium: t.medium, high: t.high }; });
      const all = labels.map((_, i) => series.reduce((a, s) => a + s.values[i], 0));
      const total = all.reduce((a, b) => a + b, 0), peak = all.indexOf(Math.max(...all));
      const prev = Math.round(total * 0.62);
      const byPest = {}; series.forEach((s) => (byPest[s.pest] = (byPest[s.pest] || 0) + s.total));
      const sprays = SPRAYS.filter((s) => s.ts >= start && (!node || PEST_OF[node] === s.pest));
      const events = [
        ...sprays.map((s) => ({ ts: s.ts, type: "spray", pest: s.pest, en: `Sprayed ${s.product}`, kn: `${s.product} ಸಿಂಪಡಿಸಲಾಗಿದೆ`, effect: effect(s) })),
        ...(await this.alerts()).map((a) => ({ ts: a.ts, type: "alert", level: a.level, en: a.title_en, kn: a.title_kn })),
        { ts: now() - 13 * DAY, type: "card", en: "Card replaced on Tomato Block A", kn: "Tomato Block A ಕಾರ್ಡ್ ಬದಲಾಯಿಸಲಾಗಿದೆ" },
      ].filter((e) => e.ts >= start).sort((a, b) => b.ts - a.ts);
      const log = [];
      traps.forEach((t, k) => { let tot = t.base + 40; for (let i = 0; i < 40; i++) { const nw = Math.max(0, Math.round(t.rate * 3 * (0.5 + ((i * 7 + k) % 5) / 5))); log.push({ ts: now() - i * 4 * H - k * 600, node: t.node, name: t.name, total: tot, new: nw, risk: card(t).risk, temp: 28, hum: 70 }); tot = Math.max(0, tot - nw); } });
      log.sort((a, b) => b.ts - a.ts);
      return { days, labels, start, series, daily_all: all,
        summary: { total, avg_per_day: +(total / days).toFixed(1), peak_day: labels[peak], peak_value: all[peak], prev_total: prev, change_pct: Math.round((100 * (total - prev)) / prev) },
        by_pest: Object.entries(byPest).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ pest: k, en: KB.pests[k] ? KB.pests[k].en : k, kn: KB.pests[k] ? KB.pests[k].kn : k, total: v })),
        sprays: sprays.map((s) => ({ ts: s.ts, day_index: Math.floor((s.ts - start) / DAY), product: s.product, pest: s.pest })), events, log };
    },
    async advice() {
      const cs = TRAPS.map(card);
      const groups = {};
      cs.forEach((c) => { const p = PEST_OF[c.node]; (groups[p] ||= []).push(c); });
      const pests = Object.entries(groups).map(([pest, tr]) => {
        const kb = KB.pests[pest]; const c24 = tr.reduce((a, x) => a + x.catches_24h, 0);
        const lvl = tr.some((x) => x.risk === "HIGH") ? "HIGH" : tr.some((x) => x.risk === "MEDIUM") ? "MEDIUM" : "LOW";
        const last = SPRAYS.filter((s) => s.pest === pest).sort((a, b) => b.ts - a.ts)[0];
        const ds = last ? (now() - last.ts) / DAY : null;
        let status, en, kn;
        if (lvl === "LOW") { status = "none"; en = `${kb.en} below the action level (${c24} in 24 h). No spray needed; keep monitoring.`; kn = `${kb.kn} ಕ್ರಮದ ಮಟ್ಟಕ್ಕಿಂತ ಕಡಿಮೆ (24 ಗಂಟೆಯಲ್ಲಿ ${c24}). ಸಿಂಪಡಣೆ ಬೇಡ; ಗಮನಿಸುತ್ತಿರಿ.`; }
        else if (lvl === "MEDIUM") { status = "non_chemical"; en = `${kb.en} rising (${c24} in 24 h). Start non-chemical measures now.`; kn = `${kb.kn} ಹೆಚ್ಚುತ್ತಿದೆ (24 ಗಂಟೆಯಲ್ಲಿ ${c24}). ಈಗಲೇ ರಾಸಾಯನಿಕವಲ್ಲದ ಕ್ರಮ ಆರಂಭಿಸಿ.`; }
        else if (ds != null && ds < 10) { status = "wait"; en = `${kb.en} still high, but you sprayed ${last.product} ${Math.floor(ds)} days ago. Give it time; re-check later or ask your officer.`; kn = `${kb.kn} ಇನ್ನೂ ಹೆಚ್ಚು, ಆದರೆ ${Math.floor(ds)} ದಿನದ ಹಿಂದೆ ಸಿಂಪಡಿಸಿದ್ದೀರಿ.`; }
        else { status = "spray"; en = `${kb.en}: ${c24} in 24 h, high for 2 days in a row. A spray is advised.`; kn = `${kb.kn}: 24 ಗಂಟೆಯಲ್ಲಿ ${c24}, ಸತತ 2 ದಿನ ಹೆಚ್ಚು. ಸಿಂಪಡಣೆ ಸಲಹೆ.`; }
        const chem = kb.chemical.map((c) => ({ ...c }));
        const pickc = chem.find((c) => !last || c.irac !== last.irac) || chem[0];
        chem.forEach((c) => { c.suggested = c === pickc && ["spray", "postpone", "watch_spray"].includes(status); c.same_group_as_last = !!(last && c.irac === last.irac); });
        return { pest, en_name: kb.en, kn_name: kb.kn, latin: kb.latin, why: kb.why, status, reason: { en, kn }, level: lvl, catches_24h: c24,
          traps: tr.map((x) => ({ node: x.node, name: x.name, c24: x.catches_24h, risk: x.risk })),
          window: { ok: true, en: "Good spray window: dry and calm for 6 h. Spray early morning or evening.", kn: "6 ಗಂಟೆ ಒಣ ಮತ್ತು ಶಾಂತ: ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ಸಿಂಪಡಿಸಲು ಸೂಕ್ತ." },
          non_chemical: kb.non_chemical, chemical: chem, last_spray: last || null, days_since_spray: ds };
      });
      const order = { spray: 0, postpone: 1, watch_spray: 2, wait: 3, non_chemical: 4, none: 5 };
      pests.sort((a, b) => order[a.status] - order[b.status]);
      return { pests, safety: KB.safety, min_days_between: 10, spray_volume_l_per_acre: 200 };
    },
    async sprays() {
      return SPRAYS.slice().sort((a, b) => b.ts - a.ts).map((s) => ({ ...s, safe_harvest_ts: s.phi_days != null && s.phi_days !== "" ? s.ts + s.phi_days * DAY : null,
        effect: effect(s), pest_en: KB.pests[s.pest] ? KB.pests[s.pest].en : s.pest, pest_kn: KB.pests[s.pest] ? KB.pests[s.pest].kn : s.pest }));
    },
    async addSpray(b) {
      const known = (KB.pests[b.pest] ? KB.pests[b.pest].chemical : []).find((c) => c.name === b.product);
      SPRAYS.push({ id: Date.now(), ts: b.ts || now(), pest: b.pest, product: b.product, irac: known ? known.irac : "", dose: b.dose, area_acres: +b.area_acres || null, phi_days: b.phi_days === "" ? null : +b.phi_days, notes: b.notes });
      return { ok: true };
    },
    async delSpray(id) { SPRAYS = SPRAYS.filter((s) => s.id !== id); return { ok: true }; },
  });
})();
