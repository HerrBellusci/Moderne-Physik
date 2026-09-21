(function () {
  const C = { ink: '#172033', muted: '#64748b', axis: '#94a3b8', wave: '#315dc4', range: '#f9e2a0', selected: '#7451ad', outside: '#94a3b8' };
  function text(p, S, x, y, value, anchor = 'start', color = C.ink, size = 22) {
    return S.addText(p, x, y, value, 'mode-label', { 'font-size': size, 'font-weight': 500, fill: color, 'text-anchor': anchor });
  }
  function line(p, S, x1, y1, x2, y2, color = C.axis, width = 1.5, extra = {}) {
    return S.el('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width, ...extra }, p);
  }
  function bracket(p, S, a, b, y, label) {
    line(p, S, a, y, b, y, C.muted);
    line(p, S, a, y-5, a, y+5, C.muted);
    line(p, S, b, y-5, b, y+5, C.muted);
    text(p, S, (a+b)/2, y+27, label, 'middle');
  }
  // Ideal stehendes Feld. Für die Form werden die Verluste am Auskoppelspiegel
  // vernachlässigt. Die Linie zeigt eine Feldkomponente, keine Photonenbahn.
  window.SRTSlide.register('laser-stehende-welle', {
    initialState: { m: 3 }, showMotionControl: true,
    controls: [{ type: 'segmented', key: 'm', label: 'Schwingungsmuster', options: [
      { label: '3 Bäuche', value: 3, description: 'Mode mit drei Bäuchen' },
      { label: '4 Bäuche', value: 4, description: 'Mode mit vier Bäuchen' },
      { label: '5 Bäuche', value: 5, description: 'Mode mit fünf Bäuchen' }
    ] }],
    render: ({ parent, t, state, SRT: S }) => {
      S.clear(parent);
      const a = 144, b = 730, y = 119, amp = 48, m = Number(state.m);
      const half = (b-a)/m, phase = Math.cos(t/1000 * 2*Math.PI/3 * m/3);
      text(parent,S,24,112,'E-Feld', 'start', C.muted);
      line(parent,S,a,y,b,y);
      line(parent,S,a,53,a,185,C.muted,5);
      // Hellere Doppellinie kennzeichnet den teildurchlässigen Spiegel,
      // ohne eine nur punktuell durchlässige Öffnung vorzutäuschen.
      line(parent,S,b,53,b,185,'#8da9c0',4);
      line(parent,S,b+6,53,b+6,185,'#b9cbd9',2);
      text(parent,S,a,211,'Spiegel','middle',C.muted);
      text(parent,S,b,211,'Auskoppelspiegel','middle',C.muted,20);
      for (const sign of [-1,1]) {
        let d='';
        for(let i=0;i<=360;i++){
          const x=a+(b-a)*i/360;
          const v=amp*Math.sin(m*Math.PI*i/360)*sign;
          d += `${i?'L':'M'}${x.toFixed(2)},${(y-v).toFixed(2)} `;
        }
        S.el('path',{d,fill:'none',stroke:C.wave,'stroke-width':1,'stroke-opacity':.24,'stroke-dasharray':'4 5'},parent);
      }
      let d='';
      for(let i=0;i<=360;i++){
        const x=a+(b-a)*i/360, v=amp*Math.sin(m*Math.PI*i/360)*phase;
        d += `${i?'L':'M'}${x.toFixed(2)},${(y-v).toFixed(2)} `;
      }
      S.el('path',{d,fill:'none',stroke:C.wave,'stroke-width':3,'data-standing-wave':''},parent);
      for(let j=0;j<=m;j++)S.el('circle',{cx:a+j*half,cy:y,r:4,fill:C.ink,'data-node':''},parent);
      const knot=a+half, belly=b-half/2;
      text(parent,S,knot,29,'Knoten','middle');
      line(parent,S,knot,36,knot,y-10,C.ink,1);
      text(parent,S,belly,29,'Bauch','middle');
      line(parent,S,belly,36,belly,61,C.ink,1);
      bracket(parent,S,a,b,236,'*L*');
      bracket(parent,S,a,a+half,277,'*λ*/2');
    }
  });
  // Tatsächliche Resonanzpositionen nahe 700 nm, L=35 cm ±200 nm.
  // Das beispielhafte gelbe Intervall ist keine berechnete Gainkurve.
  window.SRTSlide.register('laser-modenbereich', {
    initialState: { length: 0 }, showMotionControl: false,
    controls: [
      { type:'range',key:'length',label:'Spiegelabstand',ariaLabel:'Spiegelabstand verändern',min:-200,max:200,step:2,
        format:v=>Number(v)===0?'35 cm':`35 cm ${Number(v)<0?'−':'+'} ${Math.abs(Number(v))} nm` },
      { label:'Zurücksetzen',ariaLabel:'Spiegelabstand zurücksetzen',apply:s=>{s.length=0;} }
    ],
    render: ({parent,state,SRT:S})=>{
      S.clear(parent);
      const min=699.998,max=700.002,left=90,right=798,low=699.999,high=700.001;
      const x=v=>left+(v-min)/(max-min)*(right-left);
      const length=.35+Number(state.length)*1e-9;
      const trackedOrder=1000000, trackedLambda=2*length/trackedOrder*1e9;
      const origin=x(700), current=x(trackedLambda);
      text(parent,S,28,30,'Wellenlängen, die das Lasermedium verstärkt');
      S.el('rect',{x:x(low),y:48,width:x(high)-x(low),height:196,rx:4,fill:C.range,'fill-opacity':.25},parent);
      S.el('rect',{x:x(low),y:48,width:x(high)-x(low),height:44,rx:4,fill:C.range,'data-gain-range':''},parent);
      text(parent,S,(x(low)+x(high))/2,78,'Δ*λ* = 0,002 nm','middle');
      text(parent,S,28,128,'Wellenlängen, die zum Spiegelabstand passen');
      const first=Math.ceil(2*length/(max*1e-9)),last=Math.floor(2*length/(min*1e-9));
      for(let m=first;m<=last;m++){
        const lambda=2*length/m*1e9;
        const inside=lambda>=low&&lambda<=high, color=inside?C.selected:C.outside;
        line(parent,S,x(lambda),154,x(lambda),239,color,inside?3:2,{'data-mode':m,'data-wavelength':lambda,'data-in-range':inside});
      }
      // Dieselbe Modenordnung bleibt beim Verschieben sichtbar markiert.
      // Der Pfeil vergleicht ihren aktuellen Wert mit L=35 cm, nicht mit
      // einer anderen Mode. Alle Resonanzen folgen weiterhin lambda=2L/m.
      S.el('circle',{cx:current,cy:154,r:7,fill:C.wave,'data-tracked-mode':trackedOrder},parent);
      const arrowY=253, shift=current-origin;
      if(Math.abs(shift)>1){
        line(parent,S,origin,arrowY,current,arrowY,C.wave,2,{'data-wavelength-shift':''});
        const direction=Math.sign(shift),head=Math.min(7,Math.abs(shift));
        S.el('path',{d:`M${current-direction*head},${arrowY-5} L${current},${arrowY} L${current-direction*head},${arrowY+5}`,fill:'none',stroke:C.wave,'stroke-width':2},parent);
      }
      line(parent,S,origin,arrowY-4,origin,arrowY+4,C.muted,1.5);
      line(parent,S,left,274,right,274,C.muted);
      for(const value of [min,700,max]){
        const label=value===700?'700':value.toFixed(3).replace('.',',');
        line(parent,S,x(value),270,x(value),280,C.muted);
        text(parent,S,x(value),301,label,'middle');
      }
      text(parent,S,(left+right)/2,331,'Wellenlänge *λ* in nm','middle');
      S.el('circle',{cx:36,cy:361,r:6,fill:C.wave},parent);
      text(parent,S,52,369,'Markierte Mode:','start',C.wave);
      text(parent,S,798,369,`${trackedLambda.toFixed(6).replace('.',',')} nm`,'end',C.wave);

    }
  });
})();
