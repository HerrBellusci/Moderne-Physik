(function () {
  const W = 862;
  const H = 450;
  const INK = "#172033";
  const MUTED = "#64748b";
  const LEVEL = "#334155";
  const RED = "#e11d48";

  // Aufbau-Schema (Geometrie wie he-ne.js)
  const TUBE = { x0: 214, x1: 606, y0: 128, y1: 188, cy: 158 };
  const MIR_L = { x0: 198, x1: 212 };
  const MIR_R = { x0: 608, x1: 622 };

  // Spektroskop-Positionen
  const SPEC_SIDE = { cx: 410, y0: 216, w: 84, h: 46 };
  const SPEC_BEAM = { x0: 700, w: 84, h: 46 };

  // Spektrum-Panel
  const PANEL = { x0: 80, x1: 782, y0: 294, y1: 436 };
  const AXIS = { min: 420, max: 710, x0: PANEL.x0 + 46, x1: PANEL.x1 - 46 };

  // Sichtbare Linien der He-Ne-Gasentladung (Helium- und Neonlinien, gerundet)
  const LINES = [
    { nm: 447, color: "#4055ff", w: 2.6, o: 0.95 },
    { nm: 471, color: "#2f7bff", w: 2.2, o: 0.85 },
    { nm: 492, color: "#00b3c8", w: 2.2, o: 0.85 },
    { nm: 502, color: "#00c48d", w: 2.4, o: 0.9 },
    { nm: 585, color: "#ffd400", w: 2.8, o: 1 },
    { nm: 588, color: "#ffdd33", w: 2.6, o: 0.95 },
    { nm: 594, color: "#ffc61a", w: 2.2, o: 0.85 },
    { nm: 603, color: "#ff9d00", w: 2.2, o: 0.85 },
    { nm: 614, color: "#ff8400", w: 2.6, o: 0.95 },
    { nm: 622, color: "#ff6a00", w: 2.2, o: 0.85 },
    { nm: 633, color: "#ff2d2d", w: 2.8, o: 1 },
    { nm: 640, color: "#ff1f1f", w: 3, o: 1 },
    { nm: 650, color: "#f01515", w: 2.4, o: 0.9 },
    { nm: 660, color: "#e01010", w: 2.2, o: 0.8 },
    { nm: 668, color: "#d40f0f", w: 2.4, o: 0.85 },
    { nm: 693, color: "#a80808", w: 2.2, o: 0.75 }
  ];

  function mapX(nm) {
    return AXIS.x0 + (nm - AXIS.min) / (AXIS.max - AXIS.min) * (AXIS.x1 - AXIS.x0);
  }

  function drawAufbau(parent, SRT, pos) {
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

    // Elektroden mit Zuleitung zur Spannungsquelle
    SRT.el("rect", { x: 254, y: TUBE.y0 - 20, width: 12, height: 22, rx: 3, fill: LEVEL }, parent);
    SRT.el("rect", { x: 556, y: TUBE.y0 - 20, width: 12, height: 22, rx: 3, fill: LEVEL }, parent);
    SRT.el("line", { x1: 260, y1: TUBE.y0 - 20, x2: 260, y2: 88, stroke: LEVEL, "stroke-width": 1.6 }, parent);
    SRT.el("line", { x1: 562, y1: TUBE.y0 - 20, x2: 562, y2: 88, stroke: LEVEL, "stroke-width": 1.6 }, parent);
    SRT.el("line", { x1: 260, y1: 88, x2: 399, y2: 88, stroke: LEVEL, "stroke-width": 1.6 }, parent);
    SRT.el("line", { x1: 423, y1: 88, x2: 562, y2: 88, stroke: LEVEL, "stroke-width": 1.6 }, parent);

    // Quellensymbol
    SRT.el("circle", { cx: 411, cy: 88, r: 12, fill: "#ffffff", stroke: LEVEL, "stroke-width": 1.6 }, parent);
    SRT.el("path", {
      d: "M404 88 Q407.5 82.5 411 88 Q414.5 93.5 418 88",
      fill: "none", stroke: LEVEL, "stroke-width": 1.6, "stroke-linecap": "round"
    }, parent);

    // Dauerstrahl im Rohr
    SRT.el("rect", {
      x: TUBE.x0 + 8, y: TUBE.cy - 3, width: TUBE.x1 - TUBE.x0 - 16, height: 6,
      rx: 3, fill: RED, opacity: 0.55, filter: "url(#glow)"
    }, parent);

    // Laserstrahl rechts: frei mit Pfeilspitze oder endend im Spektroskop
    if (pos === "strahl") {
      SRT.el("rect", {
        x: MIR_R.x1, y: TUBE.cy - 3.5, width: SPEC_BEAM.x0 - MIR_R.x1 + 4, height: 7,
        rx: 3.5, fill: RED, opacity: 0.95, filter: "url(#glow)"
      }, parent);
    } else {
      SRT.el("rect", {
        x: MIR_R.x1, y: TUBE.cy - 3.5, width: 204, height: 7,
        rx: 3.5, fill: RED, opacity: 0.95, filter: "url(#glow)"
      }, parent);
      SRT.el("path", {
        d: `M${MIR_R.x1 + 202} ${TUBE.cy - 7} L${MIR_R.x1 + 214} ${TUBE.cy} L${MIR_R.x1 + 202} ${TUBE.cy + 7}`,
        fill: RED, opacity: 0.95
      }, parent);
    }

    // Spiegel
    SRT.el("rect", { x: MIR_L.x0, y: TUBE.y0 - 12, width: MIR_L.x1 - MIR_L.x0, height: TUBE.y1 - TUBE.y0 + 24, rx: 3, fill: "#334155" }, parent);
    SRT.el("rect", { x: MIR_R.x0, y: TUBE.y0 - 12, width: MIR_R.x1 - MIR_R.x0, height: TUBE.y1 - TUBE.y0 + 24, rx: 3, fill: "#94a3b8" }, parent);
  }

  function drawSpektroskop(parent, SRT, x, y, w, h, labelBelow) {
    SRT.el("rect", {
      x, y, width: w, height: h, rx: 8,
      fill: "#e2e8f0", stroke: "#475569", "stroke-width": 2
    }, parent);
    // Gitterlinien
    for (let gx = x + 12; gx <= x + w - 12; gx += 6) {
      SRT.el("line", {
        x1: gx, y1: y + 9, x2: gx, y2: y + h - 9,
        stroke: "#475569", "stroke-width": 1.2, opacity: 0.7
      }, parent);
    }
    SRT.addText(parent, x + w / 2, labelBelow ? y + h + 18 : y - 10, "Gitterspektroskop", "label", {
      fill: INK, "font-size": 12.5, "font-weight": "750", "text-anchor": "middle"
    });
  }

  function drawSeitlichesLicht(parent, SRT) {
    // Rosa Lichtkegel vom Entladungsleuchten zum Spektroskop:
    // die Farben trennt erst das Gitter, das seitliche Licht selbst leuchtet rosa
    SRT.el("path", {
      d: `M${SPEC_SIDE.cx - 62} ${TUBE.y1} L${SPEC_SIDE.cx + 62} ${TUBE.y1} L${SPEC_SIDE.cx + 16} ${SPEC_SIDE.y0} L${SPEC_SIDE.cx - 16} ${SPEC_SIDE.y0} Z`,
      fill: "#fda4af", opacity: 0.45, filter: "url(#glow)"
    }, parent);
    SRT.el("path", {
      d: `M${SPEC_SIDE.cx - 30} ${TUBE.y1} L${SPEC_SIDE.cx + 30} ${TUBE.y1} L${SPEC_SIDE.cx + 8} ${SPEC_SIDE.y0} L${SPEC_SIDE.cx - 8} ${SPEC_SIDE.y0} Z`,
      fill: "#fecdd3", opacity: 0.7
    }, parent);
  }

  function drawPanel(parent, SRT, pos) {
    SRT.el("rect", {
      x: PANEL.x0, y: PANEL.y0, width: PANEL.x1 - PANEL.x0, height: PANEL.y1 - PANEL.y0,
      rx: 10, fill: "#0f172a", stroke: "#334155", "stroke-width": 1.5
    }, parent);
    SRT.addText(parent, PANEL.x0 + 16, PANEL.y0 + 24, "Spektrum im Spektroskop", "label", {
      fill: "#cbd5e1", "font-size": 12.5, "font-weight": "750", "text-anchor": "start"
    });

    // Wellenlängenachse
    const axisY = PANEL.y1 - 30;
    SRT.el("line", {
      x1: AXIS.x0 - 14, y1: axisY, x2: AXIS.x1 + 14, y2: axisY,
      stroke: "#475569", "stroke-width": 1.5
    }, parent);
    [450, 500, 550, 600, 650, 700].forEach((nm) => {
      const x = mapX(nm);
      SRT.el("line", { x1: x, y1: axisY, x2: x, y2: axisY + 5, stroke: "#475569", "stroke-width": 1.5 }, parent);
      SRT.addText(parent, x, axisY + 19, String(nm), "label", {
        fill: "#94a3b8", "font-size": 11, "font-weight": "700", "text-anchor": "middle"
      });
    });
    SRT.addText(parent, AXIS.x1 + 20, axisY + 19, "nm", "label", {
      fill: "#94a3b8", "font-size": 11, "font-weight": "700", "text-anchor": "start"
    });

    const lineTop = PANEL.y0 + 38;
    const lineBottom = axisY - 8;

    // Spektrallinien als schmale Rechtecke: senkrechte SVG-Linien haben eine
    // Bounding-Box der Breite null, der Glow-Filter macht sie damit unsichtbar
    function spectrumLine(nm, color, width, opacity) {
      SRT.el("rect", {
        x: mapX(nm) - width / 2, y: lineTop, width, height: lineBottom - lineTop,
        rx: width / 2, fill: color, opacity, filter: "url(#glow)"
      }, parent);
    }

    if (pos === "strahl") {
      spectrumLine(632.8, "#ff2d2d", 5, 1);
    } else {
      LINES.forEach((line) => {
        spectrumLine(line.nm, line.color, line.w, line.o);
      });
    }
  }

  window.SRTSlide.register("laser-hene-spektroskop", {
    initialState: { pos: "seitlich" },
    showMotionControl: false,
    controls: [
      {
        type: "segmented",
        key: "pos",
        label: "Spektroskop halten",
        options: [
          { label: "seitlich ans Rohr", value: "seitlich", description: "Spektroskop vor das seitlich austretende Licht des Rohrs halten" },
          { label: "in den Laserstrahl", value: "strahl", description: "Spektroskop in den austretenden Laserstrahl halten" }
        ]
      }
    ],
    render: ({ parent, state, SRT }) => {
      SRT.clear(parent);
      SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 8, fill: "#ffffff", stroke: "#e2e8f0" }, parent);
      drawAufbau(parent, SRT, state.pos);
      if (state.pos === "strahl") {
        drawSpektroskop(parent, SRT, SPEC_BEAM.x0, TUBE.cy - SPEC_BEAM.h / 2, SPEC_BEAM.w, SPEC_BEAM.h, true);
      } else {
        drawSeitlichesLicht(parent, SRT);
        drawSpektroskop(parent, SRT, SPEC_SIDE.cx - SPEC_SIDE.w / 2, SPEC_SIDE.y0, SPEC_SIDE.w, SPEC_SIDE.h, true);
      }
      drawPanel(parent, SRT, state.pos);
    }
  });
})();
