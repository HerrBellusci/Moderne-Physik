(function () {
  const W = 862;
  const H = 506;
  const CYCLE = 4200;
  const EMISSION_X = 360;
  const PHOTON_END_X = 744;
  const TOP_Y = 230;
  const BOTTOM_Y = 326;
  const SL = { x0: 170, x1: 690, y: 438 };

  function ensureInteractive(host, state) {
    if (host.__constcInit) return;
    host.__constcInit = true;

    const svgRoot = host.ownerSVGElement || host;
    let dragging = false;

    const toLocal = (event) => {
      const ctm = host.getScreenCTM();
      if (!ctm) return null;
      const point = svgRoot.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return point.matrixTransform(ctm.inverse());
    };

    const updateSlider = (event) => {
      const point = toLocal(event);
      if (!point) return;
      const fraction = Math.max(0, Math.min(1, (point.x - SL.x0) / (SL.x1 - SL.x0)));
      if (fraction === state.sourceFraction) return;
      state.sourceFraction = fraction;
      host.dispatchEvent(new CustomEvent("srt-render", { bubbles: true }));
    };

    host.addEventListener("pointerdown", (event) => {
      const role = event.target?.getAttribute?.("data-constc");
      if (role !== "track" && role !== "handle") return;
      event.stopPropagation();
      event.preventDefault();
      dragging = true;
      updateSlider(event);
    });

    window.addEventListener("pointermove", (event) => {
      if (dragging) updateSlider(event);
    });

    const stop = () => { dragging = false; };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  window.SRTSlide.register("constc", {
    initialState: {
      frame: "earth",
      sourceFraction: 0.35
    },
    showMotionControl: false,
    controls: [
      {
        type: "segmented",
        key: "frame",
        label: "Bezugssystem",
        options: [
          {
            label: "Erdsystem",
            value: "earth",
            description: "Darstellung im Bezugssystem der Erde"
          },
          {
            label: "Raumschiffsystem",
            value: "ship",
            description: "Darstellung im Bezugssystem des Raumschiffs"
          }
        ]
      }
    ],
    render: ({ parent, t, state, SRT }) => {
      SRT.clear(parent);
      ensureInteractive(parent, state);

      const phase = (t % CYCLE) / CYCLE;
      const beta = state.sourceFraction * 0.62;
      const lightDistance = (PHOTON_END_X - EMISSION_X) * phase;
      const photonX = EMISSION_X + lightDistance;
      const inShipFrame = state.frame === "ship";
      const shipX = inShipFrame
        ? EMISSION_X
        : EMISSION_X + lightDistance * beta;
      const earthX = inShipFrame
        ? EMISSION_X - lightDistance * beta
        : EMISSION_X;

      drawBackground(parent, SRT);
      drawPulse(parent, SRT, shipX, photonX, TOP_Y, true);
      drawPulse(parent, SRT, earthX, photonX, BOTTOM_Y, false);
      drawRocket(parent, SRT, shipX, TOP_Y);
      drawEarthReference(parent, SRT, earthX, BOTTOM_Y);
      drawVelocityArrow(
        parent,
        SRT,
        inShipFrame ? earthX : shipX,
        inShipFrame ? BOTTOM_Y : TOP_Y,
        inShipFrame ? -1 : 1
      );
      drawLabels(parent, SRT, inShipFrame);
      drawSlider(parent, SRT, state.sourceFraction);
    }
  });

  function drawBackground(parent, SRT) {
    SRT.el("rect", {
      x: 0, y: 0, width: W, height: H, rx: 18,
      fill: "#f7f9fb"
    }, parent);
    SRT.el("rect", {
      x: 72, y: 118, width: 718, height: 250, rx: 16,
      fill: "#ffffff", stroke: "#d8e1ea"
    }, parent);
    drawGrid(parent, SRT);
    drawLane(parent, SRT, TOP_Y);
    drawLane(parent, SRT, BOTTOM_Y);
  }

  function drawGrid(parent, SRT) {
    const start = 96;
    const spacing = 48;
    for (let i = 0; i < 15; i++) {
      const x = start + i * spacing;
      SRT.el("line", {
        x1: x, y1: 146, x2: x, y2: 350,
        stroke: "#dbe3ec", "stroke-width": 1.5,
        opacity: 0.55
      }, parent);
    }
  }

  function drawLane(parent, SRT, y) {
    SRT.el("line", {
      x1: 112, y1: y, x2: 766, y2: y,
      stroke: "#9aa7b6", "stroke-width": 3,
      "stroke-linecap": "round"
    }, parent);
  }

  function drawLabels(parent, SRT, inShipFrame) {
    const topLabel = inShipFrame
      ? "Lichtquelle ruht"
      : "bewegte Lichtquelle";
    const bottomLabel = inShipFrame
      ? "Vergleichsquelle bewegt sich"
      : "Vergleich: ruhende Lichtquelle";

    SRT.addText(parent, 754, TOP_Y - 25, topLabel, "tiny", {
      fill: "#516173",
      "font-size": 12,
      "font-weight": 750,
      "text-anchor": "end"
    });
    SRT.addText(parent, 754, BOTTOM_Y - 25, bottomLabel, "tiny", {
      fill: "#516173",
      "font-size": 12,
      "font-weight": 750,
      "text-anchor": "end"
    });
  }

  function drawRocket(parent, SRT, x, y) {
    const width = 38;
    const height = 20;
    SRT.el("rect", {
      x: x - width / 2, y: y - height / 2,
      width, height, rx: 4,
      fill: "#cbd5e1"
    }, parent);
    SRT.el("polygon", {
      points: `${x + width / 2},${y - height / 2} ${x + width / 2 + 15},${y} ${x + width / 2},${y + height / 2}`,
      fill: "#cbd5e1"
    }, parent);
    SRT.el("circle", {
      cx: x + 5, cy: y, r: 5,
      fill: "#6d5dfc", opacity: 0.7
    }, parent);
  }

  function drawEarthReference(parent, SRT, x, y) {
    SRT.el("rect", {
      x: x - 3, y: y - 20, width: 6, height: 20, rx: 2,
      fill: "#8b6b4a"
    }, parent);
    SRT.el("circle", {
      cx: x, cy: y - 24, r: 13,
      fill: "#5fa36f"
    }, parent);
    SRT.el("line", {
      x1: x - 18, y1: y + 1, x2: x + 18, y2: y + 1,
      stroke: "#64748b", "stroke-width": 3,
      "stroke-linecap": "round"
    }, parent);
  }

  function drawPulse(parent, SRT, sourceX, photonX, y, active) {
    const color = active ? "#ffc83d" : "#94a3b8";
    SRT.el("line", {
      x1: sourceX, y1: y, x2: photonX, y2: y,
      stroke: color, "stroke-width": active ? 5 : 4,
      "stroke-linecap": "round", opacity: active ? 1 : 0.8
    }, parent);
    SRT.el("circle", {
      cx: photonX, cy: y, r: active ? 11 : 8,
      fill: color, opacity: active ? 1 : 0.9,
      filter: active ? "url(#glow)" : "none"
    }, parent);
    if (active) {
      SRT.el("circle", {
        cx: photonX, cy: y, r: 4,
        fill: "#fff"
      }, parent);
    }
  }

  function drawVelocityArrow(parent, SRT, x, y, direction) {
    const x1 = x - direction * 44;
    const x2 = x - direction * 8;
    const arrowY = y - 34;
    SRT.el("line", {
      x1, y1: arrowY, x2, y2: arrowY,
      stroke: "#6d5dfc", "stroke-width": 3,
      "stroke-linecap": "round"
    }, parent);
    SRT.el("polygon", {
      points: direction > 0
        ? `${x2},${arrowY} ${x2 - 10},${arrowY - 6} ${x2 - 10},${arrowY + 6}`
        : `${x2},${arrowY} ${x2 + 10},${arrowY - 6} ${x2 + 10},${arrowY + 6}`,
      fill: "#6d5dfc"
    }, parent);
  }

  function drawSlider(parent, SRT, fraction) {
    const handleX = SL.x0 + (SL.x1 - SL.x0) * fraction;
    SRT.el("line", {
      x1: SL.x0, y1: SL.y, x2: SL.x1, y2: SL.y,
      stroke: "#cbd5e1", "stroke-width": 6, "stroke-linecap": "round",
      "data-constc": "track", style: "cursor:pointer"
    }, parent);
    SRT.el("line", {
      x1: SL.x0, y1: SL.y, x2: handleX, y2: SL.y,
      stroke: "#ffc83d", "stroke-width": 6, "stroke-linecap": "round",
      "pointer-events": "none"
    }, parent);
    SRT.el("circle", {
      cx: handleX, cy: SL.y, r: 13,
      fill: "#fff", stroke: "#ffc83d", "stroke-width": 3,
      "data-constc": "handle", style: "cursor:grab"
    }, parent);
  }
})();
