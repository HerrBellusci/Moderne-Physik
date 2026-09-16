// Eigene lokale SVG-/HTML-Animation. Veranschaulicht Invarianz unter
// räumlichen Drehungen, keine Lorentztransformation und kein Raumzeitdiagramm.
(function () {
  const SRT = window.SRTSlide;
  const SCALE = 56, O = { x: 320, y: 230 };
  const color = { ink: '#243447', muted: '#607286', a: '#256b98', b: '#a75d19', d: '#0b796f' };
  const point = p => ({ x: O.x + SCALE * p.x, y: O.y - SCALE * p.y });
  const fmt = n => (Math.abs(n) < .005 ? 0 : n).toFixed(2).replace('.', ',').replace('-', '−');
  const text = (p, x, y, value, attrs = {}) => SRT.addText(p, x, y, value, 'label', {
    'font-size': 25, fill: color.ink, ...attrs
  });
  function math(p, x, y, tex, fallback, anchor = 'start', ink = color.ink) {
    if (!window.SRTMath?.label(p, x, y, tex, 28, anchor, ink))
      text(p, x, y, fallback, { 'text-anchor': anchor, fill: ink });
  }
  const line = (p, a, b, attrs = {}) => SRT.el('line', {
    x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#e2e9ed', 'stroke-width': 1.5, ...attrs
  }, p);
  function ui(parent) {
    const host = parent.ownerSVGElement.parentElement;
    if (host.__invarianceUi) return host.__invarianceUi;
    const values = document.createElement('div'); values.className = 'invariance-values';
    const coords = document.createElement('div'); coords.className = 'invariance-coordinates';
    const heading = document.createElement('div'); heading.textContent = 'Koordinaten';
    const a = document.createElement('div'), b = document.createElement('div');
    a.style.color = color.a; b.style.color = color.b;
    coords.append(heading, a, b);
    const distance = document.createElement('div'); distance.className = 'invariance-distance';
    const name = document.createElement('div'); name.textContent = 'Abstand unter Drehung';
    const value = document.createElement('div'); value.className = 'invariance-constant';
    value.textContent = 'd = 4';
    const unit = document.createElement('div'); unit.textContent = 'Längeneinheiten';
    distance.append(name, value, unit); values.append(coords, distance);
    const controls = document.createElement('div'); controls.className = 'invariance-controls';
    const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = 'Zurücksetzen';
    reset.addEventListener('click', () => host.dispatchEvent(new Event('srt-reset')));
    controls.append(reset); host.append(values, controls);
    host.__invarianceUi = { a, b, value };
    return host.__invarianceUi;
  }
  SRT.register('drehung-invarianz', ({ parent, t }) => {
    const theta = t / 20000 * 2 * Math.PI;
    const c = Math.cos(theta), s = Math.sin(theta);
    const a = { x: -2*c - 1.5*s, y: -2*s + 1.5*c };
    const b = { x: 2*c - 1.5*s, y: 2*s + 1.5*c };
    const controls = ui(parent);
    const ca = `A (${fmt(a.x)} | ${fmt(a.y)})`, cb = `B (${fmt(b.x)} | ${fmt(b.y)})`;
    if (controls.a.textContent !== ca) controls.a.textContent = ca;
    if (controls.b.textContent !== cb) controls.b.textContent = cb;
    if (window.SRTMath?.ready && !controls.value.querySelector('mjx-container'))
      controls.value.replaceChildren(window.SRTMath.inline('d=4'));
    SRT.clear(parent);
    SRT.el('rect', { width: 640, height: 460, fill: '#fff' }, parent);
    for (let n = -3; n <= 3; n++) {
      line(parent, point({x:n,y:-3.4}), point({x:n,y:3.4}));
      line(parent, point({x:-4.7,y:n}), point({x:4.7,y:n}));
      if (n) {
        text(parent, O.x+n*SCALE, O.y+27, String(n).replace('-', '−'), { 'text-anchor': 'middle', 'font-size': 22, fill: color.muted });
        text(parent, O.x-13, O.y-n*SCALE+8, String(n).replace('-', '−'), { 'text-anchor': 'end', 'font-size': 22, fill: color.muted });
      }
    }
    line(parent, {x:52,y:O.y}, {x:591,y:O.y}, {stroke:color.muted,'stroke-width':2});
    line(parent, {x:O.x,y:426}, {x:O.x,y:31}, {stroke:color.muted,'stroke-width':2});
    SRT.el('path', {d:`M599 ${O.y} l-12 -6 v12 Z M${O.x} 23 l-6 12 h12 Z`,fill:color.muted},parent);
    math(parent, 607, O.y+9, 'x', '*x*'); math(parent, O.x-20, 30, 'y', '*y*', 'end');
    text(parent, O.x-12, O.y+27, '0', {'text-anchor':'end','font-size':22,fill:color.muted});
    for (const [p,ink] of [[a,color.a],[b,color.b]]) {
      const pos=point(p);
      line(parent,pos,point({x:p.x,y:0}),{stroke:ink,'stroke-dasharray':'4 5',opacity:.4});
      line(parent,pos,point({x:0,y:p.y}),{stroke:ink,'stroke-dasharray':'4 5',opacity:.4});
    }
    const pa=point(a),pb=point(b);
    line(parent,pa,pb,{stroke:color.d,'stroke-width':4,'data-invariant-segment':'',
      'data-distance':Math.hypot(b.x-a.x,b.y-a.y)});
    const mx=(pa.x+pb.x)/2,my=(pa.y+pb.y)/2;
    SRT.el('rect',{x:mx-21,y:my-21,width:42,height:36,rx:8,fill:'#fff',stroke:'#c9e1dc'},parent);
    math(parent,mx,my+9,'d','*d*','middle',color.d);
    for (const [p,name,ink] of [[a,'A',color.a],[b,'B',color.b]]) {
      const pos=point(p);
      SRT.el('circle',{cx:pos.x,cy:pos.y,r:7,fill:ink,stroke:'#fff','stroke-width':2,'data-invariant-point':name},parent);
      math(parent,pos.x+(p.x>=0?16:-16),pos.y+(p.y>=0?-14:28),name,name,p.x>=0?'start':'end',ink);
    }
  });
})();
