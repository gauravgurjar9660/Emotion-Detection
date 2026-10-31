(() => {
  "use strict";

  /* ------------------------------------------------------------------
     Config
  ------------------------------------------------------------------ */
  const EMOTIONS = {
    sadness:  { emoji: "😞", color: "#5b8def", line: "Heavy, low, a little blue." },
    joy:      { emoji: "😀", color: "#ffc94a", line: "Bright, warm and upbeat." },
    love:     { emoji: "❤️", color: "#ff6b9d", line: "Tender, close and caring." },
    anger:    { emoji: "🤬", color: "#ff5252", line: "Sharp, hot and frustrated." },
    fear:     { emoji: "😨", color: "#9b7bff", line: "Uneasy, tense and on edge." },
    surprise: { emoji: "😲", color: "#2fe0c2", line: "Sudden, unexpected, wide-eyed." },
  };
  const ORDER = ["sadness", "joy", "love", "anger", "fear", "surprise"];

  const EXAMPLES = [
    "I can't believe I finally got the job!",
    "Everything feels so empty without her.",
    "I'm furious that they lied to me again.",
    "I heard footsteps behind me in the dark hallway.",
    "Wait, you did all of this for me?!",
    "Every day with you feels like coming home.",
  ];

  const RING_LEN = 2 * Math.PI * 52;
  const HISTORY_KEY = "emotion-lens-history";

  /* ------------------------------------------------------------------
     Elements
  ------------------------------------------------------------------ */
  const $ = (id) => document.getElementById(id);
  const el = {
    text: $("text"), count: $("count"), chips: $("chips"),
    analyze: $("analyze"), clear: $("clear"),
    card: $("result-card"), emoji: $("emoji"), emotion: $("emotion"),
    line: $("line"), ring: $("ring"), conf: $("conf"), bars: $("bars"),
    status: $("status"), statusText: $("status-text"), toast: $("toast"),
    historyWrap: $("history-wrap"), history: $("history"),
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Helpers
  ------------------------------------------------------------------ */
  const hexToRgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  let toastTimer;
  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("show"), 4500);
  }

  function countUp(node, to, duration = 1100) {
    if (reduceMotion) { node.textContent = to.toFixed(1); return; }
    const from = parseFloat(node.textContent) || 0;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      node.textContent = (from + (to - from) * eased).toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------
     Ambient background (soft orbs that take on the emotion's colour)
  ------------------------------------------------------------------ */
  const canvas = $("bg");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0;
  let current = [124, 134, 255];
  let target = [124, 134, 255];

  const orbs = Array.from({ length: 4 }, (_, i) => ({
    x: [0.15, 0.85, 0.5, 0.9][i],
    y: [0.1, 0.25, 0.95, 0.9][i],
    r: [0.55, 0.5, 0.6, 0.4][i],
    a: Math.random() * Math.PI * 2,
    s: 0.00012 + Math.random() * 0.00018,
  }));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(t) {
    for (let i = 0; i < 3; i++) current[i] += (target[i] - current[i]) * 0.04;
    ctx.clearRect(0, 0, W, H);
    const size = Math.max(W, H);
    const [r, g, b] = current.map(Math.round);
    orbs.forEach((o, i) => {
      const x = (o.x + Math.cos(o.a + t * o.s) * 0.09) * W;
      const y = (o.y + Math.sin(o.a + t * o.s * 1.3) * 0.09) * H;
      const rad = o.r * size;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, `rgba(${r},${g},${b},${i % 2 ? 0.13 : 0.2})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    });
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => { resize(); if (reduceMotion) draw(0); });
  resize();
  requestAnimationFrame(draw);

  function setAccent(hex) {
    const rgb = hexToRgb(hex);
    target = rgb;
    const root = document.documentElement.style;
    root.setProperty("--accent", hex);
    root.setProperty("--accent-rgb", rgb.join(", "));
    if (reduceMotion) { current = rgb; draw(0); }
  }

  /* ------------------------------------------------------------------
     Build static UI (chips, bars)
  ------------------------------------------------------------------ */
  EXAMPLES.forEach((txt) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = txt.length > 34 ? txt.slice(0, 32) + "…" : txt;
    b.title = txt;
    b.addEventListener("click", () => {
      el.text.value = txt;
      updateCount();
      el.text.focus();
      analyze();
    });
    el.chips.appendChild(b);
  });

  const barRefs = {};
  ORDER.forEach((name) => {
    const row = document.createElement("div");
    row.className = "bar";
    row.style.setProperty("--c", EMOTIONS[name].color);
    row.innerHTML =
      `<span class="b-emoji">${EMOTIONS[name].emoji}</span>` +
      `<span class="b-name">${name}</span>` +
      `<div class="b-track"><div class="b-fill"></div></div>` +
      `<span class="b-val">0%</span>`;
    el.bars.appendChild(row);
    barRefs[name] = {
      row,
      fill: row.querySelector(".b-fill"),
      val: row.querySelector(".b-val"),
    };
  });

  /* ------------------------------------------------------------------
     Input behaviour
  ------------------------------------------------------------------ */
  function updateCount() {
    el.count.textContent = el.text.value.length;
    el.analyze.disabled = el.text.value.trim().length === 0;
  }
  el.text.addEventListener("input", updateCount);
  el.text.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); analyze(); }
  });
  el.clear.addEventListener("click", () => {
    el.text.value = "";
    updateCount();
    el.text.focus();
  });
  el.analyze.addEventListener("click", analyze);
  updateCount();

  // Cursor-follow glow on cards
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ------------------------------------------------------------------
     API
  ------------------------------------------------------------------ */
  async function checkHealth() {
    try {
      const res = await fetch("/health");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.model_loaded) {
        el.status.dataset.state = "ok";
        el.statusText.textContent = "Model online";
      } else {
        el.status.dataset.state = "checking";
        el.statusText.textContent = "Model loading…";
        setTimeout(checkHealth, 3000);
      }
    } catch {
      el.status.dataset.state = "down";
      el.statusText.textContent = "Server unreachable";
    }
  }

  function errorMessage(data, status) {
    const d = data && data.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d) && d[0] && d[0].msg) return d[0].msg;
    return `Request failed (${status})`;
  }

  async function analyze() {
    const text = el.text.value.trim();
    if (!text || el.analyze.classList.contains("loading")) return;

    el.analyze.classList.add("loading");
    el.analyze.disabled = true;

    try {
      const res = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      let data = null;
      try { data = await res.json(); } catch { /* non-JSON body */ }
      if (!res.ok) throw new Error(errorMessage(data, res.status));

      showResult(data, text);
      saveHistory(data, text);
    } catch (err) {
      showToast(err.message === "Failed to fetch" ? "Can't reach the server. Is it running?" : err.message);
    } finally {
      el.analyze.classList.remove("loading");
      updateCount();
    }
  }

  /* ------------------------------------------------------------------
     Render result
  ------------------------------------------------------------------ */
  function showResult(data, _text) {
    const name = data.emotion_prediction;
    const meta = EMOTIONS[name] || EMOTIONS.joy;
    const probs = data.allprediction || data.all_predictions || {};
    const conf = (data.confidence ?? probs[name] ?? 0) * 100;

    el.card.dataset.state = "done";
    setAccent(meta.color);

    // verdict
    el.emoji.textContent = meta.emoji;
    el.emoji.classList.remove("pop");
    void el.emoji.offsetWidth; // restart animation
    el.emoji.classList.add("pop");
    el.emotion.textContent = name;
    el.line.textContent = meta.line;

    // ring + number (start from empty so it animates every time)
    el.ring.style.transition = "none";
    el.ring.style.strokeDashoffset = RING_LEN;
    el.conf.textContent = "0";
    void el.ring.getBoundingClientRect();
    el.ring.style.transition = "";
    requestAnimationFrame(() => {
      el.ring.style.strokeDashoffset = RING_LEN * (1 - conf / 100);
    });
    countUp(el.conf, conf);

    // bars
    ORDER.forEach((k, i) => {
      const p = (probs[k] || 0) * 100;
      const ref = barRefs[k];
      ref.row.classList.toggle("top", k === name);
      ref.fill.style.transitionDelay = `${i * 60}ms`;
      ref.fill.style.width = `${Math.max(p, 0.6)}%`;
      ref.val.textContent = p < 0.1 ? "<0.1%" : `${p.toFixed(1)}%`;
    });

    if (window.innerWidth < 920) {
      el.card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }

  /* ------------------------------------------------------------------
     History (localStorage, optional)
  ------------------------------------------------------------------ */
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch { return []; }
  }

  function saveHistory(data, text) {
    const items = loadHistory().filter((h) => h.text !== text);
    items.unshift({
      text,
      emotion: data.emotion_prediction,
      conf: data.confidence ?? 0,
      probs: data.allprediction || data.all_predictions || {},
    });
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 5))); } catch { /* ignore */ }
    renderHistory();
  }

  function renderHistory() {
    const items = loadHistory();
    el.historyWrap.hidden = items.length === 0;
    el.history.innerHTML = "";
    items.forEach((h, i) => {
      const meta = EMOTIONS[h.emotion] || EMOTIONS.joy;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "h-item";
      b.style.animationDelay = `${i * 50}ms`;
      const e = document.createElement("span"); e.className = "h-emoji"; e.textContent = meta.emoji;
      const t = document.createElement("span"); t.className = "h-text"; t.textContent = h.text;
      const p = document.createElement("span"); p.className = "h-pct"; p.textContent = `${(h.conf * 100).toFixed(0)}%`;
      b.append(e, t, p);
      b.addEventListener("click", () => {
        el.text.value = h.text;
        updateCount();
        showResult({ emotion_prediction: h.emotion, confidence: h.conf, allprediction: h.probs }, h.text);
      });
      el.history.appendChild(b);
    });
  }

  /* ------------------------------------------------------------------
     Go
  ------------------------------------------------------------------ */
  renderHistory();
  checkHealth();
})();
