(() => {
  "use strict";

  const C_PX = 135;
  const HEIGHT = 420;
  const LEAD_TIME = 0.8;
  const HOLD_TIME = 0.7;
  const FLASH_TIME = 0.3;

  document.querySelectorAll("[data-zp2-animation]").forEach((root) => {
    const canvas = root.querySelector("canvas");
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const playButton = root.querySelector(".zp2-play");
    const speedSlider = root.querySelector(".zp2-speed");
    const speedValue = root.querySelector(".zp2-speed-value");
    const earthButton = root.querySelector('[data-zp2-frame="earth"]');
    const shipButton = root.querySelector('[data-zp2-frame="ship"]');
    const classicalCheckbox = root.querySelector(".zp2-classical");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const state = {
      speed: Number(speedSlider.value),
      frame: "earth",
      playing: !reduceMotion.matches,
      showClassical: classicalCheckbox.checked,
      time: 0,
      visible: true
    };

    let width = 0;
    let pixelRatio = 1;
    let lastFrame = performance.now();

    function resize() {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(HEIGHT * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      draw();
    }

    function geometry() {
      return {
        startX: width * 0.18,
        endX: width - 50,
        topY: HEIGHT * 0.32,
        bottomY: HEIGHT * 0.7
      };
    }

    function loop(now) {
      const deltaTime = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      if (state.playing && state.visible) state.time += deltaTime;
      if (state.visible) draw();
      window.requestAnimationFrame(loop);
    }

    function draw() {
      if (!width) return;

      const { startX, endX, topY, bottomY } = geometry();
      const travelTime = (endX - startX) / C_PX;
      const cycleTime = LEAD_TIME + travelTime + HOLD_TIME;
      const cyclePosition = state.time % cycleTime;
      const emissionTime = Math.min(cyclePosition - LEAD_TIME, travelTime);
      const fired = emissionTime >= 0;
      const lightTime = Math.max(emissionTime, 0);

      let opacity = 1;
      if (cyclePosition > LEAD_TIME + travelTime) {
        const holdProgress = (cyclePosition - LEAD_TIME - travelTime) / HOLD_TIME;
        opacity = holdProgress > 0.5
          ? Math.max(0, 1 - (holdProgress - 0.5) / 0.5)
          : 1;
      }

      let shipMuzzle;
      let groundMuzzle;
      if (state.frame === "earth") {
        shipMuzzle = startX + state.speed * C_PX * emissionTime;
        groundMuzzle = startX;
      } else {
        shipMuzzle = startX;
        groundMuzzle = startX - state.speed * C_PX * emissionTime;
      }
      const pulseX = startX + C_PX * lightTime;

      context.clearRect(0, 0, width, HEIGHT);
      context.save();
      context.globalAlpha = opacity;

      context.strokeStyle = "#edf0f5";
      context.lineWidth = 1;
      for (let x = 60; x < width; x += 60) {
        context.beginPath();
        context.moveTo(x, 18);
        context.lineTo(x, HEIGHT - 18);
        context.stroke();
      }

      context.strokeStyle = "#9aa3b2";
      context.lineWidth = 2;
      [topY, bottomY].forEach((y) => {
        context.beginPath();
        context.moveTo(24, y);
        context.lineTo(width - 24, y);
        context.stroke();
      });

      const topLabel = state.frame === "earth" ? "bewegte Lichtquelle" : "Lichtquelle ruht";
      const bottomLabel = state.frame === "earth"
        ? "Vergleich: ruhende Lichtquelle"
        : "Vergleichsquelle bewegt sich";
      context.fillStyle = "#5a6678";
      context.font = "600 13px 'Segoe UI', sans-serif";
      context.textAlign = "right";
      context.fillText(topLabel, width - 28, topY - 34);
      context.fillText(bottomLabel, width - 28, bottomY - 34);

      if (fired) {
        drawBeam(shipMuzzle, pulseX, topY);
        drawBeam(groundMuzzle, pulseX, bottomY);
        drawPulse(pulseX, topY);
        drawPulse(pulseX, bottomY);
        drawClassicalExpectation(startX, lightTime, topY, bottomY);
      }

      const flash = fired && emissionTime < FLASH_TIME
        ? 1 - emissionTime / FLASH_TIME
        : 0;
      drawShip(shipMuzzle, topY, flash);
      drawGroundLaser(groundMuzzle, bottomY, flash);
      drawTree(groundMuzzle - 70, bottomY);

      if (state.frame === "earth" && state.speed > 0) {
        drawArrow(shipMuzzle - 50, topY - 38, state.speed, 1);
      }
      if (state.frame === "ship" && state.speed > 0) {
        drawArrow(groundMuzzle - 70, bottomY - 64, state.speed, -1);
      }

      context.restore();
    }

    function drawBeam(startX, endX, y) {
      if (endX <= startX) return;
      const gradient = context.createLinearGradient(startX, 0, endX, 0);
      gradient.addColorStop(0, "rgba(245,184,46,0.25)");
      gradient.addColorStop(1, "rgba(245,184,46,1)");
      context.strokeStyle = gradient;
      context.lineWidth = 4;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(startX, y);
      context.lineTo(endX, y);
      context.stroke();
      context.lineCap = "butt";
    }

    function drawPulse(x, y) {
      const halo = context.createRadialGradient(x, y, 2, x, y, 16);
      halo.addColorStop(0, "rgba(245,184,46,0.55)");
      halo.addColorStop(1, "rgba(245,184,46,0)");
      context.fillStyle = halo;
      context.beginPath();
      context.arc(x, y, 16, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "#f5b82e";
      context.beginPath();
      context.arc(x, y, 7.5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#fff";
      context.beginPath();
      context.arc(x, y, 3, 0, Math.PI * 2);
      context.fill();
    }

    function drawClassicalExpectation(startX, lightTime, topY, bottomY) {
      if (!state.showClassical || state.speed <= 0) return;

      const inEarthFrame = state.frame === "earth";
      const ghostX = startX + C_PX
        * (inEarthFrame ? 1 + state.speed : 1 - state.speed)
        * lightTime;
      if (ghostX >= width - 24) return;

      const ghostY = inEarthFrame ? topY : bottomY;
      context.strokeStyle = "rgba(226,87,76,0.9)";
      context.setLineDash([3, 4]);
      context.lineWidth = 2;
      context.beginPath();
      context.arc(ghostX, ghostY, 8, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = "rgba(226,87,76,0.95)";
      context.font = "italic 12px Georgia, serif";
      context.textAlign = "center";
      context.fillText(inEarthFrame ? "c + v" : "c - v", ghostX, ghostY - 16);
    }

    function drawShip(muzzleX, y, flash) {
      const x = muzzleX - 8;

      context.fillStyle = "#d4daf0";
      context.beginPath();
      context.moveTo(x - 58, y - 12);
      context.lineTo(x - 6, y - 12);
      context.quadraticCurveTo(x + 8, y - 12, x + 8, y - 5);
      context.lineTo(x + 8, y + 5);
      context.quadraticCurveTo(x + 8, y + 12, x - 6, y + 12);
      context.lineTo(x - 58, y + 12);
      context.quadraticCurveTo(x - 66, y, x - 58, y - 12);
      context.closePath();
      context.fill();

      context.fillStyle = "#5b6cf0";
      context.beginPath();
      context.arc(x - 24, y, 5, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "#3c455f";
      context.fillRect(x + 4, y - 6, muzzleX - x - 6, 12);
      context.fillStyle = "#aeb8d8";
      context.fillRect(muzzleX - 3, y - 4, 3, 8);

      context.fillStyle = flash > 0 ? "#fff" : "#e2574c";
      context.beginPath();
      context.arc(x + 7, y - 9, 3.5, 0, Math.PI * 2);
      context.fill();

      if (flash > 0) drawFlash(muzzleX, y, flash);
    }

    function drawGroundLaser(muzzleX, y, flash) {
      context.strokeStyle = "#9aa3b2";
      context.lineWidth = 2.5;
      context.beginPath();
      context.moveTo(muzzleX - 22, y + 22);
      context.lineTo(muzzleX - 14, y);
      context.moveTo(muzzleX - 6, y + 22);
      context.lineTo(muzzleX - 14, y);
      context.stroke();

      context.fillStyle = "#3c455f";
      roundedRect(muzzleX - 28, y - 7, 25, 14, 3);
      context.fill();
      context.fillStyle = "#aeb8d8";
      context.fillRect(muzzleX - 3, y - 4, 3, 8);

      context.fillStyle = flash > 0 ? "#fff" : "#e2574c";
      context.beginPath();
      context.arc(muzzleX - 20, y - 10, 3.5, 0, Math.PI * 2);
      context.fill();

      if (flash > 0) drawFlash(muzzleX, y, flash);
    }

    function drawFlash(x, y, flash) {
      context.fillStyle = `rgba(245,200,90,${0.8 * flash})`;
      context.beginPath();
      context.arc(x + 2, y, 8 * flash + 3, 0, Math.PI * 2);
      context.fill();
    }

    function drawTree(x, y) {
      context.fillStyle = "#8a6240";
      context.fillRect(x - 3, y - 24, 6, 24);
      context.fillStyle = "#4caf7d";
      context.beginPath();
      context.arc(x, y - 34, 15, 0, Math.PI * 2);
      context.fill();
    }

    function drawArrow(x, y, speed, direction) {
      const length = 26 + speed * 55;
      context.strokeStyle = "#5b6cf0";
      context.fillStyle = "#5b6cf0";
      context.lineWidth = 3;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(x - direction * length / 2, y);
      context.lineTo(x + direction * length / 2, y);
      context.stroke();
      context.lineCap = "butt";
      context.beginPath();
      context.moveTo(x + direction * (length / 2 + 6), y);
      context.lineTo(x + direction * (length / 2 - 5), y - 5.5);
      context.lineTo(x + direction * (length / 2 - 5), y + 5.5);
      context.closePath();
      context.fill();
    }

    function roundedRect(x, y, rectWidth, rectHeight, radius) {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.arcTo(x + rectWidth, y, x + rectWidth, y + rectHeight, radius);
      context.arcTo(x + rectWidth, y + rectHeight, x, y + rectHeight, radius);
      context.arcTo(x, y + rectHeight, x, y, radius);
      context.arcTo(x, y, x + rectWidth, y, radius);
      context.closePath();
    }

    function updatePlayButton() {
      playButton.textContent = state.playing ? "Pause" : "Abspielen";
      playButton.setAttribute("aria-pressed", state.playing ? "true" : "false");
    }

    function updateSpeedValue() {
      const sign = state.frame === "earth" ? "+" : "\u2212";
      const formattedSpeed = state.speed.toFixed(2).replace(".", ",");
      const text = `v = ${sign}${formattedSpeed} c`;
      speedValue.textContent = text;
      speedSlider.setAttribute("aria-valuetext", text);
    }

    function setFrame(frame) {
      state.frame = frame;
      earthButton.setAttribute("aria-pressed", frame === "earth" ? "true" : "false");
      shipButton.setAttribute("aria-pressed", frame === "ship" ? "true" : "false");
      updateSpeedValue();
      draw();
    }

    playButton.addEventListener("click", () => {
      state.playing = !state.playing;
      lastFrame = performance.now();
      updatePlayButton();
    });

    speedSlider.addEventListener("input", () => {
      state.speed = Number(speedSlider.value);
      updateSpeedValue();
      draw();
    });

    earthButton.addEventListener("click", () => setFrame("earth"));
    shipButton.addEventListener("click", () => setFrame("ship"));
    classicalCheckbox.addEventListener("change", () => {
      state.showClassical = classicalCheckbox.checked;
      draw();
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        state.visible = entries[0]?.isIntersecting ?? true;
        lastFrame = performance.now();
      });
      observer.observe(root);
    }

    window.addEventListener("resize", resize);
    updatePlayButton();
    updateSpeedValue();
    resize();
    window.requestAnimationFrame(loop);
  });
})();
