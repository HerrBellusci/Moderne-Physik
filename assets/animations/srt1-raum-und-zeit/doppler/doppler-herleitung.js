(function () {
  const SRT = window.SRTSlide;
  const C = { ink: '#243447', wave: '#0b8793', faint: '#aebdc9', movement: '#607286' };
  const compact = p => {
    const width=p.ownerSVGElement.parentElement.clientWidth;
    return width>0 && width<400;
  };
  const text = (p,x,y,s,attrs={}) => SRT.addText(p,x,y,s,'label',{'font-size':compact(p)?32:24,'font-weight':400,fill:C.ink,...attrs});
  const line = (p,x1,y1,x2,y2,attrs={}) => SRT.el('line',{x1,y1,x2,y2,stroke:C.faint,'stroke-width':1.5,...attrs},p);
  function math(p,x,y,tex) {
    const size=compact(p)?36:28;
    if (!window.SRTMath?.label(p,x,y,tex,size,'middle',C.ink)) text(p,x,y,tex.replaceAll('\\,',' ').replaceAll('\\Delta','Δ').replaceAll('\\lambda','λ').replaceAll('_0','₀'),{'text-anchor':'middle','font-size':size});
  }
  function span(p,a,b,y,tex) {
    line(p,a+7,y,b-7,y,{stroke:C.ink,'stroke-width':2});
    SRT.el('path',{d:`M${a+8},${y-4} L${a},${y} L${a+8},${y+4} M${b-8},${y-4} L${b},${y} L${b-8},${y+4}`,fill:'none',stroke:C.ink,'stroke-width':2},p);
    math(p,(a+b)/2,y-12,tex);
  }
  function source(p,x,y) {
    SRT.el('rect',{x:x-10,y:y-15,width:20,height:30,rx:4,fill:C.ink},p);
    SRT.el('circle',{cx:x,cy:y,r:4,fill:'#fff'},p);
    text(p,compact(p)?Math.max(94,x):x,y+(compact(p)?42:47),'Lichtquelle',{'text-anchor':'middle'});
  }
  function front(p,origin,radius,y) {
    // An emitted spherical wave remains centred on its emission event.
    // This circular arc is its section through the plane of the diagram.
    const halfHeight=88;
    const edge=origin+Math.sqrt(radius*radius-halfHeight*halfHeight);
    SRT.el('path',{
      d:`M${edge},${y-halfHeight} A${radius},${radius} 0 0 1 ${edge},${y+halfHeight}`,
      fill:'none',stroke:C.wave,'stroke-width':3.5,
      'data-wave-front':'1','data-emission-x':origin,'data-radius':radius
    },p);
    text(p,origin+radius+22,y+8,'1',{'text-anchor':'middle'});
  }
  function newbornFront(p,x,y) {
    // Front 2 has zero radius at this instant. Its dot marks the source event.
    SRT.el('circle',{cx:x,cy:y,r:5,fill:C.wave,'data-wave-front':'2'},p);
    text(p,x+20,y-27,'2',{'text-anchor':'middle'});
  }
  function arrow(p,a,b,y) {
    const sign=Math.sign(b-a);
    line(p,a,y,b,y,{stroke:C.movement,'stroke-width':2.5});
    SRT.el('path',{d:`M${b-sign*9},${y-5} L${b},${y} L${b-sign*9},${y+5}`,fill:'none',stroke:C.movement,'stroke-width':2.5},p);
    math(p,(a+b)/2,y-12,'v');
  }
  function prepare(parent,heading,h) {
    const host=parent.ownerSVGElement.parentElement;
    parent.ownerSVGElement.setAttribute('viewBox',`0 0 640 ${h}`);
    if (!host.querySelector('.doppler-heading')) {
      const title=document.createElement('div');title.className='doppler-heading';title.textContent=heading;host.prepend(title);
    }
    if(window.ResizeObserver && !host.__dopplerSketchResizeObserver) {
      host.__dopplerSketchResizeObserver=new window.ResizeObserver(()=>host.dispatchEvent(new Event('srt-render')));
      host.__dopplerSketchResizeObserver.observe(host);
    }
    const ready=Boolean(window.SRTMath?.ready);
    const small=compact(parent);
    if(host.dataset.mathReady===String(ready) && host.dataset.sketchCompact===String(small)) return false;
    host.dataset.mathReady=String(ready);
    host.dataset.sketchCompact=String(small);
    SRT.clear(parent);
    SRT.el('rect',{width:640,height:h,fill:'#fff'},parent);
    return true;
  }
  function renderQuelle({parent}) {
    if(!prepare(parent,'Ruhesystem der Lichtquelle',250)) return;
    const a=140,radius=320*Math.sqrt(1-.3**2),b=a+radius,y=128;
    for(const x of [a,b]) line(parent,x,40,x,233,{'stroke-dasharray':'4 5'});
    span(parent,a,b,42,'\\lambda_0');
    front(parent,a,radius,y);source(parent,a,y);newbornFront(parent,a,y);
    span(parent,a,b,234,'c\\,\\Delta t_0');
  }
  function moving(parent,recede) {
    if(!prepare(parent,'Ruhesystem des Empfängers',290)) return;
    const radius=320,old=recede?165:140,now=old+(recede?-96:96),first=old+radius,y=128;
    for(const x of [old,now,first]) line(parent,x,40,x,270,{'stroke-dasharray':'4 5'});
    span(parent,now,first,42,'\\lambda');
    front(parent,old,radius,y);
    SRT.el('circle',{cx:old,cy:y,r:7,fill:'#fff',stroke:C.movement,'stroke-width':2},parent);
    arrow(parent,old+(recede?-12:12),now+(recede?18:-18),y);
    source(parent,now,y);newbornFront(parent,now,y);
    SRT.el('circle',{cx:578,cy:y-6,r:8,fill:C.ink},parent);
    SRT.el('path',{d:`M564,${y+19} Q578,${y-1} 592,${y+19}`,fill:'none',stroke:C.ink,'stroke-width':4},parent);
    text(parent,compact(parent)?636:578,y+47,'Empfänger',{'text-anchor':compact(parent)?'end':'middle','font-size':compact(parent)?28:24});
    span(parent,Math.min(old,now),Math.max(old,now),221,'v\\,\\Delta t');
    span(parent,old,first,273,'c\\,\\Delta t');
  }
  SRT.register('doppler-bzg-quelle',{render:renderQuelle,showMotionControl:false});
  SRT.register('doppler-bzg-beobachter',{render:({parent})=>moving(parent,false),showMotionControl:false});
  SRT.register('doppler-bzg-beobachter-entfernt',{render:({parent})=>moving(parent,true),showMotionControl:false});
  window.addEventListener('load',async()=>{
    await window.MathJax?.startup?.promise;
    window.requestAnimationFrame(()=>document.querySelectorAll('[data-srt-animation^="doppler-bzg-"]').forEach(h=>h.dispatchEvent(new Event('srt-render'))));
  },{once:true});
})();
