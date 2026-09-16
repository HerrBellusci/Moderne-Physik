(function () {
  const INK = "#172033";
  const MUTED = "#64748b";
  const HILL_FILL = "#eef2f8";
  const HILL_EDGE = "#94a3b8";
  const BALL = "#2563eb";
  const LEVEL = "#334155";

  const X0 = 72;
  const X1 = 526;
  const R = 13;
  const XM = 228;   // Mulde (metastabil)
  const XB = 300;   // kleine Barriere hinter der Mulde
  const BOTTOM = 476;
  const CYCLE = 6200;
  const PANEL = { x: 568, y: 82, w: 246, h: 344 };
  const LEVELS = [
    { key: "E₃", name: "Pumpniveau", y: 142 },
    { key: "E₂", name: "metastabil", y: 266 },
    { key: "E₁", name: "Grundzustand", y: 390 }
  ];

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

  function gauss(x, c, w) {
    const d = (x - c) / w;
    return Math.exp(-d * d);
  }

  function yBase(x) {
    return 160 + 250 * ((x - X0) / (X1 - X0));
  }

  function terrain(x) {
    return yBase(x) + 42 * gauss(x, XM, 55) - 28 * gauss(x, XB, 45);
  }

  function ballX(cy) {
    if (cy < 0.15) return mix(X0, XM, ease(cy / 0.15));
    if (cy < 0.70) return XM;
    if (cy < 0.90) return mix(XM, X1, ease((cy - 0.70) / 0.20));
    return X1;
  }

  function levelDotY(cy) {
    if (cy < 0.15) return mix(LEVELS[0].y, LEVELS[1].y, ease(cy / 0.15));
    if (cy < 0.70) return LEVELS[1].y;
    if (cy < 0.90) return mix(LEVELS[1].y, LEVELS[2].y, ease((cy - 0.70) / 0.20));
    return LEVELS[2].y;
  }

  function drawLevelDiagram(parent, SRT, cy, opacity) {
    SRT.el("rect", {
      x: PANEL.x, y: PANEL.y, width: PANEL.w, height: PANEL.h, rx: 8,
      fill: "#f8fafc", stroke: "#e2e8f0"
    }, parent);
    SRT.addText(parent, PANEL.x + PANEL.w / 2, PANEL.y + 30, "Drei-Niveau-System", "label", {
      fill: INK, "font-size": 16, "font-weight": "850", "text-anchor": "middle"
    });

    const x0 = PANEL.x + 116;
    const x1 = PANEL.x + 218;
    LEVELS.forEach((level) => {
      SRT.addText(parent, PANEL.x + 20, level.y + 5, level.key, "label", {
        fill: INK, "font-size": 15, "font-weight": "850", "text-anchor": "start"
      });
      SRT.addText(parent, PANEL.x + 54, level.y + 18, level.name, "label", {
        fill: MUTED, "font-size": 12.5, "font-weight": "750", "text-anchor": "start"
      });
      SRT.el("line", {
        x1: x0, y1: level.y, x2: x1, y2: level.y,
        stroke: LEVEL, "stroke-width": 2.4, "stroke-linecap": "round"
      }, parent);
    });

    SRT.el("line", {
      x1: PANEL.x + 210, y1: LEVELS[0].y + 8, x2: PANEL.x + 210, y2: LEVELS[2].y - 8,
      stroke: "#cbd5e1", "stroke-width": 1.4, "stroke-dasharray": "4 7"
    }, parent);
    SRT.el("circle", {
      cx: PANEL.x + 210, cy: levelDotY(cy), r: 7.5,
      fill: BALL, stroke: "#ffffff", "stroke-width": 1.8, opacity, filter: "url(#glow)"
    }, parent);
  }

  function draw({ parent, t, SRT }) {
    SRT.clear(parent);
    SRT.el("rect", { x: 0, y: 0, width: 862, height: 506, rx: 8, fill: "#ffffff", stroke: "#e2e8f0" }, parent);

    let edge = `M${X0} ${terrain(X0).toFixed(1)}`;
    for (let x = X0 + 4; x <= X1; x += 4) edge += ` L${x} ${terrain(x).toFixed(1)}`;

    SRT.el("path", { d: `${edge} L${X1} ${BOTTOM} L${X0} ${BOTTOM} Z`, fill: HILL_FILL, stroke: "none" }, parent);
    SRT.el("path", { d: edge, fill: "none", stroke: HILL_EDGE, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, parent);

    SRT.addText(parent, X0 + 4, terrain(X0) - R - 12, "angeregt", "label", { fill: MUTED, "font-size": 14, "font-weight": "750", "text-anchor": "start" });
    SRT.addText(parent, XM, terrain(XM) - R - 16, "Mulde", "label", { fill: INK, "font-size": 15, "font-weight": "800", "text-anchor": "middle" });
    SRT.addText(parent, X1, terrain(X1) - R - 12, "Grundzustand", "label", { fill: MUTED, "font-size": 14, "font-weight": "750", "text-anchor": "end" });

    const cy = (t % CYCLE) / CYCLE;
    let bx = ballX(cy);
    if (cy >= 0.15 && cy < 0.70) bx += Math.sin(t * 0.018) * 3.5;
    const by = terrain(bx) - R;

    let op = 1;
    if (cy < 0.05) op = ease(cy / 0.05);
    else if (cy > 0.95) op = 1 - ease((cy - 0.95) / 0.05);

    SRT.el("circle", { cx: bx, cy: by, r: R, fill: BALL, stroke: "#ffffff", "stroke-width": 2, opacity: op, filter: "url(#glow)" }, parent);
    drawLevelDiagram(parent, SRT, cy, op);
  }

  window.SRTSlide.register("laser-metastabil", {
    render: draw
  });
})();
