(function () {
  const W = 862, H = 506;
  const BETA_MAX = 0.99;
  const GAMMA_MIN = 1;
  const GAMMA_MAX = 7.2;
  const PLOT = { x: 96, y: 78, w: 550, h: 282 };
  const SL = { x0: 156, x1: 586, y: 462 };
  const MATH_FONT = "Cambria Math, STIX Two Math, Latin Modern Math, Times New Roman, serif";
  let draggingHost = null;

  function gamma(beta) {
    return 1 / Math.sqrt(1 - beta * beta);
  }

  function betaToX(beta) {
    return PLOT.x + (beta / BETA_MAX) * PLOT.w;
  }

  function gammaToY(value) {
    return PLOT.y + PLOT.h - ((value - GAMMA_MIN) / (GAMMA_MAX - GAMMA_MIN)) * PLOT.h;
  }

  function formatNumber(value, digits) {
    return value.toFixed(digits).replace(".", ",");
  }

  function formatGamma(value) {
    if (value < 1.01) return formatNumber(value, 6);
    if (value < 2) return formatNumber(value, 3);
    return formatNumber(value, 2);
  }

  function addMathText(parent, SRT, x, y, value, className, attrs = {}) {
    return SRT.addText(parent, x, y, value, className, {
      "font-family": MATH_FONT,
      ...attrs
    });
  }

  function ensureInteractive(host) {
    if (!host.__gammaPlotState) host.__gammaPlotState = { beta: 0.8 };
    if (host.__gammaPlotInit) return;
    host.__gammaPlotInit = true;

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
      const nextBeta = f * BETA_MAX;
      if (nextBeta !== host.__gammaPlotState.beta) {
        host.__gammaPlotState.beta = nextBeta;
        host.__gammaPlotNeedsRender = true;
      }
    };

    host.addEventListener("pointerdown", (e) => {
      const role = e.target && e.target.getAttribute && e.target.getAttribute("data-gamma-plot");
      if (role !== "track" && role !== "handle") return;
      e.stopPropagation();
      e.preventDefault();
      draggingHost = host;
      updateSlider(e);
    });

    window.addEventListener("pointermove", (e) => {
      if (draggingHost === host) updateSlider(e);
    });
    const stop = () => {
      if (draggingHost === host) draggingHost = null;
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  window.SRTSlide.register("gamma-plot", ({ parent, SRT }) => {
    ensureInteractive(parent);

    const beta = parent.__gammaPlotState.beta;
    if (!parent.__gammaPlotNeedsRender && parent.__gammaPlotRenderedBeta === beta) return;
    parent.__gammaPlotNeedsRender = false;
    parent.__gammaPlotRenderedBeta = beta;

    SRT.clear(parent);
    const g = gamma(beta);

    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#f7f9fb" }, parent);
    drawTitle(parent, SRT);

    drawPlot(parent, SRT, beta, g);
    drawInfoPanel(parent, SRT, beta, g);
    drawSlider(parent, SRT, beta);
  });

  function drawTitle(parent, SRT) {
    const title = SRT.el("text", { x: 431, y: 32, class: "label",
      "text-anchor": "middle",
      style: "fill: #172033; font-size: 18px; font-weight: 900;" }, parent);
    const segments = [
      { text: "Der Lorentzfaktor " },
      { text: "γ", math: true },
      { text: " in Abhängigkeit von der Geschwindigkeit" }
    ];
    segments.forEach((segment) => {
      const tspan = SRT.el("tspan", segment.math ? { "font-family": MATH_FONT } : {}, title);
      tspan.textContent = segment.text;
    });
  }

  function drawPlot(parent, SRT, beta, g) {
    SRT.el("rect", { x: PLOT.x, y: PLOT.y, width: PLOT.w, height: PLOT.h, rx: 12,
      fill: "#ffffff", stroke: "rgba(23,32,51,0.14)", "stroke-width": 2 }, parent);

    drawGrid(parent, SRT);
    drawGammaOneLine(parent, SRT);
    drawCurve(parent, SRT);
    drawMarkers(parent, SRT);
    drawActivePoint(parent, SRT, beta, g);
    drawAxes(parent, SRT);
  }

  function drawGrid(parent, SRT) {
    [0, 0.2, 0.4, 0.6, 0.8, 0.99].forEach((b) => {
      const x = betaToX(b);
      SRT.el("line", { x1: x, y1: PLOT.y, x2: x, y2: PLOT.y + PLOT.h,
        stroke: "#e2e8f0", "stroke-width": 1 }, parent);
    });
    [1, 2, 4, 6, 7].forEach((value) => {
      const y = gammaToY(value);
      SRT.el("line", { x1: PLOT.x, y1: y, x2: PLOT.x + PLOT.w, y2: y,
        stroke: value === 1 ? "#b7e4c7" : "#e2e8f0", "stroke-width": value === 1 ? 2 : 1 }, parent);
      SRT.addText(parent, PLOT.x - 16, y + 4, String(value).replace(".", ","), "tiny", {
        "text-anchor": "end", fill: "#5c6678", "font-size": 12
      });
    });
  }

  function drawGammaOneLine(parent, SRT) {
    const y = gammaToY(1);
    addMathText(parent, SRT, PLOT.x + 12, y - 10, "Untergrenze: γ = 1", "tiny", {
      fill: "#2e7d50", "font-size": 12, "font-weight": "850"
    });
  }

  function drawCurve(parent, SRT) {
    const points = [];
    for (let i = 0; i <= 240; i += 1) {
      const beta = (i / 240) * BETA_MAX;
      points.push(`${betaToX(beta).toFixed(1)},${gammaToY(gamma(beta)).toFixed(1)}`);
    }
    SRT.el("polyline", { points: points.join(" "), fill: "none", stroke: "#6d5dfc",
      "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, parent);
  }

  function drawMarkers(parent, SRT) {
    const markers = [
      { beta: 0.1, label: "0,1 c", dx: 12, dy: -14, anchor: "start" },
      { beta: 0.8, label: "0,8 c", dx: -12, dy: -16, anchor: "end" },
      { beta: 0.99, label: "0,99 c", dx: -12, dy: 22, anchor: "end" }
    ];

    markers.forEach((marker) => {
      const value = gamma(marker.beta);
      const x = betaToX(marker.beta);
      const y = gammaToY(value);
      SRT.el("circle", { cx: x, cy: y, r: 4.5, fill: "#ffffff", stroke: "#172033",
        "stroke-width": 1.8 }, parent);
      SRT.addText(parent, x + marker.dx, y + marker.dy, marker.label, "tiny", {
        "text-anchor": marker.anchor, fill: "#172033", "font-size": 12, "font-weight": "850"
      });
    });
  }

  function drawActivePoint(parent, SRT, beta, g) {
    const x = betaToX(beta);
    const y = gammaToY(g);
    SRT.el("line", { x1: x, y1: PLOT.y + PLOT.h, x2: x, y2: y,
      stroke: "#c2414b", "stroke-width": 1.6, "stroke-dasharray": "5 5" }, parent);
    SRT.el("line", { x1: PLOT.x, y1: y, x2: x, y2: y,
      stroke: "#c2414b", "stroke-width": 1.6, "stroke-dasharray": "5 5" }, parent);
    SRT.el("circle", { cx: x, cy: y, r: 8.5, fill: "#ffc83d", stroke: "#c2414b",
      "stroke-width": 3 }, parent);
  }

  function drawAxes(parent, SRT) {
    const axisColor = "#172033";
    SRT.el("line", { x1: PLOT.x, y1: PLOT.y + PLOT.h, x2: PLOT.x + PLOT.w + 16, y2: PLOT.y + PLOT.h,
      stroke: "#172033", "stroke-width": 2.2, "stroke-linecap": "round" }, parent);
    SRT.el("line", { x1: PLOT.x, y1: PLOT.y + PLOT.h, x2: PLOT.x, y2: PLOT.y - 22,
      stroke: "#172033", "stroke-width": 2.2, "stroke-linecap": "round" }, parent);
    SRT.el("polygon", { points: `${PLOT.x + PLOT.w + 24},${PLOT.y + PLOT.h} ${PLOT.x + PLOT.w + 11},${PLOT.y + PLOT.h - 7} ${PLOT.x + PLOT.w + 11},${PLOT.y + PLOT.h + 7}`,
      fill: axisColor }, parent);
    SRT.el("polygon", { points: `${PLOT.x},${PLOT.y - 30} ${PLOT.x - 7},${PLOT.y - 17} ${PLOT.x + 7},${PLOT.y - 17}`,
      fill: axisColor }, parent);

    [0, 0.2, 0.4, 0.6, 0.8, 0.99].forEach((b) => {
      const x = betaToX(b);
      const label = b === 0.99 ? "0,99" : formatNumber(b, 1);
      SRT.el("line", { x1: x, y1: PLOT.y + PLOT.h, x2: x, y2: PLOT.y + PLOT.h + 7,
        stroke: axisColor, "stroke-width": 1.4 }, parent);
      SRT.addText(parent, x, PLOT.y + PLOT.h + 22, label, "tiny", {
        "text-anchor": "middle", fill: "#5c6678", "font-size": 12
      });
    });

    [1, 2, 4, 6, 7].forEach((value) => {
      const y = gammaToY(value);
      SRT.el("line", { x1: PLOT.x - 7, y1: y, x2: PLOT.x, y2: y,
        stroke: axisColor, "stroke-width": 1.4 }, parent);
    });

    addMathText(parent, SRT, PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h + 48, "v / c", "label", {
      "text-anchor": "middle", fill: "#172033", "font-size": 13, "font-weight": "850"
    });
    addMathText(parent, SRT, PLOT.x + 12, PLOT.y - 34, "γ", "label", {
      fill: "#172033", "font-size": 13, "font-weight": "850"
    });
  }

  function drawInfoPanel(parent, SRT, beta, g) {
    const x = 676;
    const y = 72;
    const w = 150;
    const h = 300;
    SRT.el("rect", { x, y, width: w, height: h, rx: 12, fill: "#ffffff",
      stroke: "rgba(23,32,51,0.14)", "stroke-width": 2 }, parent);
    SRT.addText(parent, x + 16, y + 34, "Aktueller Wert", "label", {
      fill: "#172033", "font-size": 14, "font-weight": "900"
    });
    addMathText(parent, SRT, x + 16, y + 68, `v/c = ${formatNumber(beta, 3)}`, "label", {
      fill: "#6d5dfc", "font-size": 15, "font-weight": "900"
    });
    SRT.addText(parent, x + 16, y + 86, `(${formatNumber(beta * 100, 1)} % von c)`, "tiny", {
      fill: "#6d5dfc", "font-size": 12, "font-weight": "850"
    });
    addMathText(parent, SRT, x + 16, y + 116, `γ = ${formatGamma(g)}`, "label", {
      fill: "#c2414b", "font-size": 17, "font-weight": "900"
    });

    SRT.el("line", { x1: x + 16, y1: y + 138, x2: x + w - 16, y2: y + 138,
      stroke: "#e2e8f0", "stroke-width": 1.5 }, parent);
    SRT.addText(parent, x + 16, y + 162, "Derselbe Tick dauert", "tiny", {
      fill: "#5c6678", "font-size": 12, "font-weight": "850"
    });
    SRT.addText(parent, x + 16, y + 178, "im Bahnsteigsystem:", "tiny", {
      fill: "#5c6678", "font-size": 12, "font-weight": "850"
    });
    SRT.addText(parent, x + 16, y + 208, `+ ${formatNumber((g - 1) * 100, 1)} %`, "label", {
      fill: "#c2414b", "font-size": 17, "font-weight": "900"
    });
    SRT.el("line", { x1: x + 16, y1: y + 230, x2: x + w - 16, y2: y + 230,
      stroke: "#e2e8f0", "stroke-width": 1.5 }, parent);
    SRT.addText(parent, x + 16, y + 256, "Im Alltag (Auto,", "tiny", {
      fill: "#2e7d50", "font-size": 12, "font-weight": "900"
    });
    SRT.addText(parent, x + 16, y + 272, "Flugzeug, ISS):", "tiny", {
      fill: "#2e7d50", "font-size": 12, "font-weight": "900"
    });
    addMathText(parent, SRT, x + 16, y + 290, "γ ≈ 1 (kaum messbar)", "tiny", {
      fill: "#2e7d50", "font-size": 11, "font-weight": "850"
    });
  }

  function drawSlider(parent, SRT, beta) {
    const f = beta / BETA_MAX;
    const x = SL.x0 + (SL.x1 - SL.x0) * f;

    SRT.addText(parent, SL.x0, SL.y - 22, "Relativgeschwindigkeit einstellen", "label", {
      fill: "#5c6678", "font-size": 13, "font-weight": "850"
    });
    SRT.el("line", { x1: SL.x0, y1: SL.y, x2: SL.x1, y2: SL.y,
      stroke: "#cbd5e1", "stroke-width": 8, "stroke-linecap": "round",
      "data-gamma-plot": "track", style: "cursor:pointer;" }, parent);
    SRT.el("line", { x1: SL.x0, y1: SL.y, x2: x, y2: SL.y,
      stroke: "#6d5dfc", "stroke-width": 8, "stroke-linecap": "round", "pointer-events": "none" }, parent);
    SRT.el("circle", { cx: x, cy: SL.y, r: 14, fill: "#ffffff", stroke: "#6d5dfc",
      "stroke-width": 3, "data-gamma-plot": "handle", style: "cursor:grab;" }, parent);
    SRT.addText(parent, SL.x0, SL.y + 30, "0", "tiny", {
      "text-anchor": "middle", fill: "#5c6678", "font-size": 12
    });
    SRT.addText(parent, SL.x1, SL.y + 30, "0,99 c", "tiny", {
      "text-anchor": "middle", fill: "#5c6678", "font-size": 12
    });
  }
})();
