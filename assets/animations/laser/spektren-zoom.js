(function () {
  const W = 862;
  const VH = 560;

  const PX0 = 150;   // Position der I-Achse
  const PX1 = 780;   // Ende der λ-Achse
  const XC = 465;    // Lage der Mittenwellenlänge 589 nm
  const PW = PX1 - PX0;

  const LAMBDA0 = 589;      // nm, Mitte des Ausschnitts
  const WIN_MAX = 300;      // nm, Ausschnitt bei Zoomstufe 0
  const H = 68;             // Kurvenhöhe pro Panel

  const INK = "#1b2330";
  const AX = "#3a4356";
  const MUTED = "#5c6678";

  // FWHM-Werte als Größenordnungen: Glühlampe sichtbarer Bereich,
  // LED-Halbwertsbreite, Doppler-Breite einer Na-Linie, einzelne Lasermode.
  const SOURCES = [
    { name: "Glühlampe", dl: "Δ*λ* ≈ 300 nm", center: 950, fwhm: 900, base: 140, fill: "#f2a65a", stroke: "#b9611f" },
    { name: "Leuchtdiode", dl: "Δ*λ* ≈ 30 nm", center: LAMBDA0, fwhm: 30, base: 240, fill: "#8ab8f0", stroke: "#2563eb" },
    { name: "Spektrallampe", dl: "Δ*λ* ≈ 0,002 nm", center: LAMBDA0, fwhm: 0.002, base: 340, fill: "#f3d36b", stroke: "#c79a1e" },
    { name: "Laser", dl: "Δ*λ* < 0,00001 nm", center: LAMBDA0, fwhm: 0.000001, base: 440, fill: "#e23b3b", stroke: "#b02525" }
  ];

  const GAUSS_TO_SIGMA = 2 * Math.sqrt(Math.log(2)); // FWHM = 2·√(ln 2)·σ für exp(-((λ−λc)/σ)²)

  function windowWidth(z) {
    return WIN_MAX * Math.pow(10, -z);
  }

  function fmtNm(w) {
    const v = Number(w.toPrecision(2));
    let s = String(v);
    if (s.includes("e")) {
      s = v.toFixed(Math.max(0, Math.ceil(-Math.log10(v)) + 1));
    }
    return s.replace(".", ",");
  }

  function arrowhead(parent, SRT, x, y, dir, color) {
    let p1, p2;
    if (dir === "r") { p1 = [x - 7, y - 4]; p2 = [x - 7, y + 4]; }
    else if (dir === "l") { p1 = [x + 7, y - 4]; p2 = [x + 7, y + 4]; }
    else { p1 = [x - 4, y + 7]; p2 = [x + 4, y + 7]; }
    SRT.el("line", { x1: p1[0], y1: p1[1], x2: x, y2: y, stroke: color, "stroke-width": 1.4 }, parent);
    SRT.el("line", { x1: p2[0], y1: p2[1], x2: x, y2: y, stroke: color, "stroke-width": 1.4 }, parent);
  }

  function widthArrow(parent, SRT, x1, x2, y, color) {
    SRT.el("line", { x1, y1: y, x2, y2: y, stroke: color, "stroke-width": 1.4 }, parent);
    arrowhead(parent, SRT, x1, y, "l", color);
    arrowhead(parent, SRT, x2, y, "r", color);
  }

  function drawPanel(parent, SRT, src, win) {
    const base = src.base;

    // Achsen
    SRT.el("line", { x1: PX0, y1: base, x2: PX1, y2: base, stroke: AX, "stroke-width": 1.4 }, parent);
    arrowhead(parent, SRT, PX1, base, "r", AX);
    SRT.el("line", { x1: PX0, y1: base, x2: PX0, y2: base - H - 16, stroke: AX, "stroke-width": 1.4 }, parent);
    arrowhead(parent, SRT, PX0, base - H - 16, "u", AX);
    SRT.addText(parent, PX0 - 16, base - H - 8, "I", "label", { fill: AX, "font-size": 14, "font-weight": "700", "font-style": "italic" });
    SRT.addText(parent, PX1 + 6, base + 5, "λ", "label", { fill: AX, "font-size": 14, "font-weight": "700", "font-style": "italic" });

    // Markierung der Mittenwellenlänge
    SRT.el("line", { x1: XC, y1: base, x2: XC, y2: base + 5, stroke: AX, "stroke-width": 1.2 }, parent);

    // Quellenname und Linienbreite
    SRT.addText(parent, 24, base - H + 8, src.name, "label", { fill: INK, "font-size": 15, "font-weight": "800" });
    SRT.addText(parent, 24, base - H + 30, src.dl, "label", { fill: MUTED, "font-size": 12.5, "font-weight": "600" });

    const sigma = src.fwhm / GAUSS_TO_SIGMA;
    const pxPerNm = PW / win;
    const fwhmPx = src.fwhm * pxPerNm;

    if (fwhmPx < 3 && src.center === LAMBDA0) {
      // Schmaler als die Zeichenauflösung: senkrechter Strich in voller Höhe
      SRT.el("line", { x1: XC, y1: base - 1, x2: XC, y2: base - H, stroke: src.stroke, "stroke-width": 2.8 }, parent);
      return;
    }

    // Kurve im aktuellen Ausschnitt abtasten, Höhe auf das Maximum im Ausschnitt normieren
    const step = Math.max(0.25, Math.min(2, fwhmPx / 24));
    const points = [];
    let vmax = 0;
    for (let x = PX0; x <= PX1 + 0.001; x += step) {
      const lambda = LAMBDA0 + ((x - XC) / PW) * win;
      const u = (lambda - src.center) / sigma;
      const v = Math.exp(-u * u);
      if (v > vmax) vmax = v;
      points.push([x, v]);
    }
    let d = `M${PX0} ${base} `;
    points.forEach(([x, v]) => {
      const y = base - (v / vmax) * H;
      d += `L${x.toFixed(1)} ${y.toFixed(1)} `;
    });
    d += `L${PX1} ${base} Z`;
    SRT.el("path", { d, fill: src.fill, "fill-opacity": 0.55, stroke: src.stroke, "stroke-width": 2 }, parent);

    // Breiten-Pfeil auf halber Höhe, sobald die Breite im Ausschnitt sichtbar ist
    if (src.center === LAMBDA0 && fwhmPx >= 3 && fwhmPx <= 0.85 * PW) {
      widthArrow(parent, SRT, XC - fwhmPx / 2, XC + fwhmPx / 2, base - H / 2, INK);
    }
  }

  function message(z) {
    if (z < 1.5) return "Spektrallampe und Laser sehen hier gleich aus: zwei schmale Striche.";
    if (z < 2.85) return "Glühlampe und Leuchtdiode ändern sich in diesem Ausschnitt kaum noch.";
    if (z < 5.3) return "Die Linie der Spektrallampe zeigt jetzt ihre Breite. Der Laser bleibt ein Strich.";
    return "Die Spektrallampe füllt den Ausschnitt. Die Lasermode bleibt ein schmaler Strich.";
  }

  window.SRTSlide.register("laser-spektren-zoom", {
    showMotionControl: false,
    initialState: { z: 0 },
    controls: [
      {
        type: "range",
        key: "z",
        min: 0,
        max: 6,
        step: 0.02,
        label: "Zoom",
        ariaLabel: "Zoomstufe: Breite des dargestellten Wellenlängenbereichs",
        format: (value) => `Ausschnitt ${fmtNm(windowWidth(Number(value)))} nm`
      }
    ],
    render: ({ parent, state, SRT }) => {
      SRT.clear(parent);
      const win = windowWidth(Number(state.z) || 0);

      SRT.el("rect", { x: 0, y: 0, width: W, height: VH, rx: 14, fill: "#ffffff", stroke: "#e2e7ef" }, parent);
      SRT.addText(parent, 24, 32, "Vier Lichtquellen im gleichen Ausschnitt", "label", { fill: INK, "font-size": 16, "font-weight": "800" });
      SRT.addText(parent, PX1, 32, "Intensität je Quelle auf gleiche Höhe normiert", "label", { fill: MUTED, "font-size": 12, "text-anchor": "end" });

      SOURCES.forEach((src) => drawPanel(parent, SRT, src, win));

      SRT.addText(parent, XC, 462, "589 nm", "label", { fill: AX, "font-size": 12, "font-weight": "700", "text-anchor": "middle" });
      SRT.addText(parent, XC, 496, message(Number(state.z) || 0), "label", { fill: INK, "font-size": 14, "font-weight": "700", "text-anchor": "middle" });
    }
  });
})();
