function createExperimentMarkup() {
  return `
    <div class="mmx-widget">
      <section class="mmx-card mmx-toolbar">
        <div class="mmx-toolbar__block">
          <div class="mmx-toolbar__label">Physikalisches Modell</div>
          <div class="mmx-radio-group">
            <label class="mmx-radio">
              <input type="radio" name="mmx_model" value="classic" data-role="modelClassic" checked>
              <span>Klassische Äther-Hypothese (Erwartung)</span>
            </label>
            <label class="mmx-radio">
              <input type="radio" name="mmx_model" value="real" data-role="modelReal">
              <span>Reales Universum (kein Äther)</span>
            </label>
          </div>
        </div>
        <div class="mmx-toolbar__switch">
          <span class="mmx-toolbar__switch-text">Animation starten</span>
          <label class="mmx-switch">
            <input type="checkbox" data-role="runToggle">
            <span class="mmx-switch__track"><span class="mmx-switch__thumb"></span></span>
          </label>
        </div>
      </section>

      <section class="mmx-grid">
        <div class="mmx-card mmx-card--dark mmx-stage">
          <div class="mmx-stage__label">Lichtwege im Versuchsaufbau (Draufsicht)</div>
          <div class="mmx-stage__canvas-wrap">
            <canvas data-role="apparatusCanvas" width="400" height="400"></canvas>
          </div>
        </div>

        <div class="mmx-card mmx-stage">
          <div class="mmx-stage__label">Signal am Detektor</div>
          <div class="mmx-wave-wrap">
            <canvas data-role="waveCanvas" width="600" height="150"></canvas>
            <div class="mmx-legend">
              <div class="mmx-legend__item"><span class="mmx-legend__swatch mmx-legend__swatch--solid"></span><span>Welle aus Arm S₁</span></div>
              <div class="mmx-legend__item"><span class="mmx-legend__swatch mmx-legend__swatch--dash"></span><span>Welle aus Arm S₂</span></div>
              <div class="mmx-legend__item"><span class="mmx-legend__swatch mmx-legend__swatch--sum"></span><span><strong>Summe (Detektor-Signal)</strong></span></div>
            </div>
            <div class="mmx-status" data-role="statusBox">Status wird berechnet...</div>
          </div>
        </div>
      </section>

      <section class="mmx-slider-grid">
        <div class="mmx-card">
          <label class="mmx-slider">
            <div class="mmx-slider__head">
              <span class="mmx-slider__label">Äthergeschwindigkeit (v/c)</span>
              <span class="mmx-slider__value" data-role="windValue">0.15</span>
            </div>
            <input type="range" min="0" max="0.45" step="0.01" value="0.15" data-role="windSlider">
          </label>
        </div>
        <div class="mmx-card">
          <label class="mmx-slider">
            <div class="mmx-slider__head">
              <span class="mmx-slider__label">Apparatur drehen (°)</span>
              <span class="mmx-slider__value" data-role="rotationValue">0°</span>
            </div>
            <input type="range" min="0" max="360" step="1" value="0" data-role="rotationSlider">
          </label>
        </div>
      </section>
    </div>
  `;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function strokeLine(ctx, x1, y1, x2, y2, options = {}) {
  const {
    color = "#000000",
    width = 1,
    dash = [],
    alpha = 1,
    cap = "round",
    shadowBlur = 0,
    shadowColor = color,
  } = options;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = cap;
  ctx.globalAlpha = alpha;
  if (dash.length) ctx.setLineDash(dash);
  if (shadowBlur > 0) {
    ctx.shadowBlur = shadowBlur;
    ctx.shadowColor = shadowColor;
  }
  ctx.stroke();
  ctx.restore();
}

function drawPhoton(ctx, x, y, color) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 4.2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowBlur = 12;
  ctx.shadowColor = color;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
}

function initExperiment(root) {
  if (!root || root.dataset.mmxReady === "true") return;
  root.dataset.mmxReady = "true";
  root.innerHTML = createExperimentMarkup();

  const els = {
    apparatusCanvas: root.querySelector('[data-role="apparatusCanvas"]'),
    waveCanvas: root.querySelector('[data-role="waveCanvas"]'),
    modelClassic: root.querySelector('[data-role="modelClassic"]'),
    modelReal: root.querySelector('[data-role="modelReal"]'),
    runToggle: root.querySelector('[data-role="runToggle"]'),
    windSlider: root.querySelector('[data-role="windSlider"]'),
    windValue: root.querySelector('[data-role="windValue"]'),
    rotationSlider: root.querySelector('[data-role="rotationSlider"]'),
    rotationValue: root.querySelector('[data-role="rotationValue"]'),
    statusBox: root.querySelector('[data-role="statusBox"]'),
  };

  const ctxApp = els.apparatusCanvas.getContext("2d");
  const ctxWave = els.waveCanvas.getContext("2d");

  const state = {
    isRunning: false,
    isClassicalModel: true,
    angleDeg: 0,
    windSpeedInput: 0.15,
    globalTime: 0,
    photons: [],
    rafId: null,
    visible: true,
  };

  const geometry = {
    appWidth: els.apparatusCanvas.width,
    appHeight: els.apparatusCanvas.height,
    waveWidth: els.waveCanvas.width,
    waveHeight: els.waveCanvas.height,
    armLength: 100,
    cx: 200,
    cy: 200,
    lr: -130,
    dy: 110,
  };

  function cancelLoop() {
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
  }

  function scheduleLoop() {
    if (!state.isRunning || !state.visible || state.rafId !== null) return;
    state.rafId = requestAnimationFrame(frame);
  }

  function updateDisplayedValues() {
    els.windValue.textContent = state.windSpeedInput.toFixed(2);
    els.rotationValue.textContent = `${state.angleDeg}°`;
  }

  function updateStatus(isClassicalModel, intensity) {
    if (!isClassicalModel) {
      els.statusBox.style.backgroundColor = "#f1f5f9";
      els.statusBox.style.borderColor = "#cbd5e1";
      els.statusBox.style.color = "#475569";
      els.statusBox.textContent = "Reales Universum: kein Äther, Licht verhält sich in allen Richtungen gleich.";
      return;
    }

    if (intensity > 0.8) {
      els.statusBox.style.backgroundColor = "#fef2f2";
      els.statusBox.style.borderColor = "#fca5a5";
      els.statusBox.style.color = "#991b1b";
      els.statusBox.textContent = "Konstruktive Interferenz - die Wellen verstärken sich.";
      return;
    }

    if (intensity < 0.2) {
      els.statusBox.style.backgroundColor = "#1e293b";
      els.statusBox.style.borderColor = "#0f172a";
      els.statusBox.style.color = "#cbd5e1";
      els.statusBox.textContent = "Destruktive Interferenz - die Wellen loeschen sich fast aus.";
      return;
    }

    els.statusBox.style.backgroundColor = "#fff7ed";
    els.statusBox.style.borderColor = "#fdba74";
    els.statusBox.style.color = "#c2410c";
    els.statusBox.textContent = "Partielle Interferenz - das Signal ist dämpft.";
  }

  function drawWavePanel(phaseShift) {
    const { waveWidth, waveHeight } = geometry;
    const centerY = waveHeight / 2;
    const amplitude = 35;
    const waveAnimTime = state.globalTime * 0.08;

    ctxWave.clearRect(0, 0, waveWidth, waveHeight);
    strokeLine(ctxWave, 0, centerY, waveWidth, centerY, {
      color: "#e2e8f0",
      width: 2,
      cap: "butt",
    });

    function drawSineWave(color, width, offsetPhase, dash = []) {
      ctxWave.save();
      ctxWave.beginPath();
      ctxWave.strokeStyle = color;
      ctxWave.lineWidth = width;
      if (dash.length) ctxWave.setLineDash(dash);

      for (let x = 0; x <= waveWidth; x += 1) {
        const y = Math.sin(x / 20 - waveAnimTime + offsetPhase) * amplitude;
        if (x === 0) ctxWave.moveTo(x, centerY + y);
        else ctxWave.lineTo(x, centerY + y);
      }

      ctxWave.stroke();
      ctxWave.restore();
    }

    drawSineWave("#ef4444", 2, 0);
    drawSineWave("#7f1d1d", 2, phaseShift, [6, 6]);

    ctxWave.save();
    ctxWave.beginPath();
    ctxWave.strokeStyle = "#dc2626";
    ctxWave.lineWidth = 4;
    ctxWave.lineJoin = "round";
    ctxWave.shadowBlur = 8;
    ctxWave.shadowColor = "#ef4444";

    for (let x = 0; x <= waveWidth; x += 1) {
      const y1 = Math.sin(x / 20 - waveAnimTime) * amplitude;
      const y2 = Math.sin(x / 20 - waveAnimTime + phaseShift) * amplitude;
      const ySum = (y1 + y2) * 0.5;
      if (x === 0) ctxWave.moveTo(x, centerY + ySum);
      else ctxWave.lineTo(x, centerY + ySum);
    }

    ctxWave.stroke();
    ctxWave.restore();
  }

  function drawApparatus(t1, t2, intensity, isClassicalModel, betaInput, alphaRad) {
    const { appWidth, appHeight, armLength, cx, cy, lr, dy } = geometry;
    const red = "#ef4444";
    const darkRed = "#7f1d1d";
    const baseRed = "rgba(239, 68, 68, 0.14)";

    ctxApp.clearRect(0, 0, appWidth, appHeight);

    ctxApp.save();
    ctxApp.strokeStyle = "rgba(100, 116, 139, 0.38)";
    ctxApp.lineWidth = 1.4;
    ctxApp.setLineDash([4, 6]);
    ctxApp.beginPath();
    ctxApp.arc(cx, cy, armLength + 40, 0, Math.PI * 2);
    ctxApp.stroke();
    ctxApp.fillStyle = "#64748b";
    ctxApp.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctxApp.textAlign = "center";
    ctxApp.fillText("0°", cx, cy - armLength - 48);
    ctxApp.restore();

    if (isClassicalModel && betaInput > 0.005) {
      ctxApp.save();
      const windOpacity = Math.min(0.2 + betaInput * 1.5, 0.8);
      const windShift = (state.globalTime * (2 + betaInput * 10)) % 400;
      ctxApp.strokeStyle = `rgba(34, 211, 238, ${windOpacity})`;
      ctxApp.lineWidth = 2 + betaInput * 3;
      ctxApp.shadowBlur = 5;
      ctxApp.shadowColor = "#22d3ee";

      for (let i = 0; i < 4; i += 1) {
        const y = 80 + i * 80;
        const x = ((windShift + i * 150) % 600) - 100;
        const head = x + 40 + betaInput * 50;
        ctxApp.beginPath();
        ctxApp.moveTo(x - 30, y);
        ctxApp.lineTo(head, y);
        ctxApp.lineTo(head - 10, y - 6);
        ctxApp.moveTo(head, y);
        ctxApp.lineTo(head - 10, y + 6);
        ctxApp.stroke();
      }

      ctxApp.restore();
    } else if (!isClassicalModel) {
      ctxApp.save();
      roundedRect(ctxApp, 15, 20, 116, 26, 8);
      ctxApp.fillStyle = "rgba(5, 46, 22, 0.88)";
      ctxApp.fill();
      ctxApp.strokeStyle = "#166534";
      ctxApp.lineWidth = 1;
      ctxApp.stroke();
      ctxApp.fillStyle = "#bbf7d0";
      ctxApp.font = "bold 11px ui-monospace, Menlo, Consolas, monospace";
      ctxApp.textAlign = "left";
      ctxApp.fillText("KEIN ÄTHER", 28, 37);
      ctxApp.restore();
    }

    ctxApp.save();
    ctxApp.translate(cx, cy);
    ctxApp.rotate(alphaRad);

    strokeLine(ctxApp, 0, 0, 0, -armLength - 30, {
      color: "#38bdf8",
      width: 1.2,
      dash: [4, 6],
      alpha: 0.45,
    });

    strokeLine(ctxApp, lr, 0, 0, 0, { color: "#1e293b", width: 12 });
    strokeLine(ctxApp, 0, 0, 0, -armLength, { color: "#1e293b", width: 12 });
    strokeLine(ctxApp, 0, 0, armLength, 0, { color: "#1e293b", width: 12 });
    strokeLine(ctxApp, 0, 0, 0, dy, { color: "#1e293b", width: 12 });

    strokeLine(ctxApp, lr, 0, 0, 0, { color: baseRed, width: 3 });
    strokeLine(ctxApp, 0, 0, 0, -armLength, { color: baseRed, width: 3 });
    strokeLine(ctxApp, 0, 0, armLength, 0, { color: baseRed, width: 3 });
    strokeLine(ctxApp, 0, 0, 0, dy, { color: "rgba(220, 38, 38, 0.12)", width: 3 });

    const baseVelocity = 1.5;
    const timeIn = Math.abs(lr) / baseVelocity;
    const armTime1 = (armLength * 2 / baseVelocity) * t1;
    const armTime2 = (armLength * 2 / baseVelocity) * t2;
    const detectorTime = dy / baseVelocity;
    const totalTime1 = timeIn + armTime1 + detectorTime;
    const totalTime2 = timeIn + armTime2 + detectorTime;

    for (let i = state.photons.length - 1; i >= 0; i -= 1) {
      const photon = state.photons[i];
      if (state.isRunning) photon.timeAlive += 1;

      if (photon.timeAlive > Math.max(totalTime1, totalTime2)) {
        state.photons.splice(i, 1);
        continue;
      }

      if (photon.timeAlive <= totalTime1) {
        let x1 = 0;
        let y1 = 0;
        if (photon.timeAlive < timeIn) {
          x1 = lr + (photon.timeAlive / timeIn) * Math.abs(lr);
        } else if (photon.timeAlive < timeIn + armTime1 / 2) {
          y1 = -((photon.timeAlive - timeIn) / (armTime1 / 2)) * armLength;
        } else if (photon.timeAlive < timeIn + armTime1) {
          y1 = -armLength + ((photon.timeAlive - timeIn - armTime1 / 2) / (armTime1 / 2)) * armLength;
        } else {
          y1 = ((photon.timeAlive - timeIn - armTime1) / detectorTime) * dy;
        }
        drawPhoton(ctxApp, x1, y1, red);
      }

      if (photon.timeAlive <= totalTime2) {
        let x2 = 0;
        let y2 = 0;
        if (photon.timeAlive < timeIn) {
          x2 = lr + (photon.timeAlive / timeIn) * Math.abs(lr);
        } else if (photon.timeAlive < timeIn + armTime2 / 2) {
          x2 = ((photon.timeAlive - timeIn) / (armTime2 / 2)) * armLength;
        } else if (photon.timeAlive < timeIn + armTime2) {
          x2 = armLength - ((photon.timeAlive - timeIn - armTime2 / 2) / (armTime2 / 2)) * armLength;
        } else {
          y2 = ((photon.timeAlive - timeIn - armTime2) / detectorTime) * dy;
        }
        drawPhoton(ctxApp, x2, y2, red);
      }
    }

    ctxApp.fillStyle = "#1e293b";
    ctxApp.fillRect(lr - 10, -15, 20, 30);
    ctxApp.strokeStyle = red;
    ctxApp.lineWidth = 2;
    ctxApp.strokeRect(lr - 10, -15, 20, 30);
    ctxApp.fillStyle = "#fecaca";
    ctxApp.font = "bold 10px ui-sans-serif, system-ui, sans-serif";
    ctxApp.textAlign = "center";
    ctxApp.fillText("LASER", lr, 25);

    ctxApp.save();
    ctxApp.rotate(Math.PI / 4);
    ctxApp.fillStyle = "rgba(226, 232, 240, 0.2)";
    ctxApp.fillRect(-25, -2, 50, 4);
    ctxApp.strokeStyle = "#f8fafc";
    ctxApp.lineWidth = 2;
    ctxApp.strokeRect(-25, -2, 50, 4);
    ctxApp.restore();
    ctxApp.fillStyle = "#cbd5e1";
    ctxApp.fillText("Strahlteiler", 42, -20);

    ctxApp.fillStyle = "#e2e8f0";
    ctxApp.fillRect(-25, -armLength - 5, 50, 10);
    ctxApp.strokeStyle = "#94a3b8";
    ctxApp.lineWidth = 1;
    ctxApp.strokeRect(-25, -armLength - 5, 50, 10);
    ctxApp.fillStyle = "#cbd5e1";
    ctxApp.fillText("S₁", 38, -armLength + 4);

    ctxApp.fillStyle = "#e2e8f0";
    ctxApp.fillRect(armLength - 5, -25, 10, 50);
    ctxApp.strokeStyle = "#94a3b8";
    ctxApp.lineWidth = 1;
    ctxApp.strokeRect(armLength - 5, -25, 10, 50);
    ctxApp.fillStyle = "#cbd5e1";
    ctxApp.fillText("S₂", armLength + 18, 22);

    const redColor = Math.round(20 + intensity * 235);
    const mixColor = Math.round(intensity * 40);
    ctxApp.fillStyle = `rgb(${redColor}, ${mixColor}, ${mixColor})`;
    ctxApp.fillRect(-20, dy, 40, 20);
    ctxApp.strokeStyle = "#cbd5e1";
    ctxApp.lineWidth = 2;
    ctxApp.strokeRect(-20, dy, 40, 20);
    ctxApp.fillStyle = "#cbd5e1";
    ctxApp.fillText("Detektor", 0, dy + 35);

    if (!state.isRunning) {
      ctxApp.fillStyle = "#64748b";
      ctxApp.font = "italic 12px ui-sans-serif, system-ui, sans-serif";
      ctxApp.fillText("▶ Animation pausiert", 0, dy + 55);
    }

    ctxApp.restore();
  }

  function render() {
    const beta = state.isClassicalModel ? state.windSpeedInput : 0;
    const beta2 = beta * beta;
    const alphaRad = state.angleDeg * Math.PI / 180;
    const phi1 = Math.PI / 2 + alphaRad;
    const phi2 = alphaRad;
    const denom = Math.max(1 - beta2, 0.0001);
    const t1 = Math.sqrt(1 - beta2 * Math.sin(phi1) ** 2) / denom;
    const t2 = Math.sqrt(1 - beta2 * Math.sin(phi2) ** 2) / denom;
    const phaseShift = 4 * Math.PI * 6 * (t2 - t1);
    const intensity = Math.cos(phaseShift / 2) ** 2;

    if (state.isRunning) {
      state.globalTime += 1;
      if (state.globalTime % 25 === 0) {
        state.photons.push({ timeAlive: 0 });
      }
    }

    updateDisplayedValues();
    updateStatus(state.isClassicalModel, intensity);
    drawApparatus(t1, t2, intensity, state.isClassicalModel, state.windSpeedInput, alphaRad);
    drawWavePanel(phaseShift);
  }

  function frame() {
    state.rafId = null;
    render();
    scheduleLoop();
  }

  function rerenderNow() {
    if (!state.isRunning) cancelLoop();
    render();
    scheduleLoop();
  }

  els.rotationSlider.addEventListener("input", (event) => {
    state.angleDeg = Number(event.target.value);
    rerenderNow();
  });

  els.windSlider.addEventListener("input", (event) => {
    state.windSpeedInput = Number(event.target.value);
    rerenderNow();
  });

  els.runToggle.addEventListener("change", (event) => {
    state.isRunning = event.target.checked;
    rerenderNow();
  });

  els.modelClassic.addEventListener("change", (event) => {
    if (!event.target.checked) return;
    state.isClassicalModel = true;
    rerenderNow();
  });

  els.modelReal.addEventListener("change", (event) => {
    if (!event.target.checked) return;
    state.isClassicalModel = false;
    rerenderNow();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      state.visible = entry ? entry.isIntersecting : true;
      if (!state.visible) {
        cancelLoop();
      } else {
        rerenderNow();
      }
    }, { threshold: 0.1 });
    observer.observe(root);
  }

  updateDisplayedValues();
  render();
}

function boot() {
  document.querySelectorAll("[data-mm-experiment]").forEach(initExperiment);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
