// Dasselbe Beispielmyon wie in der Zeitdilatation, nun in seinem Ruhesystem.
// Die unkontrahierte Variante führt bewusst die widersprüchliche Annahme L = L0 vor.
(function () {
  const SRT = window.SRTSlide;
  const SPEED = .998 * 3e8, L0 = 10000, LIFETIME = 2.2e-6;
  const GAMMA = 1 / Math.sqrt(1 - .998 ** 2);
  const W = 560, H = 470, X = 320, TOP = 78, BOTTOM = 380;
  // Beide Myon-System-Ansichten: gleiche Wiedergabezeit, verschiedene Ortsskalen.
  const MS_PER_US = 1700, LEAD = 650, HOLD = 2400;
  const C = { ink: '#243447', muted: '#607286', line: '#dce5ea', muon: '#6756bb', decay: '#b54848', arrival: '#0b796f' };
  const fmt = (v, digits = 1) => v.toLocaleString('de-DE', {minimumFractionDigits: digits, maximumFractionDigits: digits});
  const text = (p,x,y,value,attrs={}) => SRT.addText(p,x,y,value,'label',{'font-size':28,'font-weight':400,fill:C.ink,...attrs});
  const line = (p,x1,y1,x2,y2,attrs={}) => SRT.el('line',{x1,y1,x2,y2,stroke:C.line,'stroke-width':2,...attrs},p);

  function values(parent) {
    const host = parent.ownerSVGElement.parentElement;
    if (host.__muonRestUi) return host.__muonRestUi;
    const heading = document.createElement('div'); heading.className = 'muon-heading';
    heading.textContent = 'Myonsystem';
    host.prepend(heading);
    const list = document.createElement('dl'); list.className = 'muon-values';
    function row(name,value='') {
      const dt=document.createElement('dt'),dd=document.createElement('dd');
      dt.textContent=name; dd.textContent=value; list.append(dt,dd); return dd;
    }
    row('Eigenlebensdauer im Beispiel','2,2 µs');
    const elapsed=row('Zeit seit Entstehung');
    const status=document.createElement('div'); status.className='muon-status';
    const reset=document.createElement('button'); reset.type='button'; reset.className='muon-reset'; reset.textContent='Zurücksetzen';
    reset.addEventListener('click',()=>host.dispatchEvent(new Event('srt-reset')));
    host.append(list,status,reset);
    return host.__muonRestUi={host,elapsed,status};
  }

  function render(parent,t,contracted) {
    const length=contracted ? L0/GAMMA : L0;
    const axisMax=contracted ? 700 : 10000;
    const scale=(BOTTOM-TOP)/axisMax;
    const endTime=Math.min(LIFETIME,length/SPEED);
    const travelMs=endTime*1e6*MS_PER_US;
    const phase=t%(LEAD+travelMs+HOLD);
    const elapsed=Math.max(0,Math.min((phase-LEAD)/MS_PER_US*1e-6,endTime));
    const travelled=SPEED*elapsed;
    const ground=TOP+Math.max(0,length-travelled)*scale;
    const movingTop=TOP-travelled*scale;
    const ended=phase>=LEAD+travelMs;
    const arrived=length/SPEED<=LIFETIME;
    const outcome=ended ? (arrived?'arrival':'decay') : 'flight';
    const ui=values(parent);
    ui.elapsed.textContent=fmt(elapsed*1e6,2)+' µs';
    ui.status.textContent=ended ? (arrived?'Boden erreicht das Myon':'Myon zerfallen') : '';
    ui.status.dataset.outcome=outcome;
    Object.assign(ui.host.dataset,{muonTime:elapsed,muonDistance:travelled,muonLifetime:LIFETIME,muonLength:length,muonOutcome:outcome});
    SRT.clear(parent);
    SRT.el('rect',{width:W,height:H,fill:'#fff'},parent);
    // Die obere Begrenzung markiert die mit der Erde bewegte Entstehungshöhe.
    // Außerhalb der Zeichenfläche wird die weiterbewegte Strecke abgeschnitten.
    const visibleTop=Math.max(48,movingTop);
    SRT.el('rect',{x:242,y:visibleTop,width:156,height:Math.max(0,ground-visibleTop),fill:'#eef2fa'},parent);
    text(parent,55,229,'Abstand zum Myon in km',{'text-anchor':'middle','font-size':25,transform:'rotate(-90 55 229)',fill:C.muted});
    const steps=contracted?7:5;
    for(let n=0;n<=steps;n++) {
      const metres=axisMax*n/steps,y=TOP+metres*scale;
      line(parent,154,y,442,y,{stroke:n===0?'#a6b3c4':C.line,'stroke-dasharray':n===0?'5 5':'none'});
      text(parent,131,y+9,fmt(metres/1000,contracted?1:0),{'text-anchor':'end','font-size':27,fill:C.muted});
    }
    line(parent,154,TOP,154,BOTTOM,{stroke:'#a6b3c4'});
    if(movingTop>=48) line(parent,242,movingTop,398,movingTop,{stroke:'#a6b3c4','stroke-dasharray':'5 5'});
    line(parent,207,ground,442,ground,{stroke:C.ink,'stroke-width':3});
    for(let n=0;n<11;n++) line(parent,213+n*21,ground+2,205+n*21,ground+12,{stroke:'#9aa8b8','stroke-width':1.5});
    SRT.el('rect',{x:X-28,y:ground,width:56,height:15,rx:3,fill:ended&&arrived?C.arrival:'#a9b9c8',stroke:C.ink},parent);
    // Beschriftungen bleiben fest; das Myon bleibt am Ursprung der Abstandsskala.
    text(parent,320,437,'Erdboden mit Detektor',{'font-size':27,'text-anchor':'middle'});
    if(!ended) {
      SRT.el('circle',{cx:X,cy:TOP,r:16,fill:C.muon,opacity:.13},parent);
      SRT.el('circle',{cx:X,cy:TOP,r:7.5,fill:C.muon,stroke:'#fff','stroke-width':2,'data-muon-position':''},parent);
    } else if(arrived) {
      SRT.el('circle',{cx:X,cy:TOP,r:14,fill:'none',stroke:C.arrival,'stroke-width':3},parent);
    } else {
      line(parent,X-10,TOP-10,X+10,TOP+10,{stroke:C.decay,'stroke-width':3});
      line(parent,X-10,TOP+10,X+10,TOP-10,{stroke:C.decay,'stroke-width':3});
    }
  }
  for(const [id,contracted] of [['ausgangsproblem',false],['myon-system-kontrahiert',true]]) {
    SRT.register(id,{render({parent,t}){render(parent,t,contracted);}});
  }
})();
