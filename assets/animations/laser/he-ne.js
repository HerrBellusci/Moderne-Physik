(function () {
  const C = { ink: '#172033', muted: '#526174', blue: '#2864ad', amber: '#9c5d08', red: '#c72b4c' };
  function text(p, S, x, y, value, size = 24, color = C.ink, anchor = 'start') {
    return S.addText(p, x, y, value, 'hene-label', { 'font-size': size, fill: color, 'text-anchor': anchor, 'font-weight': 500 });
  }
  function line(p, S, x1, y1, x2, y2, color = C.muted, extra = {}) {
    S.el('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': 3, ...extra }, p);
  }
  function arrow(p, S, x1, y1, x2, y2, color, extra = {}) {
    line(p, S, x1, y1, x2, y2, color, extra);
    const a = Math.atan2(y2-y1, x2-x1), d = 11;
    S.el('path', { d: `M${x2-d*Math.cos(a-.5)} ${y2-d*Math.sin(a-.5)} L${x2} ${y2} L${x2-d*Math.cos(a+.5)} ${y2-d*Math.sin(a+.5)}`, fill:'none', stroke:color, 'stroke-width':3, ...extra }, p);
  }
  function setup({ parent:p, SRT:S }) {
    S.clear(p);
    S.el('rect', {width:862,height:390,fill:'white'},p);
    // Vereinfachter Längsschnitt einer Röhre mit integrierten Spiegeln.
    S.el('rect',{x:126,y:153,width:522,height:114,rx:22,fill:'#f5f7fa',stroke:'#718399','stroke-width':3},p);
    S.el('rect',{x:139,y:185,width:496,height:50,rx:15,fill:'#f8dce2'},p);
    text(p,S,387,178,'Helium-Neon-Gemisch',24,C.ink,'middle');
    text(p,S,387,254,'Gasentladung',23,C.red,'middle');
    line(p,S,128,210,650,210,C.red,{'stroke-width':4});
    arrow(p,S,650,210,827,210,C.red,{'stroke-width':4});
    S.el('rect',{x:113,y:167,width:14,height:85,rx:3,fill:'#334155'},p);
    S.el('rect',{x:648,y:167,width:14,height:85,rx:3,fill:'#b2c6d9',stroke:'#657e94'},p);
    [211,562].forEach(x => {
      S.el('rect',{x:x-9,y:136,width:18,height:48,rx:3,fill:'#657184'},p);
      line(p,S,x,136,x,61);
    });
    line(p,S,211,61,310,61); line(p,S,466,61,562,61);
    // Geräteansicht, kein spezielles Schaltzeichen für Hochspannung.
    S.el('rect',{x:310,y:35,width:156,height:60,rx:5,fill:'#edf1f5',stroke:'#526174','stroke-width':2},p);
    S.el('rect',{x:359,y:47,width:58,height:31,rx:2,fill:'white',stroke:'#718399'},p);
    text(p,S,388,70,'U',23,C.muted,'middle');
    text(p,S,322,70,'−',26); text(p,S,435,70,'+',26);
    text(p,S,388,25,'Hochspannungsquelle',24,C.ink,'middle');
    text(p,S,62,116,'Kathode (−)',23);
    arrow(p,S,182,125,206,153,C.muted,{'stroke-width':2});
    text(p,S,597,116,'Anode (+)',23);
    arrow(p,S,595,125,570,153,C.muted,{'stroke-width':2});
    line(p,S,120,258,120,295); line(p,S,655,258,655,295);
    text(p,S,32,323,'hochreflektierender',23); text(p,S,32,351,'Spiegel',23);
    text(p,S,538,323,'teildurchlässiger',23); text(p,S,538,351,'Spiegel',23);
    text(p,S,388,311,'Glasrohr',23,C.muted,'middle');
    line(p,S,388,294,388,269);
    text(p,S,744,163,'Laserstrahl',23,C.red,'middle');
    text(p,S,744,190,'632,8 nm',23,C.red,'middle');
  }
  function levels({ parent:p, SRT:S, state }) {
    S.clear(p);
    S.el('rect',{width:862,height:610,fill:'white'},p);
    text(p,S,263,78,'Helium',28,C.ink,'middle');
    text(p,S,643,78,'Neon',28,C.ink,'middle');
    arrow(p,S,76,492,76,66,C.muted);
    text(p,S,51,88,'*E*',27,C.ink,'end');
    text(p,S,51,117,'eV',22,C.muted,'end');
    // Unterbrochene, nichtlineare Achse; 0,05 eV werden bewusst überzeichnet.
    S.el('path',{d:'M64 444 L88 435 M64 458 L88 449',stroke:'white','stroke-width':10},p);
    S.el('path',{d:'M64 444 L88 435 M64 458 L88 449',stroke:C.muted,'stroke-width':2},p);
    text(p,S,61,507,'0',22,C.muted,'end');
    const yHe=169,yNe=132,yLow=285,yGround=500;
    [[156,354,yHe],[510,794,yNe],[510,794,yLow],[156,354,yGround],[510,794,yGround]].forEach(([a,b,y])=>line(p,S,a,y,b,y,C.ink));
    text(p,S,156,137,'20,61 eV',23,C.amber);
    text(p,S,156,198,'metastabil',23,C.amber);
    text(p,S,510,113,'20,66 eV · oberes Laserniveau',22,C.red);
    text(p,S,510,315,'18,70 eV · unteres Laserniveau',22);
    text(p,S,156,531,'Grundzustand',22);
    text(p,S,510,531,'Grundzustand',22);
    function group(n) { return S.el('g',{opacity:state.step===0||state.step===n?1:.18},p); }
    let g=group(1);
    arrow(g,S,293,484,293,215,C.blue,{'stroke-width':4});
    text(g,S,277,356,'Elektronen-',22,C.blue,'end'); text(g,S,277,383,'stoß',22,C.blue,'end');
    g=group(2);
    arrow(g,S,364,yHe,500,yNe,C.amber,{'stroke-width':4});
    text(g,S,425,213,'He–Ne-Stoß',21,C.amber,'middle');
    text(g,S,425,241,'+ 0,05 eV',21,C.amber,'middle');
    arrow(g,S,323,222,323,484,C.amber,{'stroke-dasharray':'6 7'});
    // Rückkehr des Heliums gehört zur Energieübertragung, nicht zur Laseremission.
    g=group(3);
    arrow(g,S,584,yNe+14,584,yLow-13,C.red,{'stroke-width':4});
    text(g,S,602,201,'Laserübergang',22,C.red); text(g,S,602,228,'632,8 nm',22,C.red);
    g=group(4);
    arrow(g,S,555,330,555,380,C.blue,{'stroke-width':4});
    text(g,S,577,355,'rascher Übergang',22,C.blue);
    text(g,S,577,382,'in tiefere Zustände',22,C.blue);
    line(g,S,522,397,603,397,C.muted,{'stroke-dasharray':'5 5'});
    arrow(g,S,555,412,555,484,C.muted,{'stroke-dasharray':'6 7'});
    text(g,S,577,435,'weitere Übergänge',21,C.muted);
    text(g,S,577,462,'und Wandstöße',21,C.muted);
    text(p,S,28,570,'Ausgewählte Niveaus. Abstände nicht maßstäblich.',22,C.muted);
    text(p,S,28,598,'Die Differenz von 0,05 eV ist vergrößert dargestellt.',22,C.muted);
  }
  window.SRTSlide.register('laser-hene',{showMotionControl:false,render:setup});
  window.SRTSlide.register('laser-hene-niveaus',{
    initialState:{step:0},showMotionControl:false,
    controls:[{type:'segmented',key:'step',label:'Vorgang hervorheben',options:[
      {label:'Übersicht',value:0},{label:'Elektronenstoß',value:1},
      {label:'He–Ne-Stoß',value:2},{label:'Laserübergang',value:3},{label:'Weitere Übergänge',value:4}
    ]}],render:levels
  });
})();
