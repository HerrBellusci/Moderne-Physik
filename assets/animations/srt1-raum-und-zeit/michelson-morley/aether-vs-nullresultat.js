(function () {
  let fieldCanvas = null;
  let fieldCtx = null;
  let fieldImage = null;

  const W = 862, H = 420;
  const APP = { x: 24, y: 84, w: 400, h: 388, cx: 224, cy: 290, armH: 110, armV: 100 };
  const FIELD = { x: 444, y: 84, w: 394, h: 388, cx: 641, cy: 280, r: 128 };
  const ETHER_PHASE_AMP = 5.2;

  function ensureControls(host, state) {
    if (!host._mmControls) {
      const panel = document.createElement("div");
      panel.className = "mp-mm-controls";
      const choices = document.createElement("div");
      choices.className = "mp-mm-choices";
      choices.setAttribute("role", "group");
      choices.setAttribute("aria-label", "Ansicht des Michelson-Morley-Experiments");
      [["ether", "Äther-Erwartung"], ["real", "Nullresultat"]].forEach(([value, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.dataset.mode = value;
        button.addEventListener("click", () => {
          state.mode = value;
          host.dispatchEvent(new Event("srt-render"));
        });
        choices.append(button);
      });
      const label = document.createElement("label");
      label.className = "mp-mm-angle";
      const heading = document.createElement("span");
      heading.textContent = "Drehwinkel";
      const output = document.createElement("span");
      output.className = "mp-mm-angle-value";
      const input = document.createElement("input");
      input.type = "range";
      input.min = "0";
      input.max = "90";
      input.step = "1";
      input.setAttribute("aria-label", "Drehwinkel der Apparatur");
      input.addEventListener("input", () => {
        state.rotationDeg = Number(input.value);
        host.dispatchEvent(new Event("srt-render"));
      });
      label.append(heading, output, input);
      panel.append(choices, label);
      host.prepend(panel);
      host._mmControls = { choices, input, output };
    }
    const { choices, input, output } = host._mmControls;
    choices.querySelectorAll("button").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode));
    });
    input.value = state.rotationDeg;
    input.setAttribute("aria-valuetext", state.rotationDeg + " Grad");
    output.textContent = state.rotationDeg + "°";
  }

  window.SRTSlide.register("mm", {
    initialState: { mode: "ether", rotationDeg: 0 },
    showMotionControl: false,
    render({ parent, state, SRT }) {
      SRT.clear(parent);
      ensureControls(parent.ownerSVGElement.parentElement, state);
      SRT.el("rect", { x: 0, y: 0, width: W, height: H, fill: "#101725" }, parent);
      const drawing = SRT.el("g", { transform: "translate(0 -64)" }, parent);
      drawApparatus(drawing, SRT, state);
      drawRingField(drawing, SRT, state);
    }
  });

  function drawApparatus(parent, SRT, { mode, rotationDeg }) {
    SRT.el("rect", { x: APP.x, y: APP.y, width: APP.w, height: APP.h, rx: 14,
      fill: "rgba(255,255,255,0.035)", stroke: "rgba(255,255,255,0.14)" }, parent);
    if (mode === "ether") drawEtherWind(parent, SRT);

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

  }

  function drawEtherWind(parent, SRT) {
    const windColor = "#ff8a94";
    SRT.el("path", {
      d: `M${APP.x + 24} ${APP.y + 22} h60`,
      stroke: windColor, "stroke-width": 3, "stroke-linecap": "round", opacity: 0.95
    }, parent);
    SRT.el("path", {
      d: `M${APP.x + 84} ${APP.y + 22} l-11 -6 v12 z`,
      fill: windColor, opacity: 0.95
    }, parent);
    SRT.addText(parent, APP.x + 96, APP.y + 26, "Ätherwind", "label",
      { fill: windColor, "font-size": 24, "text-anchor": "start", "font-weight": "600" });
  }

  function drawRingField(parent, SRT, { mode, rotationDeg }) {
    SRT.el("rect", { x: FIELD.x, y: FIELD.y, width: FIELD.w, height: FIELD.h, rx: 14,
      fill: "rgba(255,255,255,0.035)", stroke: "rgba(255,255,255,0.14)" }, parent);
    SRT.addText(parent, FIELD.x + 16, FIELD.y + 26, "Interferenzmuster", "label",
      { fill: "#ffffff", "font-size": 24, "font-weight": "600" });

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
