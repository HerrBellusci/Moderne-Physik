(function () {
  const W = 862;
  const H = 506;
  const INK = "#172033";
  const MUTED = "#64748b";
  const LEVEL = "#334155";
  const PUMP = "#2563eb";
  const RED = "#e11d48";

  // Aufbau-Schema oben
  const ROD = { x0: 214, x1: 606, y0: 128, y1: 188, cy: 158 };
  const MIR_L = { x0: 198, x1: 212 };
  const MIR_R = { x0: 608, x1: 622 };

  // Drei-Niveau-Schema unten
  const LX0 = 350;
  const LX1 = 620;
  const E3 = 322;
  const E2 = 372;
  const E1 = 456;
  const DOT_X = 440;

  const CYCLE = 6400;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(v) { const x = clamp(v, 0, 1); return x * x * (3 - 2 * x); }
  function mix(a, b, p) { return a + (b - a) * clamp(p, 0, 1); }
  function ramp(p, a, b) { return ease((p - a) / (b - a)); }

  function vArrow(parent, SRT, x, y1, y2, color, opacity, dash) {
    const attrs = {
      x1: x, y1, x2: x, y2,
      stroke: color, "stroke-width": 2.2, "stroke-linecap": "round", opacity
    };
    if (dash) attrs["stroke-dasharray"] = dash;
    SRT.el("line", attrs, parent);
    const dir = y2 > y1 ? 1 : -1;
    SRT.el("path", {
      d: `M${x - 5} ${y2 - dir * 8} L${x} ${y2} L${x + 5} ${y2 - dir * 8}`,
      fill: "none", stroke: color, "stroke-width": 2.2,
      "stroke-linecap": "round", "stroke-linejoin": "round", opacity
    }, parent);
  }

  function drawAufbau(parent, SRT, flash, glow, beam) {
    // Lichtschein der Blitzlampe
    if (flash > 0.01) {
      SRT.el("rect", {
        x: ROD.x0 - 10, y: ROD.y0 - 26, width: ROD.x1 - ROD.x0 + 20, height: ROD.y1 - ROD.y0 + 52,
        rx: 18, fill: "#fde68a", opacity: flash * 0.35, filter: "url(#glow)"
      }, parent);
    }

    // Rubinstab
    SRT.el("rect", {
      x: ROD.x0, y: ROD.y0, width: ROD.x1 - ROD.x0, height: ROD.y1 - ROD.y0,
      rx: 8, fill: "#f6c9d4", stroke: "#d16b85", "stroke-width": 2
    }, parent);

    // Rotes Licht im Stab (Rechteck statt Linie: horizontale Linien haben
    // eine Bounding-Box mit Höhe null, dann zeichnet der Glow-Filter nichts)
    if (glow > 0.01) {
      const gh = mix(2, 9, glow);
      SRT.el("rect", {
        x: ROD.x0 + 8, y: ROD.cy - gh / 2, width: ROD.x1 - ROD.x0 - 16, height: gh,
        rx: gh / 2, fill: RED, opacity: glow * 0.85, filter: "url(#glow)"
      }, parent);
    }

    // Blitzlampe als Wendel um den Stab
    for (let x = 254; x <= 566; x += 52) {
      SRT.el("ellipse", {
        cx: x, cy: ROD.cy, rx: 15, ry: 48,
        fill: "none",
        stroke: flash > 0.15 ? "#fbbf24" : "#cbd5e1",
        "stroke-width": mix(3, 4.5, flash),
        opacity: mix(0.85, 1, flash),
        filter: flash > 0.15 ? "url(#glow)" : "none"
      }, parent);
    }

    // Spiegel
    SRT.el("rect", { x: MIR_L.x0, y: ROD.y0 - 12, width: MIR_L.x1 - MIR_L.x0, height: ROD.y1 - ROD.y0 + 24, rx: 3, fill: "#334155" }, parent);
    SRT.el("rect", { x: MIR_R.x0, y: ROD.y0 - 12, width: MIR_R.x1 - MIR_R.x0, height: ROD.y1 - ROD.y0 + 24, rx: 3, fill: "#94a3b8" }, parent);

    // Laserstrahl (Rechteck statt Linie, siehe Hinweis oben)
    if (beam > 0.01) {
      const bx = mix(MIR_R.x1, 826, beam);
      SRT.el("rect", {
        x: MIR_R.x1, y: ROD.cy - 3.5, width: bx - MIR_R.x1, height: 7,
        rx: 3.5, fill: RED, opacity: beam, filter: "url(#glow)"
      }, parent);
      SRT.el("path", {
        d: `M${bx - 2} ${ROD.cy - 7} L${bx + 10} ${ROD.cy} L${bx - 2} ${ROD.cy + 7}`,
        fill: RED, opacity: beam
      }, parent);
    }

    // Beschriftungen
    SRT.addText(parent, 410, 62, "Blitzlampe", "label", { fill: INK, "font-size": 13.5, "font-weight": "800", "text-anchor": "middle" });
    SRT.el("line", { x1: 410, y1: 70, x2: 410, y2: 102, stroke: "#cbd5e1", "stroke-width": 1.4 }, parent);
    SRT.addText(parent, 410, 236, "Rubinstab: Korund mit Chrom-Ionen", "label", { fill: MUTED, "font-size": 12.5, "font-weight": "750", "text-anchor": "middle" });
    SRT.addText(parent, 205, 84, "voll reflektierender", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "middle" });
    SRT.addText(parent, 205, 100, "Spiegel", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "middle" });
    SRT.addText(parent, 617, 84, "teildurchlässiger", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "middle" });
    SRT.addText(parent, 617, 100, "Spiegel", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "middle" });
    SRT.addText(parent, 730, 134, "Laserstrahl, 694 nm", "label", { fill: INK, "font-size": 12.5, "font-weight": "750", "text-anchor": "middle" });
  }

  function dotY(p) {
    if (p < 0.10) return E1;
    if (p < 0.18) return mix(E1, E3, ease((p - 0.10) / 0.08));
    if (p < 0.26) return E3;
    if (p < 0.34) return mix(E3, E2, ease((p - 0.26) / 0.08));
    if (p < 0.62) return E2;
    if (p < 0.70) return mix(E2, E1, ease((p - 0.62) / 0.08));
    return E1;
  }

  function drawNiveaus(parent, SRT, p, flash, beam) {
    SRT.addText(parent, (LX0 + LX1) / 2, 292, "Drei-Niveau-System der Chrom-Ionen", "label", { fill: INK, "font-size": 14, "font-weight": "800", "text-anchor": "middle" });

    const levels = [
      { y: E3, key: "E₃", name: "Pumpniveau" },
      { y: E2, key: "E₂", name: "metastabil" },
      { y: E1, key: "E₁", name: "Grundzustand" }
    ];
    levels.forEach((level) => {
      SRT.el("line", { x1: LX0, y1: level.y, x2: LX1, y2: level.y, stroke: LEVEL, "stroke-width": 2.4, "stroke-linecap": "round" }, parent);
      SRT.addText(parent, LX0 - 12, level.y + 5, level.key, "label", { fill: INK, "font-size": 14, "font-weight": "850", "text-anchor": "end" });
      SRT.addText(parent, LX1 + 12, level.y + 5, level.name, "label", { fill: MUTED, "font-size": 12.5, "font-weight": "750", "text-anchor": "start" });
    });

    // Übergänge: Pumpen, schneller Übergang, Laserübergang
    const decayEmph = ramp(p, 0.26, 0.30) * (1 - ramp(p, 0.36, 0.42));
    vArrow(parent, SRT, 396, E1 - 8, E3 + 8, PUMP, 0.35 + flash * 0.65);
    SRT.addText(parent, 388, (E1 + E3) / 2 + 4, "Pumpen", "label", { fill: PUMP, "font-size": 12, "font-weight": "750", "text-anchor": "end" });
    vArrow(parent, SRT, 484, E3 + 8, E2 - 8, MUTED, 0.35 + decayEmph * 0.65, "4 5");
    SRT.addText(parent, 492, (E3 + E2) / 2 + 4, "schneller Übergang", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "start" });
    vArrow(parent, SRT, 560, E2 + 8, E1 - 8, RED, 0.35 + beam * 0.65);
    SRT.addText(parent, 568, (E2 + E1) / 2 + 4, "694 nm", "label", { fill: RED, "font-size": 12, "font-weight": "750", "text-anchor": "start" });

    // Punkt: Energiezustand eines Chrom-Ions
    const y = dotY(p);
    const upper = y < (E2 + E1) / 2;
    SRT.el("line", { x1: DOT_X, y1: E3, x2: DOT_X, y2: E1, stroke: "#cbd5e1", "stroke-width": 1.2, "stroke-dasharray": "4 7", opacity: 0.6 }, parent);
    SRT.el("circle", {
      cx: DOT_X, cy: y, r: 7.5,
      fill: upper ? "#f59e0b" : PUMP, stroke: "#ffffff", "stroke-width": 1.8, filter: "url(#glow)"
    }, parent);
  }

  function draw({ parent, t, SRT }) {
    SRT.clear(parent);
    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 8, fill: "#ffffff", stroke: "#e2e8f0" }, parent);

    const p = (t % CYCLE) / CYCLE;
    const flash = ramp(p, 0.05, 0.10) * (1 - ramp(p, 0.22, 0.28));
    const glow = ramp(p, 0.34, 0.50) * (1 - ramp(p, 0.84, 0.95));
    const beam = ramp(p, 0.50, 0.56) * (1 - ramp(p, 0.84, 0.95));

    drawAufbau(parent, SRT, flash, glow, beam);
    drawNiveaus(parent, SRT, p, flash, beam);
  }

  window.SRTSlide.register("laser-rubinlaser", {
    render: draw
  });
})();
