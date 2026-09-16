// Eigene lokale SVG-/HTML-Darstellung ohne externe Abhängigkeiten.
(function () {
  const SRT = window.SRTSlide;
  const C = 299792458;
  const MAX = 0.99;
  const P = { x: 66, y: 42, w: 524, h: 308 };
  const fmt = (n, digits = 3) => n.toLocaleString('de-DE', { maximumFractionDigits: digits });
  const gamma = b => 1 / Math.sqrt(1 - b * b);
  // Stabile Differenz auch bei Alltagsgeschwindigkeiten: kein Subtrahieren
  // zweier fast gleicher Zahlen (gamma - 1).
  const excess = b => {
    const root = Math.sqrt(1 - b * b);
    return b * b / (root * (1 + root));
  };
  const label = (p, x, y, value, attrs = {}) => SRT.addText(p, x, y, value, 'label', {
    'font-size': 25, fill: '#243447', ...attrs
  });
  const line = (p, x1, y1, x2, y2, attrs = {}) => SRT.el('line', {
    x1, y1, x2, y2, stroke: '#dce5ea', 'stroke-width': 1.5, ...attrs
  }, p);
  const px = b => P.x + b * P.w;
  const py = g => P.y + P.h - g / 8 * P.h;
  function ui(parent, state) {
    const host = parent.ownerSVGElement.parentElement;
    if (host.__gammaUi) return host.__gammaUi;
    const wrap = document.createElement('div'); wrap.className = 'gamma-controls';
    const rangeLabel = document.createElement('label'); rangeLabel.textContent = 'Relativgeschwindigkeit';
    const input = document.createElement('input');
    input.type = 'range'; input.min = 0; input.max = MAX; input.step = .001;
    input.setAttribute('aria-label', 'Relativgeschwindigkeit in Anteilen der Lichtgeschwindigkeit');
    rangeLabel.append(input);
    const values = document.createElement('div'); values.className = 'gamma-values';
    const speed = document.createElement('div');
    const factor = document.createElement('div');
    values.append(speed, factor);
    const presets = document.createElement('div'); presets.className = 'gamma-presets';
    const update = b => { state.beta = b; host.dispatchEvent(new Event('srt-render')); };
    input.addEventListener('input', () => update(Number(input.value)));
    for (const [name, b] of [['100 km/h', 100 / (C * 3.6)], ['900 km/h', 900 / (C * 3.6)], ['0,4 % von c', .004]]) {
      const button = document.createElement('button'); button.type = 'button';
      if (name.endsWith(' c')) { button.append('0,4 % von '); const i = document.createElement('i'); i.textContent = 'c'; button.append(i); }
      else button.textContent = name;
      button.dataset.beta = b;
      button.addEventListener('click', () => update(b)); presets.append(button);
    }
    wrap.append(rangeLabel, values, presets); host.append(wrap);
    host.__gammaUi = { input, speed, factor, presets };
    return host.__gammaUi;
  }
  function math(el, symbol, rest) {
    const tex = symbol === 'γ' ? '\\gamma' : symbol;
    const glyph = window.SRTMath?.inline(tex);
    if (glyph) el.append(glyph, rest);
    else { const i = document.createElement('i'); i.textContent = symbol; el.append(i, rest); }
  }
  SRT.register('gamma-plot', {
    initialState: { beta: .004 },
    render({ parent, state }) {
      const b = state.beta, g = gamma(b), delta = excess(b);
      const controls = ui(parent, state);
      const key = `${b}-${!!window.SRTMath?.ready}`;
      if (parent.__gammaBeta === key) return;
      parent.__gammaBeta = key;
      controls.input.value = b;
      controls.input.setAttribute('aria-valuetext', `${fmt(b * 100, 8)} Prozent der Lichtgeschwindigkeit, ${fmt(b * C * 3.6, 0)} Kilometer pro Stunde`);
      controls.speed.replaceChildren();
      math(controls.speed, 'v', ' = ' + fmt(b * C * 3.6, 0) + ' km/h');
      const ratio = document.createElement('span'); ratio.className = 'gamma-ratio';
      ratio.append(' (' + fmt(b * 100, 8) + ' % von '); math(ratio, 'c', ')'); controls.speed.append(ratio);
      controls.factor.replaceChildren();
      math(controls.factor, 'γ', b === 0 ? ' = 1' : ' ≈ ' + (delta < 5e-9 ? '1' : fmt(g, 8)));
      for (const button of controls.presets.children) button.setAttribute('aria-pressed', String(Number(button.dataset.beta) === b));
      SRT.clear(parent);
      SRT.el('rect', { width: 640, height: 430, fill: '#fff' }, parent);
      for (const v of [0, 2, 4, 6, 8]) {
        const y = py(v); line(parent, P.x, y, P.x + P.w, y);
        label(parent, P.x - 16, y + 8, String(v), { 'text-anchor': 'end' });
      }
      for (const v of [0, .2, .4, .6, .8, 1]) {
        const x = px(v); line(parent, x, P.y, x, P.y + P.h);
        label(parent, x, P.y + P.h + 33, fmt(v, 1), { 'text-anchor': 'middle' });
      }
      line(parent, P.x, P.y - 10, P.x, P.y + P.h, { stroke: '#607286', 'stroke-width': 2 });
      line(parent, P.x, P.y + P.h, P.x + P.w + 8, P.y + P.h, { stroke: '#607286', 'stroke-width': 2 });
      SRT.el('path', { d: `M${P.x} ${P.y - 18} l-6 12 h12 Z`, fill: '#607286' }, parent);
      SRT.el('path', { d: `M${P.x + P.w + 18} ${P.y + P.h} l-12 -6 v12 Z`, fill: '#607286' }, parent);
      line(parent, P.x, py(1), P.x + P.w, py(1), { stroke: '#93a7b1', 'stroke-dasharray': '4 5' });
      if (!window.SRTMath?.label(parent, P.x + 18, py(1) - 12, '\\gamma=1', 23, 'start', '#607286')) label(parent, P.x + 18, py(1) - 12, '*γ* = 1');
      if (!window.SRTMath?.label(parent, P.x - 20, 27, '\\gamma', 29)) label(parent, P.x - 20, 27, '*γ*');
      if (!window.SRTMath?.label(parent, P.x + P.w / 2, 414, 'v/c', 28, 'middle')) label(parent, P.x + P.w / 2, 414, '*v* / *c*', { 'text-anchor': 'middle' });
      const points = [];
      // Die Kurve reicht über den sichtbaren Bereich hinaus. Bei v/c = 1
      // liegt die senkrechte Asymptote, kein endlicher Kurvenpunkt.
      const defs = SRT.el('defs', {}, parent);
      const clip = SRT.el('clipPath', { id: 'gamma-kurvenfenster' }, defs);
      SRT.el('rect', { x: P.x, y: P.y, width: P.w, height: P.h }, clip);
      line(parent, px(1), P.y, px(1), P.y + P.h, { stroke: '#93a7b1', 'stroke-dasharray': '4 5' });
      for (let n = 0; n <= 1200; n++) { const beta = n / 1200 * .999; points.push(`${px(beta)},${py(gamma(beta))}`); }
      SRT.el('polyline', { points: points.join(' '), fill: 'none', stroke: '#0b8793', 'stroke-width': 3.5, 'clip-path': 'url(#gamma-kurvenfenster)', 'data-gamma-curve': '' }, parent);
      line(parent, px(b), P.y + P.h, px(b), py(g), { stroke: '#8a610e', 'stroke-dasharray': '5 5' });
      line(parent, P.x, py(g), px(b), py(g), { stroke: '#8a610e', 'stroke-dasharray': '5 5' });
      SRT.el('circle', { cx: px(b), cy: py(g), r: 4, fill: '#f2ad25', stroke: '#885b0b', 'stroke-width': 1.5,
        'data-gamma-point': '', 'data-beta': b, 'data-gamma': g, 'data-excess': delta }, parent);
    }
  });
})();
