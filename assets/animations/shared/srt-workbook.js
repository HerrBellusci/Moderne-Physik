(function () {
  const SRT = window.SRTSlide;
  if (!SRT) return;

  const W = 862;
  const H = 506;
  const controllers = [];
  const reduceMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  function addGlow(svg) {
    const defs = SRT.el("defs", {}, svg);
    const filter = SRT.el("filter", {
      id: "glow",
      x: "-60%",
      y: "-60%",
      width: "220%",
      height: "220%"
    }, defs);
    SRT.el("feGaussianBlur", { stdDeviation: "4", result: "blur" }, filter);
    const merge = SRT.el("feMerge", {}, filter);
    SRT.el("feMergeNode", { in: "blur" }, merge);
    SRT.el("feMergeNode", { in: "SourceGraphic" }, merge);
  }

  function createSvg(host) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    // Höhe/Breite der Zeichenfläche kann pro Einbettung überschrieben werden
    // (data-srt-viewbox-h / data-srt-viewbox-w); ohne Angabe gilt 862x506.
    const vw = Number(host.dataset.srtViewboxW) || W;
    const vh = Number(host.dataset.srtViewboxH) || H;
    svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", host.dataset.srtLabel || "Interaktive SRT-Visualisierung");
    addGlow(svg);
    const viz = SRT.el("g", {}, svg);
    host.appendChild(svg);
    return { svg, viz };
  }

  function cloneState(initialState, host) {
    const source = typeof initialState === "function" ? initialState(host) : (initialState || {});
    return JSON.parse(JSON.stringify(source));
  }

  function resolve(value, state) {
    return typeof value === "function" ? value(state) : value;
  }

  function formatRange(control, state) {
    const key = controlKey(control);
    if (typeof control.format === "function") return control.format(state[key], state);
    if (control.unit) return `${Number(state[key]).toFixed(2)} ${control.unit}`;
    return String(state[key]);
  }

  function controlKey(control) {
    return control.key || control.id;
  }

  function setStateValue(state, key, value) {
    state[key] = value;
  }

  function makeButton(control, state, onChange) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "srt-workbook-control-button";
    btn.textContent = resolve(control.label, state);
    btn.setAttribute("aria-label", resolve(control.ariaLabel, state) || btn.textContent);
    if (control.pressed) {
      btn.setAttribute("aria-pressed", resolve(control.pressed, state) ? "true" : "false");
    }
    if (control.disabled && resolve(control.disabled, state)) btn.disabled = true;
    btn.addEventListener("click", () => {
      if (typeof control.apply === "function") {
        control.apply(state);
      } else if (control.key) {
        setStateValue(state, control.key, control.value);
      }
      onChange({ rebuild: true });
    });
    return btn;
  }

  function makeRange(control, state, onChange) {
    const key = controlKey(control);
    const wrap = document.createElement("label");
    wrap.className = "srt-workbook-range";

    const top = document.createElement("span");
    top.className = "srt-workbook-range-label";
    const name = document.createElement("span");
    name.textContent = resolve(control.label, state);
    const value = document.createElement("span");
    value.className = "srt-workbook-range-value";
    value.textContent = formatRange(control, state);
    top.append(name, value);

    const input = document.createElement("input");
    input.type = "range";
    input.min = control.min;
    input.max = control.max;
    input.step = control.step || "any";
    input.value = state[key];
    input.setAttribute("aria-label", resolve(control.ariaLabel, state) || resolve(control.label, state));
    input.setAttribute("aria-valuetext", formatRange(control, state));
    input.addEventListener("input", () => {
      const next = Number(input.value);
      state[key] = Number.isFinite(next) ? next : input.value;
      value.textContent = formatRange(control, state);
      input.setAttribute("aria-valuetext", value.textContent);
      onChange({ rebuild: false });
    });

    wrap.append(top, input);
    return wrap;
  }

  function makeStepper(control, state, onChange) {
    const key = controlKey(control);
    const group = {
      type: "group",
      label: resolve(control.label, state),
      controls: [
        {
          label: "Zurück",
          ariaLabel: `${resolve(control.label, state)} zurück`,
          disabled: () => Number(state[key]) <= Number(control.min),
          apply: () => {
            state[key] = Math.max(Number(control.min), Number(state[key]) - Number(control.step || 1));
          }
        },
        {
          label: (nextState) => formatRange(control, nextState),
          ariaLabel: (nextState) => `${resolve(control.label, nextState)} ${formatRange(control, nextState)}`,
          disabled: true
        },
        {
          label: "Weiter",
          ariaLabel: `${resolve(control.label, state)} weiter`,
          disabled: () => Number(state[key]) >= Number(control.max),
          apply: () => {
            state[key] = Math.min(Number(control.max), Number(state[key]) + Number(control.step || 1));
          }
        }
      ]
    };
    return makeGroup(group, state, onChange);
  }

  function makeRandomButton(control, state, onChange) {
    return makeButton({
      label: resolve(control.label, state),
      ariaLabel: resolve(control.ariaLabel, state) || resolve(control.label, state),
      apply: () => {
        const values = control.values || {};
        (control.keys || Object.keys(values)).forEach((key) => {
          const range = values[key];
          if (!Array.isArray(range)) return;
          state[key] = range[0] + Math.random() * (range[1] - range[0]);
        });
      }
    }, state, onChange);
  }

  function makeSegmented(control, state, onChange) {
    const key = controlKey(control);
    return makeGroup({
      type: "group",
      label: resolve(control.label, state),
      controls: (control.options || []).map((option) => ({
        label: option.label,
        ariaLabel: option.description || option.label,
        pressed: () => state[key] === option.value,
        apply: () => { state[key] = option.value; }
      }))
    }, state, onChange);
  }

  function makePreset(control, state, onChange) {
    return makeGroup({
      type: "group",
      label: resolve(control.label, state),
      controls: (control.options || []).map((option) => ({
        label: option.label,
        ariaLabel: option.description || option.label,
        apply: () => { Object.assign(state, option.state || {}); }
      }))
    }, state, onChange);
  }

  function makeGroup(group, state, onChange) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "srt-workbook-control-group";
    if (group.label) {
      const legend = document.createElement("legend");
      legend.textContent = resolve(group.label, state);
      fieldset.appendChild(legend);
    }
    (group.controls || []).forEach((control) => {
      fieldset.appendChild(makeControl(control, state, onChange));
    });
    return fieldset;
  }

  function makeControl(control, state, onChange) {
    if (control.type === "group") return makeGroup(control, state, onChange);
    if (control.type === "segmented") return makeSegmented(control, state, onChange);
    if (control.type === "preset") return makePreset(control, state, onChange);
    if (control.type === "stepper") return makeStepper(control, state, onChange);
    if (control.type === "random") return makeRandomButton(control, state, onChange);
    if (control.type === "range") return makeRange(control, state, onChange);
    return makeButton(control, state, onChange);
  }

  function createControls(host, spec, state, api) {
    const controls = typeof spec.controls === "function" ? spec.controls(state) : (spec.controls || []);
    if (!controls.length && !spec.showMotionControl) return null;

    const panel = document.createElement("div");
    panel.className = "srt-workbook-controls";
    host.after(panel);

    function renderControls() {
      panel.replaceChildren();
      controls.forEach((control) => {
        panel.appendChild(makeControl(control, state, (options = {}) => {
          api.renderNow();
          if (options.rebuild) renderControls();
        }));
      });

      if (spec.showMotionControl !== false) {
        const motion = document.createElement("button");
        motion.type = "button";
        motion.className = "srt-workbook-control-button srt-workbook-motion-button";
        motion.textContent = api.motionEnabled() ? "Pause" : "Abspielen";
        motion.setAttribute("aria-label", api.motionEnabled()
          ? "Animation pausieren"
          : "Animation abspielen");
        motion.setAttribute("aria-pressed", api.motionEnabled() ? "true" : "false");
        motion.addEventListener("click", () => {
          api.setMotionEnabled(!api.motionEnabled());
          renderControls();
        });
        panel.appendChild(motion);
      }
    }

    renderControls();
    return panel;
  }

  function createMotionControl(host, api) {
    if (!host.hasAttribute("data-srt-motion-control")) return null;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "srt-workbook-overlay-motion";

    function update() {
      const enabled = api.motionEnabled();
      button.textContent = enabled ? "Pause" : "Abspielen";
      button.setAttribute("aria-label", enabled
        ? "Animation pausieren"
        : "Animation abspielen");
      button.setAttribute("aria-pressed", enabled ? "true" : "false");
    }

    button.addEventListener("click", () => {
      api.setMotionEnabled(!api.motionEnabled());
      update();
    });

    update();
    host.appendChild(button);
    return button;
  }

  function makeController(host) {
    const id = host.dataset.srtAnimation;
    const spec = SRT.animations[id];
    if (!spec || !spec.render) {
      host.textContent = `Animation "${id}" konnte nicht geladen werden.`;
      return null;
    }

    const { viz: parent } = createSvg(host);
    const mode = host.dataset.srtMode || "null";
    const state = cloneState(spec.initialState, host);
    let active = false;
    let raf = 0;
    let elapsed = 0;
    let lastFrame = 0;
    let isVisible = false;
    let motionEnabled = !reduceMotionQuery.matches;

    function renderAt(t) {
      spec.render({ parent, t, mode, state, SRT });
    }

    function frame(now) {
      if (!active) return;
      if (!lastFrame) lastFrame = now;
      elapsed += now - lastFrame;
      lastFrame = now;
      renderAt(elapsed);
      raf = window.requestAnimationFrame(frame);
    }

    function start() {
      if (active || document.hidden || !motionEnabled) return;
      active = true;
      lastFrame = 0;
      raf = window.requestAnimationFrame(frame);
    }

    function stop() {
      active = false;
      lastFrame = 0;
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    }

    function reset() {
      elapsed = 0;
      lastFrame = 0;
      renderAt(0);
    }

    function renderNow() {
      renderAt(elapsed);
    }

    function setMotionEnabled(next) {
      motionEnabled = next;
      if (!motionEnabled) {
        stop();
        renderNow();
      } else if (isVisible) {
        start();
      }
    }

    host.addEventListener("srt-reset", reset);
    host.addEventListener("srt-render", renderNow);
    renderAt(0);
    createControls(host, spec, state, {
      renderNow,
      motionEnabled: () => motionEnabled,
      setMotionEnabled
    });
    createMotionControl(host, {
      motionEnabled: () => motionEnabled,
      setMotionEnabled
    });

    return {
      host,
      start,
      stop,
      reset,
      get isVisible() { return isVisible; },
      set isVisible(next) { isVisible = next; }
    };
  }

  function initVisibility() {
    if (!("IntersectionObserver" in window)) {
      controllers.forEach((controller) => controller.start());
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const controller = controllers.find((item) => item.host === entry.target);
        if (!controller) return;
        controller.isVisible = entry.isIntersecting;
        if (entry.isIntersecting) {
          controller.start();
        } else {
          controller.stop();
        }
      });
    }, {
      root: null,
      rootMargin: "180px 0px",
      threshold: 0.05
    });

    controllers.forEach((controller) => observer.observe(controller.host));
  }

  function handlePageVisibility() {
    if (document.hidden) {
      controllers.forEach((controller) => controller.stop());
    } else {
      controllers
        .filter((controller) => controller.isVisible)
        .forEach((controller) => controller.start());
    }
  }

  function init() {
    document.querySelectorAll("[data-srt-animation]").forEach((host) => {
      const controller = makeController(host);
      if (controller) controllers.push(controller);
    });
    initVisibility();
    document.addEventListener("visibilitychange", handlePageVisibility);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
