(function () {
  const SRT = window.SRTSlide;
  if (!SRT) return;

  const START = -2, END = 2.5;
  const MASS = 1, SPACE_SCALE = 50, IMPULSE_SCALE = 60;
  const CONTACT = [260, 316], CART_WIDTH = 56;
  const COLORS = { first: '#086b89', second: '#a85d16', total: '#334658', muted: '#687b89' };
  const format = (value, digits = 1) => value.toLocaleString('de-DE', { maximumFractionDigits: digits });
  const signed = value => (value < 0 ? '−' : '+') + format(Math.abs(value));
  const text = (parent, x, y, value, attrs = {}) => SRT.addText(parent, x, y, value, 'label', {
    'font-size': 23, 'font-weight': 400, fill: COLORS.total, ...attrs
  });
  const line = (parent, x1, y1, x2, y2, attrs = {}) => SRT.el('line', {
    x1, y1, x2, y2, stroke: '#c5d0d7', 'stroke-width': 1.5, ...attrs
  }, parent);

  function values(time, scenario) {
    const initial = [2, scenario === 'opposite' ? -1 : 1];
    const common = (initial[0] + initial[1]) / 2;
    const after = time >= 0;
    const velocity = after ? [common, common] : initial;
    return {
      after, initial, common, velocity,
      position: CONTACT.map((x, index) => x + SPACE_SCALE * velocity[index] * time),
      momentum: velocity.map(speed => MASS * speed),
      total: MASS * (initial[0] + initial[1])
    };
  }

  function arrow(parent, x, y, amount, color, attrs = {}) {
    const end = x + amount * IMPULSE_SCALE;
    const direction = Math.sign(amount);
    const group = SRT.el('g', { 'data-impulse': amount, ...attrs }, parent);
    line(group, x, y, end, y, { stroke: color, 'stroke-width': 3.5 });
    SRT.el('path', {
      d: `M${end} ${y}l${-direction * 10} -6v12Z`, fill: color
    }, group);
    SRT.el('circle', { cx: x, cy: y, r: 3.2, fill: color }, group);
    return end;
  }

  function cart(parent, x, index) {
    const color = index === 0 ? COLORS.first : COLORS.second;
    const group = SRT.el('g', { transform: `translate(${x} 0)`, 'data-cart': index + 1, 'data-position-px': x }, parent);
    SRT.el('rect', { x: -CART_WIDTH / 2, y: 111, width: CART_WIDTH, height: 32, rx: 3, fill: color }, group);
    text(group, 0, 135, String(index + 1), { 'text-anchor': 'middle', fill: '#fff', 'font-size': 23 });
    [-17, 17].forEach(cx => {
      SRT.el('circle', { cx, cy: 152, r: 8, fill: '#fff', stroke: color, 'stroke-width': 3 }, group);
      SRT.el('circle', { cx, cy: 152, r: 2.3, fill: color }, group);
    });
  }

  function controlPanel(host) {
    const panel = host.nextElementSibling;
    return panel?.classList.contains('srt-workbook-controls') ? panel : null;
  }

  function syncControls(host, state) {
    const panel = controlPanel(host);
    if (!panel) return;
    panel.classList.add('inelastic-carts-controls');
    const input = panel.querySelector('input[type="range"]');
    if (input) {
      input.value = state.time;
      input.setAttribute('aria-valuetext', `${format(state.time, 2)} Sekunden, ${state.time < 0 ? 'vor' : 'nach'} dem Stoß`);
      panel.querySelector('.srt-workbook-range-value').textContent = `${format(state.time, 2)} s`;
    }
    if (!panel.__cartRestartBound) {
      panel.__cartRestartBound = true;
      // Der gemeinsame Controller erneuert seine Knöpfe nach jedem Klick.
      // Deshalb bleibt die Ergänzung am umgebenden Bedienfeld registriert.
      panel.addEventListener('click', event => {
        const button = event.target.closest('.srt-workbook-motion-button');
        if (button && button.getAttribute('aria-pressed') === 'false' && state.time >= END) {
          state.time = START;
          host.dispatchEvent(new Event('srt-render'));
        }
      }, true);
    }
  }

  function pauseAtEnd(host, state) {
    if (state.endPauseQueued) return;
    state.endPauseQueued = true;
    // Nach dem aktuellen Bild stoppt der gemeinsame Controller auch seine RAF.
    queueMicrotask(() => {
      state.endPauseQueued = false;
      const button = controlPanel(host)?.querySelector('.srt-workbook-motion-button');
      if (state.time >= END && button?.getAttribute('aria-pressed') === 'true') button.click();
    });
  }

  function preset(scenario, label) {
    return {
      label, pressed: state => state.scenario === scenario,
      apply(state) { state.scenario = scenario; state.time = START; state.lastTick = null; }
    };
  }

  SRT.register('inelastic-carts', {
    initialState: { scenario: 'same', time: START, lastTick: null },
    showMotionControl: true,
    controls: [
      {
        type: 'group', label: 'Bewegung vor dem Stoß', controls: [
          preset('same', 'Gleiche Richtung'), preset('opposite', 'Entgegengesetzt')
        ]
      },
      {
        type: 'range', key: 'time', label: 'Zeit · Stoß bei 0 s',
        min: START, max: END, step: .01, format: value => `${format(value, 2)} s`
      }
    ],
    render({ parent, state, t }) {
      const host = parent.ownerSVGElement.parentElement;
      if (state.lastTick !== null && t < state.lastTick) state.time = START;
      if (state.lastTick !== null && t > state.lastTick)
        state.time = Math.min(END, state.time + (t - state.lastTick) / 1000);
      state.lastTick = t;
      syncControls(host, state);
      if (state.time >= END) pauseAtEnd(host, state);
      const q = values(state.time, state.scenario);
      Object.assign(host.dataset, {
        cartsTime: state.time, cartsScenario: state.scenario, cartsPhase: q.after ? 'after' : 'before',
        cartsVelocity1: q.velocity[0], cartsVelocity2: q.velocity[1],
        cartsMomentum1: q.momentum[0], cartsMomentum2: q.momentum[1], cartsTotalMomentum: q.total,
        cartsPosition1: q.position[0], cartsPosition2: q.position[1], cartsWidth: CART_WIDTH,
        cartsImpulseScale: IMPULSE_SCALE, cartsSpaceScale: SPACE_SCALE
      });

      SRT.clear(parent);
      SRT.el('rect', { width: 640, height: 320, fill: '#fff' }, parent);
      text(parent, 320, 30, '*m*₁ = *m*₂ = 1 kg', { 'text-anchor': 'middle', 'font-size': 22 });
      SRT.el('rect', {
        x: 24, y: 47, width: 592, height: 134, rx: 5, fill: '#f8fafb',
        stroke: '#879ca9', 'stroke-width': 1.4, 'stroke-dasharray': '6 5', 'data-carts-system-boundary': ''
      }, parent);
      line(parent, 33, 160, 607, 160, { stroke: '#8a9aa6', 'stroke-width': 2 });
      q.position.forEach((x, index) => cart(parent, x, index));
      if (q.after) {
        const seam = (q.position[0] + q.position[1]) / 2;
        SRT.el('rect', { x: seam - 4, y: 121, width: 8, height: 11, rx: 1.5, fill: '#dce4e9', stroke: COLORS.total }, parent);
      }

      // Untereinander angeordnete Pfeile addieren sich Spitze an Fuß.
      // Alle Pfeile verwenden dieselbe Längenskala, auch nach dem Stoß.
      const origin = 330;
      const firstEnd = origin + q.momentum[0] * IMPULSE_SCALE;
      const sumEnd = origin + q.total * IMPULSE_SCALE;
      line(parent, origin, 203, origin, 292, { stroke: '#d8e0e5', 'stroke-dasharray': '3 4' });
      line(parent, firstEnd, 217, firstEnd, 249, { stroke: '#a8b7c0', 'stroke-dasharray': '3 4' });
      line(parent, sumEnd, 249, sumEnd, 285, { stroke: '#a8b7c0', 'stroke-dasharray': '3 4' });
      text(parent, 28, 224, `*p*₁ = ${signed(q.momentum[0])} kg m/s`, { fill: COLORS.first });
      text(parent, 28, 256, `*p*₂ = ${signed(q.momentum[1])} kg m/s`, { fill: COLORS.second });
      text(parent, 28, 293, `Summe: ${signed(q.total)} kg m/s`);
      arrow(parent, origin, 217, q.momentum[0], COLORS.first, { 'data-carts-vector': 'first' });
      arrow(parent, firstEnd, 249, q.momentum[1], COLORS.second, { 'data-carts-vector': 'second' });
      arrow(parent, origin, 285, q.total, COLORS.total, { 'data-carts-vector': 'total' });
    }
  });
})();
