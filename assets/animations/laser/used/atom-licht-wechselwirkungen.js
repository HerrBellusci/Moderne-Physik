(function () {
  const W = 862;
  const H = 506;
  const INK = "#172033";
  const MUTED = "#64748b";
  const LEVEL = "#334155";
  const SOFT = "#e8eef6";
  const PHOTON = "#e11d48";
  const PHOTON_SOFT = "#fb7185";
  const ENERGY = "#f59e0b";
  const ELECTRON = "#2563eb";

  const ATOM = {
    cx: 430,
    cy: 248,
    r: 160,
    x0: 286,
    x1: 574,
    e1: 328,
    e2: 168,
    ex: 430
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function ease(value) {
    const x = clamp(value, 0, 1);
    return x * x * (3 - 2 * x);
  }

  function mix(a, b, p) {
    return a + (b - a) * clamp(p, 0, 1);
  }

  function arrowHead(parent, SRT, x, y, angle, color, size = 10) {
    const a1 = angle + Math.PI * 0.82;
    const a2 = angle - Math.PI * 0.82;
    SRT.el("path", {
      d: [
        `M${x} ${y}`,
        `L${x + Math.cos(a1) * size} ${y + Math.sin(a1) * size}`,
        `M${x} ${y}`,
        `L${x + Math.cos(a2) * size} ${y + Math.sin(a2) * size}`
      ].join(" "),
      fill: "none",
      stroke: color,
      "stroke-width": 2,
      "stroke-linecap": "round"
    }, parent);
  }

  function wavePacket(parent, SRT, cx, cy, angle, color, phase, options = {}) {
    const len = options.len || 88;
    const amp = options.amp || 8;
    const opacity = options.opacity === undefined ? 1 : options.opacity;
    const width = options.width || 2.6;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let d = "";

    for (let s = -len / 2; s <= len / 2; s += 2) {
      const env = Math.exp(-2.6 * (s / (len / 2)) * (s / (len / 2)));
      const wave = Math.sin(s * 0.34 + phase) * amp * env;
      const x = cx + s * cos - wave * sin;
      const y = cy + s * sin + wave * cos;
      d += `${s === -len / 2 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
    }

    SRT.el("path", {
      d,
      fill: "none",
      stroke: color,
      "stroke-width": width,
      "stroke-linecap": "round",
      opacity,
      filter: "url(#glow)"
    }, parent);
    arrowHead(
      parent,
      SRT,
      cx + Math.cos(angle) * (len / 2 + 10),
      cy + Math.sin(angle) * (len / 2 + 10),
      angle,
      color,
      9
    );
  }

  function photonTrack(parent, SRT, y, opacity = 0.24) {
    SRT.el("line", {
      x1: 86,
      y1: y,
      x2: 776,
      y2: y,
      stroke: "#cbd5e1",
      "stroke-width": 1.4,
      "stroke-dasharray": "5 7",
      opacity
    }, parent);
  }

  function background(parent, SRT) {
    SRT.clear(parent);
    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 8, fill: "#ffffff", stroke: "#e2e8f0" }, parent);
  }

  function drawAtom(parent, SRT, electronY, options = {}) {
    const activeUpper = Math.abs(electronY - ATOM.e2) < Math.abs(electronY - ATOM.e1);

    SRT.el("circle", {
      cx: ATOM.cx,
      cy: ATOM.cy,
      r: ATOM.r,
      fill: "#f8fafc",
      stroke: "#d7e0ea",
      "stroke-width": 2
    }, parent);

    SRT.el("line", {
      x1: ATOM.x0,
      y1: ATOM.e2,
      x2: ATOM.x1,
      y2: ATOM.e2,
      stroke: activeUpper ? ENERGY : LEVEL,
      "stroke-width": activeUpper ? 4 : 2.4,
      "stroke-linecap": "round"
    }, parent);
    SRT.el("line", {
      x1: ATOM.x0,
      y1: ATOM.e1,
      x2: ATOM.x1,
      y2: ATOM.e1,
      stroke: activeUpper ? LEVEL : ENERGY,
      "stroke-width": activeUpper ? 2.4 : 4,
      "stroke-linecap": "round"
    }, parent);

    SRT.addText(parent, ATOM.x0 - 52, ATOM.e2 + 5, "E₂", "label", {
      fill: LEVEL,
      "font-size": 14,
      "font-weight": "850"
    });
    SRT.addText(parent, ATOM.x0 - 52, ATOM.e1 + 5, "E₁", "label", {
      fill: LEVEL,
      "font-size": 14,
      "font-weight": "850"
    });
    SRT.addText(parent, ATOM.x1 + 16, ATOM.e2 + 5, "angeregt", "label", {
      fill: MUTED,
      "font-size": 12,
      "font-weight": "750"
    });
    SRT.addText(parent, ATOM.x1 + 16, ATOM.e1 + 5, "Grundzustand", "label", {
      fill: MUTED,
      "font-size": 12,
      "font-weight": "750"
    });

    if (options.transition === "up") {
      drawLevelArrow(parent, SRT, ATOM.e1 - 8, ATOM.e2 + 8, ENERGY);
    }
    if (options.transition === "down") {
      drawLevelArrow(parent, SRT, ATOM.e2 + 8, ATOM.e1 - 8, PHOTON);
    }

    SRT.el("circle", {
      cx: ATOM.ex,
      cy: electronY,
      r: 9,
      fill: ELECTRON,
      stroke: "#dbeafe",
      "stroke-width": 2,
      filter: "url(#glow)"
    }, parent);
  }

  function drawLevelArrow(parent, SRT, y1, y2, color) {
    const x = ATOM.x0 + 42;
    SRT.el("line", {
      x1: x,
      y1,
      x2: x,
      y2,
      stroke: color,
      "stroke-width": 2.4,
      "stroke-linecap": "round"
    }, parent);
    arrowHead(parent, SRT, x, y2, y2 > y1 ? Math.PI / 2 : -Math.PI / 2, color, 8);
  }

  function drawAbsorption({ parent, t, SRT }) {
    const cycle = (t % 4200) / 4200;
    const phase = -t * 0.012;
    const hit = 0.56;
    const after = clamp((cycle - hit) / (1 - hit), 0, 1);
    const electronY = cycle < hit ? ATOM.e1 : mix(ATOM.e1, ATOM.e2, ease(after * 1.8));

    background(parent, SRT);
    photonTrack(parent, SRT, ATOM.cy);
    drawAtom(parent, SRT, electronY, { transition: cycle > hit ? "up" : null });

    if (cycle < hit) {
      const p = ease(cycle / hit);
      wavePacket(parent, SRT, mix(104, ATOM.cx - 92, p), ATOM.cy, 0, PHOTON, phase);
    }
  }

  // Deterministischer Pseudozufall je Durchlauf: gleicher Durchlauf sieht
  // immer gleich aus, jeder neue Durchlauf bekommt Zeitpunkt und Richtung neu.
  function rand01(seed) {
    const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  function drawSpontaneous({ parent, t, SRT }) {
    const period = 4800;
    const run = Math.floor(t / period);
    const cycle = (t % period) / period;
    const phase = -t * 0.012 + 0.7;
    const event = 0.3 + rand01(run) * 0.28;
    const after = clamp((cycle - event) / (1 - event), 0, 1);
    const electronY = cycle < event ? ATOM.e2 : mix(ATOM.e2, ATOM.e1, ease(after * 2.2));
    const angle = rand01(run + 57) * Math.PI * 2;

    background(parent, SRT);
    drawAtom(parent, SRT, electronY, { transition: cycle > event ? "down" : null });

    if (cycle >= event) {
      const cx = ATOM.cx + Math.cos(angle) * mix(76, 286, after);
      const cy = ATOM.cy + Math.sin(angle) * mix(76, 286, after);
      wavePacket(parent, SRT, cx, cy, angle, PHOTON, phase);
    }
  }

  function drawStimulated({ parent, t, SRT }) {
    const cycle = (t % 4400) / 4400;
    const phase = -t * 0.012;
    const hit = 0.46;
    const after = clamp((cycle - hit) / (1 - hit), 0, 1);
    const electronY = cycle < hit ? ATOM.e2 : mix(ATOM.e2, ATOM.e1, ease(after * 2.0));

    background(parent, SRT);
    photonTrack(parent, SRT, ATOM.cy);
    drawAtom(parent, SRT, electronY, { transition: cycle > hit ? "down" : null });

    if (cycle < hit) {
      const p = ease(cycle / hit);
      wavePacket(parent, SRT, mix(104, ATOM.cx - 92, p), ATOM.cy, 0, PHOTON, phase);
      return;
    }

    const x = mix(ATOM.cx + 104, 742, ease(after));
    wavePacket(parent, SRT, x, ATOM.cy - 18, 0, PHOTON, phase, { len: 92 });
    wavePacket(parent, SRT, x, ATOM.cy + 18, 0, PHOTON, phase, { len: 92 });
  }

  window.SRTSlide.register("laser-absorption", {
    render: drawAbsorption
  });

  window.SRTSlide.register("laser-spontane-emission", {
    render: drawSpontaneous
  });

  window.SRTSlide.register("laser-stimulierte-emission", {
    render: drawStimulated
  });
})();
