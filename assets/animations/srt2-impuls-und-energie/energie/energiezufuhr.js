(function () {
  const SRT = window.SRTSlide;
  if (!SRT) return;

  const MASS = 1.67e-27;
  const C = 3.0e8;
  const ELEMENTARY_CHARGE = 1.60e-19;
  const REST_ENERGY_MEV = MASS * C * C / (1e6 * ELEMENTARY_CHARGE);
  const STEP_MEV = 100;
  const MAX_STEPS = 100;
  let comparisonId = 0;
  const AXIS = { x: 52, y: 174, width: 544 };
  const COLORS = { active: '#0b8793', previous: '#687f8c', history: '#bed2d7', ink: '#243447', axis: '#607286' };
  const format = (value, digits = 0) => value.toLocaleString('de-DE', {
    minimumFractionDigits: digits, maximumFractionDigits: digits
  });
  const texNumber = (value, digits = 0) => {
    const [integer, fraction] = value.toFixed(digits).split('.');
    const grouped = Number(integer).toLocaleString('de-DE').replaceAll('.', '\\,');
    return fraction === undefined ? grouped : `${grouped}{,}${fraction}`;
  };

  function betaAt(step) {
    const ratio = step * STEP_MEV / REST_ENERGY_MEV;
    return Math.sqrt(ratio * (ratio + 2)) / (ratio + 1);
  }

  const line = (parent, x1, y1, x2, y2, attrs = {}) => SRT.el('line', {
    x1, y1, x2, y2, stroke: COLORS.axis, 'stroke-width': 1.5, ...attrs
  }, parent);
  const text = (parent, x, y, value, attrs = {}) => SRT.addText(parent, x, y, value, 'label', {
    'font-size': 23, 'font-weight': 400, fill: COLORS.ink, ...attrs
  });

  function mathLabel(parent, x, y, tex, fallback, size = 23, anchor = 'start') {
    if (!window.SRTMath?.label(parent, x, y, tex, size, anchor, COLORS.ink))
      text(parent, x, y, fallback, { 'font-size': size, 'text-anchor': anchor });
  }

  function inline(node, tex, fallback) {
    const formula = window.SRTMath?.inline(tex);
    node.replaceChildren();
    if (formula) node.append(formula);
    else String(fallback).split('*').forEach((part, index) => {
      if (index % 2) {
        const variable = document.createElement('i');
        variable.textContent = part;
        node.append(variable);
      } else node.append(part);
    });
  }

  function button(parent, name, action, className) {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = className;
    element.textContent = name;
    element.addEventListener('click', action);
    parent.append(element);
    return element;
  }

  function metric(parent, label, className) {
    const box = document.createElement('div');
    box.className = 'energy-increments-metric';
    const title = document.createElement('div');
    title.className = 'energy-increments-label';
    title.textContent = label;
    const value = document.createElement('div');
    value.className = className;
    box.append(title, value);
    parent.append(box);
    return value;
  }

  function ui(parent, state) {
    const svg = parent.ownerSVGElement;
    const host = svg.parentElement;
    if (host.__energyIncrementsUi) return host.__energyIncrementsUi;
    const render = () => host.dispatchEvent(new Event('srt-render'));

    const results = document.createElement('div');
    results.className = 'energy-increments-results';
    results.setAttribute('aria-hidden', 'true');
    const energy = metric(results, 'Kinetische Energie des Protons', 'energy-increments-energy');
    const speed = metric(results, 'Geschwindigkeit', 'energy-increments-speed');
    host.insertBefore(results, svg);

    const controls = document.createElement('div');
    controls.className = 'energy-increments-controls';
    const increment = document.createElement('div');
    increment.className = 'energy-increments-change';
    increment.setAttribute('aria-hidden', 'true');
    const incrementLabel = document.createElement('span');
    incrementLabel.textContent = 'Letzter Geschwindigkeitszuwachs';
    const incrementValue = document.createElement('span');
    increment.append(incrementLabel, incrementValue);
    controls.append(increment);

    const actions = document.createElement('div');
    actions.className = 'energy-increments-actions';
    const add = button(actions, '100 MeV zuführen', () => {
      state.steps = Math.min(MAX_STEPS, state.steps + 1);
      render();
    }, 'energy-increments-add');
    const previous = button(actions, 'Einen Schritt zurück', () => {
      state.steps = Math.max(0, state.steps - 1);
      render();
    }, 'energy-increments-previous');
    const reset = button(actions, 'Zurücksetzen', () => {
      state.steps = 0;
      render();
    }, 'energy-increments-reset');
    controls.append(actions);

    const limitNote = document.createElement('p');
    limitNote.className = 'energy-increments-limit-note';
    limitNote.textContent = 'Ende des dargestellten Bereichs. Weitere Energiezufuhr wäre möglich.';
    limitNote.hidden = true;
    controls.append(limitNote);

    const comparison = document.createElement('div');
    comparison.className = 'energy-increments-comparison';
    const comparisonPanel = document.createElement('div');
    comparisonPanel.className = 'energy-increments-comparison-panel';
    comparisonPanel.id = `energy-increments-comparison-${++comparisonId}`;
    comparisonPanel.hidden = true;
    const comparisonToggle = button(comparison, '100 MeV im Alltag', () => {
      comparisonPanel.hidden = !comparisonPanel.hidden;
      comparisonToggle.setAttribute('aria-expanded', String(!comparisonPanel.hidden));
    }, 'energy-increments-comparison-toggle');
    comparisonToggle.setAttribute('aria-expanded', 'false');
    comparisonToggle.setAttribute('aria-controls', comparisonPanel.id);

    const comparisonMath = [];
    const comparisonValue = (tex, fallback) => {
      const node = document.createElement('span');
      comparisonMath.push({ node, tex, fallback });
      return node;
    };
    const stepComparison = document.createElement('p');
    stepComparison.append('Mit jedem Schritt führst du einem Proton die Energie ',
      comparisonValue('100\\,\\mathrm{MeV}\\approx1{,}60\\cdot10^{-11}\\,\\mathrm{J}',
        '100 MeV ≈ 1,60 · 10⁻¹¹ J'), ' zu.');
    const liftingComparison = document.createElement('p');
    liftingComparison.append('Um ', comparisonValue('100\\,\\mathrm{g}', '100 g'),
      ' um ', comparisonValue('1\\,\\mathrm{m}', '1 m'),
      ' anzuheben, brauchst du ungefähr ', comparisonValue('1\\,\\mathrm{J}', '1 J'),
      '. Diese Energie reicht idealisiert, um rund 60 Milliarden Protonen jeweils ',
      comparisonValue('100\\,\\mathrm{MeV}', '100 MeV'), ' zuzuführen.');
    comparisonPanel.append(stepComparison, liftingComparison);
    comparison.append(comparisonPanel);
    controls.append(comparison);

    const status = document.createElement('div');
    status.className = 'energy-increments-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    controls.append(status);
    host.append(controls);

    const refreshMath = () => {
      if (window.MathJax?.startup?.promise)
        window.MathJax.startup.promise.then(() => window.setTimeout(render, 0));
    };
    if (document.readyState === 'complete') refreshMath();
    else window.addEventListener('load', refreshMath, { once: true });

    host.__energyIncrementsUi = { host, energy, speed, incrementValue, add, previous, reset, status, limitNote, comparisonMath };
    return host.__energyIncrementsUi;
  }

  function previousMarker(parent, x, y, attrs = {}) {
    SRT.el('path', {
      d: `M${x} ${y - 7}l7 7l-7 7l-7 -7Z`, fill: '#fff',
      stroke: COLORS.previous, 'stroke-width': 2.4, ...attrs
    }, parent);
  }

  SRT.register('energy-increments', {
    initialState: { steps: 0 },
    render({ parent, state }) {
      state.steps = Math.max(0, Math.min(MAX_STEPS, Math.round(Number(state.steps) || 0)));
      const controls = ui(parent, state);
      const key = `${state.steps}-${!!window.SRTMath?.ready}`;
      if (parent.__energyIncrementsKey === key) return;
      parent.__energyIncrementsKey = key;

      const steps = state.steps;
      const energy = steps * STEP_MEV;
      const beta = betaAt(steps);
      const previousBeta = betaAt(Math.max(0, steps - 1));
      const increment = steps === 0 ? null : beta - previousBeta;
      const xAt = value => AXIS.x + AXIS.width * value;
      const betaDigits = beta === 0 ? 0 : 6;
      const relation = steps === 0 ? '=' : '\\approx';
      const plainRelation = steps === 0 ? '=' : '≈';

      inline(controls.energy, `E_\\mathrm{kin}=${texNumber(energy)}\\,\\mathrm{MeV}`,
        `*E*kin = ${format(energy)} MeV`);
      inline(controls.speed, `v${relation}${texNumber(beta, betaDigits)}\\,c`,
        `*v* ${plainRelation} ${format(beta, betaDigits)} *c*`);
      controls.comparisonMath.forEach(({ node, tex, fallback }) => inline(node, tex, fallback));
      if (increment === null) controls.incrementValue.textContent = '—';
      else inline(controls.incrementValue, `\\Delta v\\approx${texNumber(increment, 6)}\\,c`,
        `Δ*v* ≈ ${format(increment, 6)} *c*`);

      controls.add.disabled = steps >= MAX_STEPS;
      controls.limitNote.hidden = steps < MAX_STEPS;
      controls.previous.disabled = steps === 0;
      controls.reset.disabled = steps === 0;
      controls.status.textContent = `Kinetische Energie: ${format(energy)} Megaelektronenvolt. Geschwindigkeit: ${format(beta, betaDigits)} mal Lichtgeschwindigkeit.` +
        (increment === null ? '' : ` Der letzte Energiezuwachs von 100 Megaelektronenvolt erhöht die Geschwindigkeit um ${format(increment, 6)} mal Lichtgeschwindigkeit.`) +
        (steps >= MAX_STEPS ? ' Ende des dargestellten Bereichs. Weitere Energiezufuhr wäre möglich.' : '');
      Object.assign(controls.host.dataset, {
        energySteps: steps, energyKineticMev: energy, energyRestMev: REST_ENERGY_MEV,
        energyBeta: beta, energyPreviousBeta: previousBeta,
        energyDeltaBeta: increment ?? 'undefined', energyStepMev: STEP_MEV, energyMaxSteps: MAX_STEPS
      });

      SRT.clear(parent);
      SRT.el('rect', { width: 640, height: 330, fill: '#fff' }, parent);

      line(parent, xAt(1), 65, xAt(1), AXIS.y, {
        stroke: '#91a2ae', 'stroke-dasharray': '5 5', 'data-energy-limit': ''
      });

      for (let n = 1; n <= steps; n++) {
        const from = xAt(betaAt(n - 1));
        const to = xAt(betaAt(n));
        const height = Math.min(112, (to - from) * .55);
        SRT.el('path', {
          d: `M${from} ${AXIS.y}Q${(from + to) / 2} ${AXIS.y - height} ${to} ${AXIS.y}`,
          fill: 'none', stroke: n === steps ? COLORS.active : COLORS.history,
          'stroke-width': n === steps ? 3 : 1.8,
          'data-energy-step': n, 'data-energy-step-beta': betaAt(n)
        }, parent);
      }

      line(parent, AXIS.x, AXIS.y, xAt(1), AXIS.y, { 'stroke-width': 2 });
      for (const tick of [0, .2, .4, .6, .8, 1]) {
        const x = xAt(tick);
        line(parent, x, AXIS.y, x, AXIS.y + 9, { 'stroke-width': 2 });
        const tex = tick === 0 ? '0' : tick === 1 ? 'c' : `${texNumber(tick, 1)}\\,c`;
        const fallback = tick === 0 ? '0' : tick === 1 ? '*c*' : `${format(tick, 1)} *c*`;
        mathLabel(parent, x, AXIS.y + 39, tex, fallback, 23, 'middle');
      }
      for (let n = 0; n <= steps; n++)
        line(parent, xAt(betaAt(n)), AXIS.y - 5, xAt(betaAt(n)), AXIS.y + 5, {
          stroke: COLORS.previous, 'stroke-width': 1.5, 'data-energy-history': n
        });

      if (steps > 0) {
        line(parent, xAt(previousBeta), 139, xAt(previousBeta), AXIS.y, {
          stroke: COLORS.previous, 'stroke-dasharray': '3 4'
        });
        previousMarker(parent, xAt(previousBeta), 132, { 'data-energy-previous-marker': '' });
      }
      line(parent, xAt(beta), 104, xAt(beta), AXIS.y, {
        stroke: COLORS.active, 'stroke-width': 1.8, 'stroke-dasharray': '4 4'
      });
      SRT.el('circle', {
        cx: xAt(beta), cy: 96, r: 7, fill: COLORS.active,
        stroke: '#fff', 'stroke-width': 1.5, 'data-energy-current-marker': ''
      }, parent);
      text(parent, 324, 254, 'Geschwindigkeit', { 'text-anchor': 'middle', 'font-size': 23 });

      SRT.el('circle', { cx: 65, cy: 300, r: 6, fill: COLORS.active }, parent);
      text(parent, 83, 308, 'aktuell', { 'font-size': 22 });
      previousMarker(parent, 245, 300);
      text(parent, 263, 308, 'zuvor', { 'font-size': 22 });
      line(parent, 416, 294, 416, 306, { stroke: COLORS.previous, 'stroke-width': 2 });
      text(parent, 433, 308, 'erreicht', { 'font-size': 22 });
    }
  });
})();
