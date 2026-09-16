(function () {
  const SRT=window.SRTSlide;
  // Längen in Zeichenkoordinaten, Zeiten in ms. Gleichförmige Fahrt in ruhender Luft.
  // Die Kreisfronten zeigen die Ausbreitung schematisch und stark verlangsamt.
  // Der hörbare Zweiklang bleibt im Hörbereich. Tonhöhen und Wechselrhythmus
  // erhalten denselben Dopplerfaktor aus der retardierten Quellposition.
  const W=640,H=330,Y=130,X0=60,X1=580,V=.04,C=.20,EMIT=375;
  const OX=320,OY=243,LEAD=500,TRAVEL=(X1-X0)/V,HOLD=1400;
  const HORN_NOTES=[440,440*4/3],NOTE_TIME=600;
  const FRONT_RATES=HORN_NOTES.map(f=>f/HORN_NOTES[0]/EMIT);
  const PHASE_LOW=NOTE_TIME*FRONT_RATES[0],PHASE_CYCLE=NOTE_TIME*(FRONT_RATES[0]+FRONT_RATES[1]);
  const INK='#243447',WAVE='#0b8793';
  const text=(p,x,y,s,attrs={})=>SRT.addText(p,x,y,s,'label',{'font-size':23,'font-weight':400,fill:INK,...attrs});
  function sourcePhase(t) {
    // Stetige Phase der ausgewählten Fronten. Die Steigung wechselt mit der
    // Quellfrequenz. Math.floor führt auch Zeiten vor dem Bildanfang fort.
    const cycle=Math.floor(t/(2*NOTE_TIME)),local=t-cycle*2*NOTE_TIME;
    return cycle*PHASE_CYCLE+(local<=NOTE_TIME?local*FRONT_RATES[0]:PHASE_LOW+(local-NOTE_TIME)*FRONT_RATES[1]);
  }
  function emissionTime(phase) {
    // Analytische Umkehrung, ohne phasenverschiebenden Neustart beim Tonwechsel.
    const cycle=Math.floor(phase/PHASE_CYCLE),local=phase-cycle*PHASE_CYCLE;
    return cycle*2*NOTE_TIME+(local<=PHASE_LOW?local/FRONT_RATES[0]:NOTE_TIME+(local-PHASE_LOW)/FRONT_RATES[1]);
  }
  function received(t) {
    // Retardierte Position: Empfang t = Aussendung te + Schalllaufzeit.
    const dx=OX-X0-V*t,dy=OY-Y,a=C*C-V*V;
    const delay=(dx*V+Math.sqrt(C*C*dx*dx+a*dy*dy))/a;
    const emission=t-delay,ex=X0+V*emission;
    const r=Math.hypot(OX-ex,dy),cos=(OX-ex)/r;
    const factor=1/(1-(V/C)*cos);
    const note=((Math.floor(emission/NOTE_TIME)%2)+2)%2;
    return {factor,frequencies:HORN_NOTES.map(f=>f*factor),note,emission,distance:r};
  }
  function ui(parent) {
    const host=parent.ownerSVGElement.parentElement;
    if(host.__dopplerSound) return host.__dopplerSound;
    parent.ownerSVGElement.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const title=document.createElement('div');title.className='doppler-heading';title.textContent='Vorbeifahrt eines Krankenwagens';host.prepend(title);
    const bar=document.createElement('div');bar.className='doppler-controls';
    const reset=document.createElement('button');reset.type='button';reset.textContent='Zurücksetzen';
    const sound=document.createElement('button');sound.type='button';sound.className='doppler-sound';sound.setAttribute('aria-pressed','false');
    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
    SRT.el('path',{d:'M3 9 H7 L12 5 V19 L7 15 H3 Z M16 8 Q21 12 16 16 M18 4 Q27 12 18 20',fill:'none',stroke:'currentColor','stroke-width':1.8,'stroke-linejoin':'round'},icon);
    const label=document.createElement('span');label.textContent='Ton einschalten';sound.append(icon,label);
    bar.append(reset,sound);
    const status=document.createElement('div');status.className='doppler-audio-status';status.setAttribute('role','status');
    host.append(status,bar);
    window.requestAnimationFrame(()=>{const play=host.querySelector('.srt-workbook-overlay-motion');if(play)bar.append(play);});
    const state={host,sound,label,status,enabled:false,inView:false,lastFrame:0,ctx:null,voices:[],gain:null,t:0};
    function mute() {
      if(state.gain) state.gain.gain.setTargetAtTime(0,state.ctx.currentTime,.015);
    }
    async function resume() {
      try {
        if(!state.ctx) {
          const Audio=window.AudioContext||window.webkitAudioContext;
          if(!Audio) throw new Error('Audio unavailable');
          state.ctx=new Audio();state.gain=state.ctx.createGain();state.gain.gain.value=0;
          state.gain.connect(state.ctx.destination);
          // Eigenständig synthetisierter Hornklang mit Grundton und Obertönen.
          // Beide Oszillatoren laufen durch. Sanft wechselnde Hüllkurven
          // vermeiden Phasensprünge und Klicks beim Wechsel zwischen den Tönen.
          const real=new Float32Array(8),imag=new Float32Array([0,1,.55,.32,.22,.14,.09,.06]);
          const timbre=state.ctx.createPeriodicWave(real,imag);
          state.voices=HORN_NOTES.map(frequency=>{
            const osc=state.ctx.createOscillator(),gain=state.ctx.createGain();
            osc.setPeriodicWave(timbre);osc.frequency.value=frequency;gain.gain.value=0;
            osc.connect(gain);gain.connect(state.gain);osc.start();
            return {osc,gain};
          });
        }
        await state.ctx.resume();
        status.textContent=state.enabled?(host.querySelector('.srt-workbook-overlay-motion')?.getAttribute('aria-pressed')==='true'?'Ton am Standort der Person':'Ton bereit. Starte die Animation.'):'';
      } catch {
        state.enabled=false;sound.setAttribute('aria-pressed','false');label.textContent='Ton einschalten';
        status.textContent='Der Browser konnte den Ton nicht starten.';
      }
    }
    sound.addEventListener('click',()=>{
      state.enabled=!state.enabled;sound.setAttribute('aria-pressed',String(state.enabled));
      label.textContent=state.enabled?'Ton ausschalten':'Ton einschalten';
      if(state.enabled) resume(); else {mute();status.textContent='';}
    });
    reset.addEventListener('click',()=>{mute();host.dispatchEvent(new Event('srt-reset'));});
    // AudioContext nur aus einer bewussten Bedienhandlung aktivieren.
    host.addEventListener('click',e=>{if(e.target.closest('.srt-workbook-overlay-motion')&&state.enabled&&host.querySelector('.srt-workbook-overlay-motion').getAttribute('aria-pressed')==='true') resume();});
    new MutationObserver(()=>{
      if(host.querySelector('.srt-workbook-overlay-motion')?.getAttribute('aria-pressed')!=='true') {
        mute();if(state.enabled)status.textContent='Ton pausiert.';
      }
    }).observe(host,{attributes:true,subtree:true,attributeFilter:['aria-pressed']});
    const observer=new IntersectionObserver(entries=>{
      state.inView=entries[0].isIntersecting&&entries[0].intersectionRatio>=.05;if(!state.inView)mute();
    },{threshold:.05});observer.observe(host);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)mute();});
    window.addEventListener('pagehide',()=>{mute();state.ctx?.suspend();});
    // Auch bei angehaltenen Animationsframes darf kein Dauerton zurückbleiben.
    window.setInterval(()=>{if(performance.now()-state.lastFrame>200)mute();},100);
    state.mute=mute;
    return host.__dopplerSound=state;
  }
  function ambulance(parent,x,y) {
    const g=SRT.el('g',{transform:`translate(${x} ${y})`,'data-doppler-vehicle':''},parent);
    SRT.el('path',{d:'M-40 -25 H14 L32 -8 H40 V23 H-40 Z',fill:'#fff',stroke:INK,'stroke-width':2.5,'stroke-linejoin':'round'},g);
    SRT.el('path',{d:'M17 -19 L29 -7 H17 Z',fill:'#bdd4de',stroke:INK,'stroke-width':1.5},g);
    SRT.el('rect',{x:-39,y:5,width:78,height:8,fill:'#bd594c'},g);
    SRT.el('path',{d:'M-17 -21 V-3 M-26 -12 H-8',stroke:'#bd594c','stroke-width':5},g);
    SRT.el('rect',{x:-8,y:-32,width:15,height:7,rx:2,fill:WAVE},g);
    for(const cx of [-25,25]) {SRT.el('circle',{cx,cy:24,r:9,fill:INK},g);SRT.el('circle',{cx,cy:24,r:4,fill:'#dce5ea'},g);}
  }
  function render({parent,t}) {
    const state=ui(parent),cycle=t%(LEAD+TRAVEL+HOLD),time=Math.max(0,Math.min(TRAVEL,cycle-LEAD));
    state.lastFrame=performance.now();state.t=time;
    const xs=X0+V*time;
    SRT.clear(parent);SRT.el('rect',{width:W,height:H,fill:'#fff'},parent);
    SRT.el('rect',{x:0,y:94,width:W,height:78,fill:'#f1f4f6'},parent);
    SRT.el('line',{x1:0,y1:174,x2:W,y2:174,stroke:'#aebdc9','stroke-width':2},parent);
    for(let k=Math.ceil(sourcePhase(time-2600));k<=Math.floor(sourcePhase(time));k++) {
      const emission=emissionTime(k),age=time-emission,r=C*age;if(r<2)continue;
      SRT.el('circle',{cx:X0+V*emission,cy:Y,r,fill:'none',stroke:WAVE,'stroke-width':2,opacity:Math.max(.12,.6-r/1400),'data-doppler-front':k},parent);
    }
    const model=received(time);
    const phase=((sourcePhase(model.emission)%1)+1)%1;
    SRT.el('circle',{cx:OX,cy:OY,r:20,fill:'#fff',stroke:WAVE,'stroke-width':phase<.16?4:1.5,'data-doppler-listener':''},parent);
    SRT.el('circle',{cx:OX,cy:OY-8,r:6,fill:INK},parent);
    SRT.el('path',{d:`M${OX-10} ${OY+10} Q${OX} ${OY-5} ${OX+10} ${OY+10}`,fill:'none',stroke:INK,'stroke-width':4},parent);
    text(parent,OX,OY+54,'Du stehst am Straßenrand',{'text-anchor':'middle','font-size':23});
    ambulance(parent,xs,Y);
    const playing=state.host.querySelector('.srt-workbook-overlay-motion')?.getAttribute('aria-pressed')==='true';
    const audible=state.enabled&&state.ctx?.state==='running'&&playing&&state.inView&&!document.hidden&&cycle>=LEAD&&cycle<LEAD+TRAVEL;
    for(const [i,voice] of state.voices.entries()) {
      voice.osc.frequency.setTargetAtTime(model.frequencies[i],state.ctx.currentTime,.008);
      voice.gain.gain.setTargetAtTime(i===model.note?1:0,state.ctx.currentTime,.008);
    }
    if(audible) {
      // Die Lautstärke nimmt mit dem Abstand zur Person ab.
      state.gain.gain.setTargetAtTime(.08*Math.min(1,150/model.distance),state.ctx.currentTime,.025);
      state.status.textContent='Ton am Standort der Person';
    } else {
      state.mute();
      if(state.enabled&&cycle>=LEAD+TRAVEL)state.status.textContent='Vorbeifahrt beendet.';
    }
  }
  SRT.register('doppler-allgemein',{render});
})();
