(function () {
  const W = 862;
  const H = 430;
  const INK = "#172033";
  const MUTED = "#64748b";
  const LEVEL = "#334155";
  const PUMP = "#2563eb";
  const AMBER = "#f59e0b";
  const RED = "#e11d48";
  const GREEN = "#16a34a";

  const MAIN = { x: 24, y: 24, w: 814, h: 330 };
  const INFO = { x: 24, y: 368, w: 814, h: 44 };
  const CHIP = { x0: 300, x1: 560, y0: 120, y1: 230 };
  const ACT = { y0: 160, y1: 188 };
  const ITH = 5;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, p) { return a + (b - a) * clamp(p, 0, 1); }

  function panel(parent, SRT, box, title) {
    SRT.el("rect", {
      x: box.x, y: box.y, width: box.w, height: box.h, rx: 10,
      fill: "#f8fafc", stroke: "#e2e8f0"
    }, parent);
    if (title) {
      SRT.addText(parent, box.x + 16, box.y + 26, title, "label", {
        fill: INK, "font-size": 13, "font-weight": "900"
      });
    }
  }

  function drawChip(parent, SRT, t, strom) {
    panel(parent, SRT, MAIN, "Laserdiode im Querschnitt");
    const actMid = (ACT.y0 + ACT.y1) / 2;

    // Kontakte und Stromzufuhr
    SRT.el("rect", { x: CHIP.x0 - 8, y: CHIP.y0 - 14, width: CHIP.x1 - CHIP.x0 + 16, height: 14, rx: 3, fill: LEVEL }, parent);
    SRT.el("rect", { x: CHIP.x0 - 8, y: CHIP.y1, width: CHIP.x1 - CHIP.x0 + 16, height: 14, rx: 3, fill: LEVEL }, parent);
    SRT.addText(parent, CHIP.x0 - 24, CHIP.y0 - 2, "+", "label", { fill: INK, "font-size": 16, "font-weight": "900", "text-anchor": "middle" });
    SRT.addText(parent, CHIP.x0 - 24, CHIP.y1 + 14, "−", "label", { fill: INK, "font-size": 16, "font-weight": "900", "text-anchor": "middle" });

    const iOp = 0.2 + 0.8 * (strom / 10);
    SRT.el("line", { x1: 430, y1: 66, x2: 430, y2: CHIP.y0 - 18, stroke: PUMP, "stroke-width": mix(1.5, 4, strom / 10), opacity: iOp }, parent);
    SRT.el("path", { d: `M425 ${CHIP.y0 - 26} L430 ${CHIP.y0 - 18} L435 ${CHIP.y0 - 26}`, fill: "none", stroke: PUMP, "stroke-width": mix(1.5, 4, strom / 10), opacity: iOp, "stroke-linecap": "round", "stroke-linejoin": "round" }, parent);
    SRT.addText(parent, 442, 78, "Strom", "label", { fill: PUMP, "font-size": 12, "font-weight": "800", "text-anchor": "start" });

    // Schichten
    SRT.el("rect", { x: CHIP.x0, y: CHIP.y0, width: CHIP.x1 - CHIP.x0, height: ACT.y0 - CHIP.y0, fill: "#dbeafe" }, parent);
    SRT.el("rect", { x: CHIP.x0, y: ACT.y0, width: CHIP.x1 - CHIP.x0, height: ACT.y1 - ACT.y0, fill: "#fee2e2" }, parent);
    SRT.el("rect", { x: CHIP.x0, y: ACT.y1, width: CHIP.x1 - CHIP.x0, height: CHIP.y1 - ACT.y1, fill: "#dcfce7" }, parent);
    SRT.el("rect", { x: CHIP.x0, y: CHIP.y0, width: CHIP.x1 - CHIP.x0, height: CHIP.y1 - CHIP.y0, fill: "none", stroke: "#94a3b8", "stroke-width": 1.5 }, parent);
    SRT.addText(parent, CHIP.x0 - 40, (CHIP.y0 + ACT.y0) / 2 + 4, "p-Schicht", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "end" });
    SRT.addText(parent, CHIP.x0 - 40, actMid + 4, "aktive Zone", "label", { fill: RED, "font-size": 12, "font-weight": "800", "text-anchor": "end" });
    SRT.addText(parent, CHIP.x0 - 40, (ACT.y1 + CHIP.y1) / 2 + 4, "n-Schicht", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "end" });

    // Endflächen als Spiegel
    SRT.el("rect", { x: CHIP.x0 - 4, y: CHIP.y0, width: 4, height: CHIP.y1 - CHIP.y0, fill: "#334155" }, parent);
    SRT.el("rect", { x: CHIP.x1, y: CHIP.y0, width: 4, height: CHIP.y1 - CHIP.y0, fill: "#94a3b8" }, parent);
    SRT.addText(parent, (CHIP.x0 + CHIP.x1) / 2, CHIP.y1 + 40, "glatte Endflächen wirken als Spiegel, die rechte ist teildurchlässig", "label", { fill: MUTED, "font-size": 11.5, "font-weight": "700", "text-anchor": "middle" });

    // Elektronen (von unten) und Löcher (von oben) wandern in die aktive Zone
    const nCarrier = Math.round(mix(1, 4, strom / 10));
    for (let i = 0; i < nCarrier; i += 1) {
      const xe = CHIP.x0 + 40 + (i * 67) % (CHIP.x1 - CHIP.x0 - 80);
      const pe = ((t * 0.0004 + i * 0.27) % 1);
      SRT.el("circle", { cx: xe, cy: mix(CHIP.y1 - 6, actMid, pe), r: 3.2, fill: PUMP, opacity: 0.9 }, parent);
      const xh = CHIP.x0 + 70 + (i * 59) % (CHIP.x1 - CHIP.x0 - 100);
      const ph = ((t * 0.00037 + i * 0.31) % 1);
      SRT.el("circle", { cx: xh, cy: mix(CHIP.y0 + 6, actMid, ph), r: 3.2, fill: "none", stroke: AMBER, "stroke-width": 2, opacity: 0.9 }, parent);
    }

    // Spontane Emission: Photonen in zufällige Richtungen (LED-Betrieb)
    const nLed = strom <= ITH ? Math.round(mix(0, 6, strom / ITH)) : 3;
    for (let i = 0; i < nLed; i += 1) {
      const ph = (t * 0.0006 + i * 0.41) % 1;
      const ox = CHIP.x0 + 30 + (i * 83) % (CHIP.x1 - CHIP.x0 - 60);
      const ang = i * 2.39996 + 0.7;
      const r = ph * 46;
      const px = ox + r * Math.cos(ang);
      const py = actMid + r * Math.sin(ang);
      SRT.el("circle", { cx: px, cy: py, r: 3, fill: RED, opacity: (1 - ph) * 0.8, filter: "url(#glow)" }, parent);
    }

    // Laserbetrieb oberhalb der Schwelle
    if (strom > ITH) {
      const b = (strom - ITH) / (10 - ITH);
      SRT.el("rect", {
        x: CHIP.x0 + 4, y: actMid - 3, width: CHIP.x1 - CHIP.x0 - 8, height: 6,
        rx: 3, fill: RED, opacity: 0.35 + 0.5 * b, filter: "url(#glow)"
      }, parent);
      SRT.el("rect", {
        x: CHIP.x1 + 4, y: actMid - 3, width: mix(80, 240, b), height: 6,
        rx: 3, fill: RED, opacity: 0.5 + 0.45 * b, filter: "url(#glow)"
      }, parent);
      SRT.el("path", {
        d: `M${CHIP.x1 + 2 + mix(80, 240, b)} ${actMid - 6} L${CHIP.x1 + 14 + mix(80, 240, b)} ${actMid} L${CHIP.x1 + 2 + mix(80, 240, b)} ${actMid + 6}`,
        fill: RED, opacity: 0.5 + 0.45 * b
      }, parent);
      SRT.addText(parent, CHIP.x1 + 60, actMid - 16, "Laserstrahl", "label", { fill: INK, "font-size": 12, "font-weight": "750", "text-anchor": "start" });
    }

    SRT.addText(parent, MAIN.x + MAIN.w - 16, MAIN.y + MAIN.h - 14, "Modellbild, stark vergrößert: der ganze Kristall ist kleiner als ein Millimeter", "label", { fill: MUTED, "font-size": 10.5, "font-weight": "700", "text-anchor": "end" });
  }

  function drawInfo(parent, SRT, strom) {
    panel(parent, SRT, INFO, null);
    const lasing = strom > ITH;
    SRT.addText(parent, INFO.x + 20, INFO.y + 28, lasing
      ? "Strom über der Laserschwelle: stimulierte Emission überwiegt, ein Laserstrahl tritt aus."
      : "Strom unter der Laserschwelle: nur spontane Emission, die Diode leuchtet wie eine LED.", "label", {
      fill: lasing ? GREEN : AMBER,
      "font-size": 12.5,
      "font-weight": "800"
    });
    SRT.addText(parent, INFO.x + INFO.w - 20, INFO.y + 28, `Laserschwelle bei Strom = ${ITH}`, "label", {
      fill: MUTED, "font-size": 11.5, "font-weight": "700", "text-anchor": "end"
    });
  }

  window.SRTSlide.register("laser-halbleiter", {
    showMotionControl: false,
    initialState: { strom: 3 },
    controls: [
      {
        type: "range",
        key: "strom",
        label: "Strom",
        ariaLabel: "Strom durch die Laserdiode",
        min: 0,
        max: 10,
        step: 0.1,
        format: (value) => Number(value).toFixed(1)
      }
    ],
    render: ({ parent, t, state, SRT }) => {
      SRT.clear(parent);
      SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 8, fill: "#ffffff", stroke: "#e2e8f0" }, parent);
      drawChip(parent, SRT, t, state.strom);
      drawInfo(parent, SRT, state.strom);
    }
  });
})();
