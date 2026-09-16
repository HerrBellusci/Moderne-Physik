// Eigene, KI-gestützt entwickelte SVG-Darstellung. Keine externen Abhängigkeiten.
(function () {
  const SRT = window.SRTSlide;
  const C = { ink: '#243447', muted: '#607286', line: '#cbd5df', path: '#0b8793', light: '#f2ad25', pale: '#eaf5f5' };
  const PERIOD = 2600;
  const D = 112;
  const HOLD = 900;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const text = (p, x, y, value, extra = {}) => SRT.addText(p, x, y, value, 'label', {
    'font-size': 27, 'font-weight': 500, fill: C.ink, ...extra
  });
  const line = (p, x1, y1, x2, y2, extra = {}) => SRT.el('line', {
    x1, y1, x2, y2, stroke: C.line, 'stroke-width': 2, ...extra
  }, p);

  // Der Puls wird als Punkt modelliert. Spiegeloberflächen und Lichtweg
  // verwenden exakt dieselbe Entfernung D, auch im bewegten System.
  function clock(p, x, top, distance, count, flash, widthScale = 1) {
    const bottom = top + distance;
    const g = SRT.el('g', { 'data-lc-clock': '', 'data-lc-x': x }, p);
    const halfWidth = 49 * widthScale;
    for (const y of [top - 9, bottom]) {
      SRT.el('rect', { x: x - halfWidth, y, width: 2 * halfWidth, height: 9, rx: 3, fill: C.ink }, g);
    }
    // Quelle und Zähler sitzen am unteren Spiegel. Die Anzeige zählt
    // vollständige Rückkehrereignisse und keine Reflexion am oberen Spiegel.
    line(g, x, bottom + 9, x, bottom + 18, { stroke: C.ink });
    SRT.el('rect', { x: x - 38, y: bottom + 18, width: 76, height: 43, rx: 8,
      fill: flash ? C.pale : '#f3f6f8', stroke: flash ? C.path : C.line, 'stroke-width': 2 }, g);
    text(g, x, bottom + 49, String(count).padStart(2, '0'), {
      'text-anchor': 'middle', 'font-size': 30, 'font-weight': 600, 'data-lc-count': count
    });
    SRT.el('rect', { x: x - 7, y: bottom + 2, width: 14, height: 7, rx: 2, fill: C.path }, g);
    return g;
  }

  function pulse(p, x, y) {
    SRT.el('circle', { cx: x, cy: y, r: 11, fill: C.light, opacity: 0.2 }, p);
    SRT.el('circle', { cx: x, cy: y, r: 6.5, fill: C.light, stroke: '#885b0b', 'stroke-width': 1,
      'data-lc-pulse': '' }, p);
  }

  function distance(p, x, top, bottom) {
    line(p, x, top, x, bottom, { stroke: C.muted });
    line(p, x - 6, top, x + 6, top, { stroke: C.muted });
    line(p, x - 6, bottom, x + 6, bottom, { stroke: C.muted });
    text(p, x - 15, (top + bottom) / 2 + 9, '*D*', { 'text-anchor': 'end' });
  }

  function addUi(parent, state, adjustable) {
    const host = parent.ownerSVGElement.parentElement;
    if (host.__lcUi) return;
    host.__lcUi = true;
    const controls = document.createElement('div');
    controls.className = 'lc-controls';
    if (adjustable) {
      const label = document.createElement('label');
      label.className = 'lc-range';
      const name = document.createElement('span');
      name.textContent = 'Relativgeschwindigkeit';
      const value = document.createElement('output');
      value.className = 'lc-value';
      const updateValue = () => {
        value.replaceChildren();
        for (const [content, variable] of [['v', true], [' = ' + state.beta.toFixed(2).replace('.', ',') + ' ', false], ['c', true]]) {
          const part = document.createElement(variable ? 'i' : 'span');
          part.textContent = content;
          value.appendChild(part);
        }
      };
      const input = document.createElement('input');
      input.type = 'range'; input.min = '0'; input.max = '0.8'; input.step = '0.01'; input.value = state.beta;
      input.setAttribute('aria-label', 'Relativgeschwindigkeit des Zuges');
      input.addEventListener('input', () => {
        state.beta = Number(input.value);
        updateValue();
        input.setAttribute('aria-valuetext', `${state.beta.toFixed(2).replace('.', ',')} mal Lichtgeschwindigkeit`);
        host.dispatchEvent(new Event('srt-render'));
      });
      input.setAttribute('aria-valuetext', '0,58 mal Lichtgeschwindigkeit');
      updateValue();
      label.append(name, value, input);
      controls.append(label);
    }
    const reset = document.createElement('button');
    reset.type = 'button'; reset.className = 'lc-reset'; reset.textContent = 'Zurücksetzen';
    reset.addEventListener('click', () => {
      state.origin = 0;
      host.dispatchEvent(new Event('srt-reset'));
    });
    controls.append(reset);
    host.append(controls);
  }

  SRT.register('lightclock-build', {
    initialState: {},
    render({ parent, t, state }) {
      addUi(parent, state, false);
      SRT.clear(parent);
      const x = 272, top = 52, d = 150, bottom = top + d;
      const phase = (t % PERIOD) / PERIOD;
      const count = Math.floor(t / PERIOD);
      const y = bottom - 2 * d * (phase <= 0.5 ? phase : 1 - phase);
      line(parent, x, top, x, bottom, { stroke: C.path, 'stroke-width': 3, opacity: 0.4 });
      clock(parent, x, top, d, count, count > 0 && phase < 0.09);
      distance(parent, 177, top, bottom);
      pulse(parent, x, y);
      text(parent, 382, top + 8, 'Spiegel', { 'font-size': 23 });
      line(parent, x + 58, top - 3, 365, top - 3);
      text(parent, 382, bottom + 8, 'Spiegel', { 'font-size': 23 });
      line(parent, x + 58, bottom + 4, 365, bottom + 4);
      text(parent, 382, bottom + 50, 'Zähler', { 'font-size': 23 });
      line(parent, x + 46, bottom + 40, 365, bottom + 40);
      text(parent, x, 300, 'Lichtquelle am unteren Spiegel', { 'text-anchor': 'middle', 'font-size': 22 });
    }
  });

  function drawLandscapeBackground(parent, SRT, panel) {
    const x = panel.x + 20;
    const y = panel.y + 60;
    const w = panel.w - 40;
    const h = 158;
    const group = SRT.el("g", { opacity: 0.48 }, parent);
    SRT.el("rect", { x, y, width: w, height: h, rx: 12, fill: "#eaf5fb" }, group);
    SRT.el("path", { d: `M${x} ${y + 98} C${x + 54} ${y + 70} ${x + 110} ${y + 76} ${x + 156} ${y + 100} C${x + 208} ${y + 68} ${x + 266} ${y + 78} ${x + w} ${y + 94} L${x + w} ${y + h} L${x} ${y + h} Z`,
      fill: "#d5e7d1" }, group);
    SRT.el("rect", { x, y: y + 112, width: w, height: h - 112, fill: "#bfd9a7" }, group);
    SRT.el("line", { x1: x, y1: y + 112, x2: x + w, y2: y + 112,
      stroke: "#8bb174", "stroke-width": 2, "stroke-linecap": "round" }, group);

    drawHouse(group, x + 222, y + 82);
    drawTree(group, x + 52, y + 92, 1);
    drawTree(group, x + 120, y + 102, 0.78);
    drawTree(group, x + 290, y + 100, 0.84);
  }

  function drawHouse(parent, x, y) {
    const SRT = window.SRTSlide;
    SRT.el("rect", { x, y: y + 28, width: 54, height: 38, rx: 3, fill: "#f7d9a8",
      stroke: "#d7a766", "stroke-width": 1.4 }, parent);
    SRT.el("polygon", { points: `${x - 6},${y + 30} ${x + 27},${y + 4} ${x + 60},${y + 30}`,
      fill: "#b45345" }, parent);
    SRT.el("rect", { x: x + 9, y: y + 43, width: 13, height: 23, rx: 2, fill: "#8b5e3c" }, parent);
    SRT.el("rect", { x: x + 32, y: y + 40, width: 13, height: 12, rx: 2, fill: "#ffffff",
      stroke: "#8aa0b8", "stroke-width": 1 }, parent);
  }

  function drawTree(parent, x, y, scale) {
    const SRT = window.SRTSlide;
    SRT.el("rect", { x: x - 3 * scale, y: y + 16 * scale, width: 6 * scale, height: 25 * scale,
      rx: 2, fill: "#8b5e3c" }, parent);
    SRT.el("circle", { cx: x, cy: y + 13 * scale, r: 16 * scale, fill: "#4f8f5b" }, parent);
    SRT.el("circle", { cx: x - 10 * scale, cy: y + 22 * scale, r: 12 * scale, fill: "#5ba46a" }, parent);
    SRT.el("circle", { cx: x + 10 * scale, cy: y + 22 * scale, r: 12 * scale, fill: "#3f7f50" }, parent);
  }

  function panel(parent, { y, title, phase, beta, completed }) {
    const g = SRT.el('g', { 'data-lc-frame': beta === null ? 'train' : 'platform' }, parent);
    SRT.el('rect', { x: 18, y, width: 604, height: 258, rx: 12, fill: '#fff', stroke: '#dbe3e9' }, g);
    if (beta !== null) drawLandscapeBackground(g, SRT, { x: 28, y, w: 584 });
    text(g, 40, y + 36, title, { 'font-size': 29, 'font-weight': 600 });
    const gamma = beta === null ? 1 : 1 / Math.sqrt(1 - beta * beta);
    const halfX = beta === null ? 0 : beta * gamma * D;
    const startX = beta === null ? 270 : 140;
    const top = y + 70, bottom = top + D;
    const midX = startX + halfX, endX = startX + 2 * halfX;
    const x = startX + 2 * halfX * phase;
    const py = bottom - 2 * D * (phase <= 0.5 ? phase : 1 - phase);
    const points = `${startX},${bottom} ${midX},${top} ${endX},${bottom}`;
    SRT.el('polyline', { points, fill: 'none', stroke: C.path, 'stroke-width': 3, opacity: 0.75,
      'data-lc-path': '', 'data-lc-distance': D }, g);
    if (beta === null) distance(g, startX - 86, top, bottom);
    else {
      const ax = 502, ay = y + 32;
      if (beta > 0) {
        line(g, ax, ay, ax + 49, ay, { stroke: C.ink, 'stroke-width': 2.5 });
        SRT.el('path', { d: `M${ax+49} ${ay} l-10 -6 v12 Z`, fill: C.ink }, g);
        text(g, ax + 59, ay + 8, '*v*');
      }
    }
    // Dezenter Wagenumriss ordnet die Uhr dem Zug zu. Die Breite wird
    // zusammen mit den Spiegeln kontrahiert; die vertikale Strecke bleibt D.
    const wagon = SRT.el('g', { 'data-lc-wagon': '', stroke: '#9aaeb9',
      'stroke-width': 2, fill: 'none' }, g);
    SRT.el('rect', { x: x - 116 / gamma, y: top - 22, width: 232 / gamma,
      height: D + 82, rx: 14 / gamma }, wagon);
    for (const offset of [-82, 82]) {
      SRT.el('ellipse', { cx: x + offset / gamma, cy: bottom + 64,
        rx: 7 / gamma, ry: 5, fill: '#eef3f5' }, wagon);
    }
    clock(g, x, top, D, completed ? 1 : 0, completed, 1 / gamma);
    pulse(g, x, py);
    if (completed) text(g, 584, y + 237, '1 Tick', { 'text-anchor': 'end', 'font-size': 26, fill: C.path });
    return { x, y: py };
  }

  SRT.register('lightclock', {
    initialState: { beta: 0.58, origin: 0 },
    render({ parent, t, state }) {
      addUi(parent, state, true);
      if (state.lastBeta !== state.beta || t < (state.lastT || 0)) {
        state.origin = t;
        state.lastBeta = state.beta;
      }
      state.lastT = t;
      SRT.clear(parent);
      const gamma = 1 / Math.sqrt(1 - state.beta * state.beta);
      const duration = PERIOD * gamma;
      const elapsed = (t - state.origin) % (duration + HOLD);
      const trainPhase = clamp(elapsed / PERIOD, 0, 1);
      const platformPhase = clamp(elapsed / duration, 0, 1);
      panel(parent, { y: 10, title: 'Zugsystem', phase: trainPhase, beta: null, completed: trainPhase === 1 });
      panel(parent, { y: 280, title: 'Bahnsteigsystem', phase: platformPhase, beta: state.beta, completed: platformPhase === 1 });
    }
  });
})();
