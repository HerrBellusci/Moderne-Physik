(function () {
  const W = 862;
  const H = 506;
  const MAX_DL = 10;

  const SOURCES = {
    thermal: {
      label: "Glühlampe",
      short: "groß",
      lc: 0.18,
      color: "#9aaab8",
      note: ["breites Spektrum,", "sehr kurze Kohärenzlänge"]
    },
    spectral: {
      label: "Spektrallampe",
      short: "mittel",
      lc: 2.0,
      color: "#ffc83d",
      note: ["schmalere Linie,", "historisch nutzbar"]
    },
    laser: {
      label: "Laser",
      short: "klein",
      lc: 8.0,
      color: "#ff5161",
      note: ["schmale Linie,", "lange Kohärenzlänge"]
    }
  };

  const WAVE = { x: 24, y: 24, w: 534, h: 250 };
  const INFO = { x: 578, y: 24, w: 260, h: 250 };
  const DET = { x: 24, y: 294, w: 814, h: 188 };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function visibility(state) {
    return Math.exp(-Math.PI * Math.abs(state.dL) / SOURCES[state.source].lc);
  }

  function panel(parent, SRT, box, title) {
    SRT.el("rect", {
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      rx: 10,
      fill: "rgba(255,255,255,0.045)",
      stroke: "rgba(255,255,255,0.16)"
    }, parent);
    SRT.addText(parent, box.x + 16, box.y + 26, title, "label", {
      fill: "#ffffff",
      "font-size": 13,
      "font-weight": "900"
    });
  }

  function addLines(parent, SRT, x, y, lines, attrs = {}, gap = 14) {
    lines.forEach((line, index) => {
      SRT.addText(parent, x, y + index * gap, line, "label", attrs);
    });
  }

  function wavePacket(xc, length, k, phase) {
    return function (x) {
      const u = (x - xc) / (length / 2);
      const env = Math.exp(-1.55 * u * u);
      return env * Math.sin((x - xc) * k + phase);
    };
  }

  function drawWavePath(parent, SRT, fn, x0, x1, y, amp, color, width) {
    let d = "";
    for (let x = x0; x <= x1; x += 1) {
      const yy = y + fn(x) * amp;
      d += `${x === x0 ? "M" : "L"}${x} ${yy} `;
    }
    SRT.el("path", {
      d,
      fill: "none",
      stroke: color,
      "stroke-width": width,
      "stroke-linecap": "round",
      filter: "url(#glow)"
    }, parent);
  }

  function drawWavePanel(parent, SRT, t, state) {
    panel(parent, SRT, WAVE, "Zwei Teilstrahlen im Interferometer");
    const cfg = SOURCES[state.source];
    const x0 = WAVE.x + 26;
    const x1 = WAVE.x + WAVE.w - 26;
    const yA = WAVE.y + 96;
    const yB = WAVE.y + 184;
    const xc = WAVE.x + WAVE.w / 2 - 72;
    const length = clamp(cfg.lc * 48, 36, WAVE.w - 70);
    const shift = state.dL * 25;
    const phase = -t * 0.006;
    const wA = wavePacket(xc, length, 0.42, phase);
    const wB = wavePacket(xc + shift, length, 0.42, phase);

    SRT.addText(parent, x0, yA - 32, "Arm 1", "label", {
      fill: "#9cecf2",
      "font-size": 11,
      "font-weight": "800"
    });
    SRT.addText(parent, x0, yB - 32, "Arm 2, verschoben um ΔL", "label", {
      fill: "#ff8a91",
      "font-size": 11,
      "font-weight": "800"
    });
    SRT.el("line", { x1: x0, y1: yA, x2: x1, y2: yA, stroke: "rgba(255,255,255,0.12)", "stroke-width": 1 }, parent);
    SRT.el("line", { x1: x0, y1: yB, x2: x1, y2: yB, stroke: "rgba(255,255,255,0.12)", "stroke-width": 1 }, parent);
    drawWavePath(parent, SRT, wA, x0, x1, yA, 22, "#9cecf2", 1.8);
    drawWavePath(parent, SRT, wB, x0, x1, yB, 22, "#ff5161", 1.8);

    const lcL = xc - length / 2;
    const lcR = xc + length / 2;
    SRT.el("line", {
      x1: lcL,
      y1: yA - 46,
      x2: lcR,
      y2: yA - 46,
      stroke: cfg.color,
      "stroke-width": 1.6,
      "stroke-dasharray": "4 4"
    }, parent);
    SRT.addText(parent, (lcL + lcR) / 2, yA - 54, `L_c ≈ ${cfg.lc.toFixed(2)}`, "label", {
      fill: cfg.color,
      "font-size": 10,
      "font-weight": "900",
      "text-anchor": "middle"
    });
  }

  function drawInfoPanel(parent, SRT, state) {
    panel(parent, SRT, INFO, "Linienbreite und Sichtbarkeit");
    const cfg = SOURCES[state.source];
    const v = visibility(state);
    const x = INFO.x + 24;
    const y = INFO.y + 58;

    SRT.addText(parent, x, y, cfg.label, "label", {
      fill: cfg.color,
      "font-size": 15,
      "font-weight": "900"
    });
    addLines(parent, SRT, x, y + 25, cfg.note, {
      fill: "#cfd8e3",
      "font-size": 11,
      "font-weight": "700"
    });
    SRT.addText(parent, x, y + 66, `Linienbreite Δν: ${cfg.short}`, "label", {
      fill: "#ffffff",
      "font-size": 12,
      "font-weight": "800"
    });
    SRT.addText(parent, x, y + 90, `normiert: L_c = ${cfg.lc.toFixed(2)}`, "label", {
      fill: "#ffffff",
      "font-size": 12,
      "font-weight": "800"
    });
    SRT.addText(parent, x, y + 118, "qualitatives Modell:", "label", {
      fill: "#9aaab8",
      "font-size": 11,
      "font-weight": "800"
    });
    SRT.addText(parent, x, y + 143, "L_c ∼ c / Δν", "formula", {
      fill: "#ffffff",
      "font-size": 18,
      "font-weight": "900"
    });
    SRT.addText(parent, x, y + 171, `Modell-Sichtbarkeit V = ${v.toFixed(2)}`, "label", {
      fill: v > 0.45 ? "#2fd17c" : "#ff8a91",
      "font-size": 12,
      "font-weight": "900"
    });
  }

  function drawDetector(parent, SRT, t, state) {
    panel(parent, SRT, DET, "Überlagerung am Detektor");
    const cfg = SOURCES[state.source];
    const v = visibility(state);
    const x0 = DET.x + 30;
    const x1 = DET.x + DET.w - 30;
    const stripeY = DET.y + 58;
    const stripeH = 58;
    const phase = t * 0.003;

    for (let i = 0; i < 64; i += 1) {
      const x = x0 + (i / 64) * (x1 - x0);
      const w = (x1 - x0) / 64 + 1;
      const contrast = 0.45 + 0.45 * v * Math.cos(i * 0.9 + phase);
      const alpha = clamp(contrast, 0.12, 0.95);
      SRT.el("rect", {
        x,
        y: stripeY,
        width: w,
        height: stripeH,
        fill: cfg.color,
        opacity: alpha
      }, parent);
    }
    SRT.el("rect", {
      x: x0,
      y: stripeY,
      width: x1 - x0,
      height: stripeH,
      rx: 8,
      fill: "none",
      stroke: "rgba(255,255,255,0.2)"
    }, parent);

    const msg = state.dL <= cfg.lc
      ? ["ΔL innerhalb der Kohärenzlänge:", "Streifen bleiben gut sichtbar."]
      : ["ΔL größer als Kohärenzlänge:", "Streifenkontrast bricht ein."];
    addLines(parent, SRT, DET.x + 30, DET.y + 146, msg, {
      fill: state.dL <= cfg.lc ? "#2fd17c" : "#ff8a91",
      "font-size": 11,
      "font-weight": "900"
    }, 14);
    SRT.addText(parent, DET.x + DET.w - 30, DET.y + 152, "Modell: V(ΔL) = exp(-π |ΔL| / L_c)", "label", {
      fill: "#cfd8e3",
      "font-size": 12,
      "font-weight": "800",
      "text-anchor": "end"
    });
  }

  window.SRTSlide.register("laser-koharenz", {
    initialState: { source: "laser", dL: 1.4 },
    controls: [
      {
        type: "group",
        label: "Lichtquelle",
        controls: [
          {
            label: "Glühlampe",
            ariaLabel: "Glühlampe als Lichtquelle auswählen",
            pressed: (state) => state.source === "thermal",
            apply: (state) => { state.source = "thermal"; }
          },
          {
            label: "Spektrallampe",
            ariaLabel: "Spektrallampe als Lichtquelle auswählen",
            pressed: (state) => state.source === "spectral",
            apply: (state) => { state.source = "spectral"; }
          },
          {
            label: "Laser",
            ariaLabel: "Laser als Lichtquelle auswählen",
            pressed: (state) => state.source === "laser",
            apply: (state) => { state.source = "laser"; }
          }
        ]
      },
      {
        type: "range",
        key: "dL",
        label: "Wegdifferenz ΔL",
        ariaLabel: "Wegdifferenz zwischen den Interferometerarmen",
        min: 0,
        max: MAX_DL,
        step: 0.1,
        format: (value) => `${Number(value).toFixed(1)} norm. Einh.`
      }
    ],
    render: ({ parent, t, state, SRT }) => {
      SRT.clear(parent);
      SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#101725" }, parent);
      drawWavePanel(parent, SRT, t, state);
      drawInfoPanel(parent, SRT, state);
      drawDetector(parent, SRT, t, state);
    }
  });
})();
