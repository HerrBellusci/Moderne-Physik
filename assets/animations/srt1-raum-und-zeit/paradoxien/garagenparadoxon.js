(function () {
  "use strict";
  const SRT = window.SRTSlide;
  if (!SRT) return;

  // Orte in Metern, Zeiten in Nanosekunden. S ist das Garagensystem.
  const MODEL = Object.freeze({ c: 0.3, beta: 0.8, garageLength: 4, carLength: 5, closedFor: 1 });
  const V = MODEL.beta * MODEL.c;
  const GAMMA = 1 / Math.sqrt(1 - MODEL.beta ** 2);
  const EMISSION = Object.freeze({ x: 0, t: -MODEL.garageLength / (2 * MODEL.c) });
  const DOORS = Object.freeze([
    { id: "entry", label: "Einfahrt", x: -MODEL.garageLength / 2 },
    { id: "exit", label: "Ausfahrt", x: MODEL.garageLength / 2 }
  ]);
  const W = 640, H = 390, SCALE = 32, ROAD_Y = 238, ROOF_Y = 140;
  const CAR_OFFSET_Y = 110;
  const COLOR = Object.freeze({ ink: "#243447", muted: "#637281", car: "#326ca8", carFill: "#dce9f5", frame: "#7e909e", shut: "#b84e45", teal: "#0b8793", light: "#b67b12", continuation: "#b29b6c" });
  const instances = new WeakMap();

  function transformEvent(event, view) {
    if (view === "garage") return { x: event.x, t: event.t };
    return { x: GAMMA * (event.x - V * event.t), t: GAMMA * (event.t - V * event.x / MODEL.c ** 2) };
  }

  function timeRange(view) {
    return view === "garage" ? [-15, 15] : [-16, 16];
  }

  function modelAt(view, time) {
    const garageView = view === "garage";
    const doors = DOORS.map((door) => {
      const close = transformEvent({ x: door.x, t: 0 }, view);
      const open = transformEvent({ x: door.x, t: MODEL.closedFor }, view);
      return {
        ...door,
        x: garageView ? door.x : door.x / GAMMA - V * time,
        closeTime: close.t,
        openTime: open.t,
        closed: time >= close.t - 1e-9 && time < open.t - 1e-9
      };
    });
    return {
      view, time, doors,
      carCenter: garageView ? V * time : 0,
      carLength: garageView ? MODEL.carLength / GAMMA : MODEL.carLength,
      garageCenter: garageView ? 0 : -V * time,
      garageLength: garageView ? MODEL.garageLength : MODEL.garageLength / GAMMA
    };
  }

  // Ein fester Ausschnitt für beide Systeme, mit und ohne Lichthilfe.
  // Er hält auch die Vergleichskreise bis zum Ende im Bild.
  function xPixel(x) { return 248 + SCALE * x; }
  function lightAt(model) {
    const emission = transformEvent(EMISSION, model.view);
    return {
      emission,
      pulses: model.doors.map((door, index) => ({
        door: door.id,
        x: emission.x + (index === 0 ? -1 : 1) * MODEL.c * (model.time - emission.t),
        hitX: emission.x + (index === 0 ? -1 : 1) * MODEL.c * (door.closeTime - emission.t),
        visible: model.time >= emission.t - 1e-9,
        active: model.time >= emission.t - 1e-9 && model.time < door.closeTime - 1e-9,
        continued: model.time >= door.closeTime - 1e-9
      }))
    };
  }
  function fmt(x, digits = 1) {
    const value = Math.abs(x) < 0.5 * 10 ** -digits ? 0 : x;
    return value.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  function text(parent, x, y, value, options = {}) {
    const node = SRT.el("text", {
      x, y, fill: COLOR.ink, "font-size": 25, "font-weight": 400,
      "text-anchor": "middle", ...options
    }, parent);
    node.textContent = value;
    return node;
  }
  function line(parent, x1, y1, x2, y2, color, width = 2, extra = {}) {
    return SRT.el("line", { x1, y1, x2, y2, stroke: color, "stroke-width": width, ...extra }, parent);
  }
  function arrow(parent, cx, y, direction, color) {
    const x1 = cx - direction * 28, x2 = cx + direction * 28;
    line(parent, x1, y, x2, y, color, 3, { "stroke-linecap": "round" });
    SRT.el("path", { d: `M ${x2 - direction * 9} ${y - 5} L ${x2} ${y} L ${x2 - direction * 9} ${y + 5}`, fill: "none", stroke: color, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, parent);
  }
  function drawCar(parent, model) {
    const left = xPixel(model.carCenter - model.carLength / 2), width = xPixel(model.carCenter + model.carLength / 2) - left;
    const car = SRT.el("g", { "data-garage-car": "", "data-length": model.carLength }, parent);
    SRT.el("path", { d: `M ${left + width * .20} 204 L ${left + width * .34} 180 L ${left + width * .63} 180 L ${left + width * .81} 204 Z`, fill: COLOR.carFill, stroke: COLOR.car, "stroke-width": 2.8, "stroke-linejoin": "round" }, car);
    line(car, left + width * .50, 181, left + width * .50, 203, COLOR.car, 2);
    SRT.el("rect", { x: left, y: 201, width, height: 34, rx: 8, fill: COLOR.carFill, stroke: COLOR.car, "stroke-width": 2.8 }, car);
    [.20, .80].forEach((ratio) => {
      SRT.el("circle", { cx: left + width * ratio, cy: ROAD_Y, r: 9, fill: COLOR.ink }, car);
      SRT.el("circle", { cx: left + width * ratio, cy: ROAD_Y, r: 3, fill: "#fff" }, car);
    });
    if (model.view === "garage") arrow(car, xPixel(model.carCenter), 218, 1, COLOR.car);
  }
  function drawGarage(parent, model) {
    const left = xPixel(model.doors[0].x), right = xPixel(model.doors[1].x);
    const center = (left + right) / 2;
    const roof = SRT.el("g", { "data-garage-frame": "", "data-length": model.garageLength }, parent);
    line(roof, left - 4, ROOF_Y, right + 4, ROOF_Y, COLOR.frame, 5, { "stroke-linecap": "round" });
    line(roof, left, ROOF_Y + 5, left, ROAD_Y + CAR_OFFSET_Y, "#cbd5dd", 1.5, { "stroke-dasharray": "4 6" });
    line(roof, right, ROOF_Y + 5, right, ROAD_Y + CAR_OFFSET_Y, "#cbd5dd", 1.5, { "stroke-dasharray": "4 6" });
    if (model.view === "auto") arrow(roof, center, 112, -1, COLOR.teal);
  }
  function drawDoors(parent, model, compact = false) {
    model.doors.forEach((door) => {
      const x = xPixel(door.x);
      const labelX = door.id === "entry" ? 110 : W - 110;
      text(parent, labelX, 55, door.label, { "font-size": compact ? 30 : 23 });
      line(parent, labelX, 67, x, ROOF_Y - 4, COLOR.frame, 1);
      const node = SRT.el("g", { "data-garage-door": door.id, "data-closed": String(door.closed), "data-position": door.x }, parent);
      if (door.closed) {
        line(node, x, ROOF_Y, x, ROAD_Y + CAR_OFFSET_Y, COLOR.shut, 7, { "stroke-linecap": "round" });
      } else {
        line(node, x - 12, ROOF_Y + 6, x + 12, ROOF_Y + 6, COLOR.frame, 5, { "stroke-linecap": "round" });
      }
    });
  }

  function drawLight(parent, model, compact) {
    const light = lightAt(model), sourceX = xPixel(model.garageCenter), y = 226;
    const group = SRT.el("g", { "data-garage-light": "" }, parent);
    const origin = xPixel(light.emission.x);
    if (model.time >= light.emission.t - 1e-9) {
      line(group, origin, y - 8, origin, 248, COLOR.muted, 1.7, { "stroke-dasharray": "4 4", "data-emission-position": light.emission.x });
      text(group, origin, 278, "Ort der Aussendung", { fill: COLOR.muted, "font-size": compact ? 30 : 23 });
      light.pulses.forEach((pulse) => {
        const endpoint = xPixel(pulse.continued ? pulse.hitX : pulse.x);
        line(group, origin, y, endpoint, y, COLOR.light, 2, { "stroke-dasharray": "5 4", "data-light-path": pulse.door });
        if (pulse.continued) {
          line(group, endpoint, y, xPixel(pulse.x), y, COLOR.continuation, 2, { "stroke-dasharray": "5 4", "data-light-continuation": pulse.door });
        }
      });
    }
    // Die Lampe folgt der Garage. Die Pulse starten dagegen am vergangenen
    // Aussendungsereignis und werden danach nicht mit der Quelle verschoben.
    const emitting = model.time >= light.emission.t && model.time < light.emission.t + .25;
    const lamp = SRT.el("g", { "data-light-source": "", "data-position": model.garageCenter, "data-emitting": String(emitting) }, group);
    line(lamp, sourceX, ROOF_Y, sourceX, 190, COLOR.frame, 2.5);
    SRT.el("circle", { cx: sourceX, cy: 206, r: 10, fill: emitting ? "#f6d77c" : "#fff", stroke: COLOR.light, "stroke-width": 2 }, lamp);
    SRT.el("path", { d: `M ${sourceX - 16} 197 L ${sourceX - 9} 187 L ${sourceX + 9} 187 L ${sourceX + 16} 197 Z`, fill: COLOR.frame, stroke: COLOR.frame, "stroke-width": 2, "stroke-linejoin": "round" }, lamp);
    line(lamp, sourceX, 216, sourceX, y, COLOR.frame, 1.5);
    light.pulses.forEach((pulse) => {
      if (!pulse.visible) return;
      const x = xPixel(pulse.x);
      SRT.el("circle", { cx: x, cy: y, r: 6, fill: pulse.continued ? "#fff" : COLOR.light, stroke: COLOR.light, "stroke-width": 2, "data-light-pulse": pulse.door, "data-position": pulse.x, "data-continued": String(pulse.continued) }, group);
    });
  }
  function makeElement(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  }
  function makeButton(className, value, action) {
    const button = makeElement("button", className, value);
    button.type = "button";
    button.addEventListener("click", action);
    return button;
  }

  function ensureControls(parent, state) {
    const host = parent.closest(".srt-workbook-stage");
    if (instances.has(host)) return instances.get(host);
    const ui = { host, state, playing: false, raf: 0, lastFrame: 0, visible: true };
    instances.set(host, ui);
    const redraw = () => host.dispatchEvent(new Event("srt-render"));
    if ("ResizeObserver" in window) {
      let width = host.clientWidth;
      const observer = new ResizeObserver(() => {
        if (host.clientWidth === width) return;
        width = host.clientWidth;
        redraw();
      });
      observer.observe(host);
    }
    const stop = () => {
      ui.playing = false;
      ui.lastFrame = 0;
      window.cancelAnimationFrame(ui.raf);
      ui.raf = 0;
    };
    const viewGroup = makeElement("div", "garage-views");
    viewGroup.setAttribute("role", "group");
    viewGroup.setAttribute("aria-label", "Bezugssystem");
    ui.viewButtons = [
      ["garage", "Garagensystem"], ["auto", "Autosystem"]
    ].map(([view, name]) => {
      const button = makeButton("", name, () => {
        if (state.view === view) return;
        stop();
        state.view = view;
        state.time = timeRange(view)[0];
        redraw();
      });
      button.dataset.view = view;
      viewGroup.append(button);
      return button;
    });
    const lengths = makeElement("div", "garage-lengths");
    ui.carLength = makeElement("span", "garage-length-car");
    ui.garageLength = makeElement("span");
    lengths.append(ui.carLength, ui.garageLength);
    host.prepend(viewGroup, lengths);

    const controls = makeElement("div", "garage-controls");
    const playRow = makeElement("div", "garage-play-row");
    ui.play = makeButton("garage-play", "Abspielen", () => {
      if (ui.playing) {
        stop();
        redraw();
        return;
      }
      if (state.time >= timeRange(state.view)[1]) state.time = timeRange(state.view)[0];
      ui.playing = true;
      ui.lastFrame = 0;
      redraw();
      ui.raf = window.requestAnimationFrame(frame);
    });
    const reset = makeButton("garage-reset", "Zurücksetzen", () => {
      stop();
      state.time = timeRange(state.view)[0];
      redraw();
    });
    playRow.append(reset, ui.play);

    const rangeLabel = makeElement("label", "garage-range");
    const rangeTitle = makeElement("span", "", "Ablauf");
    ui.range = makeElement("input");
    ui.range.type = "range";
    ui.range.min = "0";
    ui.range.max = "100";
    ui.range.step = "0.1";
    ui.range.addEventListener("input", () => {
      stop();
      const [min, max] = timeRange(state.view);
      state.time = min + Number(ui.range.value) / 100 * (max - min);
      redraw();
    });
    rangeLabel.append(rangeTitle, ui.range);
    controls.append(rangeLabel);

    controls.append(playRow);
    const lightToggle = makeElement("label", "garage-light-toggle");
    ui.light = makeElement("input");
    ui.light.type = "checkbox";
    ui.light.addEventListener("change", () => {
      state.light = ui.light.checked;
      redraw();
    });
    lightToggle.append(ui.light, makeElement("span", "", "Lichtwege einblenden"));
    controls.append(lightToggle);
    ui.lightText = makeElement("p", "garage-light-text", "Eine an der Garagenmitte befestigte Lichtquelle sendet gleichzeitig zwei Lichtpulse in entgegengesetzte Richtungen aus. Im Garagensystem ruht die Quelle. Im Autosystem bewegt sie sich mit der Garage nach links. Nach der Aussendung bewegen sich die Lichtpulse unabhängig von der Quelle weiter. Ihre Geschwindigkeit beträgt in beiden Bezugssystemen ");
    ui.lightText.append(makeElement("var", "", "c"), ". Sobald ein Puls ein Tor erreicht, schließt dieses.");
    ui.pathText = makeElement("p", "garage-light-text", "Die feste Markierung zeigt den Ort, an dem das Licht ausgesendet wurde. Nach dem Auftreffen zeigen hohle Kreise, wie sich das Licht ohne Hindernis weiter ausbreiten würde. Diese gedankliche Fortsetzung hilft dir, die zurückgelegten Wege zu vergleichen. Beide wachsen in gleichen Zeitspannen gleich stark.");
    controls.append(ui.lightText, ui.pathText);
    host.append(controls);

    // Eine Sekunde Abspielzeit entspricht 1,5 ns im gewählten System.
    // Keine Stopps einzelner Körper und keine Schleife mit Rücksprung.
    function frame(now) {
      if (!ui.playing) return;
      if (!ui.lastFrame) ui.lastFrame = now;
      const elapsed = Math.min(now - ui.lastFrame, 80);
      ui.lastFrame = now;
      state.time = Math.min(timeRange(state.view)[1], state.time + elapsed * .0015);
      if (state.time >= timeRange(state.view)[1]) {
        stop();
      }
      redraw();
      if (ui.playing) ui.raf = window.requestAnimationFrame(frame);
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && ui.playing) { stop(); redraw(); }
    });
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        ui.visible = entries[0].isIntersecting;
        if (!ui.visible && ui.playing) { stop(); redraw(); }
      }, { threshold: 0 });
      observer.observe(host);
    }
    return ui;
  }

  function updateControls(ui, model) {
    const { state } = ui;
    ui.viewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === state.view)));
    ui.play.textContent = ui.playing ? "Pause" : "Abspielen";
    ui.play.setAttribute("aria-pressed", String(ui.playing));
    ui.play.setAttribute("aria-label", ui.playing ? "Animation pausieren" : "Animation abspielen");
    const [min, max] = timeRange(state.view);
    const progress = (state.time - min) / (max - min) * 100;
    ui.range.value = progress;
    ui.range.setAttribute("aria-valuetext", `${fmt(progress, 0)} Prozent des Ablaufs`);
    ui.light.checked = state.light;
    ui.lightText.hidden = !state.light;
    ui.pathText.hidden = !state.light;
    ui.carLength.textContent = `Auto ${fmt(model.carLength, 0)} m`;
    ui.garageLength.textContent = `Garage ${fmt(model.garageLength, state.view === "garage" ? 0 : 1)} m`;
    const { host } = ui;
    host.dataset.garageView = state.view;
    host.dataset.garageTime = state.time;
    host.dataset.garagePlaying = ui.playing;
    host.dataset.garageLight = state.light;
    const lightDescription = state.light ? ` Eine Lampe ist an der Garagenmitte befestigt und ${state.view === "garage" ? "ruht in diesem System" : "bewegt sich mit der Garage nach links"}. Sie sendet gleichzeitig zwei Lichtpulse aus, die sich unabhängig von der Quelle mit derselben Lichtgeschwindigkeit bis zu ihrem jeweiligen Tor bewegen. Ab der Aussendung markiert eine feste Linie deren Ort. Gestrichelte Linien zeigen die Wege. Nach dem Auftreffen laufen hohle Kreise als gedankliche Fortsetzung ohne Hindernis weiter.` : "";
    host.querySelector("svg").setAttribute("aria-label", `${state.view === "garage" ? "Garagensystem" : "Autosystem"}, Ablauf ${fmt(progress, 0)} Prozent. Auto ${fmt(model.carLength, 1)} Meter, Garage ${fmt(model.garageLength, 1)} Meter. ${model.doors.map((door) => door.label + (door.closed ? " geschlossen" : " offen")).join(", ")}.${lightDescription}`);
  }

  function render({ parent, state }) {
    const ui = ensureControls(parent, state);
    const model = modelAt(state.view, state.time);
    const compact = ui.host.clientWidth < 360;
    const height = H;
    const svg = parent.ownerSVGElement;
    svg.setAttribute("viewBox", `0 0 ${W} ${height}`);
    svg.style.aspectRatio = `${W} / ${height}`;
    SRT.clear(parent);
    SRT.el("rect", { x: 0, y: 0, width: W, height, fill: "#fff" }, parent);
    const scene = parent;
    line(scene, 14, ROAD_Y + CAR_OFFSET_Y, W - 14, ROAD_Y + CAR_OFFSET_Y, "#d5dde4", 2);
    drawGarage(scene, model);
    const carLayer = SRT.el("g", { transform: `translate(0 ${CAR_OFFSET_Y})` }, scene);
    drawCar(carLayer, model);
    drawDoors(scene, model, compact);
    if (state.light) drawLight(scene, model, compact);
    updateControls(ui, model);
  }

  SRT.register("garagenparadoxon", {
    initialState: { view: "garage", time: -15, light: false },
    showMotionControl: false,
    render
  });
})();
