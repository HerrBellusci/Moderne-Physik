(function () {
  const W = 862, H = 506;
  const MATH_FONT = "Cambria Math, STIX Two Math, Latin Modern Math, Times New Roman, serif";

  // Plotfläche und Ursprung des Koordinatensystems
  const PLOT = { x: 64, y: 70, w: 512, h: 384 };
  const O = { x: PLOT.x + PLOT.w / 2, y: PLOT.y + PLOT.h / 2 };
  const SCALE = 46; // Pixel pro Einheit

  // Zwei Punkte auf demselben Kreis um den Ursprung (Radius 2,5).
  // Sie drehen sich gemeinsam, die Achsen bleiben fest. Ihr Abstand ist genau 4 Einheiten.
  const A0 = { x: -2, y: 1.5 };
  const B0 = { x: 2, y: 1.5 };
  const RADIUS = Math.hypot(A0.x, A0.y); // = 2,5 Einheiten

  const COL = {
    a: "#6d5dfc",
    b: "#c2414b",
    seg: "#172033",
    grid: "#e6ebf2",
    axis: "#172033",
    panelLine: "#e2e8f0",
    invariant: "#2e7d50",
    muted: "#5c6678"
  };

  // Mathe-Koordinaten (Einheiten, y nach oben) auf Bildschirm-Koordinaten
  function S(mx, my) {
    return { x: O.x + mx * SCALE, y: O.y - my * SCALE };
  }
  function rotate(P, c, s) {
    return { x: P.x * c - P.y * s, y: P.x * s + P.y * c };
  }
  function fmt(value, digits) {
    if (Math.abs(value) < 0.05) value = 0;
    return value.toFixed(digits).replace(".", ",");
  }

  window.SRTSlide.register("drehung-invarianz", ({ parent, t, SRT }) => {
    const theta = ((t || 0) / 16000) * Math.PI * 2; // eine Umdrehung pro 16 s
    const c = Math.cos(theta), s = Math.sin(theta);
    const A = rotate(A0, c, s), B = rotate(B0, c, s);
    const dx = B.x - A.x, dy = B.y - A.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    SRT.clear(parent);
    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#f7f9fb" }, parent);

    drawTitle(parent, SRT);
    SRT.el("rect", { x: PLOT.x, y: PLOT.y, width: PLOT.w, height: PLOT.h, rx: 12,
      fill: "#ffffff", stroke: "rgba(23,32,51,0.14)", "stroke-width": 2 }, parent);
    drawGrid(parent, SRT);
    drawAxes(parent, SRT);
    drawOrbit(parent, SRT);
    drawProjection(parent, SRT, A, COL.a);
    drawProjection(parent, SRT, B, COL.b);
    drawSegment(parent, SRT, A, B);
    drawPoint(parent, SRT, A, "A", COL.a);
    drawPoint(parent, SRT, B, "B", COL.b);
    drawPanel(parent, SRT, A, B, dx, dy, dist);
  });

  function drawTitle(parent, SRT) {
    SRT.addText(parent, W / 2, 32, "Drehung um den Ursprung", "label", {
      "text-anchor": "middle", fill: "#172033", "font-size": 18, "font-weight": 900
    });
    SRT.addText(parent, W / 2, 54, "Die Punkte drehen sich, ihre Koordinaten ändern sich, der Abstand bleibt invariant.", "tiny", {
      "text-anchor": "middle", fill: COL.muted, "font-size": 12.5, "font-weight": 700
    });
  }

  function drawGrid(parent, SRT) {
    for (let i = -5; i <= 5; i += 1) {
      if (i === 0) continue;
      const x = O.x + i * SCALE;
      if (x > PLOT.x + 4 && x < PLOT.x + PLOT.w - 4) {
        SRT.el("line", { x1: x, y1: PLOT.y + 6, x2: x, y2: PLOT.y + PLOT.h - 6,
          stroke: COL.grid, "stroke-width": 1 }, parent);
      }
    }
    for (let j = -4; j <= 4; j += 1) {
      if (j === 0) continue;
      const y = O.y - j * SCALE;
      if (y > PLOT.y + 4 && y < PLOT.y + PLOT.h - 4) {
        SRT.el("line", { x1: PLOT.x + 6, y1: y, x2: PLOT.x + PLOT.w - 6, y2: y,
          stroke: COL.grid, "stroke-width": 1 }, parent);
      }
    }
  }

  function arrowHead(parent, SRT, tip, ux, uy) {
    const px = -uy, py = ux;
    const b1 = `${tip.x - 12 * ux + 5 * px},${tip.y - 12 * uy + 5 * py}`;
    const b2 = `${tip.x - 12 * ux - 5 * px},${tip.y - 12 * uy - 5 * py}`;
    SRT.el("polygon", { points: `${tip.x},${tip.y} ${b1} ${b2}`, fill: COL.axis }, parent);
  }

  function drawAxes(parent, SRT) {
    const x0 = PLOT.x + 14, x1 = PLOT.x + PLOT.w - 14;
    const y0 = PLOT.y + PLOT.h - 14, y1 = PLOT.y + 14;
    SRT.el("line", { x1: x0, y1: O.y, x2: x1, y2: O.y, stroke: COL.axis, "stroke-width": 2.2, "stroke-linecap": "round" }, parent);
    SRT.el("line", { x1: O.x, y1: y0, x2: O.x, y2: y1, stroke: COL.axis, "stroke-width": 2.2, "stroke-linecap": "round" }, parent);
    arrowHead(parent, SRT, { x: x1 + 8, y: O.y }, 1, 0);
    arrowHead(parent, SRT, { x: O.x, y: y1 - 8 }, 0, -1);
    SRT.addText(parent, x1 + 6, O.y + 20, "x", "tiny", { "text-anchor": "middle", fill: COL.muted, "font-size": 13, "font-weight": 800 });
    SRT.addText(parent, O.x - 16, y1 - 4, "y", "tiny", { "text-anchor": "middle", fill: COL.muted, "font-size": 13, "font-weight": 800 });
    SRT.el("circle", { cx: O.x, cy: O.y, r: 3, fill: COL.axis }, parent);
  }

  function drawOrbit(parent, SRT) {
    SRT.el("circle", { cx: O.x, cy: O.y, r: RADIUS * SCALE, fill: "none", stroke: COL.muted,
      "stroke-width": 1.3, "stroke-dasharray": "3 5", opacity: 0.45 }, parent);
  }

  function drawProjection(parent, SRT, P, color) {
    const ps = S(P.x, P.y);
    SRT.el("line", { x1: ps.x, y1: ps.y, x2: ps.x, y2: O.y, stroke: color, "stroke-width": 1.3, "stroke-dasharray": "4 4", opacity: 0.55 }, parent);
    SRT.el("line", { x1: ps.x, y1: ps.y, x2: O.x, y2: ps.y, stroke: color, "stroke-width": 1.3, "stroke-dasharray": "4 4", opacity: 0.55 }, parent);
  }

  function drawSegment(parent, SRT, A, B) {
    const As = S(A.x, A.y), Bs = S(B.x, B.y);
    SRT.el("line", { x1: As.x, y1: As.y, x2: Bs.x, y2: Bs.y, stroke: COL.seg, "stroke-width": 3, "stroke-linecap": "round" }, parent);
    const mx = (As.x + Bs.x) / 2, my = (As.y + Bs.y) / 2;
    SRT.addText(parent, mx + 10, my - 8, "d", "tiny", { fill: COL.invariant, "font-size": 15, "font-weight": 900, "font-family": MATH_FONT });
  }

  function drawPoint(parent, SRT, P, label, color) {
    const ps = S(P.x, P.y);
    SRT.el("circle", { cx: ps.x, cy: ps.y, r: 7, fill: color, stroke: "#ffffff", "stroke-width": 2.5 }, parent);
    SRT.addText(parent, ps.x + 12, ps.y - 10, label, "tiny", { fill: color, "font-size": 14, "font-weight": 900 });
  }

  function drawPanel(parent, SRT, A, B, dx, dy, dist) {
    const x = 624, y = 78, w = 210, h = 350;
    SRT.el("rect", { x, y, width: w, height: h, rx: 12, fill: "#ffffff", stroke: "rgba(23,32,51,0.14)", "stroke-width": 2 }, parent);
    const ix = x + 18;
    SRT.addText(parent, ix, y + 30, "Koordinaten", "label", { fill: "#172033", "font-size": 14, "font-weight": 900 });

    SRT.addText(parent, ix, y + 62, `*A* = (${fmt(A.x, 1)} | ${fmt(A.y, 1)})`, "label", { fill: COL.a, "font-size": 15, "font-weight": 900, "font-family": MATH_FONT });
    SRT.addText(parent, ix, y + 88, `*B* = (${fmt(B.x, 1)} | ${fmt(B.y, 1)})`, "label", { fill: COL.b, "font-size": 15, "font-weight": 900, "font-family": MATH_FONT });

    SRT.el("line", { x1: ix, y1: y + 108, x2: x + w - 18, y2: y + 108, stroke: COL.panelLine, "stroke-width": 1.5 }, parent);

    SRT.addText(parent, ix, y + 134, "Differenz", "tiny", { fill: COL.muted, "font-size": 12, "font-weight": 850 });
    SRT.addText(parent, ix, y + 160, `Δ*x* = ${fmt(dx, 1)}`, "label", { fill: "#172033", "font-size": 15, "font-weight": 850, "font-family": MATH_FONT });
    SRT.addText(parent, ix, y + 184, `Δ*y* = ${fmt(dy, 1)}`, "label", { fill: "#172033", "font-size": 15, "font-weight": 850, "font-family": MATH_FONT });

    SRT.el("line", { x1: ix, y1: y + 204, x2: x + w - 18, y2: y + 204, stroke: COL.panelLine, "stroke-width": 1.5 }, parent);

    SRT.addText(parent, ix, y + 230, "Abstand (invariant)", "tiny", { fill: COL.invariant, "font-size": 12, "font-weight": 900 });
    SRT.addText(parent, ix, y + 264, `*d* = ${fmt(dist, 2)}`, "label", { fill: COL.invariant, "font-size": 24, "font-weight": 900, "font-family": MATH_FONT });

    SRT.addText(parent, ix, y + 304, "A und B drehen sich um", "tiny", { fill: COL.muted, "font-size": 12, "font-weight": 700 });
    SRT.addText(parent, ix, y + 320, "den Ursprung. Ihre Koordi-", "tiny", { fill: COL.muted, "font-size": 12, "font-weight": 700 });
    SRT.addText(parent, ix, y + 336, "naten ändern sich, d bleibt.", "tiny", { fill: COL.muted, "font-size": 12, "font-weight": 700 });
  }
})();
