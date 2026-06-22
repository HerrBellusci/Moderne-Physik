(function () {
  let alphaDeg = 22;
  let dragging = null;

  const W = 862, H = 506;
  const ALPHA_MIN = 7;
  const ALPHA_MAX = 34;
  const SLIDER = { x0: 120, x1: 742, y: 458 };
  const SCENE = { x: 24, y: 28, w: 510, h: 390 };
  const DETECTOR = { x: 558, y: 28, w: 280, h: 390, cx: 698, cy: 230, r: 106 };

  function ensureInteractive(host) {
    if (host.__ringsInit) return;
    host.__ringsInit = true;

    const svgRoot = host.ownerSVGElement || host;

    const toLocal = (e) => {
      const ctm = host.getScreenCTM();
      if (!ctm) return null;
      const pt = svgRoot.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      return pt.matrixTransform(ctm.inverse());
    };

    const updateAlpha = (e) => {
      const p = toLocal(e);
      if (!p) return;
      const f = Math.max(0, Math.min(1, (p.x - SLIDER.x0) / (SLIDER.x1 - SLIDER.x0)));
      alphaDeg = ALPHA_MIN + f * (ALPHA_MAX - ALPHA_MIN);
    };

    host.addEventListener("pointerdown", (e) => {
      const role = e.target && e.target.getAttribute && e.target.getAttribute("data-rings");
      if (!role) return;
      e.stopPropagation();
      e.preventDefault();
      if (role === "slider-track" || role === "slider-handle") {
        dragging = "alpha";
        updateAlpha(e);
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (dragging === "alpha") updateAlpha(e);
    });

    const stop = () => { dragging = null; };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  window.SRTSlide.register("rings", ({ parent, t, SRT }) => {
    SRT.clear(parent);
    ensureInteractive(parent);

    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#101725" }, parent);

    const defs = SRT.el("defs", {}, parent);
    const coneGrad = SRT.el("linearGradient", { id: "rings-cone-fill", x1: "0%", y1: "0%", x2: "100%", y2: "0%" }, defs);
    SRT.el("stop", { offset: "0%", "stop-color": "#ffc83d", "stop-opacity": "0.04" }, coneGrad);
    SRT.el("stop", { offset: "70%", "stop-color": "#ffc83d", "stop-opacity": "0.18" }, coneGrad);
    SRT.el("stop", { offset: "100%", "stop-color": "#ffc83d", "stop-opacity": "0.02" }, coneGrad);
    const glow = SRT.el("filter", { id: "rings-glow", x: "-80%", y: "-80%", width: "260%", height: "260%" }, defs);
    SRT.el("feGaussianBlur", { stdDeviation: "4", result: "blur" }, glow);
    const merge = SRT.el("feMerge", {}, glow);
    SRT.el("feMergeNode", { in: "blur" }, merge);
    SRT.el("feMergeNode", { in: "SourceGraphic" }, merge);

    drawScene(parent, SRT, t);
    drawDetector(parent, SRT, t);
    drawSlider(parent, SRT);
  });

  function alphaFraction() {
    return (alphaDeg - ALPHA_MIN) / (ALPHA_MAX - ALPHA_MIN);
  }

  function ringRadius() {
    return 28 + alphaFraction() * 78;
  }

  function interferenceState() {
    const destructive = Math.floor(alphaDeg / 4) % 2 === 0;
    return {
      destructive,
      color: destructive ? "#5a7088" : "#ffc83d"
    };
  }

  function drawScene(parent, SRT, t) {
    SRT.el("rect", { x: SCENE.x, y: SCENE.y, width: SCENE.w, height: SCENE.h, rx: 14,
      fill: "rgba(255,255,255,0.035)", stroke: "rgba(255,255,255,0.14)" }, parent);
    const apex = { x: 82, y: 232 };
    const sourceA = { x: 82, y: 218 };
    const sourceB = { x: 82, y: 246 };
    const center = { x: 432, y: 232 };
    const r = ringRadius();
    const ellipseRy = r * 0.58;
    const ellipseRx = r * 0.34;
    const phase = (t * 0.0011) % (Math.PI * 2);
    const state = interferenceState();
    const rayEnd = {
      x: center.x + ellipseRx * Math.cos(phase),
      y: center.y + ellipseRy * Math.sin(phase)
    };

    drawAxis(parent, SRT, apex, center);
    drawScreenPlane(parent, SRT, center);

    const conePath = [
      `M${apex.x} ${apex.y}`,
      `C${apex.x + 130} ${apex.y - 80}, ${center.x - 70} ${center.y - ellipseRy - 20}, ${center.x} ${center.y - ellipseRy}`,
      `C${center.x + ellipseRx} ${center.y - ellipseRy * 0.45}, ${center.x + ellipseRx} ${center.y + ellipseRy * 0.45}, ${center.x} ${center.y + ellipseRy}`,
      `C${center.x - 70} ${center.y + ellipseRy + 20}, ${apex.x + 130} ${apex.y + 80}, ${apex.x} ${apex.y}`,
      "Z"
    ].join(" ");
    SRT.el("path", { d: conePath, fill: "url(#rings-cone-fill)", stroke: "rgba(255,200,61,0.26)", "stroke-width": 1.4 }, parent);

    SRT.el("ellipse", { cx: center.x, cy: center.y, rx: ellipseRx, ry: ellipseRy,
      fill: "none", stroke: "#ffc83d", "stroke-width": 3, opacity: 0.92, filter: "url(#rings-glow)" }, parent);
    SRT.el("ellipse", { cx: center.x, cy: center.y, rx: ellipseRx + 8, ry: ellipseRy + 8,
      fill: "none", stroke: "rgba(255,255,255,0.12)", "stroke-width": 1.2, "stroke-dasharray": "4 7" }, parent);

    drawWaveRay(parent, SRT, sourceA, rayEnd, "#ff6b6b", t * 0.006, -5);
    drawWaveRay(parent, SRT, sourceB, rayEnd, "#6ee7b7", t * 0.006 + (state.destructive ? Math.PI : 0.4), 5);
    SRT.el("circle", { cx: rayEnd.x, cy: rayEnd.y, r: 8, fill: state.color,
      stroke: "#ffffff", "stroke-width": 2, filter: "url(#rings-glow)" }, parent);
    SRT.el("circle", { cx: sourceA.x, cy: sourceA.y, r: 6, fill: "#ff6b6b", stroke: "#ffffff", "stroke-width": 1.5 }, parent);
    SRT.el("circle", { cx: sourceB.x, cy: sourceB.y, r: 6, fill: "#6ee7b7", stroke: "#ffffff", "stroke-width": 1.5 }, parent);
    const arcR = 52;
    const a = alphaDeg * Math.PI / 180;
    SRT.el("path", { d: `M${apex.x + 34} ${apex.y} A${arcR} ${arcR} 0 0 1 ${apex.x + arcR * Math.cos(a)} ${apex.y - arcR * Math.sin(a)}`,
      fill: "none", stroke: "#ffc83d", "stroke-width": 2, "stroke-linecap": "round" }, parent);
  }

  function drawWaveRay(parent, SRT, start, end, color, phase, offset) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const steps = 32;
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const taper = Math.sin(Math.PI * u);
      const wave = Math.sin(u * Math.PI * 11 + phase) * 3.8 * taper + offset;
      points.push([
        start.x + dx * u + nx * wave,
        start.y + dy * u + ny * wave
      ]);
    }
    const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    SRT.el("path", { d, fill: "none", stroke: color, "stroke-width": 2.8,
      "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.92, filter: "url(#rings-glow)" }, parent);
  }

  function drawAxis(parent, SRT, apex, center) {
    SRT.el("line", { x1: apex.x, y1: apex.y, x2: center.x + 36, y2: center.y,
      stroke: "rgba(255,255,255,0.28)", "stroke-width": 1.6, "stroke-dasharray": "8 8" }, parent);
  }

  function drawScreenPlane(parent, SRT, center) {
    const top = center.y - 142;
    const bottom = center.y + 142;
    const leftX = center.x - 42;
    const rightX = center.x + 42;
    const skew = 24;
    SRT.el("path", { d: `M${leftX} ${top + skew} L${rightX} ${top - skew} L${rightX} ${bottom - skew} L${leftX} ${bottom + skew} Z`,
      fill: "rgba(156,236,242,0.08)", stroke: "rgba(156,236,242,0.55)", "stroke-width": 1.6 }, parent);
    SRT.el("line", { x1: leftX, y1: center.y + skew, x2: rightX, y2: center.y - skew,
      stroke: "rgba(156,236,242,0.32)", "stroke-width": 1 }, parent);
  }

  function drawDetector(parent, SRT, t) {
    SRT.el("rect", { x: DETECTOR.x, y: DETECTOR.y, width: DETECTOR.w, height: DETECTOR.h, rx: 14,
      fill: "rgba(255,255,255,0.035)", stroke: "rgba(255,255,255,0.14)" }, parent);
    const cx = DETECTOR.cx;
    const cy = DETECTOR.cy;
    const maxR = DETECTOR.r;
    const r = ringRadius();
    const pulse = 0.75 + 0.25 * Math.sin(t * 0.004);
    const state = interferenceState();
    const ringColor = state.color;

    SRT.el("circle", { cx, cy, r: maxR + 20, fill: "#06101f",
      stroke: "rgba(255,255,255,0.16)", "stroke-width": 1.4 }, parent);
    SRT.el("circle", { cx, cy, r: maxR, fill: "none",
      stroke: "rgba(255,255,255,0.12)", "stroke-width": 1.2 }, parent);
    [0.33, 0.66].forEach((u) => {
      SRT.el("circle", { cx, cy, r: maxR * u, fill: "none",
        stroke: "rgba(255,255,255,0.08)", "stroke-width": 1 }, parent);
    });
    SRT.el("line", { x1: cx - maxR - 14, y1: cy, x2: cx + maxR + 14, y2: cy,
      stroke: "rgba(255,255,255,0.08)", "stroke-width": 1 }, parent);
    SRT.el("line", { x1: cx, y1: cy - maxR - 14, x2: cx, y2: cy + maxR + 14,
      stroke: "rgba(255,255,255,0.08)", "stroke-width": 1 }, parent);

    SRT.el("circle", { cx, cy, r, fill: "none", stroke: ringColor,
      "stroke-width": state.destructive ? 5 : 4, opacity: state.destructive ? 0.82 : pulse, filter: "url(#rings-glow)" }, parent);
    if (!state.destructive) {
      SRT.el("circle", { cx, cy, r: r + 8, fill: "none", stroke: "rgba(255,200,61,0.18)", "stroke-width": 7 }, parent);
    }
    SRT.el("circle", { cx, cy, r: 4, fill: "#cfd8e3" }, parent);

  }

  function drawSlider(parent, SRT) {
    SRT.addText(parent, SLIDER.x0, SLIDER.y - 18, "Winkel verändern", "label",
      { fill: "#ffffff", "font-size": 13, "font-weight": "700" });
    SRT.el("line", { x1: SLIDER.x0, y1: SLIDER.y, x2: SLIDER.x1, y2: SLIDER.y,
      stroke: "#3a4555", "stroke-width": 7, "stroke-linecap": "round",
      "data-rings": "slider-track", style: "cursor: pointer;" }, parent);

    const f = alphaFraction();
    const handleX = SLIDER.x0 + (SLIDER.x1 - SLIDER.x0) * f;
    SRT.el("line", { x1: SLIDER.x0, y1: SLIDER.y, x2: handleX, y2: SLIDER.y,
      stroke: "#ffc83d", "stroke-width": 7, "stroke-linecap": "round", "pointer-events": "none" }, parent);
    SRT.el("circle", { cx: handleX, cy: SLIDER.y, r: 13, fill: "#fff",
      stroke: "#ffc83d", "stroke-width": 3, "data-rings": "slider-handle", style: "cursor: grab;" }, parent);

  }
})();
