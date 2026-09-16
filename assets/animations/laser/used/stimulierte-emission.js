(function () {
  const W = 862;
  const H = 506;
  const STEP_COUNT = 6;
  const DEFAULT_STATE = {
    step: 0,
    spontaneousTime: 0.47,
    spontaneousDirection: -0.52,
    spontaneousPhase: 1.75
  };

  const STEPS = [
    {
      title: "1. Ausgangspunkt",
      lead: [
        "Das Atom steht im Grundzustand.",
        "Ohne Pumpe kann es noch kein Licht verstärken."
      ],
      focus: "Erst die Pumpe bereitet das aktive Medium vor."
    },
    {
      title: "2. Pumpen",
      lead: [
        "Die Pumpe hebt das Atom kurz in ein hohes Hilfsniveau.",
        "Danach relaxiert es schnell ins obere Laserniveau E2."
      ],
      focus: "Das obere Laserniveau bleibt lange genug besetzt."
    },
    {
      title: "3. Spontane Emission",
      lead: [
        "Ein angeregtes Atom zerfällt von selbst.",
        "Zeitpunkt, Richtung und Phase sind zufällig."
      ],
      focus: "Spontan emittiertes Licht ist nicht geordnet."
    },
    {
      title: "4. Stimulierte Emission",
      lead: [
        "Ein passendes Photon trifft das angeregte Atom.",
        "Das zweite Photon ist im passenden Lichtmodus gleichartig."
      ],
      focus: "Gleiche Frequenz, gleiche Richtung, gleiche Phase."
    },
    {
      title: "5. Strahlungslose Relaxation",
      lead: [
        "Nach der Lasertransition sitzt das Elektron kurz in E1.",
        "Von E1 nach E0 fällt es schnell ohne Photon zurück."
      ],
      focus: "Das untere Laserniveau wird rasch geleert."
    },
    {
      title: "6. Vergleich",
      lead: [
        "Der Laser nutzt nicht beliebiges Leuchten.",
        "Er verstärkt den passenden Lichtmodus."
      ],
      focus: "spontan = zufällig, stimuliert = kopplungsfähig"
    }
  ];

  const TERM = { x: 24, y: 34, w: 286, h: 378 };
  const EVENT = { x: 330, y: 34, w: 508, h: 378 };
  const FOOT = { x: 24, y: 426, w: 814, h: 58 };

  const levels = [
    { key: "E0", label: "Grundzustand", frac: 0.86 },
    { key: "E1", label: "unteres Laserniveau", frac: 0.64 },
    { key: "E2", label: "oberes Laserniveau", frac: 0.34 },
    { key: "E3", label: "Pumpniveau", frac: 0.13 }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function stateValue(state, key) {
    return state && state[key] !== undefined ? state[key] : DEFAULT_STATE[key];
  }

  function currentStep(state) {
    return clamp(Math.round(Number(stateValue(state, "step")) || 0), 0, STEP_COUNT - 1);
  }

  function panel(parent, SRT, box, title) {
    SRT.el("rect", {
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      rx: 12,
      fill: "rgba(255,255,255,0.045)",
      stroke: "rgba(255,255,255,0.16)"
    }, parent);
    SRT.addText(parent, box.x + 16, box.y + 26, title, "label", {
      fill: "#ffffff",
      "font-size": 13,
      "font-weight": "800"
    });
  }

  function lines(parent, SRT, list, x, y, color, size, gap) {
    const flat = list.flatMap((item) => Array.isArray(item) ? item : [item]);
    flat.forEach((line, index) => {
      SRT.addText(parent, x, y + index * gap, line, "label", {
        fill: color,
        "font-size": size,
        "font-weight": index === 0 ? "800" : "600"
      });
    });
  }

  function levelY(index) {
    return TERM.y + 46 + levels[index].frac * (TERM.h - 80);
  }

  function electronLevel(step) {
    if (step === 0) return 0;
    if (step === 4) return 1;
    if (step === 5) return 0;
    return 2;
  }

  function arrow(parent, SRT, x, y1, y2, color, label, dashed) {
    SRT.el("line", {
      x1: x,
      y1,
      x2: x,
      y2,
      stroke: color,
      "stroke-width": 2.2,
      "stroke-linecap": "round",
      "stroke-dasharray": dashed ? "5 5" : "none"
    }, parent);
    const dir = y2 > y1 ? 1 : -1;
    SRT.el("path", {
      d: `M${x} ${y2} l-5 ${-7 * dir} h10 z`,
      fill: color
    }, parent);
    SRT.addText(parent, x + 10, (y1 + y2) / 2 + 4, label, "label", {
      fill: color,
      "font-size": 10,
      "font-weight": "800"
    });
  }

  function drawTerm(parent, SRT, step) {
    panel(parent, SRT, TERM, "Vier-Niveau-Modell");
    const x0 = TERM.x + 34;
    const x1 = TERM.x + TERM.w - 44;
    const activeLevel = electronLevel(step);

    levels.forEach((level, index) => {
      const y = levelY(index);
      const active = index === activeLevel;
      SRT.el("line", {
        x1: x0,
        y1: y,
        x2: x1,
        y2: y,
        stroke: active ? "#ffc83d" : "#cfd8e3",
        "stroke-width": active ? 3.5 : 2,
        "stroke-linecap": "round"
      }, parent);
      SRT.addText(parent, x0, y - 9, `${level.key}  ${level.label}`, "label", {
        fill: active ? "#ffc83d" : "#9aaab8",
        "font-size": 10,
        "font-weight": active ? "800" : "600"
      });
    });

    arrow(parent, SRT, TERM.x + 74, levelY(0), levelY(3), step >= 1 ? "#ffc83d" : "#5c6678", "Pumpe");
    arrow(parent, SRT, TERM.x + 138, levelY(3), levelY(2), step >= 1 ? "#9aaab8" : "#5c6678", "schnell", true);
    arrow(parent, SRT, TERM.x + 202, levelY(2), levelY(1), step >= 2 ? "#ff5161" : "#5c6678", "hν");
    arrow(parent, SRT, TERM.x + 96, levelY(1), levelY(0), step >= 4 ? "#9aaab8" : "#5c6678", "schnell", true);

    const eY = levelY(activeLevel);
    SRT.el("circle", {
      cx: TERM.x + TERM.w - 64,
      cy: eY,
      r: 8,
      fill: "#ffc83d",
      stroke: "#fff7d6",
      "stroke-width": 2,
      filter: "url(#glow)"
    }, parent);
    SRT.addText(parent, TERM.x + TERM.w - 64, eY + 26, "Elektron", "label", {
      fill: "#cfd8e3",
      "font-size": 9,
      "text-anchor": "middle"
    });
  }

  function wave(parent, SRT, x, y, color, phase, label, angle) {
    let path = "";
    const cos = Math.cos(angle || 0);
    const sin = Math.sin(angle || 0);
    for (let k = -24; k <= 24; k += 1) {
      const px = x + k * cos - Math.sin(k * 0.55 + phase) * 7 * sin;
      const py = y + k * sin + Math.sin(k * 0.55 + phase) * 7 * cos;
      path += `${k === -24 ? "M" : "L"}${px} ${py} `;
    }
    SRT.el("path", {
      d: path,
      fill: "none",
      stroke: color,
      "stroke-width": 2,
      "stroke-linecap": "round",
      filter: "url(#glow)"
    }, parent);
    if (label) {
      SRT.addText(parent, x, y - 22, label, "label", {
        fill: color,
        "font-size": 10,
        "font-weight": "800",
        "text-anchor": "middle"
      });
    }
  }

  function drawAtom(parent, SRT, x, y, stateLabel) {
    const excited = stateLabel !== "E0";
    const atomAttrs = {
      cx: x,
      cy: y,
      r: excited ? 24 : 22,
      fill: excited ? "#332b12" : "#263142",
      stroke: excited ? "#ffc83d" : "#9aaab8",
      "stroke-width": 2.2
    };
    if (excited) atomAttrs.filter = "url(#glow)";
    SRT.el("circle", atomAttrs, parent);
    SRT.el("circle", {
      cx: x,
      cy: y,
      r: 7,
      fill: excited ? "#ffc83d" : "#9aaab8"
    }, parent);
    SRT.addText(parent, x, y + 45, `Atom in ${stateLabel}`, "label", {
      fill: excited ? "#ffc83d" : "#cfd8e3",
      "font-size": 11,
      "font-weight": "800",
      "text-anchor": "middle"
    });
  }

  function drawSpontaneous(parent, SRT, t, state, atomX, atomY) {
    const eventTime = clamp(Number(stateValue(state, "spontaneousTime")), 0.12, 0.88);
    const angle = clamp(Number(stateValue(state, "spontaneousDirection")), -1.35, 0.95);
    const randomPhase = Number(stateValue(state, "spontaneousPhase")) || 0;
    const cycle = (t % 4200) / 4200;
    const emitted = cycle >= eventTime;
    const progress = emitted ? clamp((cycle - eventTime) / 0.42, 0, 1) : 0;
    const markerX = EVENT.x + 52 + eventTime * (EVENT.w - 104);

    SRT.el("line", {
      x1: EVENT.x + 52,
      y1: EVENT.y + EVENT.h - 74,
      x2: EVENT.x + EVENT.w - 52,
      y2: EVENT.y + EVENT.h - 74,
      stroke: "#536176",
      "stroke-width": 2,
      "stroke-linecap": "round"
    }, parent);
    SRT.el("circle", {
      cx: markerX,
      cy: EVENT.y + EVENT.h - 74,
      r: 5,
      fill: "#9cecf2"
    }, parent);
    SRT.addText(parent, markerX, EVENT.y + EVENT.h - 52, "zufälliger Zeitpunkt", "label", {
      fill: "#9cecf2",
      "font-size": 10,
      "font-weight": "800",
      "text-anchor": "middle"
    });

    drawAtom(parent, SRT, atomX, atomY, emitted ? "E1" : "E2");
    if (!emitted) {
      SRT.addText(parent, atomX, atomY - 52, "wartet auf spontanen Zerfall", "label", {
        fill: "#cfd8e3",
        "font-size": 11,
        "font-weight": "700",
        "text-anchor": "middle"
      });
      return;
    }

    const len = 76 + progress * 128;
    const x2 = atomX + Math.cos(angle) * len;
    const y2 = atomY + Math.sin(angle) * len;
    SRT.el("line", {
      x1: atomX,
      y1: atomY,
      x2,
      y2,
      stroke: "#9cecf2",
      "stroke-width": 2.4,
      "stroke-linecap": "round"
    }, parent);
    wave(
      parent,
      SRT,
      atomX + Math.cos(angle) * (58 + progress * 78),
      atomY + Math.sin(angle) * (58 + progress * 78),
      "#9cecf2",
      t * 0.007 + randomPhase,
      "zufällige Richtung / Phase",
      angle
    );
  }

  function drawStimulated(parent, SRT, t, atomX, atomY) {
    const phase = t * 0.007;
    SRT.el("line", {
      x1: EVENT.x + 38,
      y1: atomY,
      x2: EVENT.x + EVENT.w - 40,
      y2: atomY,
      stroke: "rgba(255,255,255,0.13)",
      "stroke-width": 1.4,
      "stroke-dasharray": "4 6"
    }, parent);
    drawAtom(parent, SRT, atomX, atomY, "E2");
    wave(parent, SRT, atomX - 110, atomY, "#ff8a91", phase, "einfallend", 0);
    wave(parent, SRT, atomX + 112, atomY - 16, "#ff5161", phase, "Original", 0);
    wave(parent, SRT, atomX + 112, atomY + 16, "#ff5161", phase, "Photon 2", 0);
    SRT.addText(parent, atomX + 112, atomY + 48, "ν, Richtung und Phase identisch", "label", {
      fill: "#ffb0b5",
      "font-size": 11,
      "font-weight": "800",
      "text-anchor": "middle"
    });
    [atomY - 16, atomY + 16].forEach((y) => {
      SRT.el("path", {
        d: `M${atomX + 36} ${y} L${atomX + 70} ${y} M${atomX + 62} ${y - 7} L${atomX + 70} ${y} L${atomX + 62} ${y + 7}`,
        fill: "none",
        stroke: "#ff5161",
        "stroke-width": 2,
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }, parent);
    });
  }

  function drawFastRelaxation(parent, SRT, t, atomX, atomY) {
    const cycle = (t % 1600) / 1600;
    const e1Y = atomY - 30 + cycle * 60;
    drawAtom(parent, SRT, atomX, e1Y, cycle < 0.55 ? "E1" : "E0");
    SRT.el("path", {
      d: `M${atomX + 48} ${atomY - 34} C${atomX + 88} ${atomY - 8}, ${atomX + 88} ${atomY + 22}, ${atomX + 48} ${atomY + 44}`,
      fill: "none",
      stroke: "#9aaab8",
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-dasharray": "5 5"
    }, parent);
    SRT.addText(parent, atomX + 106, atomY + 4, "E1 -> E0", "label", {
      fill: "#cfd8e3",
      "font-size": 12,
      "font-weight": "900"
    });
    SRT.addText(parent, atomX + 106, atomY + 24, "schnell, strahlungslos", "label", {
      fill: "#9aaab8",
      "font-size": 11,
      "font-weight": "700"
    });
    SRT.el("path", {
      d: `M${atomX - 90} ${atomY - 8} L${atomX - 50} ${atomY - 8} M${atomX - 58} ${atomY - 15} L${atomX - 50} ${atomY - 8} L${atomX - 58} ${atomY - 1}`,
      fill: "none",
      stroke: "#ff5161",
      "stroke-width": 2.2,
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    }, parent);
    wave(parent, SRT, atomX - 118, atomY - 8, "#ff5161", t * 0.007, "Laserphoton bleibt erhalten", 0);
  }

  function drawComparison(parent, SRT) {
    const rows = [
      ["spontan", "Zeitpunkt, Richtung und Phase zufällig", "Viele ungeordnete Einzelereignisse.", "#9cecf2"],
      ["stimuliert", "gleiche Frequenz, Phase und Richtung", "Verstärkung des geordneten Lichtmodus.", "#ff5161"],
      ["E1 -> E0", "schnell und strahlungslos", "Unteres Laserniveau wird entvölkert.", "#cfd8e3"]
    ];
    rows.forEach((row, index) => {
      const y = EVENT.y + 102 + index * 82;
      SRT.el("rect", {
        x: EVENT.x + 36,
        y,
        width: EVENT.w - 72,
        height: 60,
        rx: 10,
        fill: "rgba(255,255,255,0.055)",
        stroke: row[3],
        "stroke-width": 1.4
      }, parent);
      SRT.addText(parent, EVENT.x + 58, y + 25, row[0], "label", {
        fill: row[3],
        "font-size": 14,
        "font-weight": "900"
      });
      SRT.addText(parent, EVENT.x + 180, y + 24, row[1], "label", {
        fill: "#ffffff",
        "font-size": 12,
        "font-weight": "700"
      });
      SRT.addText(parent, EVENT.x + 180, y + 45, row[2], "label", {
        fill: "#9aaab8",
        "font-size": 10,
        "font-weight": "600"
      });
    });
  }

  function drawEvent(parent, SRT, t, state, step) {
    panel(parent, SRT, EVENT, "Atomarer Ereignisvergleich");
    const current = STEPS[step];
    lines(parent, SRT, [current.title, current.lead], EVENT.x + 18, EVENT.y + 56, "#ffffff", 12, 18);

    const atomX = EVENT.x + EVENT.w / 2;
    const atomY = EVENT.y + 224;

    if (step === 0) drawAtom(parent, SRT, atomX, atomY, "E0");
    if (step === 1) {
      drawAtom(parent, SRT, atomX, atomY, "E2");
      SRT.el("path", {
        d: `M${atomX - 60} ${atomY + 58} C${atomX - 34} ${atomY + 20}, ${atomX - 18} ${atomY - 58}, ${atomX} ${atomY - 92}`,
        fill: "none",
        stroke: "#ffc83d",
        "stroke-width": 3,
        "stroke-linecap": "round"
      }, parent);
      SRT.addText(parent, atomX - 78, atomY + 78, "Pumpe hebt das Atom an", "label", {
        fill: "#ffc83d",
        "font-size": 11,
        "font-weight": "800"
      });
    }
    if (step === 2) drawSpontaneous(parent, SRT, t, state, atomX, atomY);
    if (step === 3) drawStimulated(parent, SRT, t, atomX, atomY);
    if (step === 4) drawFastRelaxation(parent, SRT, t, atomX, atomY);
    if (step === 5) drawComparison(parent, SRT);
  }

  function drawFooter(parent, SRT, step) {
    SRT.el("rect", {
      x: FOOT.x,
      y: FOOT.y,
      width: FOOT.w,
      height: FOOT.h,
      rx: 10,
      fill: "rgba(6,14,28,0.92)",
      stroke: "#2563eb",
      "stroke-width": 1.2
    }, parent);
    SRT.addText(parent, FOOT.x + 18, FOOT.y + 24, "Fokus", "label", {
      fill: "#73a2ff",
      "font-size": 12,
      "font-weight": "900"
    });
    SRT.addText(parent, FOOT.x + 80, FOOT.y + 24, STEPS[step].focus, "label", {
      fill: "#ffffff",
      "font-size": 12,
      "font-weight": "700"
    });
    SRT.addText(parent, FOOT.x + 18, FOOT.y + 45, `Schritt ${step + 1} / ${STEP_COUNT}: Lasertransition E2 -> E1, danach E1 -> E0 strahlungslos.`, "label", {
      fill: "#cfd8e3",
      "font-size": 11,
      "font-weight": "600"
    });
  }

  window.SRTSlide.register("laser-mikro", {
    initialState: DEFAULT_STATE,
    controls: [
      {
        type: "stepper",
        key: "step",
        label: "Schritt",
        min: 0,
        max: STEP_COUNT - 1,
        step: 1,
        format: (value) => `${Math.round(value) + 1} / ${STEP_COUNT}`
      },
      {
        type: "random",
        label: "Spontanes Ereignis neu wählen",
        keys: ["spontaneousTime", "spontaneousDirection", "spontaneousPhase"],
        values: {
          spontaneousTime: [0.12, 0.88],
          spontaneousDirection: [-1.35, 0.95],
          spontaneousPhase: [0, Math.PI * 2]
        }
      }
    ],
    render({ parent, t, state, SRT }) {
      const step = currentStep(state);
      SRT.clear(parent);
      SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#101725" }, parent);
      drawTerm(parent, SRT, step);
      drawEvent(parent, SRT, t, state, step);
      drawFooter(parent, SRT, step);
    }
  });
})();
