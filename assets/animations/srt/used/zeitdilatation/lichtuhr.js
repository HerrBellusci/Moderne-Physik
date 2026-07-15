(function () {
  let beta = 0.58;
  let dragging = false;

  const W = 862, H = 506;
  const BETA_MIN = 0;
  const BETA_MAX = 0.8;
  const SL = { x0: 230, x1: 632, y: 486 };
  const PROPER_HALF = 110;
  const REST_PERIOD = 2400; // ms for one full tick (down→up→down) of resting clock
  const HOLD_AFTER_TICK = 850;
  const MOVING_DIRECTION = 1; // left to right in the observer system

  function ensureInteractive(host) {
    if (host.__lightclockInit) return;
    host.__lightclockInit = true;

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
      const role = e.target && e.target.getAttribute && e.target.getAttribute("data-lightclock");
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

  window.SRTSlide.register("lightclock", ({ parent, t, SRT }) => {
    SRT.clear(parent);
    ensureInteractive(parent);

    if (parent.__lightclockElapsed === undefined) {
      parent.__lightclockElapsed = 0;
      parent.__lightclockLastT = t;
    }
    if (parent.__lastBeta !== beta) {
      parent.__lightclockElapsed = 0;
      parent.__lastBeta = beta;
    }
    const delta = Math.max(0, t - parent.__lightclockLastT);
    parent.__lightclockLastT = t;
    parent.__lightclockElapsed += delta;
    const local = parent.__lightclockElapsed;

    const gamma = 1 / Math.sqrt(1 - beta * beta);
    const movingPeriod = REST_PERIOD * gamma;
    const visualT = local % (movingPeriod + HOLD_AFTER_TICK);
    const cycleT = Math.min(visualT, movingPeriod);
    const restRun = Math.min(cycleT, REST_PERIOD);
    const restPhase = restRun / REST_PERIOD;
    const movingPhase = cycleT / movingPeriod;
    const horizontalHalf = beta * gamma * PROPER_HALF;

    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#f7f9fb" }, parent);

    drawRestPanel(parent, SRT, restPhase);
    drawMovingPanel(parent, SRT, movingPhase, horizontalHalf);
    drawTickComparison(parent, SRT, gamma);
    drawSlider(parent, SRT, beta);
  });

  function drawRestPanel(parent, SRT, phase) {
    const panel = { x: 38, y: 56, w: 396, h: 320 };
    SRT.el("rect", { x: panel.x, y: panel.y, width: panel.w, height: panel.h, rx: 16,
      fill: "#ffffff", stroke: "rgba(23,32,51,0.14)", "stroke-width": 2 }, parent);
    const cx = panel.x + panel.w / 2;
    const top = panel.y + 110;
    const bottom = top + PROPER_HALF;
    const travelTop = top + 13;
    const travelBottom = bottom - 4;
    const photonY = phase <= 0.5
      ? lerp(travelBottom, travelTop, phase * 2)
      : lerp(travelTop, travelBottom, (phase - 0.5) * 2);

    SRT.addText(parent, panel.x + panel.w / 2, panel.y + 34,
      "Lichtuhr im Zug (Ruhesystem)", "label", {
      "text-anchor": "middle", fill: "#0097a7", "font-size": 14, "font-weight": "900"
    });
    drawMirror(parent, cx - 54, top, 108);
    drawMirror(parent, cx - 54, bottom, 108);
    SRT.el("line", { x1: cx, y1: travelTop, x2: cx, y2: travelBottom,
      stroke: "#0097a7", "stroke-width": 5, "stroke-linecap": "round" }, parent);

    SRT.el("circle", { cx, cy: photonY, r: 11, fill: "#ffc83d", filter: "url(#glow)" }, parent);

  }

  function drawMovingPanel(parent, SRT, phase, horizontalHalf) {
    const panel = { x: 462, y: 56, w: 360, h: 320 };
    SRT.el("rect", { x: panel.x, y: panel.y, width: panel.w, height: panel.h, rx: 16,
      fill: "#ffffff", stroke: "rgba(23,32,51,0.14)", "stroke-width": 2 }, parent);
    drawVelocityArrow(parent, SRT, panel);

    const startX = MOVING_DIRECTION > 0 ? panel.x + 50 : panel.x + panel.w - 50;
    const top = panel.y + 116;
    const bottom = top + PROPER_HALF;
    const midX = startX + MOVING_DIRECTION * horizontalHalf;
    const endX = startX + MOVING_DIRECTION * 2 * horizontalHalf;
    const currentX = lerp(startX, endX, phase);
    const start = { x: startX, y: bottom - 4 };
    const middle = { x: midX, y: top + 13 };
    const end = { x: endX, y: bottom - 4 };
    const photon = phase <= 0.5
      ? pointBetween(start, middle, phase * 2)
      : pointBetween(middle, end, (phase - 0.5) * 2);

    drawLandscapeBackground(parent, SRT, panel);
    drawGhostClock(parent, startX, top, bottom, 0.18);
    drawGhostClock(parent, midX, top, bottom, 0.2);
    drawGhostClock(parent, endX, top, bottom, 0.18);
    drawCurrentMovingClock(parent, currentX, top, bottom);

    drawPythagorasOverlay(parent, SRT, start, middle, top, bottom);

    SRT.el("polyline", { points: `${start.x},${start.y} ${middle.x},${middle.y} ${end.x},${end.y}`,
      fill: "none", stroke: "#c2414b", "stroke-width": 5, "stroke-linecap": "round", "stroke-linejoin": "round" }, parent);
    SRT.el("circle", { cx: photon.x, cy: photon.y, r: 11, fill: "#ffc83d", filter: "url(#glow)" }, parent);

  }

  function drawPythagorasOverlay(parent, SRT, start, middle, top, bottom) {
    const dashColor = "#94a3b8";
    SRT.el("line", { x1: middle.x, y1: bottom - 4, x2: middle.x, y2: top + 13,
      stroke: dashColor, "stroke-width": 1.5, "stroke-dasharray": "5 5" }, parent);
    SRT.el("line", { x1: start.x, y1: bottom - 4, x2: middle.x, y2: bottom - 4,
      stroke: dashColor, "stroke-width": 1.5, "stroke-dasharray": "5 5" }, parent);

  }

  function drawVelocityArrow(parent, SRT, panel) {
    const y = panel.y + 48;
    const x1 = MOVING_DIRECTION > 0 ? panel.x + panel.w - 104 : panel.x + panel.w - 40;
    const x2 = x1 + MOVING_DIRECTION * 54;
    SRT.el("line", { x1, y1: y, x2, y2: y,
      stroke: "#c2414b", "stroke-width": 3, "stroke-linecap": "round" }, parent);
    const head = MOVING_DIRECTION > 0
      ? `${x2},${y} ${x2 - 10},${y - 6} ${x2 - 10},${y + 6}`
      : `${x2},${y} ${x2 + 10},${y - 6} ${x2 + 10},${y + 6}`;
    SRT.el("polygon", { points: head, fill: "#c2414b" }, parent);
    SRT.addText(parent, x2 + MOVING_DIRECTION * 8, y + 4, "v", "label", {
      fill: "#c2414b", "font-size": 13, "font-weight": "900",
      "text-anchor": MOVING_DIRECTION > 0 ? "start" : "end"
    });
  }

  function drawTickComparison(parent, SRT, gamma) {
    const x = 196;
    const y = 410;
    const gap = 36;
    const base = 250;
    const restLen = base;
    const movingLen = base * gamma;

    drawMagnitudeBar(parent, SRT, x, y, restLen, "Δ*t*₀", "#0097a7");
    drawMagnitudeBar(parent, SRT, x, y + gap, movingLen, "Δ*t*", "#c2414b");

    // Markierung, wo Δt₀ endet: alles rechts davon auf dem Δt-Balken ist die Zeitdehnung
    SRT.el("line", { x1: x + restLen, y1: y - 12, x2: x + restLen, y2: y + gap + 12,
      stroke: "#94a3b8", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, parent);
  }

  function drawMagnitudeBar(parent, SRT, x, y, length, label, color) {
    SRT.addText(parent, x - 18, y + 5, label, "label", {
      "text-anchor": "end", fill: color, "font-size": 13, "font-weight": "900"
    });
    SRT.el("line", { x1: x, y1: y, x2: x + length, y2: y,
      stroke: color, "stroke-width": 11, "stroke-linecap": "round" }, parent);
  }

  function drawSlider(parent, SRT, b) {
    const f = (b - BETA_MIN) / (BETA_MAX - BETA_MIN);
    const x = SL.x0 + (SL.x1 - SL.x0) * f;
    SRT.addText(parent, SL.x1 + 18, SL.y + 5,
      `*v* = ${b.toFixed(2).replace(".", ",")} *c*`, "label", {
      fill: "#172033", "font-size": 13, "font-weight": "850"
    });
    SRT.el("line", { x1: SL.x0, y1: SL.y, x2: SL.x1, y2: SL.y,
      stroke: "#cbd5e1", "stroke-width": 7, "stroke-linecap": "round",
      "data-lightclock": "track", style: "cursor:pointer;" }, parent);
    SRT.el("line", { x1: SL.x0, y1: SL.y, x2: x, y2: SL.y,
      stroke: "#6d5dfc", "stroke-width": 7, "stroke-linecap": "round", "pointer-events": "none" }, parent);
    SRT.el("circle", { cx: x, cy: SL.y, r: 13, fill: "#fff", stroke: "#6d5dfc",
      "stroke-width": 3, "data-lightclock": "handle", style: "cursor:grab;" }, parent);
  }

  function drawMirror(parent, x, y, w) {
    const SRT = window.SRTSlide;
    SRT.el("rect", { x, y, width: w, height: 10, rx: 5, fill: "#172033" }, parent);
    SRT.el("line", { x1: x + 8, y1: y + 3, x2: x + w - 8, y2: y + 3,
      stroke: "#ffffff", "stroke-width": 1.2, opacity: 0.28 }, parent);
  }

  function drawGhostClock(parent, cx, top, bottom, opacity) {
    const SRT = window.SRTSlide;
    const group = SRT.el("g", { opacity }, parent);
    drawMirror(group, cx - 32, top, 64);
    drawMirror(group, cx - 32, bottom, 64);
    SRT.el("line", { x1: cx, y1: top + 10, x2: cx, y2: bottom - 4,
      stroke: "#0097a7", "stroke-width": 2, "stroke-dasharray": "5 6" }, group);
  }

  function drawLandscapeBackground(parent, SRT, panel) {
    const x = panel.x + 20;
    const y = panel.y + 92;
    const w = panel.w - 40;
    const h = 170;
    const group = SRT.el("g", { opacity: 0.72 }, parent);
    SRT.el("rect", { x, y, width: w, height: h, rx: 12, fill: "#eaf5fb" }, group);
    SRT.el("path", { d: `M${x} ${y + 98} C${x + 54} ${y + 70} ${x + 110} ${y + 76} ${x + 156} ${y + 100} C${x + 208} ${y + 68} ${x + 266} ${y + 78} ${x + w} ${y + 94} L${x + w} ${y + h} L${x} ${y + h} Z`,
      fill: "#d5e7d1" }, group);
    SRT.el("rect", { x, y: y + 112, width: w, height: h - 112, fill: "#bfd9a7" }, group);
    SRT.el("line", { x1: x, y1: y + 112, x2: x + w, y2: y + 112,
      stroke: "#8bb174", "stroke-width": 2, "stroke-linecap": "round" }, group);

    drawHouse(group, x + 222, y + 82);
    drawTree(group, x + 52, y + 92, 1);
    drawTree(group, x + 120, y + 102, 0.78);
    drawTree(group, x + 290, y + 100, 0.84);
  }

  function drawHouse(parent, x, y) {
    const SRT = window.SRTSlide;
    SRT.el("rect", { x, y: y + 28, width: 54, height: 38, rx: 3, fill: "#f7d9a8",
      stroke: "#d7a766", "stroke-width": 1.4 }, parent);
    SRT.el("polygon", { points: `${x - 6},${y + 30} ${x + 27},${y + 4} ${x + 60},${y + 30}`,
      fill: "#b45345" }, parent);
    SRT.el("rect", { x: x + 9, y: y + 43, width: 13, height: 23, rx: 2, fill: "#8b5e3c" }, parent);
    SRT.el("rect", { x: x + 32, y: y + 40, width: 13, height: 12, rx: 2, fill: "#ffffff",
      stroke: "#8aa0b8", "stroke-width": 1 }, parent);
  }

  function drawTree(parent, x, y, scale) {
    const SRT = window.SRTSlide;
    SRT.el("rect", { x: x - 3 * scale, y: y + 16 * scale, width: 6 * scale, height: 25 * scale,
      rx: 2, fill: "#8b5e3c" }, parent);
    SRT.el("circle", { cx: x, cy: y + 13 * scale, r: 16 * scale, fill: "#4f8f5b" }, parent);
    SRT.el("circle", { cx: x - 10 * scale, cy: y + 22 * scale, r: 12 * scale, fill: "#5ba46a" }, parent);
    SRT.el("circle", { cx: x + 10 * scale, cy: y + 22 * scale, r: 12 * scale, fill: "#3f7f50" }, parent);
  }

  function drawCurrentMovingClock(parent, cx, top, bottom) {
    const SRT = window.SRTSlide;
    const group = SRT.el("g", {}, parent);
    drawMirror(group, cx - 34, top, 68);
    drawMirror(group, cx - 34, bottom, 68);
    SRT.el("line", { x1: cx, y1: top + 10, x2: cx, y2: bottom - 4,
      stroke: "#c2414b", "stroke-width": 2.5, "stroke-dasharray": "5 6" }, group);
  }

  function lerp(a, b, u) {
    return a + (b - a) * u;
  }

  function pointBetween(a, b, u) {
    return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) };
  }
})();
