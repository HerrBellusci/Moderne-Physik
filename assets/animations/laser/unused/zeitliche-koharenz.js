(function () {
  const W = 862;
  const H = 506;
  const OMEGA = 6;
  const U_PER_PX = 0.045;
  const SPEED = 0.0022;

  const SOURCES = {
    thermal: {
      label: "Glühlampe",
      tc: 1.5,
      seed: 1,
      jitter: 0.5,
      color: "#64748b",
      note: "sehr kurze Stücke, jedes mit anderer Wellenlänge: der Takt geht fast sofort verloren"
    },
    spectral: {
      label: "Spektrallampe",
      tc: 7,
      seed: 2,
      jitter: 0,
      color: "#f59e0b",
      note: "mittellange Stücke: der Takt hält einige Schwingungen"
    },
    laser: {
      label: "Laser",
      tc: 120,
      seed: 3,
      jitter: 0,
      color: "#e11d48",
      note: "sehr lange Stücke: der Takt bleibt über das ganze Bild erhalten"
    }
  };

  const MAIN = { x: 24, y: 24, w: 814, h: 366 };
  const INFO = { x: 24, y: 406, w: 814, h: 76 };

  function segPhase(k, seed) {
    const raw = Math.sin(k * 127.1 + seed * 311.7) * 43758.5453;
    return (raw - Math.floor(raw)) * Math.PI * 2;
  }

  function segFreq(k, cfg) {
    if (!cfg.jitter) return OMEGA;
    const raw = Math.sin(k * 269.5 + cfg.seed * 97.3) * 43758.5453;
    const r = raw - Math.floor(raw);
    return OMEGA * (1 + (r - 0.5) * cfg.jitter);
  }

  function panel(parent, SRT, box, title) {
    SRT.el("rect", {
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      rx: 10,
      fill: "#f8fafc",
      stroke: "#e2e8f0"
    }, parent);
    if (title) {
      SRT.addText(parent, box.x + 16, box.y + 26, title, "label", {
        fill: "#172033",
        "font-size": 13,
        "font-weight": "900"
      });
    }
  }

  function drawMain(parent, SRT, t, state) {
    panel(parent, SRT, MAIN, "Ein Wellenzug läuft vorbei");
    const cfg = SOURCES[state.source];
    const x0 = MAIN.x + 26;
    const x1 = MAIN.x + MAIN.w - 26;
    const yMid = MAIN.y + 170;
    const amp = 62;
    const uShift = t * SPEED;

    SRT.el("line", {
      x1: x0,
      y1: yMid,
      x2: x1,
      y2: yMid,
      stroke: "rgba(23,32,51,0.12)",
      "stroke-width": 1
    }, parent);

    SRT.el("line", {
      x1: x0,
      y1: MAIN.y + 300,
      x2: x0 + 190,
      y2: MAIN.y + 300,
      stroke: "#475569",
      "stroke-width": 2.4,
      "marker-end": "none"
    }, parent);
    SRT.el("path", {
      d: `M${x0 + 190} ${MAIN.y + 300} l-12 -6 l0 12 z`,
      fill: "#475569"
    }, parent);
    SRT.addText(parent, x0, MAIN.y + 322, "Ausbreitungsrichtung", "label", {
      fill: "#475569",
      "font-size": 11,
      "font-weight": "800"
    });

    let d = "";
    for (let x = x0; x <= x1; x += 1) {
      const u = x * U_PER_PX - uShift;
      const k = Math.floor(u / cfg.tc);
      const y = yMid + Math.sin(u * segFreq(k, cfg) + segPhase(k, cfg.seed)) * amp;
      d += `${x === x0 ? "M" : "L"}${x} ${y} `;
    }
    SRT.el("path", {
      d,
      fill: "none",
      stroke: cfg.color,
      "stroke-width": 2.2,
      "stroke-linecap": "round",
      filter: "url(#glow)"
    }, parent);

    const kFirst = Math.ceil((x0 * U_PER_PX - uShift) / cfg.tc);
    for (let k = kFirst; k * cfg.tc + uShift < x1 * U_PER_PX; k += 1) {
      const x = (k * cfg.tc + uShift) / U_PER_PX;
      SRT.el("line", {
        x1: x,
        y1: yMid - amp - 14,
        x2: x,
        y2: yMid + amp + 14,
        stroke: "#94a3b8",
        "stroke-width": 1.2,
        "stroke-dasharray": "4 4"
      }, parent);
    }

    const uCenter = ((x0 + x1) / 2) * U_PER_PX - uShift;
    const kMid = Math.floor(uCenter / cfg.tc);
    const segL = (kMid * cfg.tc + uShift) / U_PER_PX;
    const segR = ((kMid + 1) * cfg.tc + uShift) / U_PER_PX;
    const arrY = yMid - amp - 34;
    const aL = Math.max(segL, x0);
    const aR = Math.min(segR, x1);
    SRT.el("line", {
      x1: aL,
      y1: arrY,
      x2: aR,
      y2: arrY,
      stroke: "#16a34a",
      "stroke-width": 2
    }, parent);
    if (segL >= x0) {
      SRT.el("path", { d: `M${aL} ${arrY} l10 -5 l0 10 z`, fill: "#16a34a" }, parent);
    }
    if (segR <= x1) {
      SRT.el("path", { d: `M${aR} ${arrY} l-10 -5 l0 10 z`, fill: "#16a34a" }, parent);
    }
    const fits = segL >= x0 && segR <= x1;
    SRT.addText(parent, (aL + aR) / 2, arrY - 10, fits
      ? "ungestörtes Stück: die Kohärenzlänge"
      : "Kohärenzlänge: größer als der Bildausschnitt", "label", {
      fill: "#16a34a",
      "font-size": 12,
      "font-weight": "900",
      "text-anchor": "middle"
    });

    SRT.addText(parent, x1, MAIN.y + MAIN.h - 14, "gestrichelt: Phasensprung, der Wellenzug vergisst seinen Takt", "label", {
      fill: "#64748b",
      "font-size": 11,
      "font-weight": "700",
      "text-anchor": "end"
    });
  }

  function drawInfo(parent, SRT, state) {
    panel(parent, SRT, INFO, null);
    const cfg = SOURCES[state.source];
    SRT.addText(parent, INFO.x + 20, INFO.y + 30, cfg.label, "label", {
      fill: cfg.color,
      "font-size": 14,
      "font-weight": "900"
    });
    SRT.addText(parent, INFO.x + 20, INFO.y + 52, cfg.note, "label", {
      fill: "#475569",
      "font-size": 12,
      "font-weight": "700"
    });
    SRT.addText(parent, INFO.x + INFO.w - 20, INFO.y + 52, "Kohärenzzeit: die Dauer, in der ein ungestörtes Stück vorbeiläuft", "label", {
      fill: "#64748b",
      "font-size": 11,
      "font-weight": "700",
      "text-anchor": "end"
    });
  }

  window.SRTSlide.register("laser-zeitliche-koharenz", {
    showMotionControl: false,
    initialState: { source: "laser" },
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
      }
    ],
    render: ({ parent, t, state, SRT }) => {
      SRT.clear(parent);
      SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 8, fill: "#ffffff", stroke: "#e2e8f0" }, parent);
      drawMain(parent, SRT, t, state);
      drawInfo(parent, SRT, state);
    }
  });
})();
