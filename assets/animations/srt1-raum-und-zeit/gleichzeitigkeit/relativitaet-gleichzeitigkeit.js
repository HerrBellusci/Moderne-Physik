(() => {
  "use strict";

  const WIDTH = 640;
  const C = 110;
  const BETA = 0.25;
  const V = BETA * C;
  const GAMMA = 1 / Math.sqrt(1 - BETA * BETA);
  const LEAD = 0.6;
  const HOLD = 0.85;
  const FLASH = 0.18;
  const MAIN_LENGTH = 430;
  const MAIN_CENTER = 278;
  const TRANSFER_LENGTH = 440 / GAMMA;
  const TRANSFER_CENTER = 286;
  const COLORS = {
    ink: "#253247", muted: "#526173", train: "#6d5dfc",
    trainFill: "#f0edff", light: "#efb12d", lightEdge: "#9a6714",
    hit: "#267568", rail: "#a8b2c0"
  };

  // Beide Ansichten nutzen dieselbe Längenskala. Die Laufzeit jeder
  // Ansicht ist ihre eigene Koordinatenzeit, keine gemeinsame Gegenwart.
  function cycle(t, lastEvent) {
    const duration = LEAD + lastEvent + HOLD;
    const phase = (t / 1000) % duration;
    return { fired: phase >= LEAD, time: Math.max(0, Math.min(phase - LEAD, lastEvent)) };
  }

  function label(parent, SRT, x, y, text, options = {}) {
    return SRT.addText(parent, x, y, text, "sim-label", {
      "text-anchor": "middle", "font-size": 23,
      "font-weight": 500, fill: COLORS.ink, ...options
    });
  }

  function background(parent, SRT, height) {
    SRT.clear(parent);
    SRT.el("rect", { width: WIDTH, height, fill: "#fff" }, parent);
  }

  function arrow(parent, SRT, x, y, length = 64) {
    // Der Schaft endet hinter der Pfeilspitze, ohne runde Endkappe.
    SRT.el("line", {
      x1: x, y1: y, x2: x + length - 10, y2: y,
      stroke: COLORS.train, "stroke-width": 3.5
    }, parent);
    SRT.el("polygon", {
      points: `${x + length},${y} ${x + length - 14},${y - 7} ${x + length - 14},${y + 7}`,
      fill: COLORS.train
    }, parent);
  }

  function wagon(parent, SRT, center, y, length) {
    const left = center - length / 2;
    SRT.el("line", {
      x1: 22, y1: y + 41, x2: 618, y2: y + 41,
      stroke: COLORS.rail, "stroke-width": 2
    }, parent);
    SRT.el("rect", {
      x: left, y: y - 28, width: length, height: 55, rx: 9,
      fill: COLORS.trainFill, stroke: COLORS.train, "stroke-width": 3
    }, parent);
    [left, left + length].forEach((x) => SRT.el("line", {
      x1: x, y1: y - 18, x2: x, y2: y + 18,
      stroke: COLORS.train, "stroke-width": 5
    }, parent));
    [left + 36, left + length - 36].forEach((x) => {
      SRT.el("circle", { cx: x, cy: y + 33, r: 7, fill: COLORS.ink }, parent);
      SRT.el("circle", { cx: x, cy: y + 33, r: 2.5, fill: "#fff" }, parent);
    });
  }

  function source(parent, SRT, x, y, flash) {
    const group = SRT.el("g", { "data-sim-source": "", transform: `translate(${x} ${y})` }, parent);
    SRT.el("rect", { x: -18, y: -10, width: 36, height: 20, rx: 4, fill: COLORS.ink }, group);
    [-24, 18].forEach((dx) => SRT.el("rect", {
      x: dx, y: -6, width: 6, height: 12, rx: 1,
      fill: "#cad2df", stroke: COLORS.ink, "stroke-width": 1.5
    }, group));
    SRT.el("circle", {
      cx: 0, cy: -14, r: 4, fill: flash ? COLORS.light : "#c95149",
      stroke: COLORS.ink, "stroke-width": 1
    }, group);
  }

  function pulse(parent, SRT, x, y, id) {
    const group = SRT.el("g", { "data-sim-pulse": id }, parent);
    SRT.el("circle", { cx: x, cy: y, r: 12, fill: COLORS.light, opacity: 0.2 }, group);
    SRT.el("circle", {
      cx: x, cy: y, r: 7, fill: COLORS.light,
      stroke: COLORS.lightEdge, "stroke-width": 1.5
    }, group);
    SRT.el("circle", { cx: x, cy: y, r: 2.5, fill: "#fff" }, group);
  }

  function hit(parent, SRT, x, y, id, persistent = false) {
    SRT.el("circle", {
      "data-sim-hit": id, cx: x, cy: y, r: persistent ? 17 : 22,
      fill: "none", stroke: COLORS.hit, "stroke-width": 3
    }, parent);
  }

  window.SRTSlide.register("sim", ({ parent, t, SRT }) => {
    const halfMoving = MAIN_LENGTH / GAMMA / 2;
    const rearTime = halfMoving / (C + V);
    const frontTime = halfMoving / (C - V);
    const trainTime = MAIN_LENGTH / (2 * C);
    const { time, fired } = cycle(t, frontTime + 0.12);
    background(parent, SRT, 388);
    SRT.el("line", { x1: 22, y1: 195, x2: 618, y2: 195, stroke: "#e1e5eb" }, parent);

    [false, true].forEach((moving) => {
      const y = moving ? 309 : 121;
      const center = MAIN_CENTER + (moving ? V * time : 0);
      const halfLength = moving ? halfMoving : MAIN_LENGTH / 2;
      const rear = center - halfLength;
      const front = center + halfLength;
      const rearHit = fired && time >= (moving ? rearTime : trainTime);
      const frontHit = fired && time >= (moving ? frontTime : trainTime);
      const frame = SRT.el("g", { "data-sim-frame": moving ? "platform" : "train" }, parent);
      label(frame, SRT, 24, y - 86, moving ? "Bahnsteigsystem" : "Zugsystem", {
        "text-anchor": "start", "font-size": 24, "font-weight": 650
      });
      if (moving) {
        arrow(frame, SRT, 511, y - 83);
        label(frame, SRT, 496, y - 76, "*v*", { "font-size": 23 });
      }
      wagon(frame, SRT, center, y, 2 * halfLength);
      if (fired) {
        if (!rearHit) pulse(frame, SRT, MAIN_CENTER - C * time, y, "rear");
        if (!frontHit) pulse(frame, SRT, MAIN_CENTER + C * time, y, "front");
      }
      source(frame, SRT, center, y, fired && time < FLASH);
      if (rearHit) hit(frame, SRT, rear, y, "rear", true);
      if (frontHit) hit(frame, SRT, front, y, "front", true);
    });
  });

  function lightningBolt(parent, SRT, x, y) {
    SRT.el("polygon", {
      "data-sim-lightning": "",
      points: `${x - 3},${y - 49} ${x + 11},${y - 49} ${x + 1},${y - 29} ${x + 13},${y - 29} ${x},${y} ${x + 3},${y - 22} ${x - 10},${y - 22}`,
      fill: COLORS.light, stroke: COLORS.lightEdge, "stroke-width": 1
    }, parent);
  }

  function person(parent, SRT, x, y, showLabel = false) {
    const group = SRT.el("g", { "data-sim-person": "", transform: `translate(${x} ${y})` }, parent);
    SRT.el("circle", { cx: 0, cy: -8, r: 7, fill: COLORS.ink }, group);
    SRT.el("path", {
      d: "M-12 16 v-5 a12 12 0 0 1 24 0 v5 Z", fill: COLORS.ink
    }, group);
    if (showLabel) label(parent, SRT, x, y + 81, "Person in der Zugmitte", { "font-size": 22 });
  }

  window.SRTSlide.register("lightning-setup", ({ parent, SRT }) => {
    const y = 112;
    const rear = TRANSFER_CENTER - TRANSFER_LENGTH / 2;
    const front = TRANSFER_CENTER + TRANSFER_LENGTH / 2;
    background(parent, SRT, 256);
    wagon(parent, SRT, TRANSFER_CENTER, y, TRANSFER_LENGTH);
    label(parent, SRT, rear, 35, "hinten");
    label(parent, SRT, front, 35, "vorn");
    lightningBolt(parent, SRT, rear, y);
    lightningBolt(parent, SRT, front, y);
    person(parent, SRT, TRANSFER_CENTER, y, true);
    arrow(parent, SRT, 350, 230, 68);
    label(parent, SRT, 330, 237, "Fahrtrichtung", { "text-anchor": "end", "font-size": 22 });
  });

  window.SRTSlide.register("lightning", ({ parent, t, SRT }) => {
    const y = 134;
    const rearStrike = TRANSFER_CENTER - TRANSFER_LENGTH / 2;
    const frontStrike = TRANSFER_CENTER + TRANSFER_LENGTH / 2;
    const frontTime = (TRANSFER_LENGTH / 2) / (C + V);
    const rearTime = (TRANSFER_LENGTH / 2) / (C - V);
    const { time, fired } = cycle(t, rearTime + 0.35);
    const center = TRANSFER_CENTER + V * time;
    background(parent, SRT, 276);
    label(parent, SRT, 24, 34, "Bahnsteigsystem", {
      "text-anchor": "start", "font-size": 24, "font-weight": 650
    });
    label(parent, SRT, 474, 52, "*v*", { "font-size": 23 });
    arrow(parent, SRT, 490, 45);
    wagon(parent, SRT, center, y, TRANSFER_LENGTH);
    if (!fired || time < FLASH) {
      lightningBolt(parent, SRT, rearStrike, y);
      lightningBolt(parent, SRT, frontStrike, y);
    }
    if (fired) {
      if (time < rearTime) pulse(parent, SRT, rearStrike + C * time, y, "rear");
      if (time < frontTime) pulse(parent, SRT, frontStrike - C * time, y, "front");
      if (time >= frontTime && time < frontTime + 0.3) hit(parent, SRT, center, y, "front");
      if (time >= rearTime && time < rearTime + 0.3) hit(parent, SRT, center, y, "rear");
    }
    person(parent, SRT, center, y);
  });
})();
