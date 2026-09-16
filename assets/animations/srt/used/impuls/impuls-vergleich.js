// Impulsbeträge eines Protons mit den gerundeten Werten der Rechenaufgabe.
(function () {
  const SRT = window.SRTSlide;
  if (!SRT) return;

  const MASS = 1.67e-27;
  const C = 3.0e8;
  const UNIT = 1e-19;
  const P = { x: 76, y: 46, w: 514, h: 204 };
  const COLORS = { rel: '#0b8793', classic: '#97541c', ink: '#243447', axis: '#607286' };
  const VIEWS = {
    wide: { max: .99, axisMax: 1, yMax: 40, xTicks: [0, .2, .4, .6, .8, 1], yTicks: [0, 10, 20, 30, 40] },
    close: { max: .30, axisMax: .30, yMax: 1.8, xTicks: [0, .05, .10, .15, .20, .25, .30], yTicks: [0, .3, .6, .9, 1.2, 1.5, 1.8] }
  };
  let serial = 0;
  const fmt = (value, digits = 3) => value.toLocaleString('de-DE', { maximumFractionDigits: digits });
  const texNumber = (value, digits = 3) => fmt(value, digits).replace(',', '{,}');
  const superscript = value => String(value).split('').map(character => ({
    '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  })[character]).join('');

  function number(value, scientific = false) {
    if (value === 0) return { tex: '0', plain: '0' };
    if (scientific || Math.abs(value) < .001) {
      const [mantissa, exponent] = value.toExponential(3).split('e').map(Number);
      return {
        tex: `${texNumber(mantissa)}\\cdot10^{${exponent}}`,
        plain: `${fmt(mantissa)} · 10${superscript(exponent)}`
      };
    }
    return { tex: texNumber(value, 4), plain: fmt(value, 4) };
  }

  function quantities(beta) {
    const root = Math.sqrt(1 - beta * beta);
    const classic = MASS * C * beta;
    return {
      gamma: 1 / root,
      classic,
      rel: classic / root,
      // (p_rel - p_klass) / p_rel, stabil auch bei kleinen beta.
      // Bei beta = 0 ist der Quotient nicht definiert. Die Ausgabe fängt das ab.
      difference: beta === 0 ? null : beta * beta / (1 + root)
    };
  }

  const line = (parent, x1, y1, x2, y2, attrs = {}) => SRT.el('line', {
    x1, y1, x2, y2, stroke: '#dce5ea', 'stroke-width': 1.3, ...attrs
  }, parent);

  const text = (parent, x, y, value, attrs = {}) => SRT.addText(parent, x, y, value, 'label', {
    'font-size': 23, 'font-weight': 400, fill: COLORS.ink, ...attrs
  });

  function mathLabel(parent, x, y, tex, fallback, size = 25, anchor = 'start') {
    if (!window.SRTMath?.label(parent, x, y, tex, size, anchor, COLORS.ink))
      text(parent, x, y, fallback, { 'font-size': size, 'text-anchor': anchor });
  }

  function inline(node, tex, fallback) {
    const formula = window.SRTMath?.inline(tex);
    node.replaceChildren();
    if (formula) node.append(formula);
    else {
      // Gleiche Sternchen-Konvention wie SRT.addText, nur als HTML.
      String(fallback).split('*').forEach((part, index) => {
        if (index % 2) {
          const variable = document.createElement('i');
          variable.textContent = part;
          node.append(variable);
        } else node.append(part);
      });
    }
  }

  function button(parent, name, apply) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = name;
    element.addEventListener('click', apply);
    parent.append(element);
    return element;
  }

  function group(name, className) {
    const element = document.createElement('fieldset');
    element.className = className;
    const legend = document.createElement('legend');
    legend.textContent = name;
    element.append(legend);
    return element;
  }

  function ui(parent, state) {
    const svg = parent.ownerSVGElement;
    const host = svg.parentElement;
    if (host.__momentumUi) return host.__momentumUi;
    const render = () => host.dispatchEvent(new Event('srt-render'));
    const id = `momentum-${++serial}`;

    const views = group('Ansicht', 'momentum-views');
    const viewButtons = [];
    for (const [view, label] of [['wide', 'Gesamtansicht'], ['close', 'Nahansicht']]) {
      const element = button(views, label, () => {
        state.view = view;
        state.beta = Math.min(state.beta, VIEWS[view].max);
        render();
      });
      element.dataset.momentumView = view;
      viewButtons.push(element);
    }
    host.insertBefore(views, svg);

    const panel = document.createElement('div'); panel.className = 'momentum-controls';
    const rangeLabel = document.createElement('label'); rangeLabel.htmlFor = id + '-speed';
    rangeLabel.className = 'momentum-range-label';
    const name = document.createElement('span'); name.textContent = 'Geschwindigkeit';
    const speed = document.createElement('span'); speed.className = 'momentum-speed';
    rangeLabel.append(name, speed);
    const range = document.createElement('input');
    range.id = id + '-speed'; range.type = 'range'; range.min = '0'; range.step = 'any';
    range.addEventListener('input', () => {
      state.beta = Math.max(0, Math.min(VIEWS[state.view].max, Number(range.value) || 0));
      render();
    });

    const presets = group('Klassischer Impuls kleiner um', 'momentum-presets');
    const presetButtons = [];
    for (const difference of [.01, .05, .10, .20]) {
      const beta = Math.sqrt(2 * difference - difference * difference);
      const element = button(presets, fmt(difference * 100) + ' %', () => {
        state.beta = beta;
        if (beta > VIEWS[state.view].max) state.view = 'wide';
        render();
      });
      element.setAttribute('aria-label', `Geschwindigkeit einstellen, bei der der klassische Impuls ${fmt(difference * 100)} Prozent kleiner als der relativistische Impuls ist`);
      element.dataset.momentumPreset = beta;
      element.dataset.momentumUnderestimate = difference;
      presetButtons.push(element);
    }

    const results = document.createElement('div'); results.className = 'momentum-results';
    results.setAttribute('role', 'status'); results.setAttribute('aria-live', 'polite');
    results.setAttribute('aria-atomic', 'true');
    const gamma = document.createElement('div'); gamma.className = 'momentum-factor';
    const classic = document.createElement('div'); classic.className = 'momentum-classic-value';
    const rel = document.createElement('div'); rel.className = 'momentum-rel-value';
    const difference = document.createElement('div'); difference.className = 'momentum-difference';
    const summary = document.createElement('div'); summary.className = 'momentum-summary';
    const momenta = document.createElement('div'); momenta.className = 'momentum-momenta';
    summary.append(gamma, difference); momenta.append(classic, rel);
    results.append(summary, momenta);

    panel.append(rangeLabel, range, presets, results);
    host.append(panel);

    // Die gemeinsame Formelsatz-Datei kennt diese neue Darstellung noch nicht.
    // Nach ihrem Bereitschaftswechsel wird einmal lokal nachgezeichnet.
    const refreshMath = () => {
      if (window.MathJax?.startup?.promise)
        window.MathJax.startup.promise.then(() => window.setTimeout(render, 0));
    };
    if (document.readyState === 'complete') refreshMath();
    else window.addEventListener('load', refreshMath, { once: true });

    host.__momentumUi = {
      host, id, range, speed, gamma, classic, rel, difference,
      viewButtons, presetButtons
    };
    return host.__momentumUi;
  }

  SRT.register('momentum-comparison', {
    initialState: { beta: .6, view: 'wide' },
    render({ parent, state }) {
      const controls = ui(parent, state);
      const key = `${state.beta}-${state.view}-${!!window.SRTMath?.ready}`;
      if (parent.__momentumKey === key) return;
      parent.__momentumKey = key;

      const beta = state.beta;
      const view = VIEWS[state.view];
      const q = quantities(beta);
      const px = b => P.x + b / view.axisMax * P.w;
      const py = p => P.y + P.h - p / UNIT / view.yMax * P.h;

      controls.range.max = view.max;
      controls.range.value = beta;
      const metresPerSecond = beta * C;
      const speedUnit = metresPerSecond >= 1e6 ? 'm/s' : 'km/h';
      const speed = number(metresPerSecond >= 1e6 ? metresPerSecond : metresPerSecond * 3.6,
        metresPerSecond >= 1e6);
      const ratio = number(beta);
      controls.range.setAttribute('aria-valuetext', metresPerSecond >= 1e6
        ? `${fmt(metresPerSecond, 0)} Meter pro Sekunde`
        : `${speed.plain} Kilometer pro Stunde`);
      inline(controls.speed, `${speed.tex}\\,\\mathrm{${speedUnit}}\\quad(v/c=${ratio.tex})`,
        `${speed.plain} ${speedUnit} (*v* / *c* = ${ratio.plain})`);
      const relation = beta === 0 ? '=' : '\\approx';
      const relationText = beta === 0 ? '=' : '≈';
      inline(controls.gamma, `\\gamma${relation}${texNumber(q.gamma, 4)}`, `*γ* ${relationText} ${fmt(q.gamma, 4)}`);
      for (const [node, symbol, value] of [[controls.classic, 'klass', q.classic], [controls.rel, 'rel', q.rel]]) {
        const formatted = number(value, true);
        inline(node, `p_\\mathrm{${symbol}}${relation}${formatted.tex}\\,\\mathrm{kg\\,m/s}`,
          `*p* (${symbol === 'klass' ? 'klassisch' : 'relativistisch'}) ${relationText} ${formatted.plain} kg m/s`);
      }
      controls.difference.replaceChildren();
      if (beta === 0) controls.difference.textContent = 'Beide Impulse sind null.';
      else {
        const deviation = number(q.difference * 100);
        const amount = document.createElement('span');
        inline(amount, `${deviation.tex}\\,\\%`, `${deviation.plain} %`);
        controls.difference.append('Klassisch ', amount, ' kleiner');
      }
      for (const element of controls.viewButtons)
        element.setAttribute('aria-pressed', String(element.dataset.momentumView === state.view));
      for (const element of controls.presetButtons)
        element.setAttribute('aria-pressed', String(q.difference !== null &&
          Math.abs(Number(element.dataset.momentumUnderestimate) - q.difference) < 1e-12));
      Object.assign(controls.host.dataset, {
        momentumBeta: beta, momentumGamma: q.gamma, momentumClassical: q.classic,
        momentumRelativistic: q.rel, momentumRelativeDifference: q.difference ?? 'undefined',
        momentumView: state.view,
        momentumYMax: view.yMax, momentumUnit: UNIT
      });

      SRT.clear(parent);
      SRT.el('rect', { width: 640, height: 350, fill: '#fff' }, parent);
      const defs = SRT.el('defs', {}, parent);
      const clipId = controls.id + '-plot';
      const clip = SRT.el('clipPath', { id: clipId }, defs);
      SRT.el('rect', { x: P.x, y: P.y, width: P.w, height: P.h }, clip);
      for (const value of view.yTicks) {
        const y = py(value * UNIT);
        line(parent, P.x, y, P.x + P.w, y);
        text(parent, P.x - 14, y + 8, fmt(value, 1), { 'text-anchor': 'end' });
      }
      for (const value of view.xTicks) {
        const x = px(value);
        line(parent, x, P.y, x, P.y + P.h);
        text(parent, x, P.y + P.h + 28, fmt(value, 2), { 'text-anchor': 'middle' });
      }
      if (state.view === 'wide')
        line(parent, px(1), P.y, px(1), P.y + P.h, { stroke: '#8c9fac', 'stroke-dasharray': '5 5', 'data-momentum-asymptote': '' });

      line(parent, P.x, P.y - 8, P.x, P.y + P.h, { stroke: COLORS.axis, 'stroke-width': 2 });
      line(parent, P.x, P.y + P.h, P.x + P.w + 7, P.y + P.h, { stroke: COLORS.axis, 'stroke-width': 2 });
      SRT.el('path', { d: `M${P.x} ${P.y - 16} l-6 12 h12 Z`, fill: COLORS.axis }, parent);
      SRT.el('path', { d: `M${P.x + P.w + 17} ${P.y + P.h} l-12 -6 v12 Z`, fill: COLORS.axis }, parent);
      mathLabel(parent, P.x, 25, 'p\\;\\text{in }10^{-19}\\,\\mathrm{kg\\,m/s}', '*p* in 10⁻¹⁹ kg m/s', 24);
      mathLabel(parent, P.x + P.w / 2, 307, 'v/c', '*v* / *c*', 27, 'middle');

      const curves = SRT.el('g', { 'clip-path': `url(#${clipId})` }, parent);
      const points = [];
      // Im Überblick reicht die Kurve bis über den oberen Bildrand hinaus.
      // Bei beta = 1 gibt es keinen endlichen Impulswert.
      const endBeta = state.view === 'wide' ? .9999 : view.axisMax;
      for (let n = 0; n <= 1400; n++) {
        const b = n / 1400 * endBeta;
        points.push(`${px(b)},${py(quantities(b).rel)}`);
      }
      line(curves, px(0), py(0), px(view.axisMax), py(MASS * C * view.axisMax), {
        stroke: COLORS.classic, 'stroke-width': 3.2, 'stroke-dasharray': '9 6', 'data-momentum-classical-curve': ''
      });
      SRT.el('polyline', {
        points: points.join(' '), fill: 'none', stroke: COLORS.rel, 'stroke-width': 3.4,
        'data-momentum-relativistic-curve': ''
      }, curves);
      line(parent, px(beta), py(q.classic), px(beta), py(q.rel), {
        stroke: '#75818c', 'stroke-width': 1.5, 'stroke-dasharray': '4 5',
        'data-momentum-point-connection': ''
      });
      SRT.el('rect', {
        x: px(beta) - 5, y: py(q.classic) - 5, width: 10, height: 10,
        fill: '#fff', stroke: COLORS.classic, 'stroke-width': 2.4,
        'data-momentum-classical-point': '', 'data-momentum': q.classic
      }, parent);
      SRT.el('circle', {
        cx: px(beta), cy: py(q.rel), r: 4.4, fill: COLORS.rel, stroke: '#fff', 'stroke-width': 1,
        'data-momentum-relativistic-point': '', 'data-momentum': q.rel
      }, parent);
      line(parent, 88, 337, 130, 337, { stroke: COLORS.classic, 'stroke-width': 3.2, 'stroke-dasharray': '9 6' });
      SRT.el('rect', { x: 104, y: 332, width: 10, height: 10, fill: '#fff', stroke: COLORS.classic, 'stroke-width': 2.4 }, parent);
      text(parent, 142, 345, 'klassisch', { 'font-size': 22 });
      line(parent, 322, 337, 364, 337, { stroke: COLORS.rel, 'stroke-width': 3.4 });
      SRT.el('circle', { cx: 343, cy: 337, r: 4.4, fill: COLORS.rel, stroke: '#fff', 'stroke-width': 1 }, parent);
      text(parent, 376, 345, 'relativistisch', { 'font-size': 22 });
    }
  });
})();
