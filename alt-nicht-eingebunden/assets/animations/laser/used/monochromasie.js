(function () {
  const W = 862;
  const VH = 360;

  const PX0 = 150;   // Position der I-Achse
  const PX1 = 780;   // Ende der f-Achse
  const XC = 460;    // Lage von f0 (gemeinsame Mittenfrequenz)

  const A = { base: 158, h: 96, sigma: 68, fill: "#f3d36b", stroke: "#c79a1e" }; // Spektrallampe
  const B = { base: 320, h: 96, sigma: 2.4, fill: "#e23b3b", stroke: "#b02525" }; // Laser

  const INK = "#1b2330";
  const AX = "#3a4356";

  function arrowhead(parent, SRT, x, y, dir, color) {
    // dir: "r","l","u" -> Pfeilspitze nach rechts/links/oben
    let p1, p2;
    if (dir === "r") { p1 = [x - 7, y - 4]; p2 = [x - 7, y + 4]; }
    else if (dir === "l") { p1 = [x + 7, y - 4]; p2 = [x + 7, y + 4]; }
    else { p1 = [x - 4, y + 7]; p2 = [x + 4, y + 7]; }
    SRT.el("line", { x1: p1[0], y1: p1[1], x2: x, y2: y, stroke: color, "stroke-width": 1.4 }, parent);
    SRT.el("line", { x1: p2[0], y1: p2[1], x2: x, y2: y, stroke: color, "stroke-width": 1.4 }, parent);
  }

  function widthArrow(parent, SRT, x1, x2, y, color) {
    SRT.el("line", { x1, y1: y, x2, y2: y, stroke: color, "stroke-width": 1.4 }, parent);
    arrowhead(parent, SRT, x1, y, "l", color);
    arrowhead(parent, SRT, x2, y, "r", color);
  }

  function gaussPath(cfg) {
    let d = "";
    for (let x = PX0; x <= PX1; x += 2) {
      const u = (x - XC) / cfg.sigma;
      const y = cfg.base - cfg.h * Math.exp(-u * u);
      d += `${x === PX0 ? "M" : "L"}${x} ${y.toFixed(1)} `;
    }
    return d;
  }

  function panel(parent, SRT, cfg, name, dfLabel) {
    // Achsen
    SRT.el("line", { x1: PX0, y1: cfg.base, x2: PX1, y2: cfg.base, stroke: AX, "stroke-width": 1.4 }, parent);
    arrowhead(parent, SRT, PX1, cfg.base, "r", AX);
    SRT.el("line", { x1: PX0, y1: cfg.base, x2: PX0, y2: cfg.base - cfg.h - 16, stroke: AX, "stroke-width": 1.4 }, parent);
    arrowhead(parent, SRT, PX0, cfg.base - cfg.h - 16, "u", AX);
    SRT.addText(parent, PX0 - 16, cfg.base - cfg.h - 8, "I", "label", { fill: AX, "font-size": 14, "font-weight": "700", "font-style": "italic" });
    SRT.addText(parent, PX1 + 6, cfg.base + 5, "f", "label", { fill: AX, "font-size": 14, "font-weight": "700", "font-style": "italic" });

    // Quellenname
    SRT.addText(parent, 24, cfg.base - cfg.h + 6, name, "label", { fill: INK, "font-size": 15, "font-weight": "800" });

    // Kurve
    SRT.el("path", { d: gaussPath(cfg), fill: cfg.fill, "fill-opacity": 0.55, stroke: cfg.stroke, "stroke-width": 2 }, parent);

    // Breiten-Pfeil bei halber Höhe
    const half = cfg.sigma * Math.sqrt(Math.log(2));
    const yArr = cfg.base - cfg.h / 2;
    widthArrow(parent, SRT, XC - half, XC + half, yArr, INK);
    SRT.addText(parent, XC + Math.max(half, 6) + 14, yArr + 4, dfLabel, "label", { fill: INK, "font-size": 14, "font-weight": "800" });

    // f0-Markierung
    SRT.el("line", { x1: XC, y1: cfg.base, x2: XC, y2: cfg.base + 5, stroke: AX, "stroke-width": 1.2 }, parent);
    SRT.addText(parent, XC, cfg.base + 20, "f₀", "label", { fill: AX, "font-size": 12, "font-weight": "700", "text-anchor": "middle" });
  }

  window.SRTSlide.register("laser-monochromasie", {
    showMotionControl: false,
    render: ({ parent, SRT }) => {
      SRT.clear(parent);
      SRT.el("rect", { x: 0, y: 0, width: W, height: VH, rx: 14, fill: "#ffffff", stroke: "#e2e7ef" }, parent);
      SRT.addText(parent, 24, 34, "Linienbreite Δf: Spektrallampe und Laser", "label", { fill: INK, "font-size": 16, "font-weight": "800" });
      panel(parent, SRT, A, "Spektrallampe", "Δf ≈ 10 GHz");
      panel(parent, SRT, B, "Laser", "Δf ≈ wenige MHz");
    }
  });
})();
