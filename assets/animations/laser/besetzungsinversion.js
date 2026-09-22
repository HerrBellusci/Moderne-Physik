(function () {
  const MUTED = "#64748b";
  const LEVEL = "#334155";
  const UP = "#f59e0b";
  const DOWN = "#94a3b8";
  const PHOTON = "#e11d48";

  const CANVAS_H = 280;
  const MED_X0 = 120;
  const MED_W = 642;
  const BEAM = 135;
  const YU = BEAM - 38;
  const YL = BEAM + 38;
  const HW = 18;

  const RUN = 4600;
  const PAUSE = 1300;
  const CYCLE = RUN + PAUSE;

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

  function atomX(frac) {
    return MED_X0 + 40 + frac * (MED_W - 80);
  }

  function arrowHead(parent, SRT, x, y, angle, color, size, opacity) {
    const a1 = angle + Math.PI * 0.82;
    const a2 = angle - Math.PI * 0.82;
    SRT.el("path", {
      d: [
        `M${x} ${y}`,
        `L${x + Math.cos(a1) * size} ${y + Math.sin(a1) * size}`,
        `M${x} ${y}`,
        `L${x + Math.cos(a2) * size} ${y + Math.sin(a2) * size}`
      ].join(" "),
      fill: "none", stroke: color, "stroke-width": 2, "stroke-linecap": "round",
      opacity: opacity === undefined ? 1 : opacity
    }, parent);
  }

  function photon(parent, SRT, cx, cy, angle, phase, opacity) {
    const len = 68;
    const amp = 7;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let d = "";
    for (let s = -len / 2; s <= len / 2; s += 2) {
      const norm = s / (len / 2);
      const env = Math.exp(-2.6 * norm * norm);
      const wave = Math.sin(s * 0.36 + phase) * amp * env;
      const x = cx + s * cos - wave * sin;
      const y = cy + s * sin + wave * cos;
      d += `${s === -len / 2 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    SRT.el("path", {
      d, fill: "none", stroke: PHOTON, "stroke-width": 2.5,
      "stroke-linecap": "round", opacity, filter: "url(#glow)"
    }, parent);
    arrowHead(parent, SRT, cx + cos * (len / 2 + 8), cy + sin * (len / 2 + 8), angle, PHOTON, 7, opacity);
  }

  // Der Punkt ist das Atom auf seinem aktuellen Energieniveau, nicht ein Elektron.
  function atomGlyph(parent, SRT, x, up) {
    const upper = up > 0.5;
    SRT.el("line", {
      x1: x - HW, y1: YU, x2: x + HW, y2: YU,
      stroke: UP, "stroke-width": 2.6, "stroke-linecap": "round"
    }, parent);
    SRT.el("line", {
      x1: x - HW, y1: YL, x2: x + HW, y2: YL,
      stroke: DOWN, "stroke-width": 2.6, "stroke-linecap": "round"
    }, parent);
    SRT.el("circle", {
      cx: x, cy: mix(YL, YU, up), r: 8.5,
      fill: upper ? UP : DOWN, stroke: "#ffffff", "stroke-width": 1.6, filter: "url(#glow)"
    }, parent);
  }

  function scene(parent, SRT, mode) {
    SRT.el("line", {
      x1: MED_X0 + 6, y1: BEAM, x2: MED_X0 + MED_W - 6, y2: BEAM,
      stroke: "#cbd5e1", "stroke-width": 1.4, "stroke-dasharray": "5 7", opacity: 0.7
    }, parent);
    SRT.addText(parent, MED_X0 - 24, YU + 7, "*E*₂", "label", { fill: MUTED, "font-size": 21, "font-weight": "650", "text-anchor": "end" });
    SRT.addText(parent, MED_X0 - 24, YL + 7, "*E*₁", "label", { fill: MUTED, "font-size": 21, "font-weight": "650", "text-anchor": "end" });
  }

  // Normale Besetzung: Photon wird absorbiert, Atome emittieren spontan.
  const N_FRACS = [0.08, 0.24, 0.4, 0.56, 0.72, 0.88];
  const N_ABS = 2;  // absorbiert das einlaufende Photon und wechselt nach E2
  const N_EXC = 5;  // von Anfang an angeregt, zerfaellt spontan

  function normalUp(i, p) {
    if (i === N_ABS) {
      if (p < 0.42) return 0;
      if (p < 0.52) return ease((p - 0.42) / 0.10);
      return 1;
    }
    if (i === N_EXC) {
      if (p < 0.22) return 1;
      if (p < 0.34) return 1 - ease((p - 0.22) / 0.12);
      return 0;
    }
    return 0;
  }

  function drawNormal(parent, SRT, p, active, phase) {
    N_FRACS.forEach((f, i) => {
      atomGlyph(parent, SRT, atomX(f), active ? normalUp(i, p) : (i === N_EXC ? 1 : 0));
    });
    if (!active) return;

    const xAbs = atomX(N_FRACS[N_ABS]);
    const xExc = atomX(N_FRACS[N_EXC]);

    if (p <= 0.42) {
      photon(parent, SRT, mix(MED_X0 + 20, xAbs, p / 0.42), BEAM, 0, phase, 1);
    }
    if (p > 0.24) {
      const a = 0.72;
      const d = mix(0, 125, (p - 0.24) / 0.5);
      photon(parent, SRT, xExc + Math.cos(a) * d, BEAM + Math.sin(a) * d, a, phase + 1.3, clamp(1 - (p - 0.24) / 0.56, 0, 1));
    }
  }

  // Besetzungsinversion: mehr Atome oben als unten, ein Atom bleibt unten.
  const I_ATOMS = [
    { f: 0.08, exc: true },
    { f: 0.24, exc: true },
    { f: 0.4, exc: true },
    { f: 0.56, exc: false },
    { f: 0.72, exc: true },
    { f: 0.88, exc: true }
  ];

  function drawInversion(parent, SRT, p, active, phase) {
    I_ATOMS.forEach((a) => {
      let up = a.exc ? 1 : 0;
      if (active && a.exc && p > a.f) up = 1 - ease((p - a.f) / 0.1);
      atomGlyph(parent, SRT, atomX(a.f), up);
    });
    if (!active) return;

    const xFront = mix(MED_X0 + 20, MED_X0 + MED_W - 20, p);
    let count = 1;
    I_ATOMS.forEach((a) => { if (a.exc && p > a.f) count += 1; });
    for (let j = 0; j < count; j++) {
      const y = BEAM + (j - (count - 1) / 2) * 15;
      photon(parent, SRT, xFront, y, 0, phase, 1);
    }
  }

  function draw({ parent, t, state, SRT }) {
    SRT.clear(parent);
    SRT.el("rect", { x: 0, y: 0, width: 862, height: CANVAS_H, rx: 8, fill: "#ffffff", stroke: "#e2e8f0" }, parent);

    if (state.mode === undefined) state.mode = "normal";
    const local = t % CYCLE;
    const active = local < RUN;
    const p = active ? clamp(local / RUN, 0, 1) : 0;
    const phase = -t * 0.012;

    scene(parent, SRT, state.mode);
    if (state.mode === "inversion") {
      drawInversion(parent, SRT, p, active, phase);
    } else {
      drawNormal(parent, SRT, p, active, phase);
    }
  }

  window.SRTSlide.register("laser-besetzungsinversion", {
    initialState: { mode: "normal" },
    showMotionControl: true,
    controls: [
      {
        type: "segmented",
        key: "mode",
        label: "Besetzung",
        options: [
          { label: "normale Besetzung", value: "normal", description: "Mehr Atome in E₁ als in E₂" },
          { label: "Besetzungsinversion", value: "inversion", description: "Mehr Atome in E₂ als in E₁" }
        ]
      }
    ],
    render: draw
  });
})();
