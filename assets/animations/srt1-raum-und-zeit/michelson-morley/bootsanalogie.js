(function () {
  // Fixed example: all positions are measured relative to the bank.
  const u = 5, v = 3, length = 60;
  const crossSpeed = Math.sqrt(u * u - v * v);
  const outTime = length / (u + v);
  const alongTime = outTime + length / (u - v);
  const crossTime = 2 * length / crossSpeed;
  const scale = 4, origin = { x: 135, y: 330 };
  const format = value => value.toFixed(1).replace('.', ',');

  window.SRTSlide.register('boote', {
    showMotionControl: false,
    render({ parent, t, SRT }) {
      // Threefold time lapse, followed by a six-model-second finish hold.
      const time = Math.min((t * 0.003) % (alongTime + 6), alongTime);
      const host = parent.ownerSVGElement.parentElement;
      let clocks = host.querySelector('.mp-boat-clocks');
      if (!clocks) {
        const heading = document.createElement('div');
        heading.className = 'mp-boat-heading';
        heading.textContent = 'Draufsicht';
        host.prepend(heading);
        clocks = document.createElement('div');
        clocks.className = 'mp-boat-clocks';
        host.append(clocks);
        for (const name of ['Längsfahrt', 'Querfahrt']) {
          const item = document.createElement('span');
          const label = document.createElement('strong');
          label.textContent = name;
          item.append(label, document.createElement('span'));
          clocks.append(item);
        }
      }
      [alongTime, crossTime].forEach((end, i) => {
        clocks.children[i].lastElementChild.textContent = format(Math.min(time, end)) + ' s' + (time >= end ? ' · zurück' : '');
      });
      SRT.clear(parent);
      const el = (tag, attrs, target = parent) => SRT.el(tag, attrs, target);
      const text = (x, y, value, attrs = {}) => SRT.addText(parent, x, y, value, '', { 'font-size': 21, fill: '#16334a', ...attrs });
      el('rect', { width: 580, height: 385, fill: '#e4f3fa' });
      el('rect', { width: 580, height: 90, fill: '#ede8d7' });
      el('rect', { y: 330, width: 580, height: 55, fill: '#ede8d7' });
      el('line', { x1: 0, y1: 90, x2: 580, y2: 90, stroke: '#b3ad98', 'stroke-width': 2 });
      el('line', { x1: 0, y1: 330, x2: 580, y2: 330, stroke: '#b3ad98', 'stroke-width': 2 });
      text(325, 135, 'Strömung 3 m/s');
      for (const y of [165, 210, 255]) {
        el('path', { d: `M325 ${y}h130m-12 -7 12 7-12 7`, fill: 'none', stroke: '#4485a2', 'stroke-width': 2 });
      }
      el('path', { d: 'M135 90V330H375', fill: 'none', stroke: '#35576a', 'stroke-width': 2, 'stroke-dasharray': '6 6' });
      [[135, 330], [135, 90], [375, 330]].forEach(([cx, cy]) => el('circle', { cx, cy, r: 5, fill: '#16334a' }));
      text(135, 363, 'Start / Ziel', { 'text-anchor': 'middle' });
      text(255, 310, '60 m', { 'text-anchor': 'middle' });
      text(88, 218, '60 m', { 'text-anchor': 'middle' });
      text(135, 67, 'Wendepunkt', { 'text-anchor': 'middle' });
      text(375, 363, 'Wendepunkt', { 'text-anchor': 'middle' });

      function boat(x, y, angle, colour, label) {
        const g = el('g', { transform: `translate(${x} ${y}) rotate(${angle})`, 'data-boat': label });
        el('path', { d: 'M23 0Q9 -12 -18 -10L-18 10Q9 12 23 0Z', fill: colour, stroke: '#172e40', 'stroke-width': 1.6 }, g);
        el('path', { d: 'M12 0L4 -5H-11V5H4Z', fill: '#ffffff', opacity: .9 }, g);
        el('line', { x1: -8, y1: -5, x2: -8, y2: 5, stroke: '#637788', 'stroke-width': 1.5 }, g);
      }
      const alongDistance = time <= outTime ? (u + v) * time : Math.max(0, length - (u - v) * (time - outTime));
      const crossElapsed = Math.min(time, crossTime);
      const crossDistance = crossElapsed <= crossTime / 2 ? crossSpeed * crossElapsed : crossSpeed * (crossTime - crossElapsed);
      boat(origin.x + alongDistance * scale, origin.y, time < outTime ? 0 : 180, '#eaa544', 'Längsfahrt');
      // The bow points upstream on both legs; the water cancels its x-component.
      boat(origin.x, origin.y - crossDistance * scale, Math.atan2(crossElapsed < crossTime / 2 ? -crossSpeed : crossSpeed, -v) * 180 / Math.PI, '#7658b0', 'Querfahrt');
    }
  });
})();
