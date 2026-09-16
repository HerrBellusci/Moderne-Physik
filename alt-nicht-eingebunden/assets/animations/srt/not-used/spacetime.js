(function () {
  const W = 862, H = 506;
  const O = { x: 330, y: 364 };

  let stage = 1;

  function ensureInteractive(host) {
    if (host.__spacetimeInit) return;
    host.__spacetimeInit = true;

    host.addEventListener("pointerdown", (e) => {
      const role = e.target && e.target.getAttribute && e.target.getAttribute("data-role");
      if (role === "stage1") { e.stopPropagation(); stage = 1; }
      if (role === "stage2") { e.stopPropagation(); stage = 2; }
      if (role === "stage3") { e.stopPropagation(); stage = 3; }
      if (role === "stage4") { e.stopPropagation(); stage = 4; }
    });
  }

  window.SRTSlide.register("spacetime", ({ parent, SRT }) => {
    SRT.clear(parent);
    ensureInteractive(parent);

    SRT.el("rect", { x: 0, y: 0, width: W, height: H, rx: 18, fill: "#f7f9fb" }, parent);
    drawStageButtons(parent, SRT, stage);
    drawGrid(parent, SRT);
    drawAxes(parent, SRT);

    if (stage >= 2) drawEvent(parent, SRT);
    if (stage >= 3) drawLightLimit(parent, SRT);
    if (stage >= 4) drawReachability(parent, SRT);

    drawCaption(parent, SRT, stage);
  });

  function drawStageButtons(parent, SRT, current) {
    const items = [
      { label: "1 · Karte", color: "#172033", role: "stage1" },
      { label: "2 · Ereignis", color: "#516173", role: "stage2" },
      { label: "3 · Licht", color: "#d9941e", role: "stage3" },
      { label: "4 · Grenze", color: "#c2414b", role: "stage4" }
    ];
    const w = 150, h = 36, gap = 12;
    const total = items.length * w + (items.length - 1) * gap;
    const startX = (W - total) / 2;
    items.forEach((it, i) => {
      const x = startX + i * (w + gap);
      const active = current === i + 1;
      const g = SRT.el("g", { "data-role": it.role, style: "cursor:pointer" }, parent);
      SRT.el("rect", {
        x, y: 14, width: w, height: h, rx: 9,
        fill: active ? it.color : "#ffffff",
        stroke: it.color, "stroke-width": active ? 2.5 : 1.5,
        "data-role": it.role
      }, g);
      SRT.addText(g, x + w / 2, 38, it.label, "label", {
        "text-anchor": "middle", fill: active ? "#ffffff" : it.color,
        "font-size": 14, "font-weight": "900", "pointer-events": "none"
      });
    });
  }

  function drawGrid(parent, SRT) {
    SRT.el("rect", { x: 54, y: 64, width: 754, height: 370, rx: 16,
      fill: "#ffffff", stroke: "rgba(23,32,51,0.12)" }, parent);
    for (let x = 96; x <= 764; x += 56) {
      SRT.el("line", { x1: x, y1: 80, x2: x, y2: 420, stroke: "#e3e8ef", "stroke-width": 1 }, parent);
    }
    for (let y = 96; y <= 416; y += 56) {
      SRT.el("line", { x1: 78, y1: y, x2: 790, y2: y, stroke: "#e3e8ef", "stroke-width": 1 }, parent);
    }
  }

  function drawAxes(parent, SRT) {
    drawArrow(parent, SRT, O.x, O.y, 770, O.y, "#172033");
    drawArrow(parent, SRT, O.x, O.y, O.x, 78, "#172033");
    SRT.addText(parent, 782, O.y + 6, "Ort x", "label", {
      fill: "#172033", "font-size": 17, "font-weight": "900"
    });
    SRT.addText(parent, O.x - 12, 76, "Zeit", "label", {
      fill: "#172033", "font-size": 17, "font-weight": "900", "text-anchor": "end"
    });
    SRT.addText(parent, O.x - 12, 96, "ct", "label", {
      fill: "#5c6678", "font-size": 12, "font-weight": "800", "text-anchor": "end"
    });
    SRT.addText(parent, O.x + 8, O.y + 18, "hier und jetzt", "label", {
      fill: "#5c6678", "font-size": 12, "font-weight": "800"
    });
  }

  function drawEvent(parent, SRT) {
    const ex = O.x + 190;
    const ey = O.y - 150;
    SRT.el("line", { x1: ex, y1: ey, x2: ex, y2: O.y,
      stroke: "#516173", "stroke-width": 1.5, "stroke-dasharray": "5 6", opacity: 0.45 }, parent);
    SRT.el("line", { x1: O.x, y1: ey, x2: ex, y2: ey,
      stroke: "#516173", "stroke-width": 1.5, "stroke-dasharray": "5 6", opacity: 0.45 }, parent);
    SRT.el("circle", { cx: ex, cy: ey, r: 14, fill: "#516173", stroke: "#ffffff", "stroke-width": 4 }, parent);
    SRT.addText(parent, ex + 22, ey - 4, "Ereignis", "label", {
      fill: "#516173", "font-size": 16, "font-weight": "900"
    });
    SRT.addText(parent, ex + 22, ey + 14, "ein Ort, eine Zeit", "label", {
      fill: "#5c6678", "font-size": 12, "font-weight": "800"
    });
  }

  function drawLightLimit(parent, SRT) {
    const len = 250;
    SRT.el("polygon", {
      points: `${O.x},${O.y} ${O.x + len},${O.y - len} ${O.x - len},${O.y - len}`,
      fill: "rgba(217,148,30,0.09)"
    }, parent);
    drawLightLine(parent, SRT, O.x, O.y, O.x + len, O.y - len);
    drawLightLine(parent, SRT, O.x, O.y, O.x - len, O.y - len);
    SRT.addText(parent, O.x + len + 8, O.y - len + 5, "Licht", "label", {
      fill: "#d9941e", "font-size": 15, "font-weight": "900"
    });
    SRT.addText(parent, O.x + 132, O.y - 118, "45° nur, weil Zeit als ct skaliert ist", "label", {
      fill: "#8b6a2b", "font-size": 12, "font-weight": "800"
    });
  }

  function drawReachability(parent, SRT) {
    const reachable = { x: O.x + 94, y: O.y - 176 };
    const unreachable = { x: O.x + 260, y: O.y - 126 };

    drawSignal(parent, SRT, reachable, "#2e7d50", "möglich");
    drawSignal(parent, SRT, unreachable, "#c2414b", "nur schneller als Licht");
  }

  function drawSignal(parent, SRT, point, color, label) {
    SRT.el("line", { x1: O.x, y1: O.y, x2: point.x, y2: point.y,
      stroke: color, "stroke-width": 3, "stroke-linecap": "round", opacity: 0.85 }, parent);
    SRT.el("circle", { cx: point.x, cy: point.y, r: 12, fill: color, stroke: "#ffffff", "stroke-width": 4 }, parent);
    SRT.addText(parent, point.x + 18, point.y + 5, label, "label", {
      fill: color, "font-size": 13, "font-weight": "900"
    });
  }

  function drawCaption(parent, SRT, current) {
    const captions = {
      1: "Raumzeit-Bild: waagrecht Ort, senkrecht Zeit. ct heißt: Zeit in Licht-Einheiten.",
      2: "Ein Ereignis ist einfach: an diesem Ort, zu diesem Zeitpunkt passiert etwas.",
      3: "Licht läuft in diesem Maßstab bei 45°. Deshalb ist diese Linie die schnellste Signalgrenze.",
      4: "Innerhalb der Lichtgrenze ist ein Signal möglich. Außerhalb bräuchte man schneller als Licht."
    };
    SRT.el("rect", { x: 92, y: 444, width: 678, height: 34, rx: 12, fill: "#172033" }, parent);
    SRT.addText(parent, 431, 466, captions[current], "label", {
      "text-anchor": "middle", fill: "#ffffff", "font-size": 13, "font-weight": "850"
    });
  }

  function drawLightLine(parent, SRT, x1, y1, x2, y2) {
    SRT.el("line", { x1, y1, x2, y2,
      stroke: "#d9941e", "stroke-width": 3, "stroke-dasharray": "9 8",
      "stroke-linecap": "round", opacity: 0.9 }, parent);
  }

  function drawArrow(parent, SRT, x1, y1, x2, y2, color) {
    SRT.el("line", { x1, y1, x2, y2, stroke: color, "stroke-width": 4.2, "stroke-linecap": "round" }, parent);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const len = 13;
    const a1 = angle + Math.PI * 0.82;
    const a2 = angle - Math.PI * 0.82;
    SRT.el("polygon", {
      points: `${x2},${y2} ${x2 + Math.cos(a1) * len},${y2 + Math.sin(a1) * len} ${x2 + Math.cos(a2) * len},${y2 + Math.sin(a2) * len}`,
      fill: color
    }, parent);
  }
})();
