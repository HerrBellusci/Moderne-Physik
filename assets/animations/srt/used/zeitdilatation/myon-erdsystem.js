// Eigene lokale Darstellung des ausdrücklich gewählten Einzelmyon-Beispiels.
// Die angenommene Eigenlebensdauer entspricht dem Mittelwert von 2,2 µs.
// Keine Zufallssimulation und keine Behauptung einer festen Lebensdauer aller Myonen.
(function () {
  const SRT = window.SRTSlide;
  const MODEL = Object.freeze({ c: 3e8, beta: .998, height: 1e4, properLifetime: 2.2e-6 });
  const speed = MODEL.c * MODEL.beta;
  const gamma = 1 / Math.sqrt(1 - MODEL.beta ** 2);
  const flightTime = MODEL.height / speed;
  const W = 560, H = 470, X = 320, TOP = 78, GROUND = 380;
  const SCALE = (GROUND - TOP) / MODEL.height;
  // In beiden Darstellungen derselbe Maßstab für Strecke UND Wiedergabezeit.
  const MS_PER_US = 170, LEAD = 650, HOLD = 2400;
  const C = { ink: '#243447', muted: '#607286', line: '#dce5ea', muon: '#6756bb', decay: '#b54848', arrival: '#0b796f' };
  const text = (p, x, y, value, attrs = {}) => SRT.addText(p, x, y, value, 'label', {
    'font-size': 28, 'font-weight': 400, fill: C.ink, ...attrs
  });
  const line = (p, x1, y1, x2, y2, attrs = {}) => SRT.el('line', {
    x1, y1, x2, y2, stroke: C.line, 'stroke-width': 2, ...attrs
  }, p);
  const fmt = (v, digits = 1) => v.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  function values(parent, lifetime) {
    const host = parent.ownerSVGElement.parentElement;
    if (host.__muonUi) return host.__muonUi;
    const heading = document.createElement('div'); heading.className = 'muon-heading';
    heading.textContent = 'Erdsystem';
    host.prepend(heading);
    const list = document.createElement('dl'); list.className = 'muon-values';
    function row(name, value = '') {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = name; dd.textContent = value; list.append(dt, dd); return dd;
    }
    row('Lebensdauer im Beispiel', fmt(lifetime * 1e6) + ' µs');
    const elapsed = row('Zeit seit Entstehung');
    const status = document.createElement('div'); status.className = 'muon-status';
    const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'muon-reset'; reset.textContent = 'Zurücksetzen';
    reset.addEventListener('click', () => host.dispatchEvent(new Event('srt-reset')));
    host.append(list, status, reset);
    return host.__muonUi = { host, elapsed, status };
  }

  function scene(parent) {
    SRT.el('rect', { width: W, height: H, fill: '#fff' }, parent);
    SRT.el('rect', { x: 242, y: TOP, width: 156, height: GROUND-TOP, fill: '#eef2fa' }, parent);
    text(parent, 55, 229, 'Abstand in km', { 'font-size': 25, 'text-anchor': 'middle', transform: 'rotate(-90 55 229)', fill: C.muted });
    for (let km = 0; km <= 10; km += 2) {
      const y = TOP + SCALE * km * 1000;
      line(parent, 154, y, 412, y, { stroke: km === 0 ? '#a6b3c4' : '#dce5ea', 'stroke-dasharray': km === 0 ? '5 5' : 'none' });
      text(parent, 131, y + 9, String(km), { 'text-anchor': 'end', 'font-size': 27, fill: C.muted });
    }
    line(parent, 154, TOP, 154, GROUND, { stroke: '#a6b3c4' });
    line(parent, 207, GROUND, 442, GROUND, { stroke: C.ink, 'stroke-width': 3 });
    for (let n = 0; n < 11; n++) line(parent, 213+n*21, GROUND+2, 205+n*21, GROUND+12, {stroke:'#9aa8b8','stroke-width':1.5});
    SRT.el('rect', { x: X-28, y: GROUND, width: 56, height: 15, rx: 3, fill: '#a9b9c8', stroke: C.ink }, parent);
    text(parent, X, 437, 'Erdboden mit Detektor', { 'font-size': 27, 'text-anchor': 'middle' });
  }

  function render(parent, t, relativistic) {
    const lifetime = MODEL.properLifetime * (relativistic ? gamma : 1);
    const endTime = Math.min(lifetime, flightTime);
    const travelMs = endTime * 1e6 * MS_PER_US;
    const phase = t % (LEAD + travelMs + HOLD);
    const elapsed = Math.max(0, Math.min((phase - LEAD) / MS_PER_US * 1e-6, endTime));
    const travelled = speed * elapsed;
    const arrived = lifetime >= flightTime;
    const ended = phase >= LEAD + travelMs;
    const status = ended ? (arrived ? 'Erdboden erreicht' : 'Myon zerfallen') : '';
    const ui = values(parent, lifetime);
    ui.elapsed.textContent = fmt(elapsed * 1e6) + ' µs';
    ui.status.textContent = status;
    ui.status.dataset.outcome = ended ? (arrived ? 'arrival' : 'decay') : 'flight';
    ui.host.dataset.muonTime = elapsed;
    ui.host.dataset.muonDistance = travelled;
    ui.host.dataset.muonLifetime = lifetime;
    ui.host.dataset.muonOutcome = ui.status.dataset.outcome;
    SRT.clear(parent); scene(parent);
    const y = TOP + travelled * SCALE;
    line(parent, X, TOP, X, y, { stroke: C.muon, 'stroke-width': 4 });
    if (!ended) {
      SRT.el('circle', { cx: X, cy: y, r: 16, fill: C.muon, opacity: .13 }, parent);
      SRT.el('circle', { cx: X, cy: y, r: 7.5, fill: C.muon, stroke: '#fff', 'stroke-width': 2, 'data-muon-position': '' }, parent);
    } else if (arrived) {
      SRT.el('rect', { x: X-28, y: GROUND, width: 56, height: 15, rx: 3, fill: C.arrival }, parent);
      SRT.el('circle', { cx: X, cy: GROUND, r: 14, fill: 'none', stroke: C.arrival, 'stroke-width': 3 }, parent);
    } else {
      // Kreuz markiert das vorgegebene Zerfallsereignis dieses Beispielmyons.
      // Keine Lebensvorratsanzeige, kein aus einem Überlebensanteil abgeleiteter Zerfall.
      line(parent, X-10, y-10, X+10, y+10, {stroke:C.decay,'stroke-width':3});
      line(parent, X-10, y+10, X+10, y-10, {stroke:C.decay,'stroke-width':3});
      line(parent, X+17, y, X+80, y, {stroke:C.decay,'stroke-dasharray':'4 4'});
      text(parent, X+90, y+8, '660 m', {fill:C.decay,'font-size':25});
    }
  }
  for (const [id, relativistic] of [['myon-klassisch',false],['myon-relativistisch',true]]) {
    SRT.register(id, { render({parent,t}) { render(parent,t,relativistic); } });
  }
})();
