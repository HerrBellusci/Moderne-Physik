(function () {
  const W = 862;

  const MATH_FONT = "Cambria Math, STIX Two Math, Latin Modern Math, Times New Roman, serif";
  const INK = "#172033", MUTED = "#5c6678";
  const WAVE = "#6d5dfc", SRC = "#e0a93b", GREEN = "#2e7d50";

  function text(parent, SRT, x, y, value, color, size, anchor, family) {
    return SRT.addText(parent, x, y, value, "tiny", {
      "text-anchor": anchor || "middle", fill: color,
      "font-size": size || 13, "font-weight": "800",
      "font-family": family || "inherit"
    });
  }

  function math(parent, SRT, x, y, value, color, size) {
    return text(parent, SRT, x, y, value, color, size || 15, "middle", MATH_FONT);
  }

  // Wellenberg als nach rechts geöffneter Bogen ")".
  function crest(parent, SRT, x, y, h, color) {
    SRT.el("path", { d: `M ${x},${y - h} Q ${x + 13},${y} ${x},${y + h}`,
      fill: "none", stroke: color, "stroke-width": 3, "stroke-linecap": "round" }, parent);
  }

  function source(parent, SRT, x, y) {
    SRT.el("circle", { cx: x, cy: y, r: 7, fill: SRC, stroke: "#ffffff", "stroke-width": 2 }, parent);
  }

  // Doppelpfeil mit Beschriftung darüber (für Wellenlängen).
  function span(parent, SRT, x1, x2, y, value, color) {
    if (x2 - x1 < 26) return;
    SRT.el("line", { x1: x1 + 8, y1: y, x2: x2 - 8, y2: y, stroke: color, "stroke-width": 1.8 }, parent);
    SRT.el("polygon", { points: `${x1},${y} ${x1 + 9},${y - 5} ${x1 + 9},${y + 5}`, fill: color }, parent);
    SRT.el("polygon", { points: `${x2},${y} ${x2 - 9},${y - 5} ${x2 - 9},${y + 5}`, fill: color }, parent);
    math(parent, SRT, (x1 + x2) / 2, y - 9, value, color);
  }

  function vArrow(parent, SRT, x1, x2, y, color) {
    SRT.el("line", { x1, y1: y, x2: x2 - 9, y2: y, stroke: color, "stroke-width": 2.6, "stroke-linecap": "round" }, parent);
    SRT.el("polygon", { points: `${x2},${y} ${x2 - 11},${y - 6} ${x2 - 11},${y + 6}`, fill: color }, parent);
  }

  // Unterklammer mit Beschriftung darunter.
  function underbrace(parent, SRT, x1, x2, y, value, color) {
    if (x2 - x1 < 16) return;
    const mid = (x1 + x2) / 2;
    SRT.el("path", {
      d: `M ${x1},${y} L ${x1},${y + 5} L ${mid - 7},${y + 5} L ${mid},${y + 11} L ${mid + 7},${y + 5} L ${x2},${y + 5} L ${x2},${y}`,
      fill: "none", stroke: color, "stroke-width": 1.6, "stroke-linejoin": "round" }, parent);
    math(parent, SRT, mid, y + 27, value, color);
  }

  function observer(parent, SRT, x, y) {
    SRT.el("circle", { cx: x, cy: y, r: 7, fill: INK }, parent);
    text(parent, SRT, x, y + 26, "Beobachter", INK, 12);
  }

  function bg(parent, SRT, h) {
    SRT.el("rect", { x: 0, y: 0, width: W, height: h, rx: 18, fill: "#f7f9fb" }, parent);
  }

  // ================================================================
  // Bezugssystem der Quelle: zwei Berge im Abstand lambda_0 (statisch)
  // ================================================================
  function renderQuelle({ parent, SRT }) {
    SRT.clear(parent);
    bg(parent, SRT, 200);
    text(parent, SRT, 60, 40, "Bezugssystem der Quelle", MUTED, 14, "start");
    const y = 120;
    source(parent, SRT, 220, y);
    math(parent, SRT, 220, y + 28, "S", MUTED, 15);
    crest(parent, SRT, 300, y, 20, WAVE);
    crest(parent, SRT, 450, y, 20, WAVE);
    span(parent, SRT, 312, 450, y, "*λ*₀", INK);
    observer(parent, SRT, 720, y);
  }

  // ================================================================
  // Bezugssystem des Beobachters: statische Skizze nach einer Periode.
  // ================================================================
  const X1 = 220;          // Punkt 1: Aussendung von Berg 1 (fest)
  const X2_END = 340;      // Quelle nach einer Periode (v·Δt weiter)
  const XC_END = 580;      // Berg 1 nach einer Periode (c·Δt vorgelaufen)

  function renderBeobachter({ parent, SRT }) {
    const p = 1;
    const y = 128;
    const xs = X1 + p * (X2_END - X1);   // Quelle / Aussendeort von Berg 2
    const xb1 = X1 + p * (XC_END - X1);  // vorlaufender Berg 1

    SRT.clear(parent);
    bg(parent, SRT, 250);
    text(parent, SRT, 60, 40, "Bezugssystem des Beobachters", MUTED, 14, "start");

    // Geschwindigkeitspfeil der Quelle: von Punkt 1 in Richtung Punkt 2.
    vArrow(parent, SRT, X1, xs - 12, y, GREEN);
    math(parent, SRT, (X1 + xs) / 2, y - 12, "v", GREEN, 15);

    // Punkt 1: Ort, an dem Berg 1 ausgesendet wurde (fest)
    SRT.el("circle", { cx: X1, cy: y, r: 4, fill: MUTED }, parent);
    math(parent, SRT, X1, y - 32, "1", MUTED, 14);

    // Berg 1, vorgelaufen
    crest(parent, SRT, xb1, y, 20, WAVE);

    // Quelle (Punkt 2), sendet Berg 2 aus
    crest(parent, SRT, xs + 6, y, 20, WAVE);
    source(parent, SRT, xs, y);
    math(parent, SRT, xs, y - 32, "2", INK, 14);
    math(parent, SRT, xs, y + 26, "S", INK, 15);

    // beobachtete Wellenlänge zwischen Berg 2 (an der Quelle) und Berg 1
    span(parent, SRT, xs + 14, xb1, y, "λ", INK);

    observer(parent, SRT, 730, y);

    // Maße: v·Δt (Punkt 1 -> Quelle) und c·Δt (Punkt 1 -> Berg 1)
    underbrace(parent, SRT, X1, xs, y + 44, "*v*·Δ*t*", GREEN);
    underbrace(parent, SRT, X1, xb1, y + 80, "*c*·Δ*t*", WAVE);
  }

  window.SRTSlide.register("doppler-bzg-quelle", {
    render: renderQuelle,
    showMotionControl: false
  });

  window.SRTSlide.register("doppler-bzg-beobachter", {
    render: renderBeobachter,
    showMotionControl: false
  });

  // ================================================================
  // Bezugssystem des Beobachters: Quelle entfernt sich (Rotverschiebung).
  // Die Quelle rückt vom Beobachter weg (nach links); die Wellenfronten
  // liegen dadurch weiter auseinander: λ = c·Δt + v·Δt > λ₀.
  // ================================================================
  function renderBeobachterEntfernt({ parent, SRT }) {
    const y = 130;
    const xP1 = 360;          // Punkt 1: Aussendung von Berg 1 (frühere Position der Quelle)
    const xs = xP1 - 110;     // Quelle nach einer Periode (v·Δt vom Beobachter weg, nach links)
    const xb1 = xP1 + 330;    // Berg 1 nach einer Periode (c·Δt zum Beobachter vorgelaufen)
    const yLam = y - 48;

    SRT.clear(parent);
    bg(parent, SRT, 250);
    text(parent, SRT, 60, 40, "Bezugssystem des Beobachters", MUTED, 14, "start");

    // Geschwindigkeitspfeil der Quelle: vom Beobachter weg (nach links).
    SRT.el("line", { x1: xP1, y1: y, x2: xs + 9, y2: y, stroke: GREEN, "stroke-width": 2.6, "stroke-linecap": "round" }, parent);
    SRT.el("polygon", { points: `${xs},${y} ${xs + 11},${y - 6} ${xs + 11},${y + 6}`, fill: GREEN }, parent);
    math(parent, SRT, (xP1 + xs) / 2, y - 12, "v", GREEN, 15);

    // Punkt 1: Ort, an dem Berg 1 ausgesendet wurde (fest)
    SRT.el("circle", { cx: xP1, cy: y, r: 4, fill: MUTED }, parent);
    math(parent, SRT, xP1, y + 26, "1", MUTED, 14);

    // Berg 1, zum Beobachter vorgelaufen
    crest(parent, SRT, xb1, y, 20, WAVE);

    // Quelle (Punkt 2), sendet Berg 2 aus
    crest(parent, SRT, xs + 6, y, 20, WAVE);
    source(parent, SRT, xs, y);
    math(parent, SRT, xs, y - 30, "2", INK, 14);
    math(parent, SRT, xs, y + 26, "S", INK, 15);

    // beobachtete Wellenlänge zwischen Berg 2 und Berg 1 (oben, mit Hilfslinien)
    SRT.el("line", { x1: xs + 6, y1: y - 20, x2: xs + 6, y2: yLam, stroke: "#c5ccd6", "stroke-width": 1, "stroke-dasharray": "3 3" }, parent);
    SRT.el("line", { x1: xb1, y1: y - 20, x2: xb1, y2: yLam, stroke: "#c5ccd6", "stroke-width": 1, "stroke-dasharray": "3 3" }, parent);
    span(parent, SRT, xs + 6, xb1, yLam, "λ", INK);

    observer(parent, SRT, 770, y);

    // Maße: v·Δt (Quelle -> Punkt 1) und c·Δt (Punkt 1 -> Berg 1)
    underbrace(parent, SRT, xs, xP1, y + 44, "*v*·Δ*t*", GREEN);
    underbrace(parent, SRT, xP1, xb1, y + 80, "*c*·Δ*t*", WAVE);
  }

  window.SRTSlide.register("doppler-bzg-beobachter-entfernt", {
    render: renderBeobachterEntfernt,
    showMotionControl: false
  });
})();
