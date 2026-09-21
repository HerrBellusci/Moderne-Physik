(function () {
  // Qualitatives Drei-Niveau-Modell mit schematischen Zeiten und Richtungen.
  // Alle erzeugten Photonen werden verfolgt und dauerhaft als Punkte gezeichnet.
  const W = 862, H = 368;
  const G = { left: 78, right: 710, top: 50, bottom: 256,
    mx: 170, my: 80, mw: 470, mh: 144 };
  const C = { ink: "#172033", muted: "#64748b", ground: "#94a3b8",
    upper: "#f59e0b", pump: "#7653c4", light: "#df2551" };
  const DT = 1 / 120, SPEED = 350, PUMP_SPEED = 350;
  const views = new WeakMap();
  let nextViewId = 0;

  function random(sim) {
    sim.seed = (Math.imul(1664525, sim.seed) + 1013904223) >>> 0;
    return sim.seed / 4294967296;
  }
  function create(mode, t) {
    const sim = { mode, lastT: t, acc: 0, seed: 1847, nextId: 0,
      atoms: [], cells: {}, photons: [], pumps: [], emitted: 0, outputFlux: 0 };
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 11; col++) {
        // Regelmäßige Anordnung als Lesehilfe, keine Kristallstruktur-Simulation.
        const a = { x: 198 + col * 41, y: 102 + row * 25,
          level: 1, timer: 0, pending: false };
        const key = `${Math.floor(a.x / 24)},${Math.floor(a.y / 24)}`;
        (sim.cells[key] ||= []).push(sim.atoms.length);
        sim.atoms.push(a);
      }
    }
    return sim;
  }
  function photon(sim, x, y, angle, atom = -1) {
    return { id: sim.nextId++, x, y, dx: Math.cos(angle), dy: Math.sin(angle),
      lastAtom: atom, out: false, dead: false };
  }
  function nearest(sim, p) {
    const cx = Math.floor(p.x / 24), cy = Math.floor(p.y / 24);
    let near = -1, distance = 81;
    for (let x = cx - 1; x <= cx + 1; x++) {
      for (let y = cy - 1; y <= cy + 1; y++) {
        for (const i of sim.cells[`${x},${y}`] || []) {
          const a = sim.atoms[i], d = (a.x - p.x) ** 2 + (a.y - p.y) ** 2;
          if (d < distance) { near = i; distance = d; }
        }
      }
    }
    return near;
  }
  function step(sim, pump, reflection) {
    const born = [];
    let transmitted = 0;
    sim.atoms.forEach((a, i) => {
      if (a.level === 3) {
        a.timer -= DT;
        if (a.timer <= 0) a.level = 2;
      } else if (a.level === 1 && !a.pending && random(sim) < 1 - Math.exp(-4 * pump * pump * DT)) {
        // Optische Anregung erst bei Ankunft des Pump-Photons. Der Pumpweg
        // ist exemplarisch, räumliche Abschattung wird nicht berechnet.
        const top = i % 2 === 0;
        a.pending = true;
        sim.pumps.push({ id: sim.nextId++, x: a.x, y: top ? 60 : 244,
          dy: top ? 1 : -1, atom: i, arrived: false, dead: false });
      } else if (a.level === 2 && random(sim) < 1 - Math.exp(-DT / 2)) {
        a.level = 1;
        // Gleiche Auswahl in beiden Aufbauten, auch während des Laserbetriebs.
        const angle = Math.floor(random(sim) * 12) * Math.PI / 6;
        born.push(photon(sim, a.x, a.y, angle, i));
      }
    });
    for (const p of sim.pumps) {
      p.y += p.dy * PUMP_SPEED * DT;
      const a = sim.atoms[p.atom];
      if (!p.arrived && (p.y - a.y) * p.dy >= 0) {
        p.arrived = true;
        a.pending = false;
        if (a.level === 1) {
          a.level = 3;
          a.timer = .12 + .08 * random(sim);
          p.dead = true;
        }
      }
      if (p.y < 46 || p.y > 258) p.dead = true;
    }
    sim.pumps = sim.pumps.filter(p => !p.dead);
    for (const p of sim.photons) {
      const oldX = p.x;
      p.x += p.dx * SPEED * DT;
      p.y += p.dy * SPEED * DT;
      if (sim.mode === "resonator" && !p.out && p.y >= G.top && p.y <= G.bottom) {
        if (p.dx < 0 && oldX > G.left && p.x <= G.left) {
          p.dx = -p.dx;
          p.x = 2 * G.left - p.x;
        } else if (p.dx > 0 && oldX < G.right && p.x >= G.right) {
          if (random(sim) < reflection) {
            p.dx = -p.dx;
            p.x = 2 * G.right - p.x;
          } else {
            p.out = true;
            sim.emitted++;
            if (Math.abs(p.dy) < .1) transmitted++;
          }
        }
      }
      if (!p.out && p.x >= G.mx && p.x <= G.mx + G.mw && p.y >= G.my && p.y <= G.my + G.mh) {
        const near = nearest(sim, p);
        if (near !== -1 && near !== p.lastAtom) {
          const a = sim.atoms[near];
          // Gleiche Wahrscheinlichkeit für Absorption und stimulierte Emission.
          if (a.level !== 3 && random(sim) < .42) {
            if (a.level === 2) {
              a.level = 1;
              born.push(photon(sim, p.x - p.dx * 7, p.y - p.dy * 7,
                Math.atan2(p.dy, p.dx), near));
            } else {
              a.level = 2;
              p.dead = true;
            }
          }
        }
        p.lastAtom = near;
      } else p.lastAtom = -1;
      if (p.x < 16 || p.x > W - 16 || p.y < 12 || p.y > 268) p.dead = true;
    }
    sim.photons = sim.photons.filter(p => !p.dead).concat(born);
    // Zeitlich gemittelter tatsächlicher Austritt entlang der Achse.
    // Das Band bündelt die Punktdarstellung, es berechnet kein Strahlprofil.
    const decay = Math.exp(-DT / 2.5);
    sim.outputFlux = sim.outputFlux * decay + transmitted / DT * (1 - decay);
  }

  function text(parent, SRT, x, y, value, size = 18, color = C.ink, anchor = "start") {
    return SRT.addText(parent, x, y, value, "label", {
      "font-size": size, "font-weight": 600, fill: color, "text-anchor": anchor
    });
  }
  function line(parent, SRT, x1, y1, x2, y2, color, width = 2, extra = {}) {
    return SRT.el("line", { x1, y1, x2, y2, stroke: color,
      "stroke-width": width, "stroke-linecap": "round", ...extra }, parent);
  }
  function circle(parent, SRT, x, y, r, fill, extra = {}) {
    return SRT.el("circle", { cx: x, cy: y, r, fill, ...extra }, parent);
  }
  function rect(parent, SRT, x, y, width, height, fill, extra = {}) {
    return SRT.el("rect", { x, y, width, height, rx: 8, fill, ...extra }, parent);
  }
  function setup(parent, SRT, sim) {
    SRT.clear(parent);
    const view = { sim, photonNodes: new Map(), pumpNodes: new Map() };
    views.set(parent, view);
    rect(parent, SRT, 0, 0, W, H, "#fff");
    text(parent, SRT, 405, 42, "Pumplicht", 18, C.pump, "middle");
    line(parent, SRT, 180, 60, 630, 60, C.pump, 5);
    line(parent, SRT, 180, 244, 630, 244, C.pump, 5);
    rect(parent, SRT, G.mx, G.my, G.mw, G.mh, "#f0f4f8", { stroke: "#cad5e0" });
    line(parent, SRT, G.left + 8, 152, G.right - 8, 152, "#ccd5df", 1, { "stroke-dasharray": "5 7" });
    if (sim.mode === "resonator") {
      const gradientId = `resonator-beam-${nextViewId++}`;
      const defs = SRT.el("defs", {}, parent);
      const gradient = SRT.el("linearGradient", { id: gradientId, x1: "0%", y1: "0%", x2: "0%", y2: "100%" }, defs);
      [[0, 0], [.18, .55], [.5, 1], [.82, .55], [1, 0]].forEach(([offset, opacity]) => {
        SRT.el("stop", { offset, "stop-color": C.light, "stop-opacity": opacity }, gradient);
      });
      view.beam = rect(parent, SRT, G.right + 4, 88, W - G.right - 20, 128,
        `url(#${gradientId})`, { rx: 0, opacity: 0, "data-output-beam": "" });
      line(parent, SRT, G.left, G.top, G.left, G.bottom, "#334155", 8);
      line(parent, SRT, G.right, G.top, G.right, G.bottom, "#8394a9", 8);
      text(parent, SRT, G.left, 294, "Spiegel", 18, C.muted, "middle");
      text(parent, SRT, G.right, 294, "Auskoppelspiegel", 18, C.muted, "middle");
    }
    text(parent, SRT, 405, 294, "Lasermedium", 18, C.muted, "middle");
    view.atoms = sim.atoms.map(a => ({
      dot: circle(parent, SRT, a.x, a.y, 7, C.ground, { stroke: "white", "stroke-width": 1.5 }),
      ring: circle(parent, SRT, a.x, a.y, 10, "none", { stroke: C.upper, "stroke-width": 1.3 }),
      center: circle(parent, SRT, a.x, a.y, 2, "white")
    }));
    view.lightLayer = SRT.el("g", {}, parent);
    line(parent, SRT, 24, 314, W - 24, 314, "#e2e8f0", 1);
    [[35, C.ground, "*E*₁: Grundzustand"], [290, C.upper, "*E*₂: oberes Laserniveau"], [622, C.pump, "*E*₃: Pumpniveau"]].forEach(([x, color, label]) => {
      circle(parent, SRT, x, 343, 7, color);
      if (color === C.upper) circle(parent, SRT, x, 343, 10, "none", { stroke: color, "stroke-width": 1.3 });
      if (color === C.pump) circle(parent, SRT, x, 343, 2, "white");
      text(parent, SRT, x + 18, 349, label);
    });
    return view;
  }
  function updatePoints(parent, SRT, points, nodes, color) {
    const alive = new Set();
    for (const p of points) {
      alive.add(p.id);
      let node = nodes.get(p.id);
      if (!node) {
        node = circle(parent, SRT, p.x, p.y, 3.2, color);
        nodes.set(p.id, node);
      }
      node.setAttribute("cx", p.x);
      node.setAttribute("cy", p.y);
    }
    for (const [id, node] of nodes) {
      if (!alive.has(id)) { node.remove(); nodes.delete(id); }
    }
  }
  function draw(parent, SRT, sim) {
    const view = views.get(parent)?.sim === sim ? views.get(parent) : setup(parent, SRT, sim);
    if (view.beam) view.beam.setAttribute("opacity", .6 * (1 - Math.exp(-sim.outputFlux / 5)));
    sim.atoms.forEach((a, i) => {
      const nodes = view.atoms[i];
      nodes.dot.setAttribute("fill", a.level === 3 ? C.pump : a.level === 2 ? C.upper : C.ground);
      nodes.ring.setAttribute("visibility", a.level === 2 ? "visible" : "hidden");
      nodes.center.setAttribute("visibility", a.level === 3 ? "visible" : "hidden");
    });
    // Ein Punkt bleibt seinem Photon zugeordnet, bis dieses absorbiert wird
    // oder das Bild verlässt. Kein wechselndes Ausdünnen nach Listenposition.
    updatePoints(view.lightLayer, SRT, sim.photons, view.photonNodes, C.light);
    updatePoints(view.lightLayer, SRT, sim.pumps, view.pumpNodes, C.pump);
  }
  function render({ parent, t, state, SRT }) {
    if (!state._sim || state._sim.mode !== state.mode || t < state._sim.lastT) state._sim = create(state.mode, t);
    const sim = state._sim;
    sim.acc += Math.max(0, Math.min(.1, (t - sim.lastT) / 1000));
    sim.lastT = t;
    while (sim.acc >= DT) {
      step(sim, Math.max(0, Math.min(1, Number(state.pump))), Math.max(.5, Math.min(.99, Number(state.reflection))));
      sim.acc -= DT;
    }
    draw(parent, SRT, sim);
  }
  window.SRTSlide.register("laser-resonator", {
    initialState: { mode: "resonator", pump: .85, reflection: .95 },
    showMotionControl: true,
    controls: [
      { type: "segmented", key: "mode", label: "Aufbau", options: [
        { label: "mit Resonator", value: "resonator", description: "Mit Resonator" },
        { label: "ohne Resonator", value: "frei", description: "Ohne Resonator" }
      ] },
      { label: "Neu starten", ariaLabel: "Resonator neu starten", apply: s => { s._sim = null; } },
      { type: "segmented", key: "pump", label: "Pumpstärke", options: [
        { label: "aus", value: 0, description: "Pumpe aus" },
        { label: "schwach", value: .25, description: "Schwaches Pumpen" },
        { label: "stark", value: .85, description: "Starkes Pumpen" }
      ] },
      { type: "range", key: "reflection", label: "Auskoppelspiegel", ariaLabel: "Reflexion des Auskoppelspiegels", min: .5, max: .99, step: .01,
        disabled: s => s.mode === "frei",
        format: v => `${Math.round(v * 100)} % Reflexion · ${Math.round((1 - v) * 100)} % Durchlass` }
    ],
    render
  });
})();
