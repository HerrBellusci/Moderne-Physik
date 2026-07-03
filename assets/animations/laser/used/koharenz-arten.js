(function () {
  const W = 862;
  const H = 506;
  const C_SPEED = 0.025;
  const K_MONO = 0.24;
  const K_MULTI = [0.19, 0.215, 0.24, 0.27, 0.3];
  const PHI_MULTI = [0, 2.1, 4.4, 1.2, 3.4];
  const COLORS_MULTI = ["#e11d48", "#f59e0b", "#16a34a", "#2563eb", "#7c3aed"];
  const COLOR_MONO = "#e11d48";
  const ANGLES_FAN = [-13, -6.5, 0, 6.5, 13];
  const AMP = 13;

  const MAIN = { x: 24, y: 24, w: 814, h: 366 };
  const INFO = { x: 24, y: 406, w: 814, h: 76 };

  function panel(parent, SRT, box, title) {
    SRT.el("rect", {
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      rx: 10,
      fill: "#f8fafc",
      stroke: "#e2e8f0"
    }, parent);
    if (title) {
      SRT.addText(parent, box.x + 16, box.y + 26, title, "label", {
        fill: "#172033",
        "font-size": 13,
        "font-weight": "900"
      });
    }
  }

  function rayGeometry(state, i) {
    const cy = MAIN.y + 196;
    if (state.dirs === "parallel") {
      return { ox: MAIN.x + 52, oy: cy + (i - 2) * 62, cos: 1, sin: 0 };
    }
    const a = (ANGLES_FAN[i] * Math.PI) / 180;
    return { ox: MAIN.x + 52, oy: cy, cos: Math.cos(a), sin: Math.sin(a) };
  }

  function rayWave(state, i) {
    if (state.color === "mono") {
      return { k: K_MONO, phi: 0, stroke: COLOR_MONO };
    }
    return { k: K_MULTI[i], phi: PHI_MULTI[i], stroke: COLORS_MULTI[i] };
  }

  function drawMain(parent, SRT, t, state) {
    panel(parent, SRT, MAIN, "Fünf Wellenzüge aus einer Quelle");
    const x1 = MAIN.x + MAIN.w - 26;

    if (state.dirs === "parallel") {
      SRT.el("rect", {
        x: MAIN.x + 32,
        y: MAIN.y + 196 - 2 * 62 - 26,
        width: 14,
        height: 4 * 62 + 52,
        rx: 4,
        fill: "#cbd5e1"
      }, parent);
    } else {
      SRT.el("circle", {
        cx: MAIN.x + 46,
        cy: MAIN.y + 196,
        r: 9,
        fill: "#cbd5e1"
      }, parent);
    }
    SRT.addText(parent, MAIN.x + 39, MAIN.y + MAIN.h - 34, "Quelle", "label", {
      fill: "#64748b",
      "font-size": 10,
      "font-weight": "700",
      "text-anchor": "middle"
    });

    for (let i = 0; i < 5; i += 1) {
      const g = rayGeometry(state, i);
      const w = rayWave(state, i);
      let d = "";
      for (let s = 0; ; s += 2) {
        const disp = Math.sin(w.k * s - t * C_SPEED * w.k + w.phi) * AMP;
        const x = g.ox + s * g.cos - disp * g.sin;
        const y = g.oy + s * g.sin + disp * g.cos;
        if (x > x1 || y < MAIN.y + 40 || y > MAIN.y + MAIN.h - 20) break;
        d += `${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      SRT.el("path", {
        d,
        fill: "none",
        stroke: w.stroke,
        "stroke-width": 1.8,
        "stroke-linecap": "round",
        filter: "url(#glow)",
        opacity: 0.9
      }, parent);
    }

    if (state.color === "mono") {
      const sMid = (x1 - MAIN.x - 52) * 0.62;
      const n = Math.round((K_MONO * sMid - t * C_SPEED * K_MONO - Math.PI / 2) / (2 * Math.PI));
      const sN = (Math.PI / 2 + 2 * Math.PI * n) / K_MONO + t * C_SPEED;
      const flat = state.dirs === "parallel";
      let fd = "";
      const pts = [];
      for (let i = 0; i < 5; i += 1) {
        const g = rayGeometry(state, i);
        pts.push({ x: g.ox + sN * g.cos, y: g.oy + sN * g.sin });
      }
      pts.forEach((p, idx) => {
        fd += `${idx === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
      });
      SRT.el("path", {
        d: fd,
        fill: "none",
        stroke: flat ? "#16a34a" : "#dc2626",
        "stroke-width": 2,
        "stroke-dasharray": "5 4"
      }, parent);
      pts.forEach((p) => {
        SRT.el("circle", {
          cx: p.x,
          cy: p.y,
          r: 3.2,
          fill: flat ? "#16a34a" : "#dc2626"
        }, parent);
      });
      SRT.addText(parent, pts[0].x, MAIN.y + 48, flat
        ? "ebene Wellenfront"
        : "gekrümmte Wellenfront", "label", {
        fill: flat ? "#16a34a" : "#dc2626",
        "font-size": 12,
        "font-weight": "900",
        "text-anchor": "middle"
      });
    }

    SRT.addText(parent, x1, MAIN.y + MAIN.h - 14, "Modellbild, stark vereinfacht", "label", {
      fill: "#64748b",
      "font-size": 10,
      "font-weight": "700",
      "text-anchor": "end"
    });
  }

  function drawInfo(parent, SRT, state) {
    panel(parent, SRT, INFO, null);
    const mono = state.color === "mono";
    const par = state.dirs === "parallel";
    SRT.addText(parent, INFO.x + 20, INFO.y + 30, mono
      ? "zeitlich kohärent: ja, eine Farbe hält den Takt längs des Strahls"
      : "zeitlich kohärent: nein, mehrere Farben verschieben sich gegeneinander", "label", {
      fill: mono ? "#16a34a" : "#dc2626",
      "font-size": 12,
      "font-weight": "800"
    });
    SRT.addText(parent, INFO.x + 20, INFO.y + 52, par
      ? "räumlich kohärent: ja, parallele Wellenzüge halten den Versatz quer zum Strahl fest"
      : "räumlich kohärent: nein, aufgefächert wächst der Versatz quer zum Strahl immer weiter", "label", {
      fill: par ? "#16a34a" : "#dc2626",
      "font-size": 12,
      "font-weight": "800"
    });
    let tag = "";
    if (mono && par) tag = "beides zusammen: Licht wie aus dem Laser";
    if (!mono && !par) tag = "keins von beiden: Licht wie aus der Glühlampe";
    if (tag) {
      SRT.addText(parent, INFO.x + INFO.w - 20, INFO.y + 41, tag, "label", {
        fill: mono && par ? "#16a34a" : "#dc2626",
        "font-size": 12,
        "font-weight": "900",
        "text-anchor": "end"
      });
    }
  }

  window.SRTSlide.register("laser-koharenz-arten", {
    showMotionControl: false,
    initialState: { color: "mono", dirs: "parallel" },
    controls: [
      {
        type: "group",
        label: "Farbe",
        controls: [
          {
            label: "eine Farbe",
            ariaLabel: "Quelle sendet eine einzige Farbe",
            pressed: (state) => state.color === "mono",
            apply: (state) => { state.color = "mono"; }
          },
          {
            label: "mehrere Farben",
            ariaLabel: "Quelle sendet mehrere Farben",
            pressed: (state) => state.color === "multi",
            apply: (state) => { state.color = "multi"; }
          }
        ]
      },
      {
        type: "group",
        label: "Richtungen",
        controls: [
          {
            label: "parallel",
            ariaLabel: "Wellenzüge laufen parallel",
            pressed: (state) => state.dirs === "parallel",
            apply: (state) => { state.dirs = "parallel"; }
          },
          {
            label: "aufgefächert",
            ariaLabel: "Wellenzüge laufen aufgefächert in verschiedene Richtungen",
            pressed: (state) => state.dirs === "fan",
            apply: (state) => { state.dirs = "fan"; }
          }
        ]
      }
    ],
    render: ({ parent, t, state, SRT }) => {
      SRT.clear(parent);
      SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 8, fill: "#ffffff", stroke: "#e2e8f0" }, parent);
      drawMain(parent, SRT, t, state);
      drawInfo(parent, SRT, state);
    }
  });
})();
