(function () {
  const W = 862;
  const H_AUFBAU = 280;
  const H_NIVEAUS = 320;
  const INK = "#172033";
  const MUTED = "#64748b";
  const LEVEL = "#334155";
  const PUMP = "#2563eb";
  const AMBER = "#f59e0b";
  const RED = "#e11d48";

  // Aufbau-Schema
  const TUBE = { x0: 214, x1: 606, y0: 128, y1: 188, cy: 158 };
  const MIR_L = { x0: 198, x1: 212 };
  const MIR_R = { x0: 608, x1: 622 };

  // Niveauschema: zwei Spalten
  const HE = { x0: 120, x1: 320 };
  const NE = { x0: 470, x1: 730 };
  const Y_TOP = 108;
  const Y_LOW = 186;
  const Y_GND = 258;
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

  function hArrow(parent, SRT, x1, x2, y, color, opacity) {
    SRT.el("line", {
      x1, y1: y, x2, y2: y,
      stroke: color, "stroke-width": 2.2, "stroke-linecap": "round", opacity
    }, parent);
    SRT.el("path", {
      d: `M${x2 - 8} ${y - 5} L${x2} ${y} L${x2 - 8} ${y + 5}`,
      fill: "none", stroke: color, "stroke-width": 2.2,
      "stroke-linecap": "round", "stroke-linejoin": "round", opacity
    }, parent);
  }

  function drawAufbau(parent, SRT) {
    // Glasrohr
    SRT.el("rect", {
      x: TUBE.x0, y: TUBE.y0, width: TUBE.x1 - TUBE.x0, height: TUBE.y1 - TUBE.y0,
      rx: 12, fill: "#f1f5f9", stroke: "#94a3b8", "stroke-width": 2
    }, parent);

    // Leuchten der Gasentladung
    SRT.el("rect", {
      x: TUBE.x0 + 6, y: TUBE.y0 + 6, width: TUBE.x1 - TUBE.x0 - 12, height: TUBE.y1 - TUBE.y0 - 12,
      rx: 9, fill: "#fda4af", opacity: 0.34, filter: "url(#glow)"
    }, parent);
    SRT.addText(parent, 410, TUBE.cy - 18, "Gasentladung", "label", { fill: "#be123c", "font-size": 12, "font-weight": "750", "text-anchor": "middle" });

    // Elektroden mit Zuleitung zur Hochspannungsquelle
    SRT.el("rect", { x: 254, y: TUBE.y0 - 20, width: 12, height: 22, rx: 3, fill: LEVEL }, parent);
    SRT.el("rect", { x: 556, y: TUBE.y0 - 20, width: 12, height: 22, rx: 3, fill: LEVEL }, parent);
    SRT.el("line", { x1: 260, y1: TUBE.y0 - 20, x2: 260, y2: 88, stroke: LEVEL, "stroke-width": 1.6 }, parent);
    SRT.el("line", { x1: 562, y1: TUBE.y0 - 20, x2: 562, y2: 88, stroke: LEVEL, "stroke-width": 1.6 }, parent);
    SRT.el("line", { x1: 260, y1: 88, x2: 352, y2: 88, stroke: LEVEL, "stroke-width": 1.6 }, parent);
    SRT.el("line", { x1: 470, y1: 88, x2: 562, y2: 88, stroke: LEVEL, "stroke-width": 1.6 }, parent);
    SRT.addText(parent, 411, 92, "Hochspannung", "label", { fill: INK, "font-size": 12.5, "font-weight": "800", "text-anchor": "middle" });
    SRT.addText(parent, 274, TUBE.y0 - 4, "Kathode (−)", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "start" });
    SRT.addText(parent, 548, TUBE.y0 - 4, "Anode (+)", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "end" });

    // Dauerstrahl im Rohr und Laserstrahl rechts
    SRT.el("rect", {
      x: TUBE.x0 + 8, y: TUBE.cy - 3, width: TUBE.x1 - TUBE.x0 - 16, height: 6,
      rx: 3, fill: RED, opacity: 0.55, filter: "url(#glow)"
    }, parent);
    SRT.el("rect", {
      x: MIR_R.x1, y: TUBE.cy - 3.5, width: 204, height: 7,
      rx: 3.5, fill: RED, opacity: 0.95, filter: "url(#glow)"
    }, parent);
    SRT.el("path", {
      d: `M${MIR_R.x1 + 202} ${TUBE.cy - 7} L${MIR_R.x1 + 214} ${TUBE.cy} L${MIR_R.x1 + 202} ${TUBE.cy + 7}`,
      fill: RED, opacity: 0.95
    }, parent);

    // Spiegel
    SRT.el("rect", { x: MIR_L.x0, y: TUBE.y0 - 12, width: MIR_L.x1 - MIR_L.x0, height: TUBE.y1 - TUBE.y0 + 24, rx: 3, fill: "#334155" }, parent);
    SRT.el("rect", { x: MIR_R.x0, y: TUBE.y0 - 12, width: MIR_R.x1 - MIR_R.x0, height: TUBE.y1 - TUBE.y0 + 24, rx: 3, fill: "#94a3b8" }, parent);

    // Beschriftungen
    SRT.addText(parent, 410, 236, "Glasrohr mit Helium und Neon", "label", { fill: MUTED, "font-size": 12.5, "font-weight": "750", "text-anchor": "middle" });
    SRT.addText(parent, 205, 84, "voll reflektierender", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "middle" });
    SRT.addText(parent, 205, 100, "Spiegel", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "middle" });
    SRT.addText(parent, 662, 84, "teildurchlässiger", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "middle" });
    SRT.addText(parent, 662, 100, "Spiegel", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "middle" });
    SRT.addText(parent, 730, 134, "Laserstrahl, 632,8 nm", "label", { fill: INK, "font-size": 12.5, "font-weight": "750", "text-anchor": "middle" });
  }

  function drawNiveaus(parent, SRT) {
    SRT.addText(parent, (HE.x0 + NE.x1) / 2, 40, "Niveauschema des Helium-Neon-Lasers", "label", { fill: INK, "font-size": 14, "font-weight": "800", "text-anchor": "middle" });
    SRT.addText(parent, (HE.x0 + HE.x1) / 2, 72, "Helium", "label", { fill: INK, "font-size": 13, "font-weight": "850", "text-anchor": "middle" });
    SRT.addText(parent, (NE.x0 + NE.x1) / 2, 72, "Neon", "label", { fill: INK, "font-size": 13, "font-weight": "850", "text-anchor": "middle" });

    // Helium-Niveaus
    [
      { y: Y_TOP, name: "metastabil (20,61 eV)" },
      { y: Y_GND, name: "Grundzustand" }
    ].forEach((level) => {
      SRT.el("line", { x1: HE.x0, y1: level.y, x2: HE.x1, y2: level.y, stroke: LEVEL, "stroke-width": 2.4, "stroke-linecap": "round" }, parent);
      SRT.addText(parent, HE.x0, level.y + 18, level.name, "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "start" });
    });

    // Neon-Niveaus
    [
      { y: Y_TOP, name: "oberes Laserniveau (20,66 eV)" },
      { y: Y_LOW, name: "unteres Laserniveau" },
      { y: Y_GND, name: "Grundzustand" }
    ].forEach((level) => {
      SRT.el("line", { x1: NE.x0, y1: level.y, x2: NE.x1, y2: level.y, stroke: LEVEL, "stroke-width": 2.4, "stroke-linecap": "round" }, parent);
      SRT.addText(parent, NE.x1, level.y + 18, level.name, "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "end" });
    });

    // Übergänge
    vArrow(parent, SRT, 160, Y_GND - 8, Y_TOP + 8, PUMP, 0.9);
    SRT.addText(parent, 152, (Y_GND + Y_TOP) / 2 + 4, "Elektronenstoß", "label", { fill: PUMP, "font-size": 12, "font-weight": "750", "text-anchor": "end" });

    hArrow(parent, SRT, HE.x1 + 10, NE.x0 - 10, Y_TOP, AMBER, 0.9);
    SRT.addText(parent, (HE.x1 + NE.x0) / 2, Y_TOP - 12, "Stoß", "label", { fill: AMBER, "font-size": 12, "font-weight": "800", "text-anchor": "middle" });
    SRT.addText(parent, (HE.x1 + NE.x0) / 2, Y_TOP + 22, "fast gleiche Energie", "label", { fill: MUTED, "font-size": 11, "font-weight": "700", "text-anchor": "middle" });

    vArrow(parent, SRT, 600, Y_TOP + 8, Y_LOW - 8, RED, 0.9);
    SRT.addText(parent, 608, (Y_TOP + Y_LOW) / 2 + 4, "632,8 nm", "label", { fill: RED, "font-size": 12, "font-weight": "750", "text-anchor": "start" });

    vArrow(parent, SRT, 660, Y_LOW + 8, Y_GND - 8, MUTED, 0.9, "4 5");
    SRT.addText(parent, 668, (Y_LOW + Y_GND) / 2 + 4, "schnelle Entleerung", "label", { fill: MUTED, "font-size": 12, "font-weight": "750", "text-anchor": "start" });

    SRT.addText(parent, NE.x1, H_NIVEAUS - 14, "Schema, nicht maßstäblich", "label", { fill: MUTED, "font-size": 10.5, "font-weight": "700", "text-anchor": "end" });
  }

  window.SRTSlide.register("laser-hene", {
    render: ({ parent, t, SRT }) => {
      SRT.clear(parent);
      SRT.el("rect", { x: 0, y: 0, width: W, height: H_AUFBAU, rx: 8, fill: "#ffffff", stroke: "#e2e8f0" }, parent);
      drawAufbau(parent, SRT);
    }
  });

  window.SRTSlide.register("laser-hene-niveaus", {
    render: ({ parent, t, SRT }) => {
      SRT.clear(parent);
      SRT.el("rect", { x: 0, y: 0, width: W, height: H_NIVEAUS, rx: 8, fill: "#ffffff", stroke: "#e2e8f0" }, parent);
      drawNiveaus(parent, SRT);
    }
  });
})();
