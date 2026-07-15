(function () {
  const W = 862, H = 506;
  const BETA_MAX = 0.99;
  const ENERGY_MAX = 6.2;
  const PLOT = { x: 96, y: 78, w: 550, h: 282 };
  const SL = { x0: 156, x1: 586, y: 462 };
  const MATH_FONT = "Cambria Math, STIX Two Math, Latin Modern Math, Times New Roman, serif";
  let draggingHost = null;

  function gamma(beta) {
    return 1 / Math.sqrt(1 - beta * beta);
  }

  function relEnergy(beta) {
    return gamma(beta) - 1;
  }

  function classicalEnergy(beta) {
    return 0.5 * beta * beta;
  }

  function betaToX(beta) {
    return PLOT.x + (beta / BETA_MAX) * PLOT.w;
  }

  function energyToY(value) {
    return PLOT.y + PLOT.h - (Math.min(value, ENERGY_MAX) / ENERGY_MAX) * PLOT.h;
  }

  function formatNumber(value, digits) {
    return value.toFixed(digits).replace(".", ",");
  }

  function formatEnergy(value) {
    if (value < 0.01) return formatNumber(value, 4);
    if (value < 1) return formatNumber(value, 3);
    return formatNumber(value, 2);
  }

  function addMathText(parent, SRT, x, y, value, className, attrs = {}) {
    return SRT.addText(parent, x, y, value, className, {
      "font-family": MATH_FONT,
      ...attrs
    });
  }

  function ensureInteractive(host) {
    if (!host.__kinEnergyState) host.__kinEnergyState = { beta: 0.8 };
    if (host.__kinEnergyInit) return;
    host.__kinEnergyInit = true;

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
      if (nextBeta !== host.__kinEnergyState.beta) {
        host.__kinEnergyState.beta = nextBeta;
        host.__kinEnergyNeedsRender = true;
      }
    };

    host.addEventListener("pointerdown", (e) => {
      const role = e.target && e.target.getAttribute && e.target.getAttribute("data-kin-energy");
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

  window.SRTSlide.register("kinetic-energy-plot", ({ parent, SRT }) => {
    ensureInteractive(parent);

    const beta = parent.__kinEnergyState.beta;
    if (!parent.__kinEnergyNeedsRender && parent.__kinEnergyRenderedBeta === beta) return;
    parent.__kinEnergyNeedsRender = false;
    parent.__kinEnergyRenderedBeta = beta;

    SRT.clear(parent);

    const rel = relEnergy(beta);
    const klassisch = classicalEnergy(beta);
    const g = gamma(beta);

    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#f7f9fb" }, parent);
    drawTitle(parent, SRT);
    drawPlot(parent, SRT, beta, rel, klassisch);
    drawInfoPanel(parent, SRT, beta, g, rel, klassisch);
    drawSlider(parent, SRT, beta);
  });

  function drawTitle(parent, SRT) {
    const title = SRT.el("text", {
      x: 431, y: 32, class: "label", "text-anchor": "middle",
      style: "fill: #172033; font-size: 18px; font-weight: 900;"
    }, parent);
    [
      { text: "Kinetische Energie " },
      { text: "K/(mc²)", math: true },
      { text: " in Abhängigkeit von " },
      { text: "*v*/*c*", math: true }
    ].forEach((segment) => {
      const tspan = SRT.el("tspan", segment.math ? { "font-family": MATH_FONT } : {}, title);
      tspan.textContent = segment.text;
    });
  }

  function drawPlot(parent, SRT, beta, rel, klassisch) {
    SRT.el("rect", {
      x: PLOT.x, y: PLOT.y, width: PLOT.w, height: PLOT.h, rx: 12,
      fill: "#ffffff", stroke: "rgba(23,32,51,0.14)", "stroke-width": 2
    }, parent);

    drawGrid(parent, SRT);
    drawCurves(parent, SRT);
    drawActivePoint(parent, SRT, beta, rel, klassisch);
    drawAxes(parent, SRT);
    drawLegend(parent, SRT);
  }

  function drawGrid(parent, SRT) {
    [0, 0.2, 0.4, 0.6, 0.8, 0.99].forEach((b) => {
      const x = betaToX(b);
      SRT.el("line", { x1: x, y1: PLOT.y, x2: x, y2: PLOT.y + PLOT.h,
        stroke: "#e2e8f0", "stroke-width": 1 }, parent);
    });

    [0, 0.5, 1, 2, 4, 6].forEach((value) => {
      const y = energyToY(value);
      SRT.el("line", { x1: PLOT.x, y1: y, x2: PLOT.x + PLOT.w, y2: y,
        stroke: value === 0 ? "#b7e4c7" : "#e2e8f0", "stroke-width": value === 0 ? 2 : 1 }, parent);
      SRT.addText(parent, PLOT.x - 16, y + 4, String(value).replace(".", ","), "tiny", {
        "text-anchor": "end", fill: "#5c6678", "font-size": 12
      });
    });
  }

  function drawCurves(parent, SRT) {
    const relPoints = [];
    const classicPoints = [];
    for (let i = 0; i <= 240; i += 1) {
      const beta = (i / 240) * BETA_MAX;
      relPoints.push(`${betaToX(beta).toFixed(1)},${energyToY(relEnergy(beta)).toFixed(1)}`);
      classicPoints.push(`${betaToX(beta).toFixed(1)},${energyToY(classicalEnergy(beta)).toFixed(1)}`);
    }
    SRT.el("polyline", { points: classicPoints.join(" "), fill: "none", stroke: "#2e7d50",
      "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round",
      "stroke-dasharray": "8 7" }, parent);
    SRT.el("polyline", { points: relPoints.join(" "), fill: "none", stroke: "#6d5dfc",
      "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, parent);
  }

  function drawActivePoint(parent, SRT, beta, rel, klassisch) {
    const x = betaToX(beta);
    const yRel = energyToY(rel);
    const yClass = energyToY(klassisch);
    SRT.el("line", { x1: x, y1: PLOT.y + PLOT.h, x2: x, y2: yRel,
      stroke: "#c2414b", "stroke-width": 1.6, "stroke-dasharray": "5 5" }, parent);
    SRT.el("line", { x1: PLOT.x, y1: yRel, x2: x, y2: yRel,
      stroke: "#c2414b", "stroke-width": 1.6, "stroke-dasharray": "5 5" }, parent);
    SRT.el("circle", { cx: x, cy: yClass, r: 6.5, fill: "#ffffff", stroke: "#2e7d50",
      "stroke-width": 3 }, parent);
    SRT.el("circle", { cx: x, cy: yRel, r: 8.5, fill: "#ffc83d", stroke: "#6d5dfc",
      "stroke-width": 3 }, parent);
  }

  function drawAxes(parent, SRT) {
    const axisColor = "#172033";
    SRT.el("line", { x1: PLOT.x, y1: PLOT.y + PLOT.h, x2: PLOT.x + PLOT.w + 16, y2: PLOT.y + PLOT.h,
      stroke: axisColor, "stroke-width": 2.2, "stroke-linecap": "round" }, parent);
    SRT.el("line", { x1: PLOT.x, y1: PLOT.y + PLOT.h, x2: PLOT.x, y2: PLOT.y - 22,
      stroke: axisColor, "stroke-width": 2.2, "stroke-linecap": "round" }, parent);
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

    [0, 0.5, 1, 2, 4, 6].forEach((value) => {
      const y = energyToY(value);
      SRT.el("line", { x1: PLOT.x - 7, y1: y, x2: PLOT.x, y2: y,
        stroke: axisColor, "stroke-width": 1.4 }, parent);
    });

    addMathText(parent, SRT, PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h + 48, "*v* / *c*", "label", {
      "text-anchor": "middle", fill: "#172033", "font-size": 13, "font-weight": "850"
    });
    addMathText(parent, SRT, PLOT.x + 12, PLOT.y - 34, "K / (mc²)", "label", {
      fill: "#172033", "font-size": 13, "font-weight": "850"
    });
  }

  function drawLegend(parent, SRT) {
    const x = PLOT.x + 315;
    const y = PLOT.y + 24;
    SRT.el("rect", { x, y: y - 18, width: 218, height: 54, rx: 10,
      fill: "rgba(255,255,255,0.88)", stroke: "rgba(23,32,51,0.10)" }, parent);
    SRT.el("line", { x1: x + 12, y1: y, x2: x + 48, y2: y, stroke: "#6d5dfc", "stroke-width": 4,
      "stroke-linecap": "round" }, parent);
    addMathText(parent, SRT, x + 58, y + 4, "relativistisch: *γ* - 1", "tiny", {
      fill: "#172033", "font-size": 12, "font-weight": "850"
    });
    SRT.el("line", { x1: x + 12, y1: y + 22, x2: x + 48, y2: y + 22, stroke: "#2e7d50",
      "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": "8 7" }, parent);
    addMathText(parent, SRT, x + 58, y + 26, "klassisch: ½(*v*/*c*)²", "tiny", {
      fill: "#172033", "font-size": 12, "font-weight": "850"
    });
  }

  function drawInfoPanel(parent, SRT, beta, g, rel, klassisch) {
    const x = 676;
    const y = 72;
    const w = 150;
    const h = 300;
    const factor = klassisch > 0 ? rel / klassisch : 1;
    SRT.el("rect", { x, y, width: w, height: h, rx: 12, fill: "#ffffff",
      stroke: "rgba(23,32,51,0.14)", "stroke-width": 2 }, parent);
    SRT.addText(parent, x + 16, y + 34, "Aktueller Wert", "label", {
      fill: "#172033", "font-size": 14, "font-weight": "900"
    });
    addMathText(parent, SRT, x + 16, y + 68, `*v*/*c* = ${formatNumber(beta, 3)}`, "label", {
      fill: "#6d5dfc", "font-size": 15, "font-weight": "900"
    });
    SRT.addText(parent, x + 16, y + 86, `(${formatNumber(beta * 100, 1)} % von *c*)`, "tiny", {
      fill: "#6d5dfc", "font-size": 12, "font-weight": "850"
    });
    addMathText(parent, SRT, x + 16, y + 116, `*γ* = ${formatNumber(g, 3)}`, "label", {
      fill: "#c2414b", "font-size": 16, "font-weight": "900"
    });

    SRT.el("line", { x1: x + 16, y1: y + 138, x2: x + w - 16, y2: y + 138,
      stroke: "#e2e8f0", "stroke-width": 1.5 }, parent);
    addMathText(parent, SRT, x + 16, y + 164, `*K*rel/(*mc*²) = ${formatEnergy(rel)}`, "tiny", {
      fill: "#6d5dfc", "font-size": 12, "font-weight": "900"
    });
    addMathText(parent, SRT, x + 16, y + 188, `*K*kl/(*mc*²) = ${formatEnergy(klassisch)}`, "tiny", {
      fill: "#2e7d50", "font-size": 12, "font-weight": "900"
    });
    SRT.el("line", { x1: x + 16, y1: y + 210, x2: x + w - 16, y2: y + 210,
      stroke: "#e2e8f0", "stroke-width": 1.5 }, parent);
    SRT.addText(parent, x + 16, y + 236, "relativistisch", "tiny", {
      fill: "#5c6678", "font-size": 12, "font-weight": "850"
    });
    SRT.addText(parent, x + 16, y + 252, "gegen klassisch:", "tiny", {
      fill: "#5c6678", "font-size": 12, "font-weight": "850"
    });
    addMathText(parent, SRT, x + 16, y + 282, `${formatNumber(factor, 2)} ×`, "label", {
      fill: "#c2414b", "font-size": 20, "font-weight": "900"
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
      "data-kin-energy": "track", style: "cursor:pointer;" }, parent);
    SRT.el("line", { x1: SL.x0, y1: SL.y, x2: x, y2: SL.y,
      stroke: "#6d5dfc", "stroke-width": 8, "stroke-linecap": "round", "pointer-events": "none" }, parent);
    SRT.el("circle", { cx: x, cy: SL.y, r: 14, fill: "#ffffff", stroke: "#6d5dfc",
      "stroke-width": 3, "data-kin-energy": "handle", style: "cursor:grab;" }, parent);
    SRT.addText(parent, SL.x0, SL.y + 30, "0", "tiny", {
      "text-anchor": "middle", fill: "#5c6678", "font-size": 12
    });
    SRT.addText(parent, SL.x1, SL.y + 30, "0,99 c", "tiny", {
      "text-anchor": "middle", fill: "#5c6678", "font-size": 12
    });
  }
})();
