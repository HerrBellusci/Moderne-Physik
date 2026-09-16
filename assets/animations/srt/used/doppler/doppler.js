(function () {
  const SRT=window.SRTSlide,REST=500,MIN=200,MAX=1300;
  const INK='#243447',TEAL='#0b8793',MUTED='#607286';
  const text=(p,x,y,s,attrs={})=>SRT.addText(p,x,y,s,'label',{'font-size':22,'font-weight':400,fill:INK,...attrs});
  const fmt=(v,n=1)=>v.toLocaleString('de-DE',{minimumFractionDigits:n,maximumFractionDigits:n});
  function setup(parent) {
    const host=parent.ownerSVGElement.parentElement;
    if(host.__dopplerSpectrum)return host.__dopplerSpectrum;
    const heading=document.createElement('div');heading.className='doppler-heading';heading.textContent='Spektrallinie und Lichtausbreitung';host.prepend(heading);
    const state={host,beta:0,direction:1};
    const choices=document.createElement('div');choices.className='doppler-controls';choices.setAttribute('role','group');choices.setAttribute('aria-label','Bewegungsrichtung der Lichtquelle');
    for(const [direction,name] of [[-1,'Annäherung'],[1,'Entfernung']]) {
      const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-pressed',String(direction===state.direction));
      b.addEventListener('click',()=>{
        state.direction=direction;
        for(const button of choices.querySelectorAll('[data-direction]'))button.setAttribute('aria-pressed',String(button===b));
        host.dispatchEvent(new Event('srt-reset'));
      });b.dataset.direction=direction;choices.append(b);
    }
    const range=document.createElement('label');range.className='doppler-range';
    const row=document.createElement('span');const title=document.createElement('span');title.textContent='Relativgeschwindigkeit';
    const value=document.createElement('span');value.innerHTML='<i>v</i> = 0,00 <i>c</i>';row.append(title,value);
    const input=document.createElement('input');input.type='range';input.min=0;input.max=.72;input.step=.01;input.value=0;input.setAttribute('aria-label','Relativgeschwindigkeit in Anteilen der Lichtgeschwindigkeit');input.setAttribute('aria-valuetext','0,00 c');
    input.addEventListener('input',()=>{
      state.beta=Number(input.value);value.innerHTML=`<i>v</i> = ${fmt(state.beta,2)} <i>c</i>`;input.setAttribute('aria-valuetext',fmt(state.beta,2)+' c');host.dispatchEvent(new Event('srt-reset'));
    });range.append(row,input);state.input=input;
    host.append(choices,range);
    window.requestAnimationFrame(()=>{const play=host.querySelector('.srt-workbook-overlay-motion');if(play)choices.append(play);});
    new ResizeObserver(()=>host.dispatchEvent(new Event('srt-render'))).observe(host);
    return host.__dopplerSpectrum=state;
  }
  function spectrum(parent,W,y,wavelength,caption,id) {
    const left=28,width=W-56,x=left+width*(wavelength-MIN)/(MAX-MIN),visibleLeft=left+width*(380-MIN)/(MAX-MIN),visibleWidth=width*400/(MAX-MIN);
    const label=caption==='Empfang'?'Empfänger':caption;
    text(parent,left,y-10,`${label} · ${fmt(wavelength)} nm`,{'data-doppler-wavelength':caption});
    SRT.el('rect',{x:left,y,width,height:20,rx:3,fill:'#e5e9ef'},parent);
    SRT.el('rect',{x:visibleLeft,y,width:visibleWidth,height:20,fill:`url(#${id})`},parent);
    SRT.el('line',{x1:x,y1:y-3,x2:x,y2:y+24,stroke:'#fff','stroke-width':7},parent);
    SRT.el('line',{x1:x,y1:y-3,x2:x,y2:y+24,stroke:INK,'stroke-width':3,'data-spectral-marker':caption,'data-wavelength':wavelength},parent);
  }
  function scene(parent,W,t,beta,direction) {
    const left=70,right=W-140,detector=W-48,cy=249,duration=8000;
    const C=(right-left)/(.72*duration),V=-direction*beta*C;
    const base=direction===-1?left:right,sourceTime=Math.min(t%9200,duration),sourceX=base+V*sourceTime;
    // Alle Kreisfronten liegen im Empfangssystem. Die Emissionsperiode
    // ist gegenüber der Eigenperiode T0 um gamma verlängert.
    const T0=1100,T=T0/Math.sqrt(1-beta*beta);
    const clipId='doppler-light-scene';
    const defs=SRT.el('defs',{},parent),clip=SRT.el('clipPath',{id:clipId},defs);
    SRT.el('rect',{x:12,y:184,width:W-24,height:131,rx:5},clip);
    const g=SRT.el('g',{'clip-path':`url(#${clipId})`},parent);
    SRT.el('rect',{x:12,y:184,width:W-24,height:131,rx:5,fill:'#f4f8f8'},g);
    for(let k=Math.ceil((sourceTime-W/(C*(1-beta)))/T);k<=Math.floor(sourceTime/T);k++) {
      const emission=k*T,r=C*(sourceTime-emission);if(r<1)continue;
      SRT.el('circle',{cx:base+V*emission,cy,r,fill:'none',stroke:TEAL,'stroke-width':1.7,opacity:.6,'data-light-front':''},g);
    }
    SRT.el('line',{x1:15,y1:cy,x2:W-15,y2:cy,stroke:'#b8c5ce','stroke-width':1,'stroke-dasharray':'4 5'},g);
    SRT.el('rect',{x:sourceX-7,y:cy-13,width:14,height:26,rx:4,fill:INK,'data-light-source-x':sourceX},g);
    SRT.el('circle',{cx:sourceX,cy,r:3.5,fill:'#fff'},g);
    const emissionAtDetector=(detector-base-C*sourceTime)/(V-C),phase=((emissionAtDetector/T)%1+1)%1;
    SRT.el('circle',{cx:detector,cy,r:16,fill:'#fff',stroke:TEAL,'stroke-width':phase<.12?3:1.5},g);
    SRT.el('circle',{cx:detector,cy:cy-5,r:5,fill:INK},g);
    SRT.el('path',{d:`M${detector-8} ${cy+8} Q${detector} ${cy-4} ${detector+8} ${cy+8}`,fill:'none',stroke:INK,'stroke-width':3},g);
    if(beta>0) {
      const d=direction===-1?1:-1;
      SRT.el('path',{d:`M${sourceX} ${cy-31} h${d*37} m${-d*8} -5 l${d*8} 5 l${-d*8} 5`,fill:'none',stroke:INK,'stroke-width':2},g);
      text(g,sourceX+d*18,cy-40,'*v*',{'text-anchor':'middle','font-size':21});
    }
    text(parent,sourceX,338,'Lichtquelle',{'text-anchor':sourceX>W-220?'end':'middle','font-size':21});
    text(parent,W-18,338,'Empfänger',{'text-anchor':'end','font-size':21});
  }
  function render({parent,t}) {
    const state=setup(parent),signed=state.direction*state.beta;
    const W=state.host.clientWidth<450?440:640,H=350;
    parent.ownerSVGElement.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const wavelength=REST*Math.sqrt((1+signed)/(1-signed));
    state.input.value=String(state.beta);
    SRT.clear(parent);SRT.el('rect',{width:W,height:H,fill:'#fff'},parent);
    const id='doppler-visible-spectrum',defs=SRT.el('defs',{},parent),gradient=SRT.el('linearGradient',{id,x1:'0%',x2:'100%',y1:'0%',y2:'0%'},defs);
    [['0%','#6c2c91'],['15%','#334fbc'],['30%','#119cd0'],['42%','#39ad62'],['58%','#d4cd41'],['72%','#ed923d'],['88%','#cb4745'],['100%','#89323e']].forEach(([offset,color])=>SRT.el('stop',{offset,'stop-color':color},gradient));
    spectrum(parent,W,36,REST,'Quelle',id);spectrum(parent,W,91,wavelength,'Empfang',id);
    const x=nm=>28+(W-56)*(nm-MIN)/(MAX-MIN);
    for(const nm of (W<500?[200,500,800,1100]:[200,400,600,800,1000,1200])) {
      SRT.el('line',{x1:x(nm),y1:116,x2:x(nm),y2:122,stroke:MUTED},parent);
      text(parent,x(nm),142,String(nm),{'text-anchor':'middle','font-size':19});
    }
    text(parent,W-12,142,'nm',{'text-anchor':'end','font-size':18});
    text(parent,x(290),171,'UV',{'text-anchor':'middle','font-size':20});
    text(parent,x(580),171,'sichtbar',{'text-anchor':'middle','font-size':20});
    text(parent,x(1040),171,'Infrarot',{'text-anchor':'middle','font-size':20});
    scene(parent,W,t,state.beta,state.direction);
  }
  SRT.register('doppler',{render});
})();
