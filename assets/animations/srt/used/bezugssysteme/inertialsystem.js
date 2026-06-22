(function () {
  window.SRTSlide.register("inertial", ({ parent, t, SRT }) => {
    SRT.clear(parent);

    SRT.el("rect", { x: 0, y: 0, width: 862, height: 506, rx: 18, fill: "#f7f9fb" }, parent);

    const panelW = 258;
    const panelH = 372;
    const panelY = 56;
    const xs = [30, 302, 574];

    const drift = (t * 0.055) % 86;
    const angle = t * 0.0021;
    const phase = t * 0.0028;

    drawPanel(parent, SRT, xs[0], panelY, panelW, panelH, "Bewegung A");
    drawPanel(parent, SRT, xs[1], panelY, panelW, panelH, "Bewegung B");
    drawPanel(parent, SRT, xs[2], panelY, panelW, panelH, "Bewegung C");

    drawUniformSystem(parent, SRT, xs[0], panelY, panelW, drift);
    drawRotatingSystem(parent, SRT, xs[1], panelY, panelW, angle);
    drawOscillatingSystem(parent, SRT, xs[2], panelY, panelW, phase);
  });

  function drawPanel(parent, SRT, x, y, w, h, title) {
    SRT.el("rect", { x, y, width: w, height: h, rx: 18, fill: "#fff", stroke: "rgba(23,32,51,0.14)", "stroke-width": 2 }, parent);
    SRT.addText(parent, x + w / 2, y + 40, title, "label", { "text-anchor": "middle" });
  }

  function drawUniformSystem(parent, SRT, x, y, w, drift) {
    const innerX = x + 22;
    const innerY = y + 76;
    const innerW = w - 44;
    const innerH = 270;

    const clipId = `clip-uniform-${x}`;
    const defs = SRT.el("defs", {}, parent);
    const clip = SRT.el("clipPath", { id: clipId }, defs);
    SRT.el("rect", { x: innerX, y: innerY, width: innerW, height: innerH, rx: 12 }, clip);

    const space = SRT.el("g", { "clip-path": `url(#${clipId})` }, parent);
    SRT.el("rect", { x: innerX, y: innerY, width: innerW, height: innerH, rx: 12, fill: "#111827" }, space);

    for (let i = 0; i < 22; i++) {
      const sx = innerX + 10 + positiveModulo(i * 47 - drift, innerW - 20);
      const sy = innerY + 14 + positiveModulo(i * 71, innerH - 28);
      SRT.el("circle", { cx: sx, cy: sy, r: i % 3 === 0 ? 2.5 : 1.8, fill: "#fff", opacity: 0.72 }, space);
    }

    const ox = innerX + innerW / 2;
    const oy = innerY + innerH / 2;
    SRT.el("circle", { cx: ox, cy: oy, r: 13, fill: "#e9eef5", stroke: "#172033", "stroke-width": 3 }, parent);
    drawReferencePoint(parent, SRT, ox, oy);
  }

  function drawRotatingSystem(parent, SRT, x, y, w, angle) {
    const innerX = x + 22;
    const innerY = y + 76;
    const innerW = w - 44;
    const innerH = 270;

    SRT.el("rect", { x: innerX, y: innerY, width: innerW, height: innerH, rx: 12, fill: "#fff7ed", stroke: "#fed7aa" }, parent);

    const ox = innerX + innerW / 2;
    const oy = innerY + innerH / 2;
    const r = 78;

    SRT.el("circle", { cx: ox, cy: oy, r, fill: "none", stroke: "#9aa7b6", "stroke-width": 2.5, "stroke-dasharray": "8 8" }, parent);
    SRT.el("circle", { cx: ox, cy: oy, r: 4, fill: "#172033" }, parent);

    const px = ox + r * Math.cos(angle);
    const py = oy + r * Math.sin(angle);
    SRT.el("circle", { cx: px, cy: py, r: 12, fill: "#172033" }, parent);
    drawReferencePoint(parent, SRT, px, py);
  }

  function drawOscillatingSystem(parent, SRT, x, y, w, phase) {
    const innerX = x + 22;
    const innerY = y + 76;
    const innerW = w - 44;
    const innerH = 270;

    SRT.el("rect", { x: innerX, y: innerY, width: innerW, height: innerH, rx: 12, fill: "#eef6ff", stroke: "#bfdbfe" }, parent);

    const cx = innerX + innerW / 2;
    const ceilY = innerY + 22;
    const A = 60;
    const restY = innerY + innerH / 2 + 10;

    SRT.el("line", { x1: cx - 60, y1: ceilY, x2: cx + 60, y2: ceilY, stroke: "#172033", "stroke-width": 4, "stroke-linecap": "round" }, parent);
    for (let i = 0; i < 9; i++) {
      const hx = cx - 56 + i * 14;
      SRT.el("line", { x1: hx, y1: ceilY, x2: hx + 8, y2: ceilY - 10, stroke: "#172033", "stroke-width": 1.4 }, parent);
    }

    const py = restY + A * Math.sin(phase);
    const springTop = ceilY;
    const springBottom = py - 16;
    const segs = 48;
    let d = `M${cx} ${springTop}`;
    for (let i = 1; i <= segs; i++) {
      const u = i / segs;
      const sy = springTop + (springBottom - springTop) * u;
      const sx = cx + Math.sin(u * Math.PI * 2 * 7) * 7;
      d += ` L${sx} ${sy}`;
    }
    d += ` L${cx} ${springBottom}`;
    SRT.el("path", { d, fill: "none", stroke: "#475569", "stroke-width": 2 }, parent);

    SRT.el("rect", { x: cx - 16, y: py - 16, width: 32, height: 32, rx: 4, fill: "#172033" }, parent);
    drawReferencePoint(parent, SRT, cx, py);
  }

  function drawReferencePoint(parent, SRT, x, y) {
    SRT.el("circle", {
      cx: x,
      cy: y,
      r: 5,
      fill: "#e11d48",
      stroke: "#ffffff",
      "stroke-width": 2
    }, parent);
  }

  function positiveModulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
  }
})();
