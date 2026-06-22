(function () {
  const W = 862, H = 506;

  // Senkrechte "Fallstrecke" des Myons (schematisch, nicht maßstabsgetreu).
  const MUON_X = 408;
  const SKY_TOP = 112;
  const GROUND_Y = 452;
  const FULL_H = GROUND_Y - SKY_TOP;
  const BAND = { x: 352, w: 112 };

  // Rein zur anschaulichen Taktung der Animation – NICHT der Wert aus der Rechnung.
  // Ein größerer Wert lässt die Überlebenskurve schneller fallen, sodass das
  // "klassische" Myon sichtbar weit oberhalb des Bodens zerfällt.
  const GAMMA_ILL = 5;
  const DECAY_REM = 0.20;                                  // Myon "zerfällt" bei diesem Restanteil
  const DEATH_P = Math.log(1 / DECAY_REM) / GAMMA_ILL;     // ≈ 0,32 der Fallstrecke
  const DEATH_Y = SKY_TOP + FULL_H * DEATH_P;

  const FALL_MS = 3500, HOLD_MS = 1300, FIZZLE_MS = 700;

  const MATH_FONT = "Cambria Math, STIX Two Math, Latin Modern Math, Times New Roman, serif";
  const INK = "#172033", MUTED = "#5c6678", FAINT = "#cbd5e1";
  const ACCENT = "#6d5dfc", GOOD = "#2e7d50", WARN = "#c2414b", AMBER = "#e0a93b";

  function survival(p, nlife) {
    return Math.exp(-p * nlife);
  }

  function addMathText(parent, SRT, x, y, value, className, attrs = {}) {
    return SRT.addText(parent, x, y, value, className, { "font-family": MATH_FONT, ...attrs });
  }

  function drawBackground(parent, SRT) {
    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#f7f9fb" }, parent);
    SRT.addText(parent, 431, 36, "Myon in der Atmosphäre, beobachtet vom Erdboden", "label", {
      "text-anchor": "middle", fill: INK, "font-size": 18, "font-weight": "900"
    });
    SRT.addText(parent, 431, 58, "(Sicht eines ruhenden Beobachters im Erdsystem)", "tiny", {
      "text-anchor": "middle", fill: MUTED, "font-size": 12, "font-weight": "700"
    });
  }

  function drawScene(parent, SRT, view) {
    // Atmosphärensäule
    SRT.el("rect", { x: BAND.x, y: SKY_TOP - 20, width: BAND.w, height: (GROUND_Y - SKY_TOP) + 20,
      rx: 12, fill: "#e9eefb", stroke: "rgba(23,32,51,0.10)", "stroke-width": 1.5 }, parent);

    // Entstehung oben
    SRT.el("line", { x1: BAND.x - 8, y1: SKY_TOP, x2: BAND.x + BAND.w + 8, y2: SKY_TOP,
      stroke: AMBER, "stroke-width": 1.5, "stroke-dasharray": "4 4" }, parent);
    SRT.addText(parent, BAND.x - 18, SKY_TOP - 8, "Entstehung in der oberen Atmosphäre", "tiny", {
      "text-anchor": "end", fill: MUTED, "font-size": 12, "font-weight": "800"
    });
    SRT.addText(parent, BAND.x - 18, SKY_TOP + 9, "(≈ 10 km Höhe)", "tiny", {
      "text-anchor": "end", fill: MUTED, "font-size": 11, "font-weight": "700"
    });

    // Klassisch erwartete Reichweite (Eigen-Lebensdauer ohne Zeitdilatation)
    const reachActive = view === "classic";
    SRT.el("line", { x1: BAND.x - 8, y1: DEATH_Y, x2: BAND.x + BAND.w + 8, y2: DEATH_Y,
      stroke: WARN, "stroke-width": reachActive ? 1.8 : 1.2,
      "stroke-dasharray": "6 5", opacity: reachActive ? 0.9 : 0.35 }, parent);
    SRT.addText(parent, BAND.x - 18, DEATH_Y - 4, "ohne Zeitdilatation", "tiny", {
      "text-anchor": "end", fill: WARN, "font-size": 12, "font-weight": "850",
      opacity: reachActive ? 1 : 0.45
    });
    SRT.addText(parent, BAND.x - 18, DEATH_Y + 12, "hier längst zerfallen", "tiny", {
      "text-anchor": "end", fill: WARN, "font-size": 11, "font-weight": "750",
      opacity: reachActive ? 1 : 0.45
    });

    // Erdboden mit Detektor
    SRT.el("line", { x1: BAND.x - 40, y1: GROUND_Y, x2: BAND.x + BAND.w + 40, y2: GROUND_Y,
      stroke: INK, "stroke-width": 3, "stroke-linecap": "round" }, parent);
    for (let i = 0; i < 10; i += 1) {
      const x = BAND.x - 36 + i * 20;
      SRT.el("line", { x1: x, y1: GROUND_Y, x2: x - 8, y2: GROUND_Y + 10,
        stroke: INK, "stroke-width": 1.4 }, parent);
    }
    SRT.addText(parent, BAND.x - 18, GROUND_Y + 22, "Erdoberfläche (Detektor)", "tiny", {
      "text-anchor": "end", fill: INK, "font-size": 12, "font-weight": "850"
    });
  }

  function drawExplain(parent, SRT, view) {
    const x = 506, y = 96, w = 320, h = 232;
    const accent = view === "classic" ? WARN : GOOD;
    SRT.el("rect", { x, y, width: w, height: h, rx: 12, fill: "#ffffff",
      stroke: "rgba(23,32,51,0.14)", "stroke-width": 2 }, parent);
    SRT.el("rect", { x, y, width: 6, height: h, rx: 3, fill: accent }, parent);

    const heading = view === "classic" ? "Ohne Zeitdilatation (klassisch)" : "Mit Zeitdilatation (relativistisch)";
    SRT.addText(parent, x + 24, y + 34, heading, "label", {
      fill: accent, "font-size": 16, "font-weight": "900"
    });

    const lines = view === "classic"
      ? [
          "Ein Myon lebt im Mittel nur",
          "rund τ ≈ 2,2 µs (Eigenzeit).",
          "",
          "Klassisch käme es damit nur",
          "wenige hundert Meter weit und",
          "wäre weit oberhalb des Bodens",
          "zerfallen, es dürfte den",
          "Detektor nie erreichen."
        ]
      : [
          "Vom Erdboden aus gemessen lebt",
          "das schnelle Myon γ-mal länger.",
          "",
          "Die gedehnte Lebensdauer reicht,",
          "um die ganze Strecke bis zum",
          "Boden zurückzulegen.",
          "",
        ];
    lines.forEach((line, i) => {
      if (!line) return;
      const attrs = {
        fill: i === 0 ? INK : MUTED, "font-size": 13, "font-weight": i === 0 ? "850" : "700"
      };
      const ty = y + 62 + i * 19;
      // Zeile mit dem griechischen τ im Mathe-Font setzen, sonst normale Schrift.
      if (line.indexOf("τ") !== -1) {
        addMathText(parent, SRT, x + 24, ty, line, "tiny", attrs);
      } else {
        SRT.addText(parent, x + 24, ty, line, "tiny", attrs);
      }
    });
  }

  function drawBirth(parent, SRT, p) {
    const opacity = p < 0.10 ? 1 - p / 0.10 : 0;
    if (opacity <= 0) return;
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      SRT.el("line", {
        x1: MUON_X + Math.cos(a) * 7, y1: SKY_TOP + Math.sin(a) * 7,
        x2: MUON_X + Math.cos(a) * 17, y2: SKY_TOP + Math.sin(a) * 17,
        stroke: AMBER, "stroke-width": 2.5, "stroke-linecap": "round", opacity
      }, parent);
    }
  }

  function drawMuon(parent, SRT, y, rem) {
    // Bewegungsschweif nach oben
    const len = 14 + 42 * Math.min((y - SKY_TOP) / FULL_H * 3, 1);
    SRT.el("ellipse", { cx: MUON_X, cy: y - len, rx: 6, ry: len,
      fill: ACCENT, opacity: 0.16 }, parent);
    // weicher Schein
    SRT.el("circle", { cx: MUON_X, cy: y, r: 19, fill: ACCENT, opacity: 0.14 + 0.16 * rem }, parent);
    // Lebensdauer-Ring (Resttakt)
    SRT.el("circle", { cx: MUON_X, cy: y, r: 14, fill: "none", stroke: FAINT, "stroke-width": 3.5 }, parent);
    SRT.el("circle", { cx: MUON_X, cy: y, r: 14, fill: "none", stroke: ACCENT, "stroke-width": 3.5,
      "stroke-linecap": "round", pathLength: 100, "stroke-dasharray": `${(rem * 100).toFixed(1)} 100`,
      transform: `rotate(-90 ${MUON_X} ${y})` }, parent);
    SRT.el("circle", { cx: MUON_X, cy: y, r: 5.5, fill: "#ffffff", stroke: ACCENT, "stroke-width": 2 }, parent);
  }

  function drawFizzle(parent, SRT, y, k) {
    const opacity = Math.max(0, 1 - k);
    const r = 8 + 36 * k;
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      SRT.el("line", {
        x1: MUON_X + Math.cos(a) * 6, y1: y + Math.sin(a) * 6,
        x2: MUON_X + Math.cos(a) * r, y2: y + Math.sin(a) * r,
        stroke: WARN, "stroke-width": 2, "stroke-linecap": "round", opacity
      }, parent);
    }
    SRT.el("circle", { cx: MUON_X, cy: y, r: 3, fill: FAINT, opacity: 0.9 }, parent);
  }

  function drawSurvive(parent, SRT, y, s) {
    drawMuon(parent, SRT, y, survival(1, 1));
    SRT.el("circle", { cx: MUON_X, cy: y, r: 14 + 30 * Math.min(s * 1.4, 1),
      fill: "none", stroke: GOOD, "stroke-width": 3, opacity: Math.max(0, 1 - s) }, parent);
    SRT.addText(parent, MUON_X, y + 40, "nachgewiesen", "tiny", {
      "text-anchor": "middle", fill: GOOD, "font-size": 13, "font-weight": "850",
      opacity: Math.max(0, 1 - s)
    });
  }

  function renderClassic(parent, SRT, t) {
    const nlife = GAMMA_ILL;
    SRT.clear(parent);
    drawBackground(parent, SRT);
    drawScene(parent, SRT, "classic");
    drawExplain(parent, SRT, "classic");

    const fallDur = DEATH_P * FALL_MS;
    const cycle = fallDur + HOLD_MS;
    const tc = t % cycle;
    if (tc < fallDur) {
      const p = (tc / fallDur) * DEATH_P;
      drawBirth(parent, SRT, p);
      drawMuon(parent, SRT, SKY_TOP + FULL_H * p, survival(p, nlife));
    } else {
      drawFizzle(parent, SRT, DEATH_Y, Math.min((tc - fallDur) / FIZZLE_MS, 1));
    }
  }

  function renderRelativistic(parent, SRT, t) {
    SRT.clear(parent);
    drawBackground(parent, SRT);
    drawScene(parent, SRT, "relativistic");
    drawExplain(parent, SRT, "relativistic");

    const cycle = FALL_MS + HOLD_MS;
    const tc = t % cycle;
    if (tc < FALL_MS) {
      const p = tc / FALL_MS;
      drawBirth(parent, SRT, p);
      drawMuon(parent, SRT, SKY_TOP + FULL_H * p, survival(p, 1));
    } else {
      drawSurvive(parent, SRT, GROUND_Y, (tc - FALL_MS) / HOLD_MS);
    }
  }

  window.SRTSlide.register("myon-klassisch", {
    render({ parent, t, SRT }) { renderClassic(parent, SRT, t); }
  });

  window.SRTSlide.register("myon-relativistisch", {
    render({ parent, t, SRT }) { renderRelativistic(parent, SRT, t); }
  });
})();
