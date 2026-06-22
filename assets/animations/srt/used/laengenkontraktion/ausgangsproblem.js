(function () {
  const W = 862, H = 506;
  const MUON_X = 362;
  const TOP_Y = 104;
  const GROUND_Y = 424;
  const FULL_H = GROUND_Y - TOP_Y;
  const BAND = { x: 306, w: 112 };
  const SHIFT = FULL_H * 0.066; // d_M / L_0 ≈ 0.66 km / 10 km
  const CONTR_H = 96; // schematisch vergrößert, damit die Kontraktion gut sichtbar ist
  const MOVE_MS = 4200;
  const HOLD_MS = 1600;

  const INK = "#172033", MUTED = "#5c6678", FAINT = "#cbd5e1";
  const ACCENT = "#6d5dfc", WARN = "#c2414b", AMBER = "#e0a93b", GOOD = "#2e7d50";

  function ease(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }

  function drawBracket(parent, SRT, x, y1, y2, color, side = "right") {
    const dir = side === "right" ? 1 : -1;
    SRT.el("line", { x1: x, y1, x2: x, y2, stroke: color, "stroke-width": 2 }, parent);
    SRT.el("line", { x1: x, y1, x2: x + dir * 12, y2: y1, stroke: color, "stroke-width": 2 }, parent);
    SRT.el("line", { x1: x, y1: y2, x2: x + dir * 12, y2, stroke: color, "stroke-width": 2 }, parent);
  }

  function drawGround(parent, SRT, y) {
    SRT.el("line", {
      x1: BAND.x - 42, y1: y, x2: BAND.x + BAND.w + 42, y2: y,
      stroke: INK, "stroke-width": 3, "stroke-linecap": "round"
    }, parent);
    for (let i = 0; i < 10; i += 1) {
      const x = BAND.x - 36 + i * 20;
      SRT.el("line", { x1: x, y1: y, x2: x - 8, y2: y + 10,
        stroke: INK, "stroke-width": 1.4 }, parent);
    }
  }

  function drawMuon(parent, SRT, rem) {
    SRT.el("circle", { cx: MUON_X, cy: TOP_Y, r: 25, fill: ACCENT, opacity: 0.10 }, parent);
    SRT.el("circle", { cx: MUON_X, cy: TOP_Y, r: 14, fill: "none", stroke: FAINT, "stroke-width": 3.5 }, parent);
    SRT.el("circle", {
      cx: MUON_X, cy: TOP_Y, r: 14, fill: "none", stroke: ACCENT, "stroke-width": 3.5,
      "stroke-linecap": "round", pathLength: 100,
      "stroke-dasharray": `${Math.max(0, rem * 100).toFixed(1)} 100`,
      transform: `rotate(-90 ${MUON_X} ${TOP_Y})`
    }, parent);
    SRT.el("circle", { cx: MUON_X, cy: TOP_Y, r: 5.8, fill: "#ffffff", stroke: ACCENT, "stroke-width": 2 }, parent);
  }

  function render({ parent, t, SRT }) {
    const cycle = MOVE_MS + HOLD_MS;
    const tc = t % cycle;
    const raw = Math.min(tc / MOVE_MS, 1);
    const p = ease(raw);
    const shift = SHIFT * p;
    const top = TOP_Y - shift;
    const ground = GROUND_Y - shift;
    const rem = 1 - raw;

    SRT.clear(parent);
    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#f7f9fb" }, parent);

    SRT.addText(parent, BAND.x - 18, GROUND_Y + 22, "Erdoberfläche (Detektor)", "tiny", {
      "text-anchor": "end", fill: INK, "font-size": 12, "font-weight": "850"
    });

    // Unverkürzte Anfangslänge als gestrichelte Referenz.
    SRT.el("rect", {
      x: BAND.x, y: TOP_Y, width: BAND.w, height: FULL_H, rx: 12,
      fill: "none", stroke: FAINT, "stroke-width": 1.5, "stroke-dasharray": "5 6"
    }, parent);
    drawBracket(parent, SRT, BAND.x - 28, TOP_Y, GROUND_Y, FAINT, "left");

    // Bewegte, aber noch unkontrahierte Atmosphäre.
    SRT.el("rect", {
      x: BAND.x, y: top, width: BAND.w, height: FULL_H, rx: 12,
      fill: "#e9eefb", stroke: "rgba(23,32,51,0.18)", "stroke-width": 2
    }, parent);
    for (let i = 0; i < 6; i += 1) {
      const y = top + 36 + i * 48;
      SRT.el("line", { x1: BAND.x + 12, y1: y, x2: BAND.x + BAND.w - 12, y2: y,
        stroke: "#a5b4fc", "stroke-width": 1.4, "stroke-linecap": "round", opacity: 0.75 }, parent);
    }
    drawGround(parent, SRT, ground);

    // Weg, der während der Eigenzeit tatsächlich am ruhenden Myon vorbeigezogen ist.
    SRT.el("rect", { x: BAND.x, y: TOP_Y - SHIFT, width: BAND.w, height: SHIFT,
      fill: AMBER, opacity: 0.18 }, parent);
    drawBracket(parent, SRT, BAND.x + BAND.w + 22, TOP_Y - SHIFT, TOP_Y, AMBER, "right");

    drawMuon(parent, SRT, rem);

    if (raw >= 1) {
      SRT.el("circle", { cx: MUON_X, cy: TOP_Y, r: 22 + 12 * ((tc - MOVE_MS) / HOLD_MS),
        fill: "none", stroke: WARN, "stroke-width": 3, opacity: Math.max(0, 1 - (tc - MOVE_MS) / HOLD_MS) }, parent);
    }
  }

  window.SRTSlide.register("ausgangsproblem", {
    showMotionControl: false,
    render
  });

  function renderContracted({ parent, t, SRT }) {
    const cycle = MOVE_MS + HOLD_MS;
    const tc = t % cycle;
    const raw = Math.min(tc / MOVE_MS, 1);
    const p = ease(raw);
    const top = TOP_Y - CONTR_H * p;
    const ground = TOP_Y + CONTR_H * (1 - p);
    const rem = Math.max(0.28, 1 - raw * 0.72);

    SRT.clear(parent);
    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#f7f9fb" }, parent);

    SRT.addText(parent, BAND.x - 18, ground + 22, "Erdoberfläche (Detektor)", "tiny", {
      "text-anchor": "end", fill: INK, "font-size": 12, "font-weight": "850"
    });

    // Unverkürzte Länge als Vergleich.
    SRT.el("rect", {
      x: BAND.x, y: TOP_Y, width: BAND.w, height: FULL_H, rx: 12,
      fill: "none", stroke: FAINT, "stroke-width": 1.5, "stroke-dasharray": "5 6"
    }, parent);
    drawBracket(parent, SRT, BAND.x - 28, TOP_Y, GROUND_Y, FAINT, "left");

    // Kontrahierte Atmosphäre im Myon-System.
    SRT.el("rect", {
      x: BAND.x, y: top, width: BAND.w, height: CONTR_H, rx: 12,
      fill: "#e9eefb", stroke: ACCENT, "stroke-width": 2
    }, parent);
    for (let i = 0; i < 4; i += 1) {
      const y = top + 18 + i * 22;
      SRT.el("line", { x1: BAND.x + 12, y1: y, x2: BAND.x + BAND.w - 12, y2: y,
        stroke: "#a5b4fc", "stroke-width": 1.4, "stroke-linecap": "round", opacity: 0.75 }, parent);
    }
    drawGround(parent, SRT, ground);
    drawMuon(parent, SRT, rem);

    if (raw >= 1) {
      const k = Math.min((tc - MOVE_MS) / HOLD_MS, 1);
      SRT.el("circle", { cx: MUON_X, cy: TOP_Y, r: 18 + 28 * k,
        fill: "none", stroke: GOOD, "stroke-width": 3, opacity: Math.max(0, 1 - k) }, parent);
    }
  }

  window.SRTSlide.register("myon-system-kontrahiert", {
    showMotionControl: false,
    render: renderContracted
  });
})();
