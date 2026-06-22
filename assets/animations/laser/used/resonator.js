(function () {
  const W = 862;
  const H = 506;

  const CAVITY = { x: 24, y: 24, w: 504, h: 306 };
  const PANEL = { x: 548, y: 24, w: 290, h: 306 };
  const OUT = { x: 24, y: 350, w: 814, h: 132 };

  const DEFAULT_STATE = {
    source: "gainMedium",
    operation: "resonator",
    pump: 0.64,
    reflectivity: 0.9
  };

  const CONTROLS = [
    {
      id: "source",
      label: "Quelle",
      type: "segmented",
      options: [
        { value: "lamp", label: "Lampe", description: "spontane Emission ohne Besetzungsinversion" },
        { value: "gainMedium", label: "Lasermedium", description: "gepumptes Medium mit moeglicher Inversion" }
      ]
    },
    {
      id: "operation",
      label: "Betriebsart",
      type: "segmented",
      options: [
        { value: "free", label: "frei", description: "keine resonante Rueckkopplung" },
        { value: "resonator", label: "Resonator", description: "Rueckkopplung und Modenselektion" }
      ]
    },
    {
      id: "pump",
      label: "normierte Pumprate P",
      type: "range",
      min: 0,
      max: 1,
      step: 0.01,
      unit: "P/Pmax"
    },
    {
      id: "reflectivity",
      label: "Auskoppler-Reflektivitaet R",
      type: "range",
      min: 0.55,
      max: 0.98,
      step: 0.01,
      unit: "R"
    },
    {
      id: "preset",
      label: "Presets",
      type: "preset",
      options: [
        {
          value: "spontaneousLamp",
          label: "Lampe",
          state: { source: "lamp", operation: "free", pump: 0.48, reflectivity: 0.7 }
        },
        {
          value: "belowThreshold",
          label: "unter Schwelle",
          state: { source: "gainMedium", operation: "resonator", pump: 0.28, reflectivity: 0.82 }
        },
        {
          value: "aboveThreshold",
          label: "ueber Schwelle",
          state: { source: "gainMedium", operation: "resonator", pump: 0.64, reflectivity: 0.9 }
        },
        {
          value: "outputTradeoff",
          label: "Auskopplung",
          state: { source: "gainMedium", operation: "resonator", pump: 0.82, reflectivity: 0.72 }
        }
      ]
    }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function fmt(value) {
    return value.toFixed(2);
  }

  function model(state) {
    const sourceIsLaserMedium = state.source === "gainMedium";
    const resonatorActive = state.operation === "resonator";
    const pump = clamp(Number(state.pump), 0, 1);
    const reflectivity = clamp(Number(state.reflectivity), 0.55, 0.98);
    const outcoupling = 1 - reflectivity;

    const n2 = sourceIsLaserMedium ? clamp(0.08 + 0.84 * pump, 0, 1) : clamp(0.05 + 0.38 * pump, 0, 0.48);
    const n1 = clamp(1 - n2, 0, 1);
    const inversion = n2 - n1;
    const inversionNorm = clamp((inversion + 1) / 2, 0, 1);
    const gain = sourceIsLaserMedium ? clamp(0.12 + 1.12 * Math.max(0, inversion), 0, 1.35) : clamp(0.12 + 0.25 * pump, 0, 0.45);
    const loss = resonatorActive ? clamp(0.14 + 1.24 * outcoupling, 0, 1.35) : 1.18;
    const thresholdPump = clamp((loss - 0.12) / 1.12 / 0.84 + 0.5 - 0.08 / 0.84, 0, 1);
    const excess = Math.max(0, gain - loss);
    const photonDensity = sourceIsLaserMedium && resonatorActive ? clamp(excess / 0.58, 0, 1) : 0;
    const extracted = photonDensity * clamp(outcoupling / 0.28, 0.08, 1);
    const lasing = sourceIsLaserMedium && resonatorActive && inversion > 0 && gain > loss;

    return {
      pump,
      reflectivity,
      outcoupling,
      n1,
      n2,
      inversion,
      inversionNorm,
      gain,
      loss,
      thresholdPump,
      excess,
      photonDensity,
      extracted,
      lasing,
      sourceIsLaserMedium,
      resonatorActive
    };
  }

  function panel(parent, SRT, box, title) {
    SRT.el("rect", {
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      rx: 8,
      fill: "rgba(255,255,255,0.045)",
      stroke: "rgba(255,255,255,0.16)"
    }, parent);
    SRT.addText(parent, box.x + 16, box.y + 26, title, "label", {
      fill: "#ffffff",
      "font-size": 13,
      "font-weight": "900"
    });
  }

  function addLines(parent, SRT, x, y, lines, attrs = {}, gap = 14) {
    lines.forEach((line, index) => {
      SRT.addText(parent, x, y + index * gap, line, "label", attrs);
    });
  }

  function sine(parent, SRT, x0, x1, y, amp, color, phase, width) {
    let d = "";
    for (let x = x0; x <= x1; x += 2) {
      const yy = y + Math.sin((x - x0) * 0.08 + phase) * amp;
      d += `${x === x0 ? "M" : "L"}${x} ${yy} `;
    }
    SRT.el("path", {
      d,
      fill: "none",
      stroke: color,
      "stroke-width": width,
      "stroke-linecap": "round",
      filter: "url(#glow)"
    }, parent);
  }

  function bar(parent, SRT, x, y, w, label, value, color, max = 1.2) {
    SRT.addText(parent, x, y - 8, label, "label", {
      fill: "#cfd8e3",
      "font-size": 10,
      "font-weight": "800"
    });
    SRT.el("rect", { x, y, width: w, height: 14, rx: 7, fill: "#263142" }, parent);
    SRT.el("rect", {
      x,
      y,
      width: clamp(value, 0, max) / max * w,
      height: 14,
      rx: 7,
      fill: color
    }, parent);
  }

  function drawLevelGauge(parent, SRT, x, y, m) {
    const h = 86;
    const w = 86;
    SRT.el("line", { x1: x, y1: y, x2: x + w, y2: y, stroke: "#9aaab8", "stroke-width": 1.4 }, parent);
    SRT.el("line", { x1: x, y1: y + h, x2: x + w, y2: y + h, stroke: "#9aaab8", "stroke-width": 1.4 }, parent);
    SRT.addText(parent, x + w + 8, y + 4, "N2", "label", { fill: "#ffc83d", "font-size": 11, "font-weight": "900" });
    SRT.addText(parent, x + w + 8, y + h + 4, "N1", "label", { fill: "#9cecf2", "font-size": 11, "font-weight": "900" });

    SRT.el("rect", { x: x + 10, y: y - m.n2 * 40, width: 26, height: m.n2 * 40, rx: 3, fill: "#ffc83d" }, parent);
    SRT.el("rect", { x: x + 48, y: y + h - m.n1 * 40, width: 26, height: m.n1 * 40, rx: 3, fill: "#9cecf2" }, parent);

    const inversionText = m.inversion > 0 ? "N2 > N1: Besetzungsinversion" : "N2 < N1: Absorption dominiert";
    SRT.addText(parent, x, y + h + 28, inversionText, "label", {
      fill: m.inversion > 0 ? "#ffc83d" : "#cfd8e3",
      "font-size": 11,
      "font-weight": "900"
    });
  }

  function drawCavity(parent, SRT, t, m) {
    panel(parent, SRT, CAVITY, "Resonator und aktives Medium");
    const left = CAVITY.x + 56;
    const right = CAVITY.x + CAVITY.w - 62;
    const top = CAVITY.y + 74;
    const bottom = CAVITY.y + CAVITY.h - 58;
    const beamY = CAVITY.y + 168;

    SRT.el("rect", {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
      rx: 18,
      fill: "rgba(255,255,255,0.035)",
      stroke: m.resonatorActive ? "rgba(156,236,242,0.28)" : "rgba(255,255,255,0.08)"
    }, parent);

    const mirrorOpacity = m.resonatorActive ? 1 : 0.22;
    SRT.el("line", { x1: left, y1: top - 10, x2: left, y2: bottom + 10, stroke: "#cfd8e3", "stroke-width": 6, "stroke-linecap": "round", opacity: mirrorOpacity }, parent);
    SRT.el("line", { x1: right, y1: top - 10, x2: right, y2: bottom + 10, stroke: "#cfd8e3", "stroke-width": 6, "stroke-linecap": "round", opacity: m.resonatorActive ? 0.35 + m.reflectivity * 0.65 : 0.22 }, parent);
    SRT.addText(parent, left, bottom + 30, "Spiegel", "label", { fill: "#cfd8e3", "font-size": 10, "text-anchor": "middle" });
    SRT.addText(parent, right, bottom + 30, "Auskoppler", "label", { fill: "#cfd8e3", "font-size": 10, "text-anchor": "middle" });

    const atoms = 42;
    for (let i = 0; i < atoms; i += 1) {
      const col = i % 7;
      const row = Math.floor(i / 7);
      const x = left + 42 + col * 45;
      const y = top + 26 + row * 23;
      const rank = ((i * 17) % atoms) / atoms;
      const excited = rank < m.n2;
      SRT.el("circle", {
        cx: x,
        cy: y,
        r: excited ? 5.6 : 4.6,
        fill: excited ? "#ffc83d" : "#3a4555",
        stroke: excited ? "#fff7d6" : "#5c6678",
        "stroke-width": 1
      }, parent);
    }

    if (m.lasing) {
      sine(parent, SRT, left + 18, right - 18, beamY, 14 + m.photonDensity * 12, "#ff5161", t * 0.006, 2.4);
      SRT.el("path", {
        d: `M${right + 10} ${beamY} L${right + 78} ${beamY} M${right + 68} ${beamY - 8} L${right + 80} ${beamY} L${right + 68} ${beamY + 8}`,
        fill: "none",
        stroke: "#ff5161",
        "stroke-width": 3,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        filter: "url(#glow)"
      }, parent);
      addLines(parent, SRT, CAVITY.x + 18, CAVITY.y + CAVITY.h - 34, [
        "Resonatormode baut sich auf:",
        "stimulierte Emission verstaerkt phasenrichtig."
      ], { fill: "#ff8a91", "font-size": 11, "font-weight": "800" });
    } else {
      const rays = [
        [left + 96, beamY - 24, -44, -38],
        [left + 182, beamY + 26, 52, -34],
        [left + 282, beamY - 8, -18, 48],
        [left + 338, beamY + 20, 42, 30]
      ];
      rays.forEach((ray, index) => {
        SRT.el("line", {
          x1: ray[0],
          y1: ray[1],
          x2: ray[0] + ray[2],
          y2: ray[1] + ray[3],
          stroke: m.sourceIsLaserMedium ? "#9aaab8" : "#9cecf2",
          "stroke-width": 1.8,
          "stroke-linecap": "round",
          "stroke-dasharray": index % 2 ? "6 5" : "3 6",
          opacity: m.sourceIsLaserMedium ? 0.55 : 0.9
        }, parent);
      });
      const note = !m.sourceIsLaserMedium
        ? ["Lampenquelle: spontane Photonen,", "aber keine Inversion und keine Modenselektion."]
        : (!m.resonatorActive
          ? ["Betriebsart frei: Inversion moeglich,", "aber ohne Rueckkopplung kein Laserstrahl."]
          : ["Unterhalb der Schwelle:", "Verluste gewinnen gegen die Verstaerkung."]);
      addLines(parent, SRT, CAVITY.x + 18, CAVITY.y + CAVITY.h - 34, note, {
        fill: "#cfd8e3",
        "font-size": 11,
        "font-weight": "800"
      });
    }

    SRT.addText(parent, CAVITY.x + 18, CAVITY.y + 52, "gelb = oberes Laserniveau N2, blau = unteres Niveau N1", "label", {
      fill: "#ffc83d",
      "font-size": 10,
      "font-weight": "700"
    });
  }

  function drawCurve(parent, SRT, m) {
    const x = PANEL.x + 30;
    const y = PANEL.y + 212;
    const w = PANEL.w - 54;
    const h = 48;
    const baseY = y + h;
    SRT.el("line", { x1: x, y1: baseY, x2: x + w, y2: baseY, stroke: "rgba(255,255,255,0.4)", "stroke-width": 1.2 }, parent);
    SRT.el("line", { x1: x, y1: baseY, x2: x, y2: y, stroke: "rgba(255,255,255,0.4)", "stroke-width": 1.2 }, parent);
    SRT.addText(parent, x + w, baseY + 16, "P/Pmax", "label", { fill: "#9aaab8", "font-size": 10, "text-anchor": "end" });
    SRT.addText(parent, x + 4, y - 6, "Iout norm.", "label", { fill: "#9aaab8", "font-size": 10 });

    let d = "";
    for (let i = 0; i <= 80; i += 1) {
      const sample = model({ ...DEFAULT_STATE, pump: i / 80, reflectivity: m.reflectivity });
      const px = x + sample.pump * w;
      const py = baseY - sample.extracted * h;
      d += `${i === 0 ? "M" : "L"}${px} ${py} `;
    }
    SRT.el("path", { d, fill: "none", stroke: "#ff5161", "stroke-width": 2.2, filter: "url(#glow)" }, parent);
    const thX = x + m.thresholdPump * w;
    SRT.el("line", { x1: thX, y1: y, x2: thX, y2: baseY, stroke: "#ffc83d", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, parent);
    SRT.addText(parent, thX + 4, y + 12, "Schwelle", "label", { fill: "#ffc83d", "font-size": 9, "font-weight": "800" });
    SRT.el("circle", {
      cx: x + m.pump * w,
      cy: m.lasing ? baseY - m.extracted * h : baseY,
      r: 6,
      fill: "#ffffff",
      stroke: "#2563eb",
      "stroke-width": 2.4
    }, parent);
  }

  function drawPanel(parent, SRT, m) {
    panel(parent, SRT, PANEL, "Normierte Modellgroessen");
    drawLevelGauge(parent, SRT, PANEL.x + 24, PANEL.y + 66, m);
    bar(parent, SRT, PANEL.x + 154, PANEL.y + 72, PANEL.w - 180, "g/g0", m.gain, "#ffc83d", 1.35);
    bar(parent, SRT, PANEL.x + 154, PANEL.y + 112, PANEL.w - 180, "Verlust L/L0", m.loss, "#9cecf2", 1.35);
    bar(parent, SRT, PANEL.x + 154, PANEL.y + 152, PANEL.w - 180, "(N2-N1) norm.", m.inversionNorm, "#73a2ff", 1);
    bar(parent, SRT, PANEL.x + 154, PANEL.y + 192, PANEL.w - 180, "Photonendichte", m.photonDensity, "#ff5161", 1);
    drawCurve(parent, SRT, m);

    const status = !m.sourceIsLaserMedium
      ? "Quelle Lampe: N2 < N1"
      : (!m.resonatorActive
        ? "kein Resonator: keine Rueckkopplung"
        : (m.lasing ? "Laserbetrieb: g > L" : "unter Schwelle: g < L"));
    SRT.addText(parent, PANEL.x + PANEL.w / 2, PANEL.y + PANEL.h - 16, status, "label", {
      fill: m.lasing ? "#ff5161" : "#cfd8e3",
      "font-size": 11,
      "font-weight": "900",
      "text-anchor": "middle"
    });
  }

  function drawOutput(parent, SRT, t, m) {
    panel(parent, SRT, OUT, "Auskopplung und Reflektivitaets-Tradeoff");
    const y = OUT.y + 78;
    SRT.el("line", { x1: OUT.x + 24, y1: y, x2: OUT.x + OUT.w - 24, y2: y, stroke: "rgba(255,255,255,0.12)", "stroke-width": 1 }, parent);
    if (m.lasing) {
      const amp = 10 + m.extracted * 26;
      sine(parent, SRT, OUT.x + 42, OUT.x + OUT.w - 42, y, amp, "#ff5161", t * 0.008, 2.4);
      SRT.addText(parent, OUT.x + 26, OUT.y + 44, `R = ${fmt(m.reflectivity)} senkt Verluste, T = 1 - R = ${fmt(m.outcoupling)} koppelt Leistung aus`, "label", {
        fill: "#ffffff",
        "font-size": 12,
        "font-weight": "800"
      });
      SRT.addText(parent, OUT.x + OUT.w - 26, OUT.y + 44, `Iout norm. = ${fmt(m.extracted)}`, "label", {
        fill: "#ff8a91",
        "font-size": 12,
        "font-weight": "800",
        "text-anchor": "end"
      });
    } else {
      const colors = ["#9cecf2", "#cfd8e3", "#9aaab8", "#73a2ff"];
      for (let i = 0; i < 11; i += 1) {
        const x0 = OUT.x + 50 + i * 68;
        const yy = y + Math.sin(i * 1.7) * 28;
        sine(parent, SRT, x0, x0 + 36, yy, 6, colors[i % colors.length], t * 0.01 + i, 1.4);
      }
      SRT.addText(parent, OUT.x + 26, OUT.y + 44, "keine makroskopische Resonatormode: kurze Wellenzuege mit zufaelligen Phasen", "label", {
        fill: "#cfd8e3",
        "font-size": 12,
        "font-weight": "800"
      });
    }
  }

  window.SRTSlide.register("laser-makro", {
    initialState: DEFAULT_STATE,
    controls: CONTROLS,
    render({ parent, t, state, SRT }) {
      const currentState = { ...DEFAULT_STATE, ...(state || {}) };
      const m = model(currentState);
      SRT.clear(parent);
      SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#101725" }, parent);
      drawCavity(parent, SRT, t, m);
      drawPanel(parent, SRT, m);
      drawOutput(parent, SRT, t, m);
    }
  });
})();
