// Verwendet ausschließlich die bereits lokal eingebundene MathJax-Version.
// Zwischengespeicherte SVG-Glyphen vermeiden erneuten Formelsatz pro Animationsbild.
(function () {
  const cache = new Map();
  let serial = 0;
  const api = window.SRTMath = {
    ready: false,
    inline(tex) {
      if (!api.ready) return null;
      if (!cache.has(tex)) cache.set(tex, window.MathJax.tex2svg(tex, { display: false }));
      const node = cache.get(tex).cloneNode(true);
      const image = node.querySelector('svg');
      // Die allgemeine Zeichenflächenregel setzt SVGs auf volle Breite.
      // Formeln behalten ihre von MathJax vorgegebenen Textabmessungen.
      image.style.width = image.getAttribute('width');
      image.style.height = image.getAttribute('height');
      image.style.display = 'inline-block';
      image.style.aspectRatio = 'auto';
      const prefix = `srt-math-${++serial}-`;
      for (const el of node.querySelectorAll('[id]')) el.id = prefix + el.id;
      for (const el of node.querySelectorAll('use')) {
        for (const attr of [...el.attributes]) {
          if (attr.localName === 'href' && attr.value.startsWith('#'))
            el.setAttributeNS(attr.namespaceURI, attr.name, '#' + prefix + attr.value.slice(1));
        }
      }
      return node;
    },
    label(parent, x, baseline, tex, size = 28, anchor = 'start', color = '#243447') {
      const node = api.inline(tex);
      if (!node) return false;
      const svg = node.querySelector('svg');
      const box = svg.getAttribute('viewBox').split(/\s+/).map(Number);
      const scale = size / 1000, width = box[2] * scale;
      svg.removeAttribute('style');
      svg.setAttribute('x', x - (anchor === 'middle' ? width / 2 : anchor === 'end' ? width : 0));
      svg.setAttribute('y', baseline + box[1] * scale);
      svg.setAttribute('width', width);
      svg.setAttribute('height', box[3] * scale);
      svg.style.width = width + 'px';
      svg.style.height = box[3] * scale + 'px';
      svg.style.aspectRatio = 'auto';
      svg.style.color = color;
      svg.setAttribute('data-srt-math', tex);
      parent.append(svg);
      return true;
    }
  };
  async function start() {
    if (!window.MathJax?.startup?.promise) return;
    await window.MathJax.startup.promise;
    api.ready = true;
    for (const host of document.querySelectorAll('[data-srt-animation="gamma-plot"], [data-srt-animation="drehung-invarianz"], [data-srt-animation="laser-hene"], [data-srt-animation="laser-hene-niveaus"]'))
      host.dispatchEvent(new Event('srt-render'));
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
})();
