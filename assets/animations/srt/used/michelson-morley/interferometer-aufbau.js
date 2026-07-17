(function () {
  let step = 1;
  let ringCanvas = null;
  let ringCtx = null;
  let ringImage = null;

  const W = 862, H = 506;
  const STEPS = 5;
  const BTN = { y: 16, h: 40, w: 150, gap: 10 };
  const BTN_X0 = (W - (STEPS * BTN.w + (STEPS - 1) * BTN.gap)) / 2;

  const APP = { x: 24, y: 80, w: 600, h: 320 };
  const RING = { cx: 740, cy: 240, r: 88 };

  const LASER  = { x: 92,  y: 240 };
  const LENS   = { x: 224, y: 240 };
  const SPLIT  = { x: 360, y: 240 };
  const M_EAST = { x: 540, y: 240 };
  const M_NORTH= { x: 360, y: 124 };
  const SCREEN = { x: 360, y: 360 };

  const STEP_LABELS = [
    "1 · Laser",
    "2 · Linse",
    "3 · Strahlteiler",
    "4 · Spiegel",
    "5 · Schirm"
  ];

  const STEP_TEXTS = [
    [
      "Ein Laser liefert kohärentes Licht.",
      "Der Lichtstrahl wird anschließend aufgeweitet und aufgeteilt."
    ],
    [
      "Eine Linse weitet den Strahl auf.",
      "Damit enthält das Lichtbündel viele leicht unterschiedliche Winkel."
    ],
    [
      "Ein halbdurchlässiger Spiegel (Strahlteiler) im 45°-Winkel teilt den Strahl auf.",
      "Etwa 50 % gehen geradeaus weiter (rot), 50 % werden um 90° abgelenkt (grün)."
    ],
    [
      "Zwei vollverspiegelte Spiegel reflektieren beide Teilstrahlen in sich zurück.",
      "Beide Strahlen treffen sich erneut am Strahlteiler und überlagern sich."
    ],
    [
      "Am Schirm überlagern sich beide Strahlen.",
      "Je nach Wegunterschied entstehen helle und dunkle Interferenzringe."
    ]
  ];

  const COL = {
    laser: "#ffc83d",
    main:  "#ffc83d",
    pathR: "#ff6b6b",
    pathG: "#6ee7b7",
    combined: "#fff1a8",
    body:  "#cfd8e3",
    glass: "#9cecf2",
    inactive: "rgba(255,255,255,0.18)",
    panel: "rgba(255,255,255,0.035)",
    panelBorder: "rgba(255,255,255,0.14)"
  };

  function ensureInteractive(host) {
    if (host.__aufbauInit) return;
    host.__aufbauInit = true;
    host.addEventListener("pointerdown", (e) => {
      const role = e.target && e.target.getAttribute && e.target.getAttribute("data-aufbau-step");
      if (!role) return;
      e.stopPropagation();
      e.preventDefault();
      step = parseInt(role, 10);
      // Klick-gesteuerte Grafik: explizit neu zeichnen, die Animationsschleife läuft nicht.
      host.dispatchEvent(new Event("srt-render", { bubbles: true }));
    });
  }

  window.SRTSlide.register("aufbau", ({ parent, t, SRT }) => {
    SRT.clear(parent);
    ensureInteractive(parent);

    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#101725" }, parent);

    const defs = SRT.el("defs", {}, parent);
    const glow = SRT.el("filter", { id: "aufbau-glow", x: "-80%", y: "-80%", width: "260%", height: "260%" }, defs);
    SRT.el("feGaussianBlur", { stdDeviation: "5", result: "blur" }, glow);
    const merge = SRT.el("feMerge", {}, glow);
    SRT.el("feMergeNode", { in: "blur" }, merge);
    SRT.el("feMergeNode", { in: "SourceGraphic" }, merge);

    drawSteps(parent, SRT);
    drawApparatus(parent, SRT, t);
    drawExplain(parent, SRT);
  });

  function drawSteps(parent, SRT) {
    for (let i = 0; i < STEPS; i++) {
      const x = BTN_X0 + i * (BTN.w + BTN.gap);
      const n = i + 1;
      const isActive = step === n;
      const isPast = step > n;
      const fill = isActive ? "#0097a7" : (isPast ? "rgba(0,151,167,0.28)" : "rgba(255,255,255,0.04)");
      const stroke = isActive ? "#0097a7" : (isPast ? "rgba(0,151,167,0.55)" : "rgba(255,255,255,0.32)");
      const textFill = isActive ? "#ffffff" : (isPast ? "#9cecf2" : "#cfd8e3");
      SRT.el("rect", {
        x, y: BTN.y, width: BTN.w, height: BTN.h, rx: 10,
        fill, stroke, "stroke-width": isActive ? 2 : 1.4,
        "data-aufbau-step": String(n), style: "cursor: pointer;"
      }, parent);
      SRT.addText(parent, x + BTN.w / 2, BTN.y + BTN.h / 2 + 5, STEP_LABELS[i], "label", {
        fill: textFill, "font-size": 13, "text-anchor": "middle",
        "font-weight": isActive ? "700" : "600", "pointer-events": "none"
      });
    }
  }

  function drawApparatus(parent, SRT, t) {
    SRT.el("rect", { x: APP.x, y: APP.y, width: APP.w, height: APP.h, rx: 14,
      fill: COL.panel, stroke: COL.panelBorder }, parent);

    const showLens   = step >= 2;
    const showSplit  = step >= 3;
    const showMirror = step >= 4;
    const showScreen = step >= 5;

    drawBeams(parent, SRT, t, { showSplit, showMirror, showLens, showScreen });
    drawLaser(parent, SRT);
    if (showLens)   drawLens(parent, SRT);
    if (showSplit)  drawSplitter(parent, SRT);
    if (showMirror) drawMirrors(parent, SRT);
    if (showScreen) drawScreen(parent, SRT);

    drawRingPanel(parent, SRT, showScreen);
  }

  function drawLaser(parent, SRT) {
    SRT.el("rect", { x: LASER.x - 22, y: LASER.y - 16, width: 44, height: 32, rx: 5,
      fill: "#172033", stroke: COL.body, "stroke-width": 1.5 }, parent);
    SRT.el("rect", { x: LASER.x - 16, y: LASER.y - 9, width: 24, height: 18, rx: 2,
      fill: "rgba(255,200,61,0.18)" }, parent);
    SRT.el("circle", { cx: LASER.x + 14, cy: LASER.y, r: 5,
      fill: COL.laser, filter: "url(#aufbau-glow)" }, parent);
    SRT.addText(parent, LASER.x, LASER.y + 36, "Laser", "label",
      { fill: COL.body, "font-size": 12, "text-anchor": "middle" });
  }

  function drawLens(parent, SRT) {
    const x = LENS.x, y = LENS.y;
    SRT.el("path", {
      d: `M${x} ${y - 28} Q${x - 11} ${y} ${x} ${y + 28} Q${x + 11} ${y} ${x} ${y - 28} Z`,
      fill: "rgba(156,236,242,0.28)", stroke: COL.glass, "stroke-width": 1.6
    }, parent);
    SRT.addText(parent, x, y - 44, "Linse", "label",
      { fill: COL.body, "font-size": 12, "text-anchor": "middle" });
    SRT.addText(parent, x, y - 30, "weitet auf", "label",
      { fill: "#9aaab8", "font-size": 10, "text-anchor": "middle", "font-weight": "500" });
  }

  function drawSplitter(parent, SRT) {
    const x = SPLIT.x, y = SPLIT.y;
    SRT.el("rect", { x: x - 22, y: y - 22, width: 44, height: 44, rx: 4,
      fill: "rgba(255,255,255,0.04)", stroke: "rgba(255,255,255,0.18)", "stroke-width": 1 }, parent);
    SRT.el("line", { x1: x - 18, y1: y + 18, x2: x + 18, y2: y - 18,
      stroke: COL.body, "stroke-width": 3.4, "stroke-linecap": "round" }, parent);
    SRT.addText(parent, x + 30, y - 26, "Strahlteiler", "label",
      { fill: COL.body, "font-size": 12, "text-anchor": "start" });
    SRT.addText(parent, x + 30, y - 12, "45° · halbdurchlässig", "label",
      { fill: "#9aaab8", "font-size": 10, "text-anchor": "start", "font-weight": "500" });
  }

  function drawMirrors(parent, SRT) {
    const eN = M_NORTH;
    SRT.el("rect", { x: eN.x - 30, y: eN.y - 6, width: 60, height: 8, rx: 2,
      fill: COL.body }, parent);
    SRT.el("line", { x1: eN.x - 30, y1: eN.y + 4, x2: eN.x + 30, y2: eN.y + 4,
      stroke: "rgba(255,255,255,0.22)", "stroke-width": 1 }, parent);
    SRT.addText(parent, eN.x, eN.y - 14, "Spiegel oben", "label",
      { fill: COL.body, "font-size": 12, "text-anchor": "middle" });

    const eE = M_EAST;
    SRT.el("rect", { x: eE.x - 4, y: eE.y - 30, width: 8, height: 60, rx: 2,
      fill: COL.body }, parent);
    SRT.el("line", { x1: eE.x - 4, y1: eE.y - 30, x2: eE.x - 4, y2: eE.y + 30,
      stroke: "rgba(255,255,255,0.22)", "stroke-width": 1 }, parent);
    SRT.addText(parent, eE.x + 14, eE.y + 4, "Spiegel rechts", "label",
      { fill: COL.body, "font-size": 12, "text-anchor": "start" });
  }

  function drawScreen(parent, SRT) {
    SRT.el("rect", { x: SCREEN.x - 70, y: SCREEN.y - 4, width: 140, height: 12, rx: 3,
      fill: "#172033", stroke: COL.body, "stroke-width": 1.5 }, parent);
    SRT.el("rect", { x: SCREEN.x - 70, y: SCREEN.y + 8, width: 140, height: 4,
      fill: "rgba(255,200,61,0.45)" }, parent);
    SRT.addText(parent, SCREEN.x, SCREEN.y + 30, "Schirm", "label",
      { fill: COL.body, "font-size": 12, "text-anchor": "middle" });
  }

  function drawBeams(parent, SRT, t, flags) {
    const { showSplit, showMirror, showLens, showScreen } = flags;
    // Statische Grafik: konstante Strahl-Deckkraft statt zeitabhängigem Pulsieren.
    const pulse = 0.9;

    const beamStartX = LASER.x + 18;
    const preLensEndX = showLens ? LENS.x - 12 : (showSplit ? SPLIT.x - 22 : (showMirror ? SPLIT.x : APP.x + APP.w - 24));

    SRT.el("line", {
      x1: beamStartX, y1: LASER.y, x2: preLensEndX, y2: LASER.y,
      stroke: COL.main, "stroke-width": 3, opacity: pulse, "stroke-linecap": "round"
    }, parent);

    if (showLens) {
      SRT.el("line", {
        x1: LENS.x + 12, y1: LENS.y, x2: SPLIT.x - 22, y2: LASER.y,
        stroke: COL.main, "stroke-width": 3, opacity: pulse, "stroke-linecap": "round"
      }, parent);
      SRT.el("path", {
        d: `M${LENS.x + 12} ${LENS.y - 4} L${SPLIT.x - 22} ${LASER.y - 14} L${SPLIT.x - 22} ${LASER.y + 14} L${LENS.x + 12} ${LENS.y + 4} Z`,
        fill: "rgba(255,200,61,0.18)", "pointer-events": "none"
      }, parent);
    }

    if (!showSplit) return;

    if (!showMirror) {
      SRT.el("line", {
        x1: SPLIT.x + 18, y1: SPLIT.y, x2: APP.x + APP.w - 24, y2: SPLIT.y,
        stroke: COL.pathR, "stroke-width": 2.4, opacity: 0.7,
        "stroke-dasharray": "8 6", "stroke-linecap": "round"
      }, parent);
      SRT.el("line", {
        x1: SPLIT.x, y1: SPLIT.y - 18, x2: SPLIT.x, y2: APP.y + 8,
        stroke: COL.pathG, "stroke-width": 2.4, opacity: 0.7,
        "stroke-dasharray": "8 6", "stroke-linecap": "round"
      }, parent);
      SRT.addText(parent, APP.x + APP.w - 24, SPLIT.y - 10,
        "→ verloren (kein Spiegel)", "label",
        { fill: "#9aaab8", "font-size": 10, "text-anchor": "end", "font-weight": "500" });
      return;
    }

    SRT.el("line", {
      x1: SPLIT.x + 18, y1: SPLIT.y - 6, x2: M_EAST.x - 6, y2: SPLIT.y - 6,
      stroke: COL.pathR, "stroke-width": 2.6, opacity: 0.95, "stroke-linecap": "round"
    }, parent);
    SRT.el("line", {
      x1: M_EAST.x - 6, y1: SPLIT.y + 6, x2: SPLIT.x + 18, y2: SPLIT.y + 6,
      stroke: COL.pathR, "stroke-width": 2.6, opacity: 0.95, "stroke-linecap": "round"
    }, parent);

    SRT.el("line", {
      x1: SPLIT.x - 6, y1: SPLIT.y - 18, x2: SPLIT.x - 6, y2: M_NORTH.y + 6,
      stroke: COL.pathG, "stroke-width": 2.6, opacity: 0.95, "stroke-linecap": "round"
    }, parent);
    SRT.el("line", {
      x1: SPLIT.x + 6, y1: M_NORTH.y + 6, x2: SPLIT.x + 6, y2: SPLIT.y - 18,
      stroke: COL.pathG, "stroke-width": 2.6, opacity: 0.95, "stroke-linecap": "round"
    }, parent);

    const downEndY = showScreen ? SCREEN.y - 6 : APP.y + APP.h - 18;
    SRT.el("line", {
      x1: SPLIT.x - 4, y1: SPLIT.y + 18, x2: SPLIT.x - 4, y2: downEndY,
      stroke: COL.pathR, "stroke-width": 2.6, opacity: 0.92, "stroke-linecap": "round"
    }, parent);
    SRT.el("line", {
      x1: SPLIT.x + 4, y1: SPLIT.y + 18, x2: SPLIT.x + 4, y2: downEndY,
      stroke: COL.pathG, "stroke-width": 2.6, opacity: 0.92, "stroke-linecap": "round"
    }, parent);

    if (showScreen) {
      SRT.el("circle", { cx: SPLIT.x, cy: SCREEN.y + 2, r: 9,
        fill: COL.combined, filter: "url(#aufbau-glow)", "pointer-events": "none" }, parent);
    }
  }

  function drawRingPanel(parent, SRT, showRings) {
    SRT.el("rect", { x: 638, y: APP.y, width: APP.x + APP.w + 200 - 638, height: APP.h, rx: 14,
      fill: COL.panel, stroke: COL.panelBorder }, parent);
    SRT.addText(parent, 654, APP.y + 24, "Ansicht des Schirms", "label",
      { fill: "#ffffff", "font-size": 12, "font-weight": "600" });

    if (!showRings) {
      SRT.el("circle", { cx: RING.cx, cy: RING.cy, r: RING.r, fill: "#06101f",
        stroke: "rgba(255,255,255,0.16)", "stroke-width": 1.4 }, parent);
      SRT.el("circle", { cx: RING.cx, cy: RING.cy, r: 4, fill: "rgba(255,255,255,0.18)" }, parent);
      SRT.addText(parent, RING.cx, RING.cy + RING.r + 22,
        "noch kein Schirm vorhanden", "label",
        { fill: "#9aaab8", "font-size": 11, "text-anchor": "middle" });
      return;
    }

    const cw = Math.round(RING.r * 2 + 8);
    const ch = cw;
    if (!ringCanvas || ringCanvas.width !== cw) {
      ringCanvas = document.createElement("canvas");
      ringCanvas.width = cw;
      ringCanvas.height = ch;
      ringCtx = ringCanvas.getContext("2d", { willReadFrequently: true });
      ringImage = ringCtx.createImageData(cw, ch);
    }

    const data = ringImage.data;
    const ccx = cw / 2, ccy = ch / 2;
    const phaseBase = 2 * Math.PI * 1.4;
    const curvature = 0.0048;
    let idx = 0;
    for (let py = 0; py < ch; py++) {
      const dy = py - ccy;
      for (let px = 0; px < cw; px++) {
        const dx = px - ccx;
        const rho2 = dx * dx + dy * dy;
        const rho = Math.sqrt(rho2);
        const phase = phaseBase - curvature * rho2;
        const rings = Math.pow((1 + Math.cos(phase)) / 2, 1.45);
        const aperture = softAperture(rho, RING.r - 12, RING.r);
        const vignette = Math.max(0.36, 1 - Math.pow(rho / (RING.r * 1.15), 2));
        const intensity = Math.max(0, Math.min(1, rings * vignette * aperture));
        const color = mixRgb([5, 13, 27], [255, 204, 72], intensity);
        data[idx++] = color[0];
        data[idx++] = color[1];
        data[idx++] = color[2];
        data[idx++] = Math.round(255 * aperture);
      }
    }
    ringCtx.putImageData(ringImage, 0, 0);

    SRT.el("image", {
      x: RING.cx - cw / 2, y: RING.cy - ch / 2, width: cw, height: ch,
      href: ringCanvas.toDataURL("image/png"), preserveAspectRatio: "none",
      "pointer-events": "none"
    }, parent);
    SRT.el("circle", { cx: RING.cx, cy: RING.cy, r: RING.r + 4, fill: "none",
      stroke: "#172033", "stroke-width": 4 }, parent);
    SRT.el("circle", { cx: RING.cx, cy: RING.cy, r: RING.r, fill: "none",
      stroke: "#5c6678", "stroke-width": 1.2 }, parent);
    SRT.addText(parent, RING.cx, RING.cy + RING.r + 22,
      "Interferenzringe", "label",
      { fill: "#ffc83d", "font-size": 12, "text-anchor": "middle", "font-weight": "700" });
  }

  function drawExplain(parent, SRT) {
    const x = 24, y = 416, w = W - 48, h = 76;
    SRT.el("rect", { x, y, width: w, height: h, rx: 12,
      fill: "rgba(6,14,28,0.88)", stroke: "rgba(255,255,255,0.22)" }, parent);
    SRT.addText(parent, x + 18, y + 24, `Schritt ${step} · ${STEP_LABELS[step - 1].split(" · ")[1]}`, "label",
      { fill: "#9cecf2", "font-size": 12, "font-weight": "700" });
    const lines = STEP_TEXTS[step - 1];
    SRT.addText(parent, x + 18, y + 48, lines[0], "label",
      { fill: "#ffffff", "font-size": 13 });
    SRT.addText(parent, x + 18, y + 66, lines[1], "label",
      { fill: "#cfd8e3", "font-size": 12 });
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
