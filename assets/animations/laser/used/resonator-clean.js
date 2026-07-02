(function () {
  const INK = "#172033";
  const MUTED = "#64748b";
  const MED_FILL = "#eef2f8";
  const MED_EDGE = "#cbd5e1";
  const EXCITED = "#f59e0b";   // angeregtes Atom
  const GROUND = "#94a3b8";    // Atom im Grundzustand
  const PHOTON = "#e11d48";
  const PUMP = "#f97316";
  const MIRROR_FULL = "#334155";
  const MIRROR_PART = "#94a3b8";

  const W = 862;
  const H = 506;

  // Aktives Medium
  const MX0 = 182;
  const MX1 = 686;
  const MY0 = 150;
  const MY1 = 374;
  const BY = (MY0 + MY1) / 2;   // Strahlachse

  // Spiegel
  const LM = MX0 - 12;          // Vollspiegel (links)
  const RM = MX1 + 4;           // teildurchlaessiger Spiegel (rechts)
  const MTOP = MY0 - 16;
  const MBOT = MY1 + 16;

  // Innenraum fuer die Welle
  const WX0 = MX0 + 18;
  const WX1 = MX1 - 8;

  const CYCLE = 6200;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function ease(value) {
    const x = clamp(value, 0, 1);
    return x * x * (3 - 2 * x);
  }

  function mix(a, b, p) {
    return a + (b - a) * clamp(p, 0, 1);
  }

  function arrowHead(parent, SRT, x, y, angle, color, size, width, opacity) {
    const a1 = angle + Math.PI * 0.82;
    const a2 = angle - Math.PI * 0.82;
    SRT.el("path", {
      d: [
        `M${x} ${y}`,
        `L${(x + Math.cos(a1) * size).toFixed(1)} ${(y + Math.sin(a1) * size).toFixed(1)}`,
        `M${x} ${y}`,
        `L${(x + Math.cos(a2) * size).toFixed(1)} ${(y + Math.sin(a2) * size).toFixed(1)}`
      ].join(" "),
      fill: "none", stroke: color, "stroke-width": width, "stroke-linecap": "round",
      opacity: opacity === undefined ? 1 : opacity
    }, parent);
  }

  // Kurzer Wellenzug (Photon) in beliebiger Richtung
  function photon(parent, SRT, cx, cy, angle, phase, opacity) {
    const len = 54;
    const amp = 5.5;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let d = "";
    for (let s = -len / 2; s <= len / 2; s += 2) {
      const norm = s / (len / 2);
      const env = Math.exp(-2.6 * norm * norm);
      const wave = Math.sin(s * 0.4 + phase) * amp * env;
      const x = cx + s * cos - wave * sin;
      const y = cy + s * sin + wave * cos;
      d += `${s === -len / 2 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    SRT.el("path", {
      d, fill: "none", stroke: PHOTON, "stroke-width": 2.4,
      "stroke-linecap": "round", opacity, filter: "url(#glow)"
    }, parent);
    arrowHead(parent, SRT, cx + cos * (len / 2 + 6), cy + sin * (len / 2 + 6), angle, PHOTON, 6, 2, opacity);
  }

  function atom(parent, SRT, x, y, excited) {
    SRT.el("circle", {
      cx: x, cy: y, r: 9,
      fill: excited ? EXCITED : GROUND,
      stroke: "#ffffff", "stroke-width": 1.8,
      filter: excited ? "url(#glow)" : "none"
    }, parent);
  }

  // Atome in zwei Reihen ober- und unterhalb der Achse
  const COLS = 7;
  const ROW_UP = BY - 58;
  const ROW_DN = BY + 58;
  function atomX(col) {
    return mix(MX0 + 42, MX1 - 42, col / (COLS - 1));
  }

  function drawMedium(parent, SRT) {
    SRT.el("rect", {
      x: MX0, y: MY0, width: MX1 - MX0, height: MY1 - MY0, rx: 10,
      fill: MED_FILL, stroke: MED_EDGE, "stroke-width": 1.6
    }, parent);
    SRT.addText(parent, MX0 + 16, MY0 + 26, "aktives Medium", "label", {
      fill: INK, "font-size": 15, "font-weight": "800", "text-anchor": "start"
    });
  }

  function drawPump(parent, SRT, pumped) {
    const x = (MX0 + MX1) / 2;
    const op = pumped ? 1 : 0.32;
    SRT.addText(parent, x, 40, "Energiezufuhr (Pumpen)", "label", {
      fill: PUMP, "font-size": 15, "font-weight": "800", "text-anchor": "middle", opacity: op
    });
    SRT.el("line", {
      x1: x, y1: 58, x2: x, y2: MY0 - 8,
      stroke: PUMP, "stroke-width": 5, "stroke-linecap": "round", opacity: op
    }, parent);
    arrowHead(parent, SRT, x, MY0 - 6, Math.PI / 2, PUMP, 12, 5, op);
  }

  function drawMirrors(parent, SRT, on) {
    const op = on ? 1 : 0.2;
    // Vollspiegel links
    SRT.el("line", {
      x1: LM, y1: MTOP, x2: LM, y2: MBOT,
      stroke: MIRROR_FULL, "stroke-width": 8, "stroke-linecap": "round", opacity: op
    }, parent);
    // teildurchlaessiger Spiegel rechts
    SRT.el("line", {
      x1: RM, y1: MTOP, x2: RM, y2: MBOT,
      stroke: MIRROR_PART, "stroke-width": 8, "stroke-linecap": "round", opacity: op
    }, parent);
    if (on) {
      SRT.addText(parent, LM, MBOT + 22, "Spiegel", "label", { fill: MUTED, "font-size": 13, "font-weight": "750", "text-anchor": "middle" });
      SRT.addText(parent, LM, MBOT + 39, "voll reflektierend", "label", { fill: MUTED, "font-size": 11.5, "text-anchor": "middle" });
      SRT.addText(parent, RM, MBOT + 22, "Spiegel", "label", { fill: MUTED, "font-size": 13, "font-weight": "750", "text-anchor": "middle" });
      SRT.addText(parent, RM, MBOT + 39, "teildurchlässig", "label", { fill: MUTED, "font-size": 11.5, "text-anchor": "middle" });
    }
  }

  function caption(parent, SRT, text) {
    SRT.addText(parent, W / 2, H - 18, text, "label", {
      fill: INK, "font-size": 15, "font-weight": "750", "text-anchor": "middle"
    });
  }

  const CAV_YOFF = [0, -11, 10, -5, 6, -15];   // enges Buendel um die Resonatorachse
  const LOSS_RAYS = [
    { c: 1, row: ROW_UP, angle: -2.18, delay: 0 },
    { c: 2, row: ROW_DN, angle: 1.22, delay: 430 },
    { c: 4, row: ROW_UP, angle: -0.78, delay: 810 },
    { c: 5, row: ROW_DN, angle: 2.36, delay: 1180 }
  ];

  function drawAxisGlow(parent, SRT, build) {
    const op = build * 0.16;
    if (op <= 0.01) return;
    SRT.el("line", {
      x1: LM + 10, y1: BY, x2: RM - 10, y2: BY,
      stroke: PHOTON, "stroke-width": 20, "stroke-linecap": "round",
      opacity: op * 0.45
    }, parent);
    SRT.el("line", {
      x1: LM + 10, y1: BY, x2: RM - 10, y2: BY,
      stroke: PHOTON, "stroke-width": 4, "stroke-linecap": "round",
      opacity: op
    }, parent);
  }

  function drawLossPhotons(parent, SRT, local, build, phase) {
    const opBase = build * 0.58;
    LOSS_RAYS.forEach((ray, i) => {
      const span = 210;
      const dist = ((local * 0.12 + ray.delay) % span);
      const p = dist / span;
      const opacity = opBase * clamp(dist / 28, 0, 1) * clamp(1 - p, 0, 1);
      if (opacity <= 0.02) return;
      const cos = Math.cos(ray.angle);
      const sin = Math.sin(ray.angle);
      const x = atomX(ray.c) + cos * dist;
      const y = ray.row + sin * dist;
      photon(parent, SRT, x, y, ray.angle, phase + i * 0.45, opacity);
    });
  }

  // Mit Resonator: Photonen laufen zwischen den Spiegeln hin und her und treten teilweise aus.
  function drawResonator(parent, SRT, local) {
    const gp = (local % CYCLE) / CYCLE;
    const build = ease(clamp(gp / 0.45, 0, 1));
    const phase = -local * 0.02;

    // fast alle Atome angeregt (Besetzungsinversion), zwei im Grundzustand
    for (let c = 0; c < COLS; c += 1) {
      atom(parent, SRT, atomX(c), ROW_UP, c !== 3);
      atom(parent, SRT, atomX(c), ROW_DN, c !== 5);
    }

    drawMirrors(parent, SRT, true);
    drawLossPhotons(parent, SRT, local, build, phase);
    drawAxisGlow(parent, SRT, build);

    // Photonen laufen zwischen den Spiegeln hin und her, ihre Zahl waechst beim Aufbau
    const span = WX1 - WX0;
    const speed = 0.3;
    const T = span / speed;      // Zeit fuer einen einfachen Weg
    const period = 2 * T;        // hin und zurueck
    const maxN = CAV_YOFF.length;
    const count = Math.max(1, Math.round(mix(1, maxN, build)));
    for (let j = 0; j < count; j += 1) {
      const u = ((local + j * (period / maxN)) % period) / T;
      let x, angle;
      if (u < 1) { x = WX0 + span * u; angle = 0; }
      else { x = WX1 - span * (u - 1); angle = Math.PI; }
      photon(parent, SRT, x, BY + CAV_YOFF[j % CAV_YOFF.length], angle, phase, 1);
    }

    // Auskopplung: der ganze rechte Spiegel ist teildurchlaessig, Photonen treten auf allen Hoehen aus
    const exitStart = RM + 16;
    const exitSpan = 828 - exitStart;
    CAV_YOFF.forEach((off, k) => {
      const d = (local * speed + k * (exitSpan / CAV_YOFF.length)) % exitSpan;
      photon(parent, SRT, exitStart + d, BY + off, 0, phase, build * 0.9);
    });
    SRT.addText(parent, 786, BY - 52, "Laserstrahl", "label", {
      fill: PHOTON, "font-size": 14, "font-weight": "800", "text-anchor": "middle", opacity: build
    });

    caption(parent, SRT, "Mit Resonator laufen die Photonen zwischen den Spiegeln hin und her und werden verstärkt.");
  }

  // Ohne Resonator: spontane Photonen verlassen das Medium in alle Richtungen.
  const EMITTERS = [
    { c: 1, row: ROW_UP, angle: -2.3 },
    { c: 3, row: ROW_DN, angle: 1.1 },
    { c: 4, row: ROW_UP, angle: -0.5 },
    { c: 5, row: ROW_DN, angle: 2.4 },
    { c: 2, row: ROW_DN, angle: -1.4 }
  ];

  function drawFree(parent, SRT, local) {
    // gleiche Besetzungsinversion wie im Resonator-Modus, nur ohne Spiegel
    for (let c = 0; c < COLS; c += 1) {
      atom(parent, SRT, atomX(c), ROW_UP, c !== 3);
      atom(parent, SRT, atomX(c), ROW_DN, c !== 5);
    }

    drawMirrors(parent, SRT, false);

    const phase = -local * 0.02;
    EMITTERS.forEach((e, i) => {
      const span = 214;
      const dist = ((local * 0.12 + i * 82) % span);
      const p = dist / span;
      const cos = Math.cos(e.angle);
      const sin = Math.sin(e.angle);
      const baseX = atomX(e.c);
      const fadeOut = clamp(1 - p, 0, 1);
      // erstes Photon (spontane Emission), Richtung zufaellig
      const op1 = clamp(dist / 24, 0, 1) * fadeOut;
      photon(parent, SRT, baseX + cos * dist, e.row + sin * dist, e.angle, phase + i, op1);
      // zweites, identisches Photon (stimulierte Emission), laeuft parallel hinterher
      if (dist > 58) {
        const d2 = dist - 46;
        const op2 = clamp((dist - 58) / 24, 0, 1) * fadeOut;
        photon(parent, SRT, baseX + cos * d2, e.row + sin * d2, e.angle, phase + i + 0.4, op2);
      }
    });

    caption(parent, SRT, "Ohne Spiegel verlassen die Photonen das Medium in alle Richtungen.");
  }

  // Vor dem Pumpen: Atome im Grundzustand, kein Licht.
  function drawIdle(parent, SRT, mode) {
    for (let c = 0; c < COLS; c += 1) {
      atom(parent, SRT, atomX(c), ROW_UP, false);
      atom(parent, SRT, atomX(c), ROW_DN, false);
    }
    drawMirrors(parent, SRT, mode === "resonator");
    caption(parent, SRT, "Drücke „Pumpen“, um das Medium in Besetzungsinversion zu bringen.");
  }

  function draw({ parent, t, state, SRT }) {
    SRT.clear(parent);
    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 8, fill: "#ffffff", stroke: "#e2e8f0" }, parent);

    if (state.mode === undefined) state.mode = "frei";
    if (state.pumped === undefined) state.pumped = false;
    if (state.pumpStart === undefined) state.pumpStart = 0;
    state._t = t;

    drawMedium(parent, SRT);
    drawPump(parent, SRT, state.pumped);

    if (!state.pumped) {
      drawIdle(parent, SRT, state.mode);
      return;
    }

    const local = Math.max(0, t - state.pumpStart);
    if (state.mode === "resonator") {
      drawResonator(parent, SRT, local);
    } else {
      drawFree(parent, SRT, local);
    }
  }

  window.SRTSlide.register("laser-resonator-clean", {
    initialState: { mode: "frei", pumped: false, pumpStart: 0 },
    showMotionControl: false,
    controls: [
      {
        label: (s) => (s.pumped ? "Pumpe ausschalten" : "Pumpen"),
        ariaLabel: "Pumpe ein- oder ausschalten",
        pressed: (s) => s.pumped,
        apply: (s) => {
          s.pumped = !s.pumped;
          if (s.pumped) s.pumpStart = s._t || 0;
        }
      },
      {
        type: "segmented",
        key: "mode",
        label: "Aufbau",
        options: [
          { label: "ohne Resonator", value: "frei", description: "Kein Spiegelpaar: Licht läuft in alle Richtungen" },
          { label: "mit Resonator", value: "resonator", description: "Zwei Spiegel: Licht läuft hin und her und wird verstärkt" }
        ]
      }
    ],
    render: draw
  });
})();
