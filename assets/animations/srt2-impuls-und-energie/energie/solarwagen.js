(function () {
  'use strict';
  const SRT = window.SRTSlide;
  if (!SRT) return;
  const C = 299792458;
  const INITIAL_MASS = 1;
  const CHARGE = 100;
  const DURATION = 6500;
  const colors = { ink: '#243447', muted: '#566b79', teal: '#0b8793', amber: '#ae6224', sun: '#d79e30' };
  const number = (n, digits = 1) => n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const el = (name, attrs, parent) => SRT.el(name, attrs, parent);
  function label(parent, x, y, content, attrs = {}) {
    const n = el('text', { x, y, fill: colors.ink, 'font-size': 20, 'font-weight': 400, ...attrs }, parent);
    n.textContent = content;
    return n;
  }
  function line(parent, x1, y1, x2, y2, attrs = {}) {
    return el('line', { x1, y1, x2, y2, stroke: '#becbd2', 'stroke-width': 2, ...attrs }, parent);
  }
  function arrow(parent, x1, y1, x2, y2, color, width = 3) {
    line(parent, x1, y1, x2, y2, { stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' });
    const a = Math.atan2(y2 - y1, x2 - x1), size = 7;
    const p1 = [x2 - size * Math.cos(a - .45), y2 - size * Math.sin(a - .45)];
    const p2 = [x2 - size * Math.cos(a + .45), y2 - size * Math.sin(a + .45)];
    el('path', { d: `M${p1}L${x2},${y2}L${p2}`, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  }
  function quantities(state) {
    const f = Math.min(1, Math.max(0, state.progress));
    const kinetic = state.phase === 'charge' ? 0 : CHARGE * f * f;
    const stored = state.phase === 'charge' ? CHARGE * f : CHARGE - kinetic;
    // Kleine Änderungen bleiben getrennt von der großen Anfangsruheenergie.
    const deltaMass = stored / (C * C);
    const ratio = kinetic / (INITIAL_MASS * C * C + stored);
    const speed = C * Math.sqrt(ratio * (ratio + 2)) / (ratio + 1);
    return { stored, kinetic, total: stored + kinetic, deltaMass, speed };
  }
  function setup(host, state) {
    if (host.__solarUi) return host.__solarUi;
    const top = document.createElement('div');
    top.className = 'solar-top';
    top.innerHTML = `<div class="solar-phases" role="group" aria-label="Vorgang auswählen">
      <button type="button" data-solar-phase="charge" aria-pressed="true">1. Akku laden</button>
      <button type="button" data-solar-phase="drive" aria-pressed="false">2. Mit Akku anfahren</button>
      </div><div class="solar-context"><span>Bezugssystem: Boden</span><span class="solar-speed"><em>v</em> = <span data-solar-speed>0,00</span> m/s</span></div>`;
    host.prepend(top);
    const bottom = document.createElement('div');
    bottom.className = 'solar-bottom';
    bottom.innerHTML = `<div class="solar-actions">
      <button type="button" class="solar-play" aria-label="Animation abspielen">▶ Abspielen</button>
      <button type="button" class="solar-reset">Zurücksetzen</button>
      </div><label class="solar-seek"><span class="solar-seek-heading"><span>Ablauf</span><span data-solar-progress>0 %</span></span>
      <input type="range" min="0" max="100" step="0.1" value="0" aria-label="Fortschritt des ausgewählten Vorgangs"></label>
      <p class="solar-state"></p>
      <p class="solar-reference">Energieänderungen gegenüber dem Wagen vor dem Laden</p>
      <div class="solar-metrics">
        <div class="solar-metric"><span class="solar-metric-name">Ruheenergie</span><span class="solar-metric-value">Δ<em>E</em><sub>0</sub> = <span data-solar-rest>0</span> J</span></div>
        <div class="solar-metric"><span class="solar-metric-name">Kinetische Energie</span><span class="solar-metric-value">Δ<em>E</em><sub>kin</sub> = <span data-solar-kinetic>0</span> J</span></div>
        <div class="solar-metric"><span class="solar-metric-name">Gesamtenergie</span><span class="solar-metric-value">Δ<em>E</em> = <span data-solar-total>0</span> J</span></div>
      </div>
      <div class="solar-mass"><div class="solar-mass-heading"><span class="solar-mass-label">Massenänderung des Wagens</span><span class="solar-mass-value">Δ<em>m</em><sub>0</sub> = <span data-solar-mass>0 kg</span></span></div>
      <p class="solar-mass-note">100 J zusätzlich gespeicherte Energie entsprechen etwa einem Billionstel Gramm. Mit einer Alltagswaage ist diese Änderung nicht erkennbar.</p></div>
      <div class="solar-sr-only" role="status" aria-live="polite" aria-atomic="true"></div>`;
    host.append(bottom);
    const ui = {
      host, state, top, bottom, running: false, frame: 0, last: 0,
      play: bottom.querySelector('.solar-play'), reset: bottom.querySelector('.solar-reset'),
      seek: bottom.querySelector('input'), phaseButtons: [...top.querySelectorAll('[data-solar-phase]')],
      speed: top.querySelector('[data-solar-speed]'), progress: bottom.querySelector('[data-solar-progress]'),
      stateText: bottom.querySelector('.solar-state'), rest: bottom.querySelector('[data-solar-rest]'),
      kinetic: bottom.querySelector('[data-solar-kinetic]'), total: bottom.querySelector('[data-solar-total]'),
      mass: bottom.querySelector('[data-solar-mass]'), status: bottom.querySelector('[role="status"]')
    };
    host.__solarUi = ui;
    const refresh = () => host.dispatchEvent(new Event('srt-render'));
    const announce = () => {
      const q = quantities(state);
      ui.status.textContent = `${state.phase === 'charge' ? 'Laden' : 'Anfahren'}: ${number(q.stored)} Joule zusätzlich gespeicherte Ruheenergie, ${number(q.kinetic)} Joule kinetische Energie. Gesamtenergie gegenüber dem Anfang um ${number(q.total)} Joule erhöht. Geschwindigkeit ${number(q.speed, 2)} Meter pro Sekunde.`;
    };
    function stop() {
      ui.running = false;
      cancelAnimationFrame(ui.frame);
      ui.frame = 0;
      ui.last = 0;
    }
    function frame(now) {
      if (!ui.running) return;
      const dt = ui.last ? Math.min(100, now - ui.last) : 0;
      ui.last = now;
      state.progress = Math.min(1, state.progress + dt / DURATION);
      if (state.progress >= 1) { stop(); announce(); }
      refresh();
      if (ui.running) ui.frame = requestAnimationFrame(frame);
    }
    ui.play.addEventListener('click', () => {
      if (ui.running) { stop(); announce(); }
      else {
        if (state.progress >= 1) state.progress = 0;
        ui.running = true;
        ui.last = 0;
        ui.frame = requestAnimationFrame(frame);
      }
      refresh();
    });
    ui.phaseButtons.forEach(button => button.addEventListener('click', () => {
      stop();
      state.phase = button.dataset.solarPhase;
      state.progress = 0;
      refresh(); announce();
    }));
    ui.reset.addEventListener('click', () => { stop(); state.phase = 'charge'; state.progress = 0; refresh(); announce(); });
    ui.seek.addEventListener('input', () => { stop(); state.progress = Number(ui.seek.value) / 100; refresh(); });
    ui.seek.addEventListener('change', announce);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); refresh(); } });
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting && ui.running) { stop(); refresh(); }
    }).observe(host);
    if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(host);
    return ui;
  }
  function draw(parent, width, state, q) {
    SRT.clear(parent);
    const charging = state.phase === 'charge';
    const travel = charging ? 0 : (width - 292) * state.progress * state.progress;
    const x = 146 + travel;
    // Ruhender Boden mit festen Markierungen macht die Bewegung sichtbar.
    el('rect', { width, height: 270, fill: '#fff' }, parent);
    el('rect', { x: 0, y: 231, width, height: 39, fill: '#f1f5f7' }, parent);
    line(parent, 0, 231, width, 231, { stroke: '#91a5b2', 'stroke-width': 2 });
    for (let mark = 25; mark < width; mark += 52) line(parent, mark, 243, mark + 16, 243, { stroke: '#c9d4db', 'stroke-width': 2 });
    if (charging) {
      const sun = el('g', {}, parent);
      el('circle', { cx: 49, cy: 40, r: 17, fill: '#f9d779', stroke: '#d8a544', 'stroke-width': 1.5 }, sun);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        line(sun, 49 + 23 * Math.cos(a), 40 + 23 * Math.sin(a), 49 + 30 * Math.cos(a), 40 + 30 * Math.sin(a), { stroke: '#d8a544', 'stroke-width': 2 });
      }
      for (let i = 0; i < 3; i++) arrow(parent, 76 + i * 19, 48 + i * 2, x - 42 + i * 26, 108 - i * 2, colors.sun, 2.5);
    }
    const cart = el('g', { transform: `translate(${x} 0)`, 'data-solar-cart': '' }, parent);
    // Solarzelle über einem offenen Chassis, Akku und Antrieb sichtbar.
    line(cart, -60, 126, -60, 157, { stroke: '#8a9fab', 'stroke-width': 5 });
    line(cart, 57, 116, 57, 157, { stroke: '#8a9fab', 'stroke-width': 5 });
    el('path', { d: 'M-89 109L62 89L87 116L-65 136Z', fill: '#dbe9ef', stroke: '#7894a5', 'stroke-width': 2 }, cart);
    el('path', { d: 'M-81 111L59 93L79 114L-64 132Z', fill: charging ? '#28546b' : '#667f8d', stroke: '#fff', 'stroke-width': 1 }, cart);
    for (let i = 1; i < 6; i++) {
      const ax = -81 + 140 * i / 6;
      line(cart, ax, 111 - 18 * i / 6, ax + 17, 132 - 18 * i / 6, { stroke: '#9dc8da', 'stroke-width': 1 });
    }
    line(cart, -73, 121, 68, 103, { stroke: '#9dc8da', 'stroke-width': 1 });
    label(cart, 60, 61, 'Solarzelle', { 'text-anchor': 'middle', 'font-size': 20, fill: colors.muted });
    line(cart, 60, 67, 55, 98, { stroke: '#93aab7', 'stroke-width': 1.2 });
    el('path', { d: 'M-85 156H75Q91 156 95 171L104 199H-94L-94 168Q-94 156-85 156Z', fill: '#e7eef2', stroke: '#728c9c', 'stroke-width': 2 }, cart);
    // Der Akku behält unabhängig von seiner Energie dieselbe gezeichnete Größe.
    el('rect', { x: -69, y: 151, width: 83, height: 43, rx: 6, fill: '#e4f2f1', stroke: colors.teal, 'stroke-width': 2 }, cart);
    el('rect', { x: 14, y: 164, width: 5, height: 15, rx: 1, fill: colors.teal }, cart);
    label(cart, -29, 169, 'Akku', { 'font-size': 16, 'text-anchor': 'middle', fill: '#086570' });
    label(cart, -29, 187, `${number(q.stored, 0)} J`, { 'font-size': 17, 'text-anchor': 'middle', fill: '#086570' });
    line(cart, -59, 151, -59, 135, { stroke: charging ? colors.teal : '#9caeb8', 'stroke-width': 3 });
    const motorColor = charging ? '#849aa8' : colors.amber;
    el('rect', { x: 45, y: 163, width: 34, height: 25, rx: 8, fill: '#fff4e8', stroke: motorColor, 'stroke-width': 2 }, cart);
    label(cart, 62, 181, 'M', { fill: motorColor, 'font-size': 17, 'font-style': 'italic', 'text-anchor': 'middle' });
    line(cart, 19, 173, 45, 173, { stroke: charging ? '#92a6b1' : colors.amber, 'stroke-width': 3 });
    if (!charging && state.progress > 0 && state.progress < 1) arrow(cart, 22, 173, 41, 173, colors.amber, 2);
    line(cart, 66, 188, 66, 207, { stroke: motorColor, 'stroke-width': 4 });
    [-60, 66].forEach(cx => {
      el('circle', { cx, cy: 210, r: 20, fill: '#334b5d' }, cart);
      el('circle', { cx, cy: 210, r: 12, fill: '#dce7ed', stroke: '#fff', 'stroke-width': 2 }, cart);
      const wheel = el('g', { transform: `rotate(${travel / 20 * 180 / Math.PI} ${cx} 210)` }, cart);
      line(wheel, cx - 9, 210, cx + 9, 210, { stroke: '#6c8798', 'stroke-width': 2 });
      line(wheel, cx, 201, cx, 219, { stroke: '#6c8798', 'stroke-width': 2 });
      el('circle', { cx, cy: 210, r: 3, fill: '#587387' }, cart);
    });
  }
  SRT.register('solar-cart', {
    initialState: { phase: 'charge', progress: 0 },
    showMotionControl: false,
    render({ parent, state }) {
      const svg = parent.ownerSVGElement;
      const host = svg.parentElement;
      const ui = setup(host, state);
      const q = quantities(state);
      const width = host.clientWidth < 460 ? 420 : 640;
      svg.setAttribute('viewBox', `0 0 ${width} 270`);
      svg.style.aspectRatio = `${width} / 270`;
      ui.phaseButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.solarPhase === state.phase)));
      ui.play.textContent = ui.running ? 'Ⅱ Pause' : state.progress >= 1 ? '↻ Wiederholen' : '▶ Abspielen';
      ui.play.setAttribute('aria-label', ui.running ? 'Animation pausieren' : state.progress >= 1 ? 'Vorgang wiederholen' : 'Animation abspielen');
      ui.play.setAttribute('aria-pressed', String(ui.running));
      ui.seek.value = state.progress * 100;
      ui.seek.setAttribute('aria-valuetext', `${number(state.progress * 100, 0)} Prozent des Vorgangs ${state.phase === 'charge' ? 'Laden' : 'Anfahren'}`);
      ui.progress.textContent = `${number(state.progress * 100, 0)} %`;
      ui.speed.textContent = number(q.speed, 2);
      ui.rest.textContent = number(q.stored);
      ui.kinetic.textContent = number(q.kinetic);
      ui.total.textContent = number(q.total);
      ui.mass.innerHTML = q.deltaMass < 1e-25 ? '0 kg' : `${number(q.deltaMass / 1e-15, 2)} · 10<sup>−15</sup> kg`;
      ui.stateText.textContent = state.phase === 'charge'
        ? state.progress >= 1 ? '100 J gespeichert. Du kannst jetzt „Mit Akku anfahren“ wählen.' : 'Der Wagen ruht. Die Solarzelle lädt den Akku.'
        : state.progress >= 1 ? 'Wiedergabe am Ende pausiert. Der Wagen rollt weiter.' : 'Die Solarzelle ist abgeschaltet. Der Akku treibt den Wagen an.';
      Object.assign(host.dataset, {
        solarPhase: state.phase, solarProgress: state.progress, solarStoredJ: q.stored,
        solarKineticJ: q.kinetic, solarDeltaTotalJ: q.total, solarDeltaMassKg: q.deltaMass,
        solarSpeed: q.speed, solarPlaying: ui.running, solarInitialMassKg: INITIAL_MASS
      });
      draw(parent, width, state, q);
    }
  });
})();
