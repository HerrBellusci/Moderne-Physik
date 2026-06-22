(function () {
  const SIM_TRAIN_WIDTH = 380;
  const SIM_LIGHT_SPEED = (SIM_TRAIN_WIDTH / 2) / 0.62;

  window.SRTSlide.register("sim", ({ parent, t, SRT }) => {
    SRT.clear(parent);
    const phase = (t % 4000) / 4000;
    const trainTop = 108;
    const platTop = 286;

    SRT.el("rect", { x: 0, y: 0, width: 862, height: 506, rx: 18, fill: "#f7f9fb" }, parent);
    drawTrainFrame(parent, SRT, trainTop, phase);
    drawPlatformFrame(parent, SRT, platTop, phase);
  });

  window.SRTSlide.register("lightning", ({ parent, t, SRT }) => {
    SRT.clear(parent);
    const phase = (t % 5200) / 5200;
    const y = 248;
    const center = 431;
    const leftStrike = 214;
    const rightStrike = 648;
    const v = 92;
    const c = 392;
    const trainW = 456;
    const trainX = center - trainW / 2 + v * phase;
    const passengerX = center + v * phase;
    const leftFront = Math.min(passengerX, leftStrike + c * phase);
    const rightFront = Math.max(passengerX, rightStrike - c * phase);
    const frontHitTime = (rightStrike - center) / (c + v);
    const rearHitTime = (center - leftStrike) / (c - v);
    const frontHit = phase >= frontHitTime;
    const rearHit = phase >= rearHitTime;

    SRT.el("rect", { x: 0, y: 0, width: 862, height: 506, rx: 18, fill: "#f7f9fb" }, parent);
    SRT.el("rect", { x: 64, y: 54, width: 734, height: 356, rx: 16, fill: "#fff", stroke: "rgba(23,32,51,0.14)", "stroke-width": 2 }, parent);
    SRT.addText(parent, center, 92, "Bahnsteigsystem", "label", {
      fill: "#516173",
      "font-size": 14,
      "font-weight": "850",
      "text-anchor": "middle"
    });

    SRT.el("line", { x1: 104, y1: y + 76, x2: 758, y2: y + 76, stroke: "#a7b2c0", "stroke-width": 5, "stroke-linecap": "round" }, parent);
    SRT.el("rect", { x: trainX, y: y + 8, width: trainW, height: 58, rx: 8, fill: "rgba(109,93,252,0.14)", stroke: "#6d5dfc", "stroke-width": 4 }, parent);
    SRT.el("path", { d: `M${trainX + trainW + 20} ${y + 37} h42`, stroke: "#6d5dfc", "stroke-width": 4, "stroke-linecap": "round" }, parent);
    SRT.el("polygon", { points: `${trainX + trainW + 62},${y + 37} ${trainX + trainW + 48},${y + 29} ${trainX + trainW + 48},${y + 45}`, fill: "#6d5dfc" }, parent);

    lightningBolt(parent, SRT, leftStrike, y - 16, "#d9941e");
    lightningBolt(parent, SRT, rightStrike, y - 16, "#d9941e");

    SRT.el("circle", { cx: leftFront, cy: y + 37, r: 12, fill: "#ffc83d", filter: "url(#glow)" }, parent);
    SRT.el("circle", { cx: rightFront, cy: y + 37, r: 12, fill: "#ffc83d", filter: "url(#glow)" }, parent);
    SRT.el("circle", { cx: passengerX, cy: y + 37, r: 10, fill: "#172033" }, parent);

    if (frontHit) hit(parent, SRT, passengerX, y + 37, "#2e7d50");
    if (rearHit) hit(parent, SRT, passengerX, y + 37, "#c2414b");
  });

  window.SRTSlide.register("lightning-setup", ({ parent, SRT }) => {
    SRT.clear(parent);
    const center = 431;
    const trainX = 191;
    const trainY = 214;
    const trainW = 480;
    const trainH = 82;
    const rearX = trainX;
    const frontX = trainX + trainW;
    const passengerY = trainY + trainH / 2;

    SRT.el("rect", { x: 0, y: 0, width: 862, height: 506, rx: 18, fill: "#f7f9fb" }, parent);
    SRT.el("rect", {
      x: 64, y: 54, width: 734, height: 356, rx: 16,
      fill: "#fff", stroke: "rgba(23,32,51,0.14)", "stroke-width": 2
    }, parent);

    SRT.addText(parent, center, 94, "Ausgangslage im Bahnsteigsystem", "label", {
      "text-anchor": "middle",
      "font-size": 18
    });
    SRT.addText(parent, center, 122, "Beide Blitze schlagen gleichzeitig ein.", "tiny", {
      "text-anchor": "middle",
      "font-size": 13
    });

    SRT.el("line", {
      x1: 112, y1: trainY + trainH + 54, x2: 750, y2: trainY + trainH + 54,
      stroke: "#a7b2c0", "stroke-width": 5, "stroke-linecap": "round"
    }, parent);
    SRT.el("rect", {
      x: trainX, y: trainY, width: trainW, height: trainH, rx: 10,
      fill: "rgba(109,93,252,0.14)", stroke: "#6d5dfc", "stroke-width": 4
    }, parent);

    lightningBolt(parent, SRT, rearX, trainY - 58, "#d9941e");
    lightningBolt(parent, SRT, frontX, trainY - 58, "#d9941e");
    SRT.addText(parent, rearX, trainY - 72, "hinten", "tiny", {
      "text-anchor": "middle",
      "font-size": 13,
      "font-weight": "800"
    });
    SRT.addText(parent, frontX, trainY - 72, "vorn", "tiny", {
      "text-anchor": "middle",
      "font-size": 13,
      "font-weight": "800"
    });

    SRT.el("circle", {
      cx: center, cy: passengerY, r: 12,
      fill: "#172033", stroke: "#fff", "stroke-width": 3
    }, parent);
    SRT.el("line", {
      x1: center, y1: trainY - 12, x2: center, y2: trainY + trainH + 12,
      stroke: "#d9941e", "stroke-width": 2, "stroke-dasharray": "6 6"
    }, parent);
    SRT.addText(parent, center, trainY + trainH + 34, "Passagier in der Zugmitte", "label", {
      "text-anchor": "middle",
      "font-size": 13,
      fill: "#516173"
    });

    SRT.el("line", {
      x1: 350, y1: 390, x2: 512, y2: 390,
      stroke: "#6d5dfc", "stroke-width": 5, "stroke-linecap": "round"
    }, parent);
    SRT.el("polygon", {
      points: "512,390 494,379 494,401",
      fill: "#6d5dfc"
    }, parent);
    SRT.addText(parent, center, 426, "Fahrtrichtung des Zuges", "label", {
      "text-anchor": "middle",
      "font-size": 14,
      fill: "#6d5dfc"
    });
  });

  function drawTrainFrame(parent, SRT, y, phase) {
    const cx = 431;
    const trainW = SIM_TRAIN_WIDTH;
    const left = cx - trainW / 2;
    const right = cx + trainW / 2;
    const lightSpread = Math.min(trainW / 2, SIM_LIGHT_SPEED * phase);
    const pLeft = cx - lightSpread;
    const pRight = cx + lightSpread;

    SRT.el("rect", { x: 64, y: y - 58, width: 734, height: 156, rx: 16, fill: "#fff", stroke: "rgba(23,32,51,0.14)", "stroke-width": 2 }, parent);
    SRT.addText(parent, cx, y - 28, "Zugsystem", "label", {
      fill: "#516173",
      "font-size": 14,
      "font-weight": "850",
      "text-anchor": "middle"
    });
    SRT.el("rect", { x: left, y: y + 8, width: trainW, height: 54, rx: 8, fill: "rgba(109,93,252,0.14)", stroke: "#6d5dfc", "stroke-width": 4 }, parent);
    SRT.el("circle", { cx: cx, cy: y + 35, r: 8, fill: "#d9941e" }, parent);
    SRT.el("circle", { cx: pLeft, cy: y + 35, r: 11, fill: "#ffc83d", filter: "url(#glow)" }, parent);
    SRT.el("circle", { cx: pRight, cy: y + 35, r: 11, fill: "#ffc83d", filter: "url(#glow)" }, parent);
    if (lightSpread >= trainW / 2) {
      hit(parent, SRT, left, y + 35, "#2e7d50");
      hit(parent, SRT, right, y + 35, "#2e7d50");
    }
  }

  function drawPlatformFrame(parent, SRT, y, phase) {
    const cx = 431;
    const trainW = SIM_TRAIN_WIDTH;
    const v = 92;
    const trainX = cx - trainW / 2 + v * phase;
    const left = trainX;
    const right = trainX + trainW;
    const lightSpread = SIM_LIGHT_SPEED * phase;
    const rearHitTime = (trainW / 2) / (SIM_LIGHT_SPEED + v);
    const frontHitTime = (trainW / 2) / (SIM_LIGHT_SPEED - v);
    const rearHit = phase >= rearHitTime;
    const frontHit = phase >= frontHitTime;
    const leftPhoton = rearHit ? left : cx - lightSpread;
    const rightPhoton = frontHit ? right : cx + lightSpread;

    SRT.el("rect", { x: 64, y: y - 58, width: 734, height: 156, rx: 16, fill: "#fff", stroke: "rgba(23,32,51,0.14)", "stroke-width": 2 }, parent);
    SRT.addText(parent, cx, y - 28, "Bahnsteigsystem", "label", {
      fill: "#516173",
      "font-size": 14,
      "font-weight": "850",
      "text-anchor": "middle"
    });
    SRT.el("line", { x1: 96, y1: y + 72, x2: 766, y2: y + 72, stroke: "#a7b2c0", "stroke-width": 4 }, parent);
    SRT.el("rect", { x: trainX, y: y + 8, width: trainW, height: 54, rx: 8, fill: "rgba(109,93,252,0.14)", stroke: "#6d5dfc", "stroke-width": 4 }, parent);
    SRT.el("path", { d: `M${trainX + trainW + 22} ${y + 35} h44`, stroke: "#6d5dfc", "stroke-width": 4, "stroke-linecap": "round" }, parent);
    SRT.el("polygon", { points: `${trainX + trainW + 66},${y + 35} ${trainX + trainW + 52},${y + 27} ${trainX + trainW + 52},${y + 43}`, fill: "#6d5dfc" }, parent);
    SRT.el("circle", { cx: cx, cy: y + 35, r: 8, fill: "#d9941e" }, parent);
    SRT.el("circle", { cx: leftPhoton, cy: y + 35, r: 11, fill: "#ffc83d", filter: "url(#glow)" }, parent);
    SRT.el("circle", { cx: rightPhoton, cy: y + 35, r: 11, fill: "#ffc83d", filter: "url(#glow)" }, parent);
    if (rearHit) hit(parent, SRT, left, y + 35, "#2e7d50");
    if (frontHit) hit(parent, SRT, right, y + 35, "#c2414b");
  }

  function hit(parent, SRT, x, y, color) {
    SRT.el("circle", { cx: x, cy: y, r: 18, fill: "none", stroke: color, "stroke-width": 4, opacity: 0.9 }, parent);
  }

  function lightningBolt(parent, SRT, x, y, color) {
    SRT.el("polygon", {
      points: `${x - 8},${y} ${x + 5},${y} ${x - 2},${y + 20} ${x + 12},${y + 20} ${x - 9},${y + 54} ${x - 1},${y + 28} ${x - 14},${y + 28}`,
      fill: color,
      filter: "url(#glow)"
    }, parent);
  }
})();
