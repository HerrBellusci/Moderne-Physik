(function () {
  const W = 862;
  const H = 506;

  const INK = "#172033";
  const MUTED = "#64748b";
  const MED_FILL = "#eef2f8";
  const MED_EDGE = "#cbd5e1";
  const EXCITED = "#f59e0b";
  const GROUND = "#94a3b8";
  const PHOTON = "#e11d48";
  const PUMP = "#5b64e0";
  const MIRROR_FULL = "#334155";
  const MIRROR_PART = "#94a3b8";

  const GEO = {
    mirrorL: 108,
    mirrorR: 754,
    mirrorT: 108,
    mirrorB: 398,
    medL: 254,
    medR: 608,
    medT: 164,
    medB: 342,
    cy: 253
  };
  GEO.medW = GEO.medR - GEO.medL;
  GEO.medH = GEO.medB - GEO.medT;

  const STEP_MS = 1000 / 60;
  const SPEED = 3.8;
  const CAP = 260;
  const TX_HIST = 90;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function mix(a, b, p) {
    return a + (b - a) * clamp(p, 0, 1);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function makeAtoms() {
    const atoms = [];
    const cols = 11;
    const rows = 5;
    const sx = GEO.medW / (cols + 1);
    const sy = GEO.medH / (rows + 1);

    for (let row = 1; row <= rows; row += 1) {
      for (let col = 1; col <= cols; col += 1) {
        atoms.push({
          x: GEO.medL + col * sx + rand(-4, 4),
          y: GEO.medT + row * sy + rand(-4, 4),
          excited: Math.random() < 0.2,
          cool: 0,
          flash: 0
        });
      }
    }
    return atoms;
  }

  function makeSim(mode) {
    return {
      mode,
      lastT: 0,
      acc: 0,
      frame: 0,
      pumpAcc: 0,
      atoms: makeAtoms(),
      photons: [],
      pumps: [],
      txHist: Array(TX_HIST).fill(0),
      txIndex: 0,
      power: 0,
      axial: 0
    };
  }

  function ensureSim(state, t) {
    if (!state._sim) state._sim = makeSim(state.mode);
    const sim = state._sim;
    if (sim.mode !== state.mode) {
      sim.mode = state.mode;
      sim.photons = [];
      sim.txHist.fill(0);
      sim.power = 0;
      sim.axial = 0;
      sim.lastT = t;
      sim.acc = 0;
    }
    return sim;
  }

  function excitedFraction(sim) {
    if (!sim.atoms.length) return 0;
    return sim.atoms.reduce((sum, atom) => sum + (atom.excited ? 1 : 0), 0) / sim.atoms.length;
  }

  function addPhoton(sim, x, y, angle, out) {
    if (sim.photons.length >= CAP) sim.photons.shift();
    sim.photons.push({
      x,
      y,
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
      out: Boolean(out),
      dead: false
    });
  }

  function spawnPump(sim) {
    const top = Math.random() < 0.5;
    sim.pumps.push({
      x: rand(GEO.medL + 10, GEO.medR - 10),
      y: top ? GEO.medT - 26 : GEO.medB + 26,
      vy: top ? 2.3 : -2.3,
      dead: false
    });
  }

  function emitSpontaneous(sim, atom, mode) {
    let angle = rand(0, Math.PI * 2);
    if (mode === "resonator" && Math.random() < 0.18) {
      angle = (Math.random() < 0.5 ? 0 : Math.PI) + rand(-0.045, 0.045);
    }
    addPhoton(sim, atom.x, atom.y, angle, false);
    atom.excited = false;
    atom.cool = 10;
    atom.flash = 10;
  }

  function pumpStep(sim, pumpPower) {
    sim.pumpAcc += pumpPower * 0.95;
    while (sim.pumpAcc >= 1) {
      sim.pumpAcc -= 1;
      spawnPump(sim);
    }

    for (const pump of sim.pumps) {
      pump.y += pump.vy;
      if (pump.y > GEO.medT - 4 && pump.y < GEO.medB + 4) {
        for (const atom of sim.atoms) {
          if (atom.excited || atom.cool > 0) continue;
          const dx = atom.x - pump.x;
          const dy = atom.y - pump.y;
          if (dx * dx + dy * dy < 90) {
            atom.excited = true;
            atom.flash = 8;
            pump.dead = true;
            break;
          }
        }
      }
      if (pump.y < GEO.medT - 34 || pump.y > GEO.medB + 34) pump.dead = true;
    }
    sim.pumps = sim.pumps.filter((pump) => !pump.dead);
  }

  function atomStep(sim, mode) {
    const inv = excitedFraction(sim);
    for (const atom of sim.atoms) {
      if (atom.cool > 0) atom.cool -= 1;
      if (atom.flash > 0) atom.flash -= 1;
      if (atom.excited && Math.random() < 0.0009) emitSpontaneous(sim, atom, mode);
    }

    if (mode === "resonator" && inv > 0.42 && sim.photons.length < 4 && Math.random() < 0.08) {
      const excited = sim.atoms.filter((atom) => atom.excited);
      if (excited.length) {
        const atom = excited[Math.floor(Math.random() * excited.length)];
        const angle = (Math.random() < 0.5 ? 0 : Math.PI) + rand(-0.03, 0.03);
        addPhoton(sim, atom.x, atom.y, angle, false);
      }
    }
  }

  function inMirror(y) {
    return y > GEO.mirrorT && y < GEO.mirrorB;
  }

  function photonAtomInteraction(sim, photon) {
    if (photon.out) return;
    if (photon.x < GEO.medL || photon.x > GEO.medR || photon.y < GEO.medT || photon.y > GEO.medB) return;

    for (const atom of sim.atoms) {
      const dx = atom.x - photon.x;
      const dy = atom.y - photon.y;
      if (dx * dx + dy * dy > 72) continue;

      if (atom.excited && Math.random() < 0.42) {
        atom.excited = false;
        atom.cool = 12;
        atom.flash = 14;
        const norm = Math.hypot(photon.vx, photon.vy) || 1;
        const angle = Math.atan2(photon.vy, photon.vx);
        addPhoton(sim, atom.x - photon.vy / norm * 4, atom.y + photon.vx / norm * 4, angle, false);
        break;
      }

      if (!atom.excited && atom.cool <= 0 && Math.random() < 0.025) {
        atom.excited = true;
        atom.cool = 5;
        atom.flash = 8;
        photon.dead = true;
        break;
      }
    }
  }

  function mirrorStep(sim, photon, prevX, reflectivity) {
    if (sim.mode !== "resonator" || photon.out) return 0;

    if (photon.vx < 0 && photon.x <= GEO.mirrorL && prevX > GEO.mirrorL) {
      if (inMirror(photon.y)) {
        photon.vx = Math.abs(photon.vx);
        photon.x = 2 * GEO.mirrorL - photon.x;
      } else {
        photon.dead = true;
      }
    }

    if (photon.vx > 0 && photon.x >= GEO.mirrorR && prevX < GEO.mirrorR) {
      if (inMirror(photon.y)) {
        if (Math.random() < reflectivity) {
          photon.vx = -Math.abs(photon.vx);
          photon.x = 2 * GEO.mirrorR - photon.x;
        } else {
          photon.out = true;
          return 1;
        }
      } else {
        photon.dead = true;
      }
    }

    return 0;
  }

  function photonStep(sim, reflectivity) {
    let tx = 0;
    for (const photon of sim.photons) {
      const prevX = photon.x;
      photon.x += photon.vx;
      photon.y += photon.vy;

      tx += mirrorStep(sim, photon, prevX, reflectivity);
      photonAtomInteraction(sim, photon);

      if (photon.x < -30 || photon.x > W + 30 || photon.y < -30 || photon.y > H + 30) {
        photon.dead = true;
      }
    }

    sim.photons = sim.photons.filter((photon) => !photon.dead);
    sim.txIndex = (sim.txIndex + 1) % sim.txHist.length;
    sim.txHist[sim.txIndex] = tx;

    const sum = sim.txHist.reduce((a, b) => a + b, 0);
    sim.power = clamp((sum / sim.txHist.length) / 0.42, 0, 1);
    sim.axial = sim.photons.filter((photon) => !photon.out && Math.abs(photon.vy) < SPEED * 0.16).length;
  }

  function step(sim, state) {
    sim.frame += 1;
    const pumpPower = clamp(Number(state.pump), 0, 1);
    const reflectivity = clamp(Number(state.reflectivity), 0.8, 0.99);

    pumpStep(sim, pumpPower);
    atomStep(sim, state.mode);
    photonStep(sim, reflectivity);
  }

  function drawRect(parent, SRT, x, y, width, height, rx, fill, stroke, opacity) {
    const attrs = {
      x,
      y,
      width,
      height,
      rx,
      fill,
      opacity: opacity === undefined ? 1 : opacity
    };
    if (stroke) {
      attrs.stroke = stroke;
      attrs["stroke-width"] = 1.4;
    }
    SRT.el("rect", attrs, parent);
  }

  function drawHud(parent, SRT, sim) {
    const inv = excitedFraction(sim);
    const x = 22;
    const y = 20;
    const bw = 112;

    drawRect(parent, SRT, x, y, 196, 78, 8, "rgba(255,255,255,0.76)", "#e2e8f0", 1);
    SRT.addText(parent, x + 12, y + 24, "Inversion", "label", {
      fill: MUTED,
      "font-size": 11,
      "font-weight": "800"
    });
    drawRect(parent, SRT, x + 72, y + 15, bw, 6, 3, "rgba(23,32,51,0.12)", null, 1);
    drawRect(parent, SRT, x + 72, y + 15, bw * inv, 6, 3, EXCITED, null, 1);

    SRT.addText(parent, x + 12, y + 47, "Ausgang", "label", {
      fill: MUTED,
      "font-size": 11,
      "font-weight": "800"
    });
    drawRect(parent, SRT, x + 72, y + 38, bw, 6, 3, "rgba(23,32,51,0.12)", null, 1);
    drawRect(parent, SRT, x + 72, y + 38, bw * sim.power, 6, 3, PHOTON, null, 1);

    SRT.addText(parent, x + 12, y + 68, `Photonen ${sim.photons.length}`, "label", {
      fill: "#8a94a8",
      "font-size": 10.5,
      "font-weight": "750"
    });
    SRT.addText(parent, x + 118, y + 68, `axial ${sim.axial}`, "label", {
      fill: "#8a94a8",
      "font-size": 10.5,
      "font-weight": "750"
    });
  }

  function drawPump(parent, SRT, state, sim) {
    const pumpPower = clamp(Number(state.pump), 0, 1);
    const op = 0.18 + pumpPower * 0.55;

    drawRect(parent, SRT, GEO.medL + 8, GEO.medT - 30, GEO.medW - 16, 7, 3.5, PUMP, null, op);
    drawRect(parent, SRT, GEO.medL + 8, GEO.medB + 23, GEO.medW - 16, 7, 3.5, PUMP, null, op);
    SRT.addText(parent, (GEO.medL + GEO.medR) / 2, GEO.medT - 42, "Pumpe", "label", {
      fill: PUMP,
      "font-size": 13,
      "font-weight": "850",
      "text-anchor": "middle",
      opacity: 0.74
    });

    for (const pump of sim.pumps) {
      SRT.el("circle", {
        cx: pump.x,
        cy: pump.y,
        r: 2.2,
        fill: PUMP,
        opacity: 0.78
      }, parent);
    }
  }

  function drawMirrors(parent, SRT, state) {
    if (state.mode !== "resonator") return;
    const refl = clamp(Number(state.reflectivity), 0.8, 0.99);

    SRT.el("line", {
      x1: GEO.mirrorL,
      y1: GEO.mirrorT,
      x2: GEO.mirrorL,
      y2: GEO.mirrorB,
      stroke: MIRROR_FULL,
      "stroke-width": 9,
      "stroke-linecap": "round"
    }, parent);
    SRT.el("line", {
      x1: GEO.mirrorR,
      y1: GEO.mirrorT,
      x2: GEO.mirrorR,
      y2: GEO.mirrorB,
      stroke: MIRROR_PART,
      "stroke-width": 9,
      "stroke-linecap": "round",
      opacity: 0.42 + refl * 0.56
    }, parent);

    SRT.addText(parent, GEO.mirrorL, GEO.mirrorB + 22, "Spiegel", "label", {
      fill: MUTED,
      "font-size": 12,
      "font-weight": "800",
      "text-anchor": "middle"
    });
    SRT.addText(parent, GEO.mirrorR, GEO.mirrorB + 22, "Auskoppler", "label", {
      fill: MUTED,
      "font-size": 12,
      "font-weight": "800",
      "text-anchor": "middle"
    });
  }

  function drawAtoms(parent, SRT, sim) {
    for (const atom of sim.atoms) {
      if (atom.flash > 0) {
        SRT.el("circle", {
          cx: atom.x,
          cy: atom.y,
          r: 9 + atom.flash * 0.45,
          fill: atom.excited ? EXCITED : PHOTON,
          opacity: 0.08 + atom.flash * 0.012,
          filter: "url(#glow)"
        }, parent);
      }

      SRT.el("circle", {
        cx: atom.x,
        cy: atom.y,
        r: atom.excited ? 5.2 : 4.2,
        fill: atom.excited ? EXCITED : GROUND,
        stroke: "#ffffff",
        "stroke-width": 1.2,
        opacity: atom.excited ? 1 : 0.86,
        filter: atom.excited ? "url(#glow)" : "none"
      }, parent);
    }
  }

  function drawPhotons(parent, SRT, sim) {
    for (const photon of sim.photons) {
      const outOpacity = photon.out ? 0.82 : 1;
      SRT.el("circle", {
        cx: photon.x,
        cy: photon.y,
        r: 6.8,
        fill: PHOTON,
        opacity: 0.12 * outOpacity,
        filter: "url(#glow)"
      }, parent);
      SRT.el("circle", {
        cx: photon.x,
        cy: photon.y,
        r: 2.5,
        fill: PHOTON,
        opacity: 0.96 * outOpacity
      }, parent);
    }
  }

  function drawAxis(parent, SRT, sim, state) {
    if (state.mode !== "resonator") return;
    const axial = clamp(sim.axial / 46, 0, 1);
    const op = Math.max(sim.power * 0.34, axial * 0.22);
    if (op <= 0.02) return;

    SRT.el("line", {
      x1: GEO.mirrorL + 8,
      y1: GEO.cy,
      x2: GEO.mirrorR - 8,
      y2: GEO.cy,
      stroke: PHOTON,
      "stroke-width": 22,
      "stroke-linecap": "round",
      opacity: op * 0.32
    }, parent);
    SRT.el("line", {
      x1: GEO.mirrorR + 8,
      y1: GEO.cy,
      x2: W - 28,
      y2: GEO.cy,
      stroke: PHOTON,
      "stroke-width": 14,
      "stroke-linecap": "round",
      opacity: sim.power * 0.42
    }, parent);

    if (sim.power > 0.12) {
      SRT.addText(parent, W - 34, GEO.cy - 18, "Laserstrahl", "label", {
        fill: PHOTON,
        "font-size": 13,
        "font-weight": "850",
        "text-anchor": "end",
        opacity: clamp(sim.power * 1.4, 0, 1)
      });
    }
  }

  function drawScene(parent, SRT, sim, state) {
    SRT.clear(parent);
    drawRect(parent, SRT, 0, 0, W, H, 8, "#ffffff", "#e2e8f0", 1);

    drawRect(parent, SRT, GEO.medL, GEO.medT, GEO.medW, GEO.medH, 10, MED_FILL, MED_EDGE, 1);
    SRT.addText(parent, (GEO.medL + GEO.medR) / 2, GEO.medB + 45, "aktives Medium", "label", {
      fill: MUTED,
      "font-size": 13,
      "font-weight": "850",
      "text-anchor": "middle"
    });

    drawPump(parent, SRT, state, sim);
    drawMirrors(parent, SRT, state);
    drawAxis(parent, SRT, sim, state);
    drawAtoms(parent, SRT, sim);
    drawPhotons(parent, SRT, sim);
    drawHud(parent, SRT, sim);

    if (state.mode === "frei") {
      SRT.addText(parent, W / 2, H - 18, "Ohne Resonator verlassen Photonen das Medium in viele Richtungen.", "label", {
        fill: INK,
        "font-size": 14,
        "font-weight": "800",
        "text-anchor": "middle"
      });
    } else {
      SRT.addText(parent, W / 2, H - 18, "Mit Resonator bleibt achsnahes Licht lange im Medium.", "label", {
        fill: INK,
        "font-size": 14,
        "font-weight": "800",
        "text-anchor": "middle"
      });
    }
  }

  function render({ parent, t, state, SRT }) {
    if (state.mode === undefined) state.mode = "resonator";
    if (state.pump === undefined) state.pump = 0.65;
    if (state.reflectivity === undefined) state.reflectivity = 0.96;

    const sim = ensureSim(state, t);
    if (!sim.lastT) sim.lastT = t;
    const dt = clamp(t - sim.lastT, 0, 120);
    sim.lastT = t;
    sim.acc += dt;

    let steps = 0;
    while (sim.acc >= STEP_MS && steps < 5) {
      step(sim, state);
      sim.acc -= STEP_MS;
      steps += 1;
    }
    if (sim.acc >= STEP_MS) sim.acc = 0;

    drawScene(parent, SRT, sim, state);
  }

  window.SRTSlide.register("laser-resonator", {
    initialState: {
      mode: "resonator",
      pump: 0.65,
      reflectivity: 0.96
    },
    showMotionControl: false,
    controls: [
      {
        type: "segmented",
        key: "mode",
        label: "Aufbau",
        options: [
          { label: "mit Resonator", value: "resonator", description: "Spiegel halten achsnahes Licht im Medium" },
          { label: "ohne Resonator", value: "frei", description: "Licht verlässt das Medium in viele Richtungen" }
        ]
      },
      {
        type: "range",
        key: "pump",
        label: "Pumpleistung",
        min: 0,
        max: 1,
        step: 0.01,
        format: (value) => `${Math.round(Number(value) * 100)} %`
      },
      {
        type: "range",
        key: "reflectivity",
        label: "Spiegel-Reflexion",
        min: 0.8,
        max: 0.99,
        step: 0.01,
        format: (value) => `${Math.round(Number(value) * 100)} %`
      },
      {
        label: "Neu starten",
        ariaLabel: "Simulation neu starten",
        apply: (s) => {
          s._sim = null;
        }
      }
    ],
    render
  });
})();
