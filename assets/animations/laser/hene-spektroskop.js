(function () {
  const ink='#172033', muted='#526174', red='#c72b4c', blue='#2864ad';
  // Ausgewählte neutrale He-/Ne-Linien nach NIST, Handbook of Basic Atomic
  // Spectroscopic Data. Keine Rekonstruktion des Fotos; Linienhelligkeiten
  // und -breiten sind schematisch, schwache Linien bleiben ausgelassen.
  const lines=[
    [447.1,'#6576ff'],[501.6,'#2ed9ae'],[514.5,'#66df75'],[533.1,'#9de354'],
    [540.1,'#b1e44e'],[565.7,'#d7e74a'],[576.4,'#ecdf44'],[580.4,'#f4d844'],
    [585.2,'#ffd044'],[587.6,'#ffe269'],[594.5,'#ffc044'],[603.0,'#ffad44'],
    [607.4,'#ffa044'],[614.3,'#ff8844'],[621.7,'#ff7349'],[626.6,'#ff664c'],
    [640.2,'#ff5959'],[650.7,'#f65357'],[667.8,'#ed6060'],[692.9,'#d34f58']
  ];
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
    if(svg){svg.setAttribute('viewBox',`0 0 862 ${real?330:580}`);svg.style.aspectRatio=`862 / ${real?330:580}`;}
    if(panel){
      panel.querySelectorAll('[data-hene-photo]').forEach(el=>{el.hidden=!real||el.dataset.henePhoto!==state.pos;});
    }
    S.el('rect',{width:862,height:real?330:580,fill:'white'},p);
    // A untersucht seitlich ausgesandtes Licht, B zeigt Gitter und Schirm in Draufsicht.
    text(p,S,237,46,'Helium-Neon-Laser',24,ink,'middle');
    S.el('rect',{x:64,y:86,width:350,height:77,rx:20,fill:'#f3f5f8',stroke:'#718399','stroke-width':3},p);
    S.el('rect',{x:79,y:109,width:320,height:31,rx:12,fill:'#f4bbc9'},p);
    S.el('rect',{x:57,y:94,width:12,height:60,fill:'#334155'},p);
    S.el('rect',{x:409,y:94,width:12,height:60,fill:'#b2c6d9',stroke:'#657e94'},p);
    line(p,S,77,125,568,125,red,4);
    text(p,S,489,86,'Laserstrahl',22,red,'middle');
    // Die nullte und die beiden ersten Ordnungen enthalten dieselbe Wellenlänge.
    S.el('rect',{x:562,y:93,width:14,height:64,rx:2,fill:beam?'#edf3fb':'#f6f7f9',stroke:beam?red:muted,'stroke-width':2},p);
    for(let y=97;y<155;y+=8)line(p,S,563,y,575,y+4,beam?red:muted,1.5);
    S.el('rect',{x:755,y:43,width:10,height:165,rx:2,fill:'#e2e8f0',stroke:muted,'stroke-width':2},p);
    for(const [y,order] of [[65,'+1'],[125,'0'],[185,'−1']]){
      line(p,S,576,125,754,y,red,y===125?3:2);
      S.el('circle',{cx:760,cy:y,r:y===125?6:4.5,fill:red},p);
      text(p,S,780,y+7,order,21,muted);
    }
    text(p,S,569,193,'B · Gitter',23,beam?red:muted,'middle');
    text(p,S,760,240,'Schirm',23,beam?red:muted,'middle');
    // Gitterspektroskop nur als Gerät angedeutet, keine Augenposition.
    arrow(p,S,237,168,237,208,beam?'#bcc6d2':blue);
    S.el('rect',{x:202,y:217,width:70,height:48,rx:7,fill:beam?'#f6f7f9':'#edf3fb',stroke:beam?'#a7b2c0':blue,'stroke-width':beam?2:3},p);
    for(let i=0;i<4;i++)line(p,S,221+i*8,227,213+i*8,255,beam?'#a7b2c0':blue,2);
    text(p,S,189,249,'A',23,beam?muted:blue,'end');
    text(p,S,237,293,'Gitterspektroskop',23,beam?muted:blue,'middle');
    if(real)return;
    // Spektrenvergleich jeweils innerhalb einer Beugungsordnung.
    S.el('rect',{x:30,y:350,width:802,height:122,rx:7,fill:'#121c2d'},p);
    const x=nm=>78+(nm-420)/290*724;
    (beam?[[632.8,'#ff5959']]:lines).forEach(([nm,color])=>S.el('rect',{x:x(nm)-2,y:365,width:4,height:91,fill:color},p));
    arrow(p,S,78,490,816,490,muted);
    [450,500,550,600,650,700].forEach(nm=>{line(p,S,x(nm),490,x(nm),498,muted,2);text(p,S,x(nm),525,String(nm),21,muted,'middle');});
    text(p,S,440,564,'Wellenlänge in nm',23,ink,'middle');
  }
  window.SRTSlide.register('laser-hene-spektroskop',{
    initialState:{pos:'seitlich',view:'schema'},showMotionControl:false,
    controls:[
      {type:'segmented',key:'pos',label:'Licht untersuchen',options:[{label:'A · Seitliches Licht',value:'seitlich'},{label:'B · Laserstrahl',value:'strahl'}]},
      {type:'segmented',key:'view',label:'Ansicht',options:[{label:'Schema',value:'schema'},{label:state=>state.pos==='strahl'?'Messkurve':'Foto',value:'real'}]}
    ],render
  });
})();
