(function () {
  let beta = 0;
  let dragging = false;

  const W = 862, H = 506;
  const SL = { x0: 226, x1: 636, y: 462 };
  const FIELD = { x: 48, y: 150, w: 766, h: 246, cx: 431, cy: 270 };
  const BETA_MIN = 0;
  const BETA_MAX = 0.72;
  const REST_WAVELENGTH = 550;
  const VISIBLE_MIN = 400;
  const VISIBLE_MAX = 700;
  const INK = "#172033";
  const MUTED = "#5c6678";
  const PANEL = "#f7f9fb";
  const BLUE = "#2563eb";
  const RED = "#dc2626";
  const NEUTRAL = "#64748b";

  function ensureInteractive(host) {
    if (host.__dopplerInit) return;
    host.__dopplerInit = true;

    const svgRoot = host.ownerSVGElement || host;
    const toLocal = (e) => {
      const ctm = host.getScreenCTM();
      if (!ctm) return null;
      const pt = svgRoot.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      return pt.matrixTransform(ctm.inverse());
    };
    const updateSlider = (e) => {
      const p = toLocal(e);
      if (!p) return;
      const f = Math.max(0, Math.min(1, (p.x - SL.x0) / (SL.x1 - SL.x0)));
      beta = BETA_MIN + f * (BETA_MAX - BETA_MIN);
    };

    host.addEventListener("pointerdown", (e) => {
      const role = e.target && e.target.getAttribute && e.target.getAttribute("data-doppler");
      if (role !== "track" && role !== "handle") return;
      e.stopPropagation();
      e.preventDefault();
      dragging = true;
      updateSlider(e);
    });
    window.addEventListener("pointermove", (e) => {
      if (dragging) updateSlider(e);
    });
    const stop = () => { dragging = false; };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  window.SRTSlide.register("doppler", ({ parent, t, SRT }) => {
    SRT.clear(parent);
    ensureInteractive(parent);

    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: PANEL }, parent);
    drawDefs(parent, SRT);
    drawSpectrum(parent, SRT, beta);
    drawWaveField(parent, SRT, t, beta);
    drawExplanation(parent, SRT);
    drawSlider(parent, SRT, beta);
  });

  function drawDefs(parent, SRT) {
    const defs = SRT.el("defs", {}, parent);
    const spectrum = SRT.el("linearGradient", { id: "doppler-spectrum", x1: "0%", y1: "0%", x2: "100%", y2: "0%" }, defs);
    [
      ["0%", "#6d28d9"], ["12%", "#2563eb"], ["28%", "#00b7ff"],
      ["44%", "#00e676"], ["58%", "#eaff00"], ["72%", "#ff9f1c"],
      ["88%", "#ef233c"], ["100%", "#7f1d1d"]
    ].forEach(([offset, color]) => SRT.el("stop", { offset, "stop-color": color }, spectrum));

    const glow = SRT.el("filter", { id: "doppler-glow", x: "-70%", y: "-70%", width: "240%", height: "240%" }, defs);
    SRT.el("feGaussianBlur", { stdDeviation: "5", result: "blur" }, glow);
    const merge = SRT.el("feMerge", {}, glow);
    SRT.el("feMergeNode", { in: "blur" }, merge);
    SRT.el("feMergeNode", { in: "SourceGraphic" }, merge);
  }

  function drawSpectrum(parent, SRT, b) {
    const x = 108, y = 20, w = 646, h = 122;
    const bar = { x: x + 46, y: y + 48, w: w - 92, h: 22 };
    const isRest = b < 0.015;
    const approach = dopplerWavelength(REST_WAVELENGTH, b, "approach");
    const recede = dopplerWavelength(REST_WAVELENGTH, b, "recede");

    SRT.el("rect", { x, y, width: w, height: h, rx: 12,
      fill: "#ffffff", stroke: "rgba(23,32,51,0.14)" }, parent);
    SRT.addText(parent, x + w / 2, y + 26, "sichtbares Spektrum", "label", {
      "text-anchor": "middle", fill: INK, "font-size": 17, "font-weight": "900"
    });
    SRT.el("rect", { x: bar.x, y: bar.y, width: bar.w, height: bar.h, rx: 11,
      fill: "url(#doppler-spectrum)" }, parent);
    [["400 nm", 400], ["500", 500], ["600", 600], ["700 nm", 700]].forEach(([label, wavelength]) => {
      const lx = wavelengthToX(bar, wavelength);
      SRT.el("line", { x1: lx, y1: bar.y + bar.h + 2, x2: lx, y2: bar.y + bar.h + 10,
        stroke: MUTED, "stroke-width": 1.5 }, parent);
      if (wavelength === VISIBLE_MIN || wavelength === VISIBLE_MAX) {
        SRT.addText(parent, lx, bar.y - 8, label, "label", {
          "text-anchor": "middle", fill: MUTED, "font-size": 11, "font-weight": "800"
        });
      }
    });

    const restX = wavelengthToX(bar, REST_WAVELENGTH);
    if (isRest) {
      drawSpectrumMarker(parent, SRT, restX, bar.y + bar.h / 2, NEUTRAL, "Ruhe: keine Verschiebung", y + 108);
    } else {
      drawRestMarker(parent, SRT, restX, bar.y + bar.h / 2);
      drawSpectrumMarker(parent, SRT, wavelengthToX(bar, approach), bar.y + bar.h / 2,
        BLUE, `zu uns: ${formatNm(approach)}`, y + 102);
      drawSpectrumMarker(parent, SRT, wavelengthToX(bar, recede), bar.y + bar.h / 2,
        RED, `weg: ${formatNm(recede)}`, y + 118);
    }
  }

  function drawSpectrumMarker(parent, SRT, x, y, color, label, labelY) {
    SRT.el("line", { x1: x, y1: y - 16, x2: x, y2: y + 16,
      stroke: color, "stroke-width": 3, "stroke-linecap": "round", opacity: color === NEUTRAL ? 0.8 : 1 }, parent);
    SRT.el("circle", { cx: x, cy: y - 16, r: 4.5, fill: color }, parent);
    SRT.addText(parent, x, labelY, label, "label", {
      "text-anchor": "middle", fill: color, "font-size": 11, "font-weight": "900"
    });
  }

  function drawRestMarker(parent, SRT, x, y) {
    SRT.el("line", { x1: x, y1: y - 14, x2: x, y2: y + 14,
      stroke: NEUTRAL, "stroke-width": 2, "stroke-linecap": "round", opacity: 0.45 }, parent);
  }

  function drawWaveField(parent, SRT, t, b) {
    SRT.el("rect", { x: FIELD.x, y: FIELD.y, width: FIELD.w, height: FIELD.h, rx: 18,
      fill: "#ffffff", stroke: "rgba(23,32,51,0.14)" }, parent);

    const shift = Math.min(1, b / BETA_MAX);
    const isRest = b < 0.015;
    const phase = (t % 3600) / 3600;
    const travel = (t % 5200) / 5200;
    const spacing = 32;
    const sourceX = FIELD.cx + b * 150 - travel * b * 300;
    const sourceY = FIELD.cy;
    const driftPerAge = b * 30;
    const frontColor = mixColor(NEUTRAL, BLUE, shift);
    const backColor = mixColor(NEUTRAL, RED, shift);

    for (let i = 0; i < 13; i++) {
      const age = i + phase;
      const r = 18 + age * spacing;
      const cx = sourceX + age * driftPerAge;
      const opacity = Math.max(0, 0.64 - i * 0.045);
      drawWaveArc(parent, SRT, cx, sourceY, r, "left", frontColor, opacity);
      drawWaveArc(parent, SRT, cx, sourceY, r, "right", backColor, opacity);
    }

    drawObserver(parent, SRT, FIELD.x + 78, FIELD.cy, isRest ? NEUTRAL : frontColor,
      isRest ? "keine Verschiebung" : "vorn: Blauverschiebung");
    drawObserver(parent, SRT, FIELD.x + FIELD.w - 78, FIELD.cy, isRest ? NEUTRAL : backColor,
      isRest ? "keine Verschiebung" : "hinten: Rotverschiebung");

    SRT.el("line", { x1: sourceX + 42, y1: sourceY + 62, x2: sourceX - 42, y2: sourceY + 62,
      stroke: isRest ? MUTED : "#ca8a04", "stroke-width": 4, "stroke-linecap": "round" }, parent);
    SRT.el("path", { d: `M${sourceX - 42} ${sourceY + 62} l12 -8 v16 z`,
      fill: isRest ? MUTED : "#ca8a04" }, parent);
    SRT.addText(parent, sourceX, sourceY + 88, isRest ? "Quelle ruht" : "Quelle bewegt sich nach links", "label", {
      "text-anchor": "middle", fill: isRest ? MUTED : "#92400e", "font-size": 12, "font-weight": "900"
    });

    drawSource(parent, SRT, sourceX, sourceY);
  }

  function drawWaveArc(parent, SRT, cx, cy, r, side, color, opacity) {
    const x = side === "right" ? cx : cx;
    const startY = cy - r;
    const endY = cy + r;
    const sweep = side === "right" ? 1 : 0;
    SRT.el("path", { d: `M${x} ${startY} A${r} ${r} 0 0 ${sweep} ${x} ${endY}`,
      fill: "none", stroke: color, "stroke-width": 2,
      "stroke-linecap": "round", opacity }, parent);
  }

  function drawSource(parent, SRT, x, y) {
    SRT.el("circle", { cx: x, cy: y, r: 26, fill: "#fef3c7", filter: "url(#doppler-glow)" }, parent);
    SRT.el("circle", { cx: x, cy: y, r: 15, fill: "#facc15" }, parent);
    SRT.el("circle", { cx: x - 6, cy: y - 7, r: 5, fill: "#ffffff", opacity: 0.7 }, parent);
  }

  function drawObserver(parent, SRT, x, y, color, label) {
    SRT.el("circle", { cx: x, cy: y, r: 15, fill: INK, stroke: color, "stroke-width": 3 }, parent);
    SRT.el("circle", { cx: x, cy: y - 5, r: 5, fill: color }, parent);
    SRT.el("path", { d: `M${x - 9} ${y + 10} q9 -8 18 0`, stroke: color,
      "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, parent);
    SRT.addText(parent, x, y + 42, label, "label", {
      "text-anchor": "middle", fill: color, "font-size": 13, "font-weight": "900"
    });
  }

  function drawExplanation(parent, SRT) {
    SRT.addText(parent, 431, 420, "Nur bei relativer Bewegung: vorne dichter und blauer; hinten weiter auseinander und röter.", "label", {
      "text-anchor": "middle", fill: INK, "font-size": 13, "font-weight": "850"
    });
  }

  function drawSlider(parent, SRT, b) {
    const f = (b - BETA_MIN) / (BETA_MAX - BETA_MIN);
    const x = SL.x0 + (SL.x1 - SL.x0) * f;
    SRT.addText(parent, SL.x0, SL.y - 18, "Geschwindigkeit der Quelle", "label", {
      fill: INK, "font-size": 13, "font-weight": "850"
    });
    SRT.addText(parent, SL.x1 + 18, SL.y + 5, `v = ${b.toFixed(2)} c`, "label", {
      fill: MUTED, "font-size": 13, "font-weight": "850"
    });
    SRT.el("line", { x1: SL.x0, y1: SL.y, x2: SL.x1, y2: SL.y,
      stroke: "#cbd5e1", "stroke-width": 7, "stroke-linecap": "round",
      "data-doppler": "track", style: "cursor:pointer;" }, parent);
    SRT.el("line", { x1: SL.x0, y1: SL.y, x2: x, y2: SL.y,
      stroke: "#2563eb", "stroke-width": 7, "stroke-linecap": "round", "pointer-events": "none" }, parent);
    SRT.el("circle", { cx: x, cy: SL.y, r: 13, fill: "#ffffff", stroke: "#2563eb",
      "stroke-width": 3, "data-doppler": "handle", style: "cursor:grab;" }, parent);
  }

  function dopplerWavelength(restWavelength, b, direction) {
    const factor = direction === "approach"
      ? Math.sqrt((1 - b) / (1 + b))
      : Math.sqrt((1 + b) / (1 - b));
    return restWavelength * factor;
  }

  function wavelengthToX(bar, wavelength) {
    const clamped = Math.max(VISIBLE_MIN, Math.min(VISIBLE_MAX, wavelength));
    return bar.x + bar.w * ((clamped - VISIBLE_MIN) / (VISIBLE_MAX - VISIBLE_MIN));
  }

  function formatNm(wavelength) {
    if (wavelength < VISIBLE_MIN) return "<400 nm";
    if (wavelength > VISIBLE_MAX) return ">700 nm";
    return `${Math.round(wavelength)} nm`;
  }

  function mixColor(from, to, amount) {
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    const t = Math.max(0, Math.min(1, amount));
    return `rgb(${Math.round(a.r + (b.r - a.r) * t)}, ${Math.round(a.g + (b.g - a.g) * t)}, ${Math.round(a.b + (b.b - a.b) * t)})`;
  }

  function hexToRgb(hex) {
    const value = hex.replace("#", "");
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }
})();
