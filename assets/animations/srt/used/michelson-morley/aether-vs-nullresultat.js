(function () {
  let mode = "ether"; // "ether" | "real"
  let rotationDeg = 0;
  let dragging = null;
  let fieldCanvas = null;
  let fieldCtx = null;
  let fieldImage = null;

  const W = 862, H = 506;
  const TOGGLE = {
    y: 18, h: 38,
    etherX: 24, etherW: 224,
    realX:  264, realW: 244
  };
  const SLIDER = { x0: 568, x1: 820, y: 37 };

  const APP   = { x: 24,  y: 84, w: 400, h: 388, cx: 224, cy: 270, armH: 120, armV: 110 };
  const FIELD = { x: 444, y: 84, w: 394, h: 388, cx: 641, cy: 262, r: 128 };

  const ETHER_PHASE_AMP = 5.2;

  function ensureInteractive(host) {
    if (host.__mmInit) return;
    host.__mmInit = true;

    const svgRoot = host.ownerSVGElement || host;

    const toLocal = (e) => {
      const ctm = host.getScreenCTM();
      if (!ctm) return null;
      const pt = svgRoot.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      return pt.matrixTransform(ctm.inverse());
    };

    const updateRotationFromEvent = (e) => {
      const p = toLocal(e);
      if (!p) return;
      const f = Math.max(0, Math.min(1, (p.x - SLIDER.x0) / (SLIDER.x1 - SLIDER.x0)));
      rotationDeg = f * 90;
    };

    host.addEventListener("pointerdown", (e) => {
      const role = e.target && e.target.getAttribute && e.target.getAttribute("data-mm");
      if (!role) return;
      e.stopPropagation();
      e.preventDefault();
      if (role === "mode-ether") {
        mode = "ether";
        return;
      }
      if (role === "mode-real") {
        mode = "real";
        return;
      }
      if (role === "slider-handle" || role === "slider-track") {
        dragging = "rotation";
        updateRotationFromEvent(e);
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (dragging === "rotation") updateRotationFromEvent(e);
    });

    const stop = () => { dragging = null; };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  window.SRTSlide.register("mm", ({ parent, t, mode: slideMode, SRT }) => {
    if (slideMode === "ether" || slideMode === "real") mode = slideMode;
    SRT.clear(parent);
    ensureInteractive(parent);

    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#101725" }, parent);

    const defs = SRT.el("defs", {}, parent);
    const glow = SRT.el("filter", { id: "mm-glow", x: "-80%", y: "-80%", width: "260%", height: "260%" }, defs);
    SRT.el("feGaussianBlur", { stdDeviation: "5", result: "blur" }, glow);
    const merge = SRT.el("feMerge", {}, glow);
    SRT.el("feMergeNode", { in: "blur" }, merge);
    SRT.el("feMergeNode", { in: "SourceGraphic" }, merge);

    drawControls(parent, SRT);
    drawApparatus(parent, SRT, t);
    drawRingField(parent, SRT);
  });

  function drawControls(parent, SRT) {
    drawToggle(parent, SRT, TOGGLE.etherX, TOGGLE.y, TOGGLE.etherW, TOGGLE.h,
      "A · Äther-Erwartung", "mode-ether", mode === "ether", "#c2414b");
    drawToggle(parent, SRT, TOGGLE.realX,  TOGGLE.y, TOGGLE.realW, TOGGLE.h,
      "B · Nullresultat", "mode-real", mode === "real", "#2e7d50");

    SRT.addText(parent, SLIDER.x0, SLIDER.y - 14,
      `Rotation der Apparatur:  *θ* = ${rotationDeg.toFixed(0)}°`,
      "label", { fill: "#ffffff", "font-size": 12, "text-anchor": "start" });

    SRT.el("line", {
      x1: SLIDER.x0, y1: SLIDER.y, x2: SLIDER.x1, y2: SLIDER.y,
      stroke: "#3a4555", "stroke-width": 7, "stroke-linecap": "round",
      "data-mm": "slider-track", style: "cursor: pointer;"
    }, parent);

    const handleX = SLIDER.x0 + (SLIDER.x1 - SLIDER.x0) * (rotationDeg / 90);
    SRT.el("line", {
      x1: SLIDER.x0, y1: SLIDER.y, x2: handleX, y2: SLIDER.y,
      stroke: mode === "ether" ? "#c2414b" : "#2e7d50",
      "stroke-width": 7, "stroke-linecap": "round", "pointer-events": "none"
    }, parent);
    SRT.el("circle", {
      cx: handleX, cy: SLIDER.y, r: 11, fill: "#fff",
      stroke: mode === "ether" ? "#c2414b" : "#2e7d50", "stroke-width": 3,
      "data-mm": "slider-handle", style: "cursor: grab;"
    }, parent);

    [0, 45, 90].forEach((deg) => {
      const tx = SLIDER.x0 + (SLIDER.x1 - SLIDER.x0) * (deg / 90);
      SRT.el("line", { x1: tx, y1: SLIDER.y + 8, x2: tx, y2: SLIDER.y + 13,
        stroke: "#7d8a9c", "stroke-width": 1.4, "pointer-events": "none" }, parent);
      SRT.addText(parent, tx, SLIDER.y + 26, `${deg}°`, "label",
        { fill: "#9aaab8", "font-size": 10, "text-anchor": "middle" });
    });
  }

  function drawToggle(parent, SRT, x, y, w, h, label, role, active, accent) {
    const fill = active ? accent : "rgba(255,255,255,0.04)";
    const stroke = active ? accent : "rgba(255,255,255,0.32)";
    const textFill = active ? "#ffffff" : "#cfd8e3";
    SRT.el("rect", {
      x, y, width: w, height: h, rx: 10,
      fill, stroke, "stroke-width": active ? 2 : 1.4,
      "data-mm": role, style: "cursor: pointer;"
    }, parent);
    SRT.addText(parent, x + w / 2, y + h / 2 + 5, label, "label", {
      fill: textFill, "font-size": 12, "text-anchor": "middle",
      "font-weight": active ? "800" : "600", "pointer-events": "none"
    });
  }

  function drawApparatus(parent, SRT, t) {
    SRT.el("rect", { x: APP.x, y: APP.y, width: APP.w, height: APP.h, rx: 14,
      fill: "rgba(255,255,255,0.035)", stroke: "rgba(255,255,255,0.14)" }, parent);
    if (mode === "ether") drawEtherWind(parent, SRT, t);

    const cx = APP.cx, cy = APP.cy;
    const armH = APP.armH, armV = APP.armV;
    const angle = rotationDeg;
    const apparatus = SRT.el("g", { transform: `rotate(${angle} ${cx} ${cy})` }, parent);

    const sourceX = cx - armH - 50;
    const detY = cy + armV + 30;
    const beamColor = "#9cecf2";
    const armColor = "#cfd8e3";

    SRT.el("line", { x1: sourceX + 16, y1: cy, x2: cx + armH, y2: cy,
      stroke: beamColor, "stroke-width": 2.2, opacity: 0.85 }, apparatus);
    SRT.el("line", { x1: cx, y1: cy, x2: cx, y2: cy - armV,
      stroke: beamColor, "stroke-width": 2.2, opacity: 0.85 }, apparatus);
    SRT.el("line", { x1: cx, y1: cy + 14, x2: cx, y2: detY - 6,
      stroke: beamColor, "stroke-width": 2.2, opacity: 0.85 }, apparatus);

    SRT.el("rect", { x: sourceX - 18, y: cy - 16, width: 34, height: 32, rx: 5,
      fill: "#172033", stroke: armColor, "stroke-width": 1.5 }, apparatus);
    SRT.el("circle", { cx: sourceX - 1, cy, r: 5, fill: "#ffc83d" }, apparatus);

    SRT.el("line", { x1: cx - 16, y1: cy + 16, x2: cx + 16, y2: cy - 16,
      stroke: armColor, "stroke-width": 3, "stroke-linecap": "round" }, apparatus);

    SRT.el("rect", { x: cx + armH, y: cy - 28, width: 8, height: 56, rx: 2,
      fill: armColor }, apparatus);
    SRT.el("rect", { x: cx - 28, y: cy - armV - 8, width: 56, height: 8, rx: 2,
      fill: armColor }, apparatus);

    SRT.el("rect", { x: cx - 26, y: detY, width: 52, height: 26, rx: 5,
      fill: "#172033", stroke: armColor, "stroke-width": 1.5 }, apparatus);
    SRT.el("circle", { cx, cy: detY + 13, r: 5,
      fill: mode === "ether" ? "#c2414b" : "#2e7d50" }, apparatus);

    SRT.el("circle", { cx, cy, r: 156, fill: "none",
      stroke: "#5c6678", "stroke-width": 1.2, "stroke-dasharray": "4 6", opacity: 0.45 }, parent);

    const tipRad = (rotationDeg - 90) * Math.PI / 180;
    const tipX = cx + 156 * Math.cos(tipRad);
    const tipY = cy + 156 * Math.sin(tipRad);
    SRT.el("circle", { cx: tipX, cy: tipY, r: 6,
      fill: mode === "ether" ? "#c2414b" : "#2e7d50",
      stroke: "#fff", "stroke-width": 2 }, parent);

  }

  function drawEtherWind(parent, SRT, t) {
    const windColor = "#c2414b";
    const drift = (t * 0.07) % 44;
    const rows = [APP.y + 50, APP.y + 96, APP.y + 144, APP.y + 192, APP.y + 240, APP.y + 288, APP.y + 336];
    for (let i = 0; i < rows.length; i++) {
      const wy = rows[i];
      SRT.el("line", { x1: APP.x + 16, y1: wy, x2: APP.x + APP.w - 16, y2: wy,
        stroke: windColor, "stroke-width": 1, opacity: 0.18, "stroke-linecap": "round" }, parent);
      for (let xOff = 24 + drift; xOff < APP.w - 12; xOff += 44) {
        SRT.el("path", {
          d: `M${APP.x + xOff} ${wy} l-9 -5 v10 z`,
          fill: windColor, opacity: 0.42
        }, parent);
      }
    }
    SRT.el("path", {
      d: `M${APP.x + 24} ${APP.y + 22} h60`,
      stroke: windColor, "stroke-width": 3, "stroke-linecap": "round", opacity: 0.95
    }, parent);
    SRT.el("path", {
      d: `M${APP.x + 84} ${APP.y + 22} l-11 -6 v12 z`,
      fill: windColor, opacity: 0.95
    }, parent);
    SRT.addText(parent, APP.x + 96, APP.y + 26, "Ätherwind", "label",
      { fill: windColor, "font-size": 12, "text-anchor": "start", "font-weight": "600" });
  }

  function drawRingField(parent, SRT) {
    SRT.el("rect", { x: FIELD.x, y: FIELD.y, width: FIELD.w, height: FIELD.h, rx: 14,
      fill: "rgba(255,255,255,0.035)", stroke: "rgba(255,255,255,0.14)" }, parent);
    SRT.addText(parent, FIELD.x + 16, FIELD.y + 26, "Interferenzmuster auf dem Schirm", "label",
      { fill: "#ffffff", "font-size": 13, "font-weight": "600" });

    const rotRad = rotationDeg * Math.PI / 180;
    const phaseShift = mode === "ether" ? ETHER_PHASE_AMP * Math.cos(2 * rotRad) : 0;

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
    const phaseBase = 2 * Math.PI * 1.4;
    const curvature = 0.0042;
    let idx = 0;
    for (let py = 0; py < ch; py++) {
      const dy = py - ccy;
      for (let px = 0; px < cw; px++) {
        const dx = px - ccx;
        const rho2 = dx * dx + dy * dy;
        const rho = Math.sqrt(rho2);
        const phase = phaseBase - curvature * rho2 + phaseShift;
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

    drawPhaseReadout(parent, SRT, phaseShift);
  }

  function drawPhaseReadout(parent, SRT, phaseShift) {
    const px = FIELD.x + 16, py = FIELD.y + FIELD.h - 72;
    const pw = FIELD.w - 32;
    SRT.el("rect", { x: px, y: py, width: pw, height: 54, rx: 10,
      fill: "rgba(6,14,28,0.88)", stroke: "rgba(255,255,255,0.22)" }, parent);

    if (mode === "ether") {
      SRT.addText(parent, px + pw / 2, py + 32,
        "Erwartung: Das Muster verschiebt sich beim Drehen.",
        "label", { fill: "#c2414b", "font-size": 12, "font-weight": "600", "text-anchor": "middle" });
    } else {
      SRT.addText(parent, px + pw / 2, py + 32,
        "Beobachtung: Das Muster verschiebt sich nicht.",
        "label", { fill: "#2e7d50", "font-size": 12, "font-weight": "600", "text-anchor": "middle" });
    }
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
