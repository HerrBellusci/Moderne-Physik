(function () {
  const ink='#172033', muted='#526174', red='#c72b4c', blue='#2864ad';
  // Ausgewählte neutrale He-/Ne-Linien nach NIST, Handbook of Basic Atomic
  // Spectroscopic Data. Linienhelligkeiten und -breiten sind schematisch.
  const lines=[[447.1,'#6576ff'],[501.6,'#2ed9ae'],[585.2,'#ffd044'],[587.6,'#ffe269'],[640.2,'#ff5959'],[667.8,'#ed6060']];
  function text(p,S,x,y,value,size=23,color=ink,anchor='start') {
    S.addText(p,x,y,value,'hene-label',{'font-size':size,fill:color,'text-anchor':anchor,'font-weight':500});
  }
  function line(p,S,x1,y1,x2,y2,color,width=3,dash='') {
    S.el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':width,'stroke-dasharray':dash||'none'},p);
  }
  function arrow(p,S,x1,y1,x2,y2,color) {
    line(p,S,x1,y1,x2,y2,color);
    const a=Math.atan2(y2-y1,x2-x1),d=10;
    S.el('path',{d:`M${x2-d*Math.cos(a-.5)} ${y2-d*Math.sin(a-.5)} L${x2} ${y2} L${x2-d*Math.cos(a+.5)} ${y2-d*Math.sin(a+.5)}`,fill:'none',stroke:color,'stroke-width':3},p);
  }
  function render({parent:p,SRT:S,state}) {
    S.clear(p);
    const beam=state.pos==='strahl', real=state.view==='real';
    const svg=p.ownerSVGElement, panel=p.closest?.('.hene-spectrum');
    if(svg){svg.setAttribute('viewBox',`0 0 862 ${real?275:515}`);svg.style.aspectRatio=`862 / ${real?275:515}`;}
    if(panel){
      panel.querySelectorAll('[data-hene-photo]').forEach(el=>{el.hidden=!real||el.dataset.henePhoto!==state.pos;});
    }
    S.el('rect',{width:862,height:real?275:515,fill:'white'},p);
    // Zwei Entnahmestellen für Licht, keine Augenpositionen und kein maßstäblicher Versuchsplan.
    text(p,S,266,39,'Helium-Neon-Röhre',24,ink,'middle');
    S.el('rect',{x:64,y:76,width:408,height:77,rx:20,fill:'#f3f5f8',stroke:'#718399','stroke-width':3},p);
    S.el('rect',{x:79,y:99,width:378,height:31,rx:12,fill:'#f4bbc9'},p);
    S.el('rect',{x:57,y:84,width:12,height:60,fill:'#334155'},p);
    S.el('rect',{x:467,y:84,width:12,height:60,fill:'#b2c6d9',stroke:'#657e94'},p);
    line(p,S,77,115,709,115,red,4);
    text(p,S,585,85,'Laserstrahl',23,red,'middle');
    // Auswahl A liegt seitlich zur Röhre, B am ausgekoppelten Strahl.
    arrow(p,S,266,157,266,193,beam?'#bcc6d2':blue);
    for(const [x,y,selected,label,color] of [[266,219,!beam,'A',blue],[744,115,beam,'B',red]]){
      S.el('rect',{x:x-35,y:y-24,width:70,height:48,rx:7,fill:selected?'#edf3fb':'#f6f7f9',stroke:selected?color:'#a7b2c0','stroke-width':selected?3:2},p);
      for(let i=0;i<4;i++)line(p,S,x-16+i*8,y-14,x-24+i*8,y+14,selected?color:'#a7b2c0',2);
      text(p,S,x-49,y+8,label,23,selected?color:muted,'end');
    }
    text(p,S,266,269,'seitliches Licht',22,beam?muted:blue,'middle');
    text(p,S,744,171,'Strahlaustritt',22,beam?red:muted,'middle');
    if(real)return;
    const sx=beam?744:266;
    line(p,S,sx,beam?184:280,sx,307,beam?red:blue,2,'5 5');
    S.el('rect',{x:30,y:310,width:802,height:122,rx:7,fill:'#121c2d'},p);
    const x=nm=>78+(nm-420)/290*724;
    (beam?[[632.8,'#ff5959']]:lines).forEach(([nm,color])=>S.el('rect',{x:x(nm)-2,y:325,width:4,height:91,fill:color},p));
    line(p,S,78,445,802,445,muted,2);
    [450,500,550,600,650,700].forEach(nm=>{line(p,S,x(nm),445,x(nm),453,muted,2);text(p,S,x(nm),477,String(nm),21,muted,'middle');});
    text(p,S,440,507,'Wellenlänge in nm',23,ink,'middle');
  }
  window.SRTSlide.register('laser-hene-spektroskop',{
    initialState:{pos:'seitlich',view:'schema'},showMotionControl:false,
    controls:[
      {type:'segmented',key:'pos',label:'Licht untersuchen',options:[{label:'A · seitlich',value:'seitlich'},{label:'B · Strahlaustritt',value:'strahl'}]},
      {type:'segmented',key:'view',label:'Ansicht',options:[{label:'Schema',value:'schema'},{label:'Reales Bild',value:'real'}]}
    ],render
  });
})();
