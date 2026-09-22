(function () {
  const W = 862, H = 350;
  const C = { ink: "#172033", muted: "#64748b", ground: "#94a3b8", upper: "#f59e0b", pump: "#7653c4", light: "#df2551" };
  const Y = { 1: 322, 2: 178, 3: 74 };
  const CYCLE = 15000;

  function text(parent, SRT, x, y, value, size = 24, color = C.ink, anchor = "start") {
    return SRT.addText(parent, x, y, value, "label", { fill: color, "font-size": size, "font-weight": 600, "text-anchor": anchor });
  }
  function line(parent, SRT, x1, y1, x2, y2, color, width = 3, extra = {}) {
    return SRT.el("line", { x1, y1, x2, y2, stroke: color, "stroke-width": width, "stroke-linecap": "round", ...extra }, parent);
  }
  function arrow(parent, SRT, x, y1, y2, color, active, dashed = false) {
    const opacity = active ? 1 : 0.4;
    line(parent, SRT, x, y1, x, y2, color, active ? 5 : 3, { opacity, ...(dashed ? {"stroke-dasharray":"7 7"} : {}) });
    const d = y2 > y1 ? 1 : -1;
    SRT.el("path", { d: `M${x-8} ${y2-d*12} L${x} ${y2} L${x+8} ${y2-d*12}`, fill: "none", stroke: color, "stroke-width": active ? 5 : 3, opacity }, parent);
  }
  function draw({parent, SRT, t, state}) {
    SRT.clear(parent);
    if (state.restart) { state.origin = t; state.restart = false; }
    const p = ((t - state.origin) % CYCLE) / CYCLE;
    const level = p < 0.15 ? 1 : p < 0.25 ? 3 : p < 0.72 ? 2 : 1;
    const pump = p >= 0.07 && p < 0.25;
    const relax = p >= 0.25 && p < 0.34;
    const emit = p >= 0.72 && p < 0.90;
    SRT.el("rect", { x:0, y:0, width:W, height:H, fill:"#fff" }, parent);

    [[3,"Pumpniveau (vereinfacht)",C.pump],[2,"metastabiles Laserniveau",C.upper],[1,"Grundzustand",C.ground]].forEach(([n,name,color]) => {
      text(parent,SRT,44,Y[n]+8,`*E*${["","₁","₂","₃"][n]}`,27);
      if (n === 3) SRT.el("rect",{x:102,y:Y[n]-12,width:702,height:24,fill:color,opacity:.10},parent);
      line(parent,SRT,102,Y[n],804,Y[n],color,4);
      text(parent,SRT,800,Y[n]-22,name,26,C.ink,"end");
    });
    arrow(parent,SRT,207,Y[1]-15,Y[3]+15,C.pump,pump);
    text(parent,SRT,192,231,"Pumpen",23,C.pump,"end");
    arrow(parent,SRT,401,Y[3]+15,Y[2]-15,C.muted,relax,true);
    text(parent,SRT,420,103,"schnell,",23,C.muted);
    text(parent,SRT,420,129,"strahlungslos",23,C.muted);
    arrow(parent,SRT,546,Y[2]+17,Y[1]-17,C.light,emit);
    text(parent,SRT,564,239,"Laserübergang",23,C.light);
    text(parent,SRT,564,267,"694 nm",23,C.light);

    // Diskrete Zustandswechsel, keine Bahn durch Zwischenenergien.
    const fill = level === 3 ? C.pump : level === 2 ? C.upper : C.ground;
    SRT.el("circle", {cx:737,cy:Y[level],r:12,fill,stroke:"white","stroke-width":3},parent);
    if (level === 2) SRT.el("circle", {cx:737,cy:Y[level],r:17,fill:"none",stroke:C.upper,"stroke-width":2},parent);

    // Ein roter Punkt steht wie beim Resonator für ein Photon.
    // Die Photonensymbole markieren hier den Auslöser der Emission.
    if (p >= .58 && p < .72) {
      const x = 820 - (p-.58)/.14*83;
      SRT.el("circle", {cx:x,cy:Y[2],r:5,fill:C.light},parent);
    }
    if (p >= .72 && p < .85) {
      const x = 737 - (p-.72)/.13*100;
      [-8,8].forEach(d => SRT.el("circle",{cx:x,cy:Y[2]+d,r:5,fill:C.light},parent));
    }

  }
  window.SRTSlide.register("laser-rubinlaser-niveaus", {
    initialState: {origin:0, restart:false},
    controls: [{type:"button",label:"Zurücksetzen",apply:state=>{state.restart=true;}}],
    showMotionControl: true,
    render: draw
  });
})();
