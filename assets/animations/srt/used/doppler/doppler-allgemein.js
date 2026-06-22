(function () {
  const W = 862, H = 506;
  const Y = 286;                 // Linie, auf der Quelle und Beobachter liegen
  const X0 = 150, X1 = 700;      // Bewegungsbereich der Quelle
  const V = 0.095;               // Quellgeschwindigkeit (px/ms)
  const CW = 0.21;               // Wellenausbreitung (px/ms), CW > V => unterschallartig
  const EMIT = 470;              // Abstand zwischen zwei Wellenfronten (ms)
  const FULL = (X1 - X0) / V;    // Dauer einer Überquerung

  const INK = "#172033", MUTED = "#5c6678";
  const WAVE = "#6d5dfc", SRC = "#e0a93b", BLUE = "#2f6df6", RED = "#c2414b";

  function render({ parent, t, SRT }) {
    const tc = t % FULL;
    const xs = X0 + V * tc;       // aktuelle Quellposition

    SRT.clear(parent);
    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#f7f9fb" }, parent);
    SRT.addText(parent, 431, 36, "Doppler-Effekt einer bewegten Quelle", "label", {
      "text-anchor": "middle", fill: INK, "font-size": 16, "font-weight": "900"
    });

    // Wellenfronten: ausgesendet zu Zeiten t_k = k*EMIT (nur die mit t_k <= tc)
    const kMax = Math.floor(tc / EMIT);
    for (let k = 0; k <= kMax; k += 1) {
      const tk = k * EMIT;
      const xk = X0 + V * tk;               // Ort der Quelle bei Aussendung
      const r = CW * (tc - tk);
      if (r < 1) continue;
      const op = Math.max(0, 0.6 - r / 1500);
      SRT.el("circle", { cx: xk.toFixed(1), cy: Y, r: r.toFixed(1), fill: "none",
        stroke: WAVE, "stroke-width": 2, opacity: op.toFixed(2) }, parent);
    }

    // Beobachter: rechts (Annäherung, höher / Licht blau), links (Entfernung, tiefer / Licht rot)
    SRT.el("circle", { cx: X1 + 96, cy: Y, r: 7, fill: BLUE }, parent);
    SRT.el("circle", { cx: X0 - 96, cy: Y, r: 7, fill: RED }, parent);
    SRT.addText(parent, X1 + 96, Y + 27, "höher", "tiny", { "text-anchor": "middle", fill: BLUE, "font-size": 13, "font-weight": "850" });
    SRT.addText(parent, X0 - 96, Y + 27, "tiefer", "tiny", { "text-anchor": "middle", fill: RED, "font-size": 13, "font-weight": "850" });

    // Quelle mit Geschwindigkeitspfeil
    SRT.el("circle", { cx: xs.toFixed(1), cy: Y, r: 10, fill: SRC, stroke: "#ffffff", "stroke-width": 2 }, parent);
    const ax0 = xs + 16, ax1 = xs + 54;
    SRT.el("line", { x1: ax0.toFixed(1), y1: Y, x2: ax1.toFixed(1), y2: Y, stroke: INK, "stroke-width": 2.4, "stroke-linecap": "round" }, parent);
    SRT.el("polygon", { points: `${(ax1 + 10).toFixed(1)},${Y} ${ax1.toFixed(1)},${Y - 6} ${ax1.toFixed(1)},${Y + 6}`, fill: INK }, parent);
  }

  window.SRTSlide.register("doppler-allgemein", { render });
})();
