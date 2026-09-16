(function () {
  "use strict";
  const SRT = window.SRTSlide;
  if (!SRT) return;

  const LAYOUT = {
    regular: { width: 640, height: 396, scale: 30, stationOrigin: 185, shipOrigin: 320, rowHeight: 198, clockRadius: 12, labelFont: 24 },
    compact: { width: 480, height: 428, scale: 22, stationOrigin: 130, shipOrigin: 240, rowHeight: 214, clockRadius: 14, labelFont: 26 }
  };
  const DISTANCE = 9, BETA = 0.6, GAMMA = 1 / Math.sqrt(1 - BETA ** 2);
  const COLOR = { ink: "#243447", muted: "#687b8c", line: "#d6dfe6", ship: "#247a86", event: "#a74d26" };
  const instances = new WeakMap();

  // Entfernungen in Lichtminuten. Beide Ansichten verwenden denselben
  // Ortsmaßstab. Das Raumschiffsymbol kennzeichnet nur seine Spitze.
  function snapshot(view, event) {
    const stationView = view === "stations";
    const separation = stationView ? DISTANCE : DISTANCE / GAMMA;
    const stationA = stationView || event === 1 ? 0 : -separation;
    return {
      event, separation,
      stationA,
      stationB: stationA + separation,
      tip: stationView && event === 2 ? DISTANCE : 0
    };
  }

  const px = (view, x, layout) => (view === "stations" ? layout.stationOrigin : layout.shipOrigin) + layout.scale * x;
  const line = (parent, x1, y1, x2, y2, extra = {}) => SRT.el("line", {
    x1, y1, x2, y2, stroke: COLOR.line, "stroke-width": 2, ...extra
  }, parent);
  const text = (parent, x, y, value, extra = {}) => SRT.addText(parent, x, y, value, "label", {
    "font-size": 27, "font-weight": 400, fill: COLOR.ink, "text-anchor": "middle", ...extra
  });

  function arrow(parent, center, y, direction, color) {
    const start = center - direction * 22, end = center + direction * 22;
    line(parent, start, y, end, y, { stroke: color, "stroke-width": 2.8 });
    SRT.el("path", { d: `M ${end - direction * 8} ${y - 5} L ${end} ${y} L ${end - direction * 8} ${y + 5}`, fill: "none", stroke: color, "stroke-width": 2.8 }, parent);
  }

  function clock(parent, x, y, color, layout, attributes = {}) {
    const group = SRT.el("g", attributes, parent);
    SRT.el("circle", { cx: x, cy: y, r: layout.clockRadius, fill: "#fff", stroke: color, "stroke-width": 2.5 }, group);
    // Piktogramme markieren Messorte, keine konkreten Uhrzeiten.
    // Die Bildunterschrift grenzt die Symbole von Zeitangaben ab.
    SRT.el("path", {
      d: `M ${x} ${y - layout.clockRadius * 0.6} V ${y} L ${x + layout.clockRadius * 0.45} ${y + layout.clockRadius * 0.25}`,
      fill: "none", stroke: color, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round"
    }, group);
  }

  function station(parent, view, name, position, layout) {
    const x = px(view, position, layout);
    const group = SRT.el("g", { "data-raumfahrt-station": name, "data-position": position }, parent);
    text(group, x, 62, name, { "font-size": layout.labelFont });
    clock(group, x, 91, COLOR.muted, layout);
    line(group, x, 104, x, 126, { stroke: COLOR.muted });
    line(group, x - 9, 126, x + 9, 126, { stroke: COLOR.muted, "stroke-width": 2.5 });
    if (view === "ship") arrow(group, x - 40, 90, -1, COLOR.muted);
  }

  function spaceship(parent, view, position, layout) {
    const tip = px(view, position, layout);
    const group = SRT.el("g", { "data-raumfahrt-tip": "", "data-position": position }, parent);
    // Ein Symbol ohne Längenangabe, kein maßstäblicher Raumschiffkörper.
    SRT.el("path", {
      d: `M ${tip - 68} 104 L ${tip - 24} 104 L ${tip} 115 L ${tip - 24} 126 L ${tip - 68} 126 L ${tip - 57} 115 Z`,
      fill: "#e2f0f1", stroke: COLOR.ship, "stroke-width": 2.5, "stroke-linejoin": "round"
    }, group);
    SRT.el("circle", { cx: tip - 29, cy: 115, r: 5, fill: "#fff", stroke: COLOR.ship, "stroke-width": 1.5 }, group);
    line(group, tip, 126, tip, 132, { stroke: COLOR.ship });
    clock(group, tip, 145, COLOR.ship, layout, { "data-raumfahrt-board-clock": "", "data-position": position });
    if (view === "stations") arrow(group, tip - 42, 82, 1, COLOR.ship);
  }

  function drawRow(parent, view, event, offset, layout) {
    const model = snapshot(view, event);
    const row = SRT.el("g", { transform: `translate(0 ${offset - 22})`, "data-raumfahrt-event": event }, parent);
    line(row, 48, 126, layout.width - 49, 126, { stroke: "#e6ebef" });
    station(row, view, "A", model.stationA, layout);
    station(row, view, "B", model.stationB, layout);
    spaceship(row, view, model.tip, layout);
    const tip = px(view, model.tip, layout);
    SRT.el("circle", { cx: tip, cy: 115, r: 8, fill: "#fff", stroke: COLOR.event, "stroke-width": 3, "data-raumfahrt-event-point": event }, row);
    SRT.el("circle", { cx: tip, cy: 115, r: 2.5, fill: COLOR.event }, row);

    const a = px(view, model.stationA, layout), b = px(view, model.stationB, layout);
    line(row, a, 181, b, 181, { stroke: COLOR.muted, "stroke-width": 1.7 });
    [a, b].forEach((x) => line(row, x, 175, x, 187, { stroke: COLOR.muted, "stroke-width": 1.7 }));
    const midpoint = (a + b) / 2;
    if (view === "stations") {
      text(row, midpoint, 208, "9 Lichtminuten", { "font-size": layout.labelFont });
    } else {
      text(row, midpoint, 208, "L", { "font-size": layout.labelFont, "font-style": "italic" });
    }
  }

  function ensureControls(parent, state) {
    const host = parent.closest(".srt-workbook-stage");
    if (instances.has(host)) return instances.get(host);
    if ("ResizeObserver" in window) {
      let width = host.clientWidth;
      const observer = new window.ResizeObserver(() => {
        if (width === host.clientWidth) return;
        width = host.clientWidth;
        host.dispatchEvent(new Event("srt-render"));
      });
      observer.observe(host);
    }
    const group = document.createElement("div");
    group.className = "raumfahrt-views";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Bezugssystem der Skizze");
    const buttons = [["stations", "Stationssystem"], ["ship", "Raumschiffsystem"]].map(([view, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.view = view;
      button.addEventListener("click", () => {
        if (view === state.view) return;
        state.view = view;
        host.dispatchEvent(new Event("srt-render"));
      });
      group.append(button);
      return button;
    });
    const note = document.createElement("div");
    note.className = "raumfahrt-view-note";
    note.setAttribute("aria-live", "polite");
    host.prepend(group, note);
    const ui = { host, buttons, note };
    instances.set(host, ui);
    return ui;
  }

  function render({ parent, state }) {
    const ui = ensureControls(parent, state);
    const view = state.view === "ship" ? "ship" : "stations";
    const compact = ui.host.clientWidth > 0 && ui.host.clientWidth < 360;
    const layout = compact ? LAYOUT.compact : LAYOUT.regular;
    ui.buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === view)));
    const note = view === "stations" ? "Raumschiff bewegt sich nach rechts." : "Stationen bewegen sich nach links.";
    if (ui.note.textContent !== note) ui.note.textContent = note;
    ui.host.dataset.raumfahrtView = view;
    ui.host.dataset.raumfahrtLayout = compact ? "compact" : "regular";
    const svg = parent.ownerSVGElement;
    svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
    svg.style.aspectRatio = `${layout.width} / ${layout.height}`;
    svg.setAttribute("aria-label", view === "stations"
      ? "Stationssystem. Oben passiert die Spitze des Raumschiffs Station A, unten Station B. Der Stationsabstand beträgt neun Lichtminuten. Eine Borduhr befindet sich an der Spitze. Die Zeitangaben bleiben offen."
      : "Raumschiffsystem. Oben passiert Station A die Spitze des Raumschiffs, unten Station B. Die Borduhr bleibt an der Spitze. Der Stationsabstand und die Zeitangaben sind zu bestimmen.");
    SRT.clear(parent);
    SRT.el("rect", { width: layout.width, height: layout.height, fill: "#fff" }, parent);
    drawRow(parent, view, 1, 0, layout);
    line(parent, 24, layout.rowHeight, layout.width - 24, layout.rowHeight, { stroke: "#edf1f4" });
    drawRow(parent, view, 2, layout.rowHeight, layout);
  }

  SRT.register("raumfahrt-aufgabe", {
    initialState: { view: "stations" },
    showMotionControl: false,
    render
  });
})();
