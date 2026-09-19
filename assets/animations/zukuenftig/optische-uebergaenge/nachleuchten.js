// Unveröffentlichter Entwurf für ein mögliches späteres Kapitel zu optischen Übergängen.
(function () {
  "use strict";
  const INK = "#172033";
  const MUTED = "#64748b";
  const TRAP = "#b45309";
  const LIGHT = "#2563eb";
  const watched = new WeakSet();
  const STATUS = [
    "Licht regt den Leuchtstoff an. Ein Teil der angeregten Elektronen wird an Fallen gebunden.",
    "Nach dem Ausschalten des Lichts bleibt das dargestellte Elektron zunächst in der Falle gebunden.",
    "Thermische Energie kann das Elektron freisetzen. Seine Rückkehr zum Leuchtzentrum ermöglicht Lichtabgabe."
  ];

  function draw({ parent, state, SRT }) {
    const svg = parent.ownerSVGElement;
    const host = svg.parentElement;
    const width = Math.max(280, Math.round(host.getBoundingClientRect().width));
    svg.setAttribute("viewBox", `0 0 ${width} 462`);
    svg.setAttribute("aria-label", `Nachleuchten durch Elektronenfallen. ${STATUS[state.phase]} Die untere Ansicht zeigt schematisch die zur Freisetzung benötigte Energie.`);
    if (!watched.has(host)) {
      watched.add(host);
      let previousWidth = width;
      const observer = new ResizeObserver(() => {
        const next = Math.max(280, Math.round(host.getBoundingClientRect().width));
        if (previousWidth !== next) {
          previousWidth = next;
          host.dispatchEvent(new Event("srt-render"));
        }
      });
      observer.observe(host);
    }
    SRT.clear(parent);
    function text(x, y, content, options = {}) {
      return SRT.addText(parent, x, y, content, "", {
        fill: INK, "font-size": 16, "font-weight": 400,
        "text-anchor": "middle", ...options
      });
    }
    function line(x1, y1, x2, y2, options = {}) {
      SRT.el("line", { x1, y1, x2, y2, stroke: INK, "stroke-width": 1.5, ...options }, parent);
    }
    function arrow(x1, y1, x2, y2, options = {}) {
      line(x1, y1, x2, y2, options);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const x = x2 - 7 * Math.cos(angle), y = y2 - 7 * Math.sin(angle);
      const d = `M${x + 3 * Math.sin(angle)} ${y - 3 * Math.cos(angle)} L${x2} ${y2} L${x - 3 * Math.sin(angle)} ${y + 3 * Math.cos(angle)}`;
      SRT.el("path", { d, fill: "none", stroke: options.stroke || INK, "stroke-width": 1.5 }, parent);
    }
    function electron(x, y) {
      SRT.el("circle", {cx:x, cy:y, r:10, fill:INK}, parent);
      text(x, y+5, "−", {fill:"#ffffff", "font-size":16});
    }

    const dx = (width - 56) / 6, tx = 28 + dx, cx = 28 + 5 * dx, y = 160;
    text(width/2, 26, state.phase === 0 ? "Lichtquelle an" : "Lichtquelle aus", {"font-weight":600});
    for (let row=0; row<3; row++) for(let col=0; col<7; col++) {
      if (row===1 && (col===1 || col===5)) continue;
      SRT.el("circle", {cx:28+col*dx, cy:115+row*45, r:Math.min(9, dx*0.2), fill:"#e2e8f0", stroke:"#cbd5e1"}, parent);
    }
    if (state.phase===2) SRT.el("circle", {cx, cy:y, r:31, fill:"#dbeafe"}, parent);
    SRT.el("rect", {x:tx-18, y:y-18, width:36, height:36, rx:3, fill:"#fff7ed", stroke:TRAP, "stroke-width":2}, parent);
    SRT.el("path", {d:`M${cx} ${y-23} L${cx+23} ${y} L${cx} ${y+23} L${cx-23} ${y} Z`, fill:"#dbeafe", stroke:LIGHT, "stroke-width":2}, parent);
    line(tx,y+21,tx,224,{stroke:MUTED});
    line(cx,y+26,cx,224,{stroke:MUTED});
    text(tx,244,"Elektronenfalle"); text(cx,244,"Leuchtzentrum");
    if (state.phase===0) {
      text(cx,62,"Lichtaufnahme"); arrow(cx,73,cx,130);
      arrow(cx-29,y,tx+26,y,{"stroke-dasharray":"5 5"});
      text(width/2,y+34,"Einfangen");
      electron(tx,y);
    } else if(state.phase===1) {
      text(width/2,76,"Ladung gespeichert"); electron(tx,y);
    } else {
      text(tx,59,"thermische"); text(tx,79,"Energie"); arrow(tx,89,tx,132);
      arrow(tx+26,y,cx-30,y,{"stroke-dasharray":"5 5"});
      text(width/2,y+34,"Rückkehr"); arrow(cx,130,cx,75); text(cx,62,"Lichtabgabe");
    }

    line(20,268,width-20,268,{stroke:"#cbd5e1", "stroke-width":1});
    text(width/2,293,"Energetische Ansicht der Falle", {"font-size":16,"font-weight":600});
    arrow(32,429,32,320,{stroke:MUTED}); text(18,322,"*E*",{"font-size":18});
    const left=65, right=width-28, ax=width*0.73;
    line(left,345,right,345,{stroke:MUTED});
    text(left,333,"beweglicher Zustand",{"text-anchor":"start", "font-size":15});
    line(left,406,width*0.57,406,{stroke:TRAP,"stroke-width":2});
    text(left,429,"gebundenes Elektron",{"text-anchor":"start", "font-size":15});
    arrow(ax,406,ax,345,{stroke:state.phase===2?LIGHT:MUTED});
    text(ax+10,381,"Δ*E*",{"text-anchor":"start","font-size":17});
    if(state.phase!==2) electron(left+27,406);
    text(width/2,450,"Δ*E* = benötigte Freisetzungsenergie",{"font-size":14,fill:MUTED});
    const status = host.parentElement.querySelector(".laser-nachleuchten-status");
    if(status && status.textContent!==STATUS[state.phase]) status.textContent=STATUS[state.phase];
  }

  window.SRTSlide.register("laser-nachleuchten", {
    showMotionControl: false,
    initialState: {phase:0},
    controls: [{type:"segmented", key:"phase", label:"Vorgang", options:[
      {label:"Beleuchten",value:0}, {label:"Speichern",value:1}, {label:"Nachleuchten",value:2}
    ]}],
    render: draw
  });
})();
