(function () {
  let mirrorShift = 0; // mechanical mirror shift s in λ, range -1.5 .. +1.5
  let dragging = null;
  let fieldCanvas = null;
  let fieldCtx = null;
  let fieldImage = null;

  const W = 862, H = 506;
  const SHIFT_MIN = -1.5;
  const SHIFT_MAX =  1.5;

  const SLIDER = { x0: 80, x1: 780, y: 458 };
  const APP   = { x: 24,  y: 24, w: 400, h: 408, cx: 224, cy: 240, armH: 130, armV: 110 };
  const FIELD = { x: 444, y: 24, w: 394, h: 408, cx: 596, cy: 246, r: 124 };

  function ensureInteractive(host) {
    if (host.__interferenceInit) return;
    host.__interferenceInit = true;

    const svgRoot = host.ownerSVGElement || host;

    const toLocal = (e) => {
      const ctm = host.getScreenCTM();
      if (!ctm) return null;
      const pt = svgRoot.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      return pt.matrixTransform(ctm.inverse());
    };

    const updateSliderFromEvent = (e) => {
      const p = toLocal(e);
      if (!p) return;
      const f = Math.max(0, Math.min(1, (p.x - SLIDER.x0) / (SLIDER.x1 - SLIDER.x0)));
      const next = SHIFT_MIN + f * (SHIFT_MAX - SHIFT_MIN);
      mirrorShift = next;
    };

    host.addEventListener("pointerdown", (e) => {
      const role = e.target && e.target.getAttribute && e.target.getAttribute("data-interference");
      if (!role) return;
      e.stopPropagation();
      e.preventDefault();
      if (role !== "slider-handle" && role !== "slider-track") return;
      dragging = "slider";
      updateSliderFromEvent(e);
    });

    window.addEventListener("pointermove", (e) => {
      if (dragging === "slider") updateSliderFromEvent(e);
    });

    const stop = () => { dragging = null; };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  window.SRTSlide.register("interference", ({ parent, t, SRT }) => {
    SRT.clear(parent);
    ensureInteractive(parent);

    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#101725" }, parent);

    const defs = SRT.el("defs", {}, parent);
    const glow = SRT.el("filter", { id: "interference-glow", x: "-80%", y: "-80%", width: "260%", height: "260%" }, defs);
    SRT.el("feGaussianBlur", { stdDeviation: "5", result: "blur" }, glow);
    const merge = SRT.el("feMerge", {}, glow);
    SRT.el("feMergeNode", { in: "blur" }, merge);
    SRT.el("feMergeNode", { in: "SourceGraphic" }, merge);

    drawApparatus(parent, SRT, t);
    drawRingField(parent, SRT, t);
    drawSlider(parent, SRT);
  });

  function drawApparatus(parent, SRT, t) {
    SRT.el("rect", { x: APP.x, y: APP.y, width: APP.w, height: APP.h, rx: 14,
      fill: "rgba(255,255,255,0.035)", stroke: "rgba(255,255,255,0.14)" }, parent);
    const cx = APP.cx, cy = APP.cy;
    const armH = APP.armH, armV = APP.armV;
    const sourceX = cx - armH - 60;
    const detY = cy + armV - 25;
    const beamColor = "#9cecf2";
    const armColor = "#cfd8e3";

    const shiftPx = mirrorShift * 14;
    const verticalMirrorX = cx + armH + shiftPx;

    SRT.el("line", { x1: sourceX + 18, y1: cy, x2: verticalMirrorX, y2: cy,
      stroke: beamColor, "stroke-width": 2.4, opacity: 0.92 }, parent);
    SRT.el("line", { x1: cx, y1: cy, x2: cx, y2: cy - armV,
      stroke: beamColor, "stroke-width": 2.4, opacity: 0.92 }, parent);
    SRT.el("line", { x1: cx, y1: cy + 16, x2: cx, y2: detY - 6,
      stroke: beamColor, "stroke-width": 2.4, opacity: 0.92 }, parent);

    SRT.el("rect", { x: sourceX - 18, y: cy - 18, width: 36, height: 36, rx: 5,
      fill: "#172033", stroke: armColor, "stroke-width": 1.5 }, parent);
    SRT.el("circle", { cx: sourceX, cy, r: 6, fill: "#ffc83d", filter: "url(#interference-glow)" }, parent);

    SRT.el("line", { x1: cx - 18, y1: cy + 18, x2: cx + 18, y2: cy - 18,
      stroke: armColor, "stroke-width": 3.2, "stroke-linecap": "round" }, parent);

    SRT.el("rect", { x: cx - 30, y: cy - armV - 10, width: 60, height: 8, rx: 2,
      fill: armColor }, parent);

    SRT.el("rect", { x: verticalMirrorX, y: cy - 30, width: 8, height: 60, rx: 2,
      fill: "#ffc83d", stroke: "#fff", "stroke-width": 1.4 }, parent);
    SRT.el("path", {
      d: `M${verticalMirrorX + 4} ${cy - 46} l-7 -7 m7 7 l-7 7`,
      stroke: "#ffc83d", "stroke-width": 2, fill: "none", "stroke-linecap": "round"
    }, parent);
    SRT.el("path", {
      d: `M${verticalMirrorX + 4} ${cy + 46} l-7 -7 m7 7 l-7 7`,
      stroke: "#ffc83d", "stroke-width": 2, fill: "none", "stroke-linecap": "round",
      transform: `rotate(180 ${verticalMirrorX + 4} ${cy + 46})`
    }, parent);

    SRT.el("rect", { x: cx - 28, y: detY, width: 56, height: 28, rx: 5,
      fill: "#172033", stroke: armColor, "stroke-width": 1.5 }, parent);
    SRT.el("circle", { cx, cy: detY + 14, r: 6,
      fill: brightnessForShift(mirrorShift), filter: "url(#interference-glow)" }, parent);
  }

  function brightnessForShift(shift) {
    const opl = 2 * shift;
    const intensity = (1 + Math.cos(2 * Math.PI * opl)) / 2;
    const r = Math.round(20 + (255 - 20) * intensity);
    const g = Math.round(40 + (200 - 40) * intensity);
    const b = Math.round(60 + (61 - 60) * intensity);
    return `rgb(${r},${g},${b})`;
  }

  function drawRingField(parent, SRT) {
    SRT.el("rect", { x: FIELD.x, y: FIELD.y, width: FIELD.w, height: FIELD.h, rx: 14,
      fill: "rgba(255,255,255,0.035)", stroke: "rgba(255,255,255,0.14)" }, parent);
    SRT.addText(parent, FIELD.x + 16, FIELD.y + 26, "Interferenzmuster auf dem Schirm", "label",
      { fill: "#ffffff", "font-size": 13, "font-weight": "600" });

    const cx = FIELD.cx, cy = FIELD.cy;
    const Rmax = FIELD.r;

    const cw = Math.round(Rmax * 2 + 8);
    const ch = Math.round(Rmax * 2 + 8);
    if (!fieldCanvas || fieldCanvas.width !== cw) {
      fieldCanvas = document.createElement("canvas");
      fieldCanvas.width = cw;
      fieldCanvas.height = ch;
      fieldCtx = fieldCanvas.getContext("2d", { willReadFrequently: true });
      fieldImage = fieldCtx.createImageData(cw, ch);
    }

    const data = fieldImage.data;
    const ccx = cw / 2, ccy = ch / 2;
    const phaseBase = 2 * Math.PI * (2 * mirrorShift);
    const curvature = 0.0034;
    let idx = 0;
    for (let py = 0; py < ch; py++) {
      const dy = py - ccy;
      for (let px = 0; px < cw; px++) {
        const dx = px - ccx;
        const rho2 = dx * dx + dy * dy;
        const rho = Math.sqrt(rho2);
        const phase = phaseBase - curvature * rho2;
        const rings = Math.pow((1 + Math.cos(phase)) / 2, 1.45);
        const aperture = softAperture(rho, Rmax - 16, Rmax);
        const vignette = Math.max(0.36, 1 - Math.pow(rho / (Rmax * 1.15), 2));
        const intensity = Math.max(0, Math.min(1, rings * vignette * aperture));
        const color = mixRgb([5, 13, 27], [255, 204, 72], intensity);
        data[idx++] = color[0];
        data[idx++] = color[1];
        data[idx++] = color[2];
        data[idx++] = Math.round(255 * aperture);
      }
    }
    fieldCtx.putImageData(fieldImage, 0, 0);

    SRT.el("image", {
      x: cx - cw / 2, y: cy - ch / 2, width: cw, height: ch,
      href: fieldCanvas.toDataURL("image/png"), preserveAspectRatio: "none"
    }, parent);
    SRT.el("circle", { cx, cy, r: Rmax + 8, fill: "none",
      stroke: "#172033", "stroke-width": 5 }, parent);
    SRT.el("circle", { cx, cy, r: Rmax + 2, fill: "none",
      stroke: "#5c6678", "stroke-width": 1.4 }, parent);

  }

  function drawSlider(parent, SRT) {
    SRT.addText(parent, SLIDER.x0, SLIDER.y - 16,
      "Spiegel verschieben",
      "label", { fill: "#ffffff", "font-size": 13, "text-anchor": "start", "font-weight": "600" });

    SRT.el("line", {
      x1: SLIDER.x0, y1: SLIDER.y, x2: SLIDER.x1, y2: SLIDER.y,
      stroke: "#3a4555", "stroke-width": 7, "stroke-linecap": "round",
      "data-interference": "slider-track", style: "cursor: pointer;"
    }, parent);

    const f = (mirrorShift - SHIFT_MIN) / (SHIFT_MAX - SHIFT_MIN);
    const handleX = SLIDER.x0 + (SLIDER.x1 - SLIDER.x0) * f;
    const centerX = SLIDER.x0 + (SLIDER.x1 - SLIDER.x0) * 0.5;
    const fillX1 = Math.min(centerX, handleX);
    const fillX2 = Math.max(centerX, handleX);
    SRT.el("line", {
      x1: fillX1, y1: SLIDER.y, x2: fillX2, y2: SLIDER.y,
      stroke: "#ffc83d", "stroke-width": 7, "stroke-linecap": "round", "pointer-events": "none"
    }, parent);

    SRT.el("circle", {
      cx: handleX, cy: SLIDER.y, r: 13, fill: "#fff",
      stroke: "#ffc83d", "stroke-width": 3,
      "data-interference": "slider-handle", style: "cursor: grab;"
    }, parent);
  }

  function softAperture(r, inner, outer) {
    if (r <= inner) return 1;
    if (r >= outer) return 0;
    const u = (r - inner) / (outer - inner);
    return 1 - u * u * (3 - 2 * u);
  }

  function mixRgb(a, b, u) {
    const eased = u * u * (3 - 2 * u);
    const r = Math.round(a[0] + (b[0] - a[0]) * eased);
    const g = Math.round(a[1] + (b[1] - a[1]) * eased);
    const bl = Math.round(a[2] + (b[2] - a[2]) * eased);
    return [r, g, bl];
  }
})();
