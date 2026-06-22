(function () {
  const SRT = window.SRTSlide;
  if (!SRT) return;

  const W = 862;
  const VH = 340;

  const INK = "#172033", MUTED = "#5c6678", GREEN = "#2e7d50";
  const CAR = "#2f6fd0", CAR_FILL = "#cfe0f7";
  const FRAME = "#7a8493", DOOR_OPEN = "#9aa4b2", DOOR_SHUT = "#d64545";

  const MPX = 60;          // Pixel pro Meter
  const GROUND_Y = 250;
  const ROOF_Y = 150;
  const CAR_H = 70;
  const PERIOD = 7500;     // ms pro Durchlauf

  function bg(parent) {
    SRT.el("rect", { x: 0, y: 0, width: W, height: VH, rx: 18, fill: "#f7f9fb" }, parent);
  }

  function ground(parent) {
    SRT.el("line", { x1: 30, y1: GROUND_Y, x2: W - 30, y2: GROUND_Y,
      stroke: "#cdd5df", "stroke-width": 3, "stroke-linecap": "round" }, parent);
  }

  function label(parent, x, y, value, color, size, anchor) {
    return SRT.addText(parent, x, y, value, "tiny", {
      "text-anchor": anchor || "middle", fill: color || INK,
      "font-size": size || 13, "font-weight": "700"
    });
  }

  function car(parent, cx, lengthPx) {
    const top = GROUND_Y - CAR_H;
    const x = cx - lengthPx / 2;
    SRT.el("rect", { x, y: top, width: lengthPx, height: CAR_H, rx: 14,
      fill: CAR_FILL, stroke: CAR, "stroke-width": 3 }, parent);
    SRT.el("rect", { x: x + lengthPx * 0.28, y: top - 22, width: lengthPx * 0.44, height: 26, rx: 8,
      fill: CAR_FILL, stroke: CAR, "stroke-width": 3 }, parent);
    SRT.el("circle", { cx: x + lengthPx * 0.22, cy: GROUND_Y, r: 13, fill: INK }, parent);
    SRT.el("circle", { cx: x + lengthPx * 0.78, cy: GROUND_Y, r: 13, fill: INK }, parent);
  }

  // Garagenrahmen ohne Tore (Pfosten + Dach).
  function garageFrame(parent, cx, widthPx) {
    const xl = cx - widthPx / 2, xr = cx + widthPx / 2;
    SRT.el("line", { x1: xl, y1: ROOF_Y, x2: xl, y2: GROUND_Y, stroke: FRAME, "stroke-width": 4, "stroke-linecap": "round" }, parent);
    SRT.el("line", { x1: xr, y1: ROOF_Y, x2: xr, y2: GROUND_Y, stroke: FRAME, "stroke-width": 4, "stroke-linecap": "round" }, parent);
    SRT.el("line", { x1: xl - 4, y1: ROOF_Y, x2: xr + 4, y2: ROOF_Y, stroke: FRAME, "stroke-width": 4, "stroke-linecap": "round" }, parent);
  }

  function door(parent, x, closed) {
    if (closed) {
      SRT.el("rect", { x: x - 4, y: ROOF_Y + 2, width: 8, height: GROUND_Y - ROOF_Y - 2, fill: DOOR_SHUT }, parent);
    } else {
      // offenes Tor: hochgeklappt, kurzer Balken unter dem Dach
      SRT.el("line", { x1: x - 11, y1: ROOF_Y + 7, x2: x + 11, y2: ROOF_Y + 7, stroke: DOOR_OPEN, "stroke-width": 5, "stroke-linecap": "round" }, parent);
    }
  }

  function arrow(parent, x1, x2, y, color, lbl) {
    const dir = x2 > x1 ? 1 : -1;
    SRT.el("line", { x1, y1: y, x2: x2 - dir * 9, y2: y, stroke: color, "stroke-width": 3, "stroke-linecap": "round" }, parent);
    SRT.el("polygon", { points: `${x2},${y} ${x2 - dir * 12},${y - 6} ${x2 - dir * 12},${y + 6}`, fill: color }, parent);
    if (lbl) label(parent, (x1 + x2) / 2, y - 10, lbl, color, 14);
  }

  // ================================================================
  // Ruhesystem der Garage: Auto (3 m) faehrt durch Garage (4 m).
  // Ist das Auto ganz drin, schliessen beide Tore gleichzeitig.
  // ================================================================
  function renderGarage(parent, p) {
    label(parent, 40, 40, "Ruhesystem der Garage", MUTED, 15, "start");
    ground(parent);

    const gcx = 431, gw = 4 * MPX;          // Garage 240 px
    const gl = gcx - gw / 2, gr = gcx + gw / 2;
    const cl = 3 * MPX;                      // Auto 180 px (kontrahiert)
    const half = cl / 2;

    const xStart = gl - half - 120, xEnd = gr + half + 120;
    let ccx;
    if (p < 0.42) {
      ccx = xStart + (p / 0.42) * (gcx - xStart);
    } else if (p < 0.60) {
      ccx = gcx;
    } else {
      ccx = gcx + ((p - 0.60) / 0.40) * (xEnd - gcx);
    }
    const carLeft = ccx - half, carRight = ccx + half;
    const inside = carLeft >= gl + 8 && carRight <= gr - 8;

    garageFrame(parent, gcx, gw);
    car(parent, ccx, cl);
    door(parent, gl, inside);
    door(parent, gr, inside);

    arrow(parent, ccx - 28, ccx + 28, 118, GREEN, "v");
    label(parent, gcx, ROOF_Y - 12, "Garage 4 m", MUTED, 13);
    label(parent, ccx, GROUND_Y + 34, "Auto 3 m", CAR, 13);
    if (inside) label(parent, gcx, ROOF_Y - 58, "beide Tore zu, Auto ganz drin", DOOR_SHUT, 13);

  }

  // ================================================================
  // Ruhesystem des Autos: Garage (2,4 m) gleitet ueber Auto (5 m).
  // Die Tore schliessen nacheinander, das Auto ist nie eingeschlossen.
  // ================================================================
  function renderAuto(parent, p) {
    label(parent, 40, 40, "Ruhesystem des Autos", MUTED, 15, "start");
    ground(parent);

    const ccx = 431, cl = 5 * MPX;          // Auto 300 px
    const carHalf = cl / 2;
    const carLeft = ccx - carHalf, carRight = ccx + carHalf;
    const gw = 2.4 * MPX;                    // Garage 144 px (kontrahiert)
    const gHalf = gw / 2;

    const xgStart = carRight + gHalf + 140, xgEnd = carLeft - gHalf - 140;
    const gcx = xgStart + p * (xgEnd - xgStart);
    const gl = gcx - gHalf, gr = gcx + gHalf;

    const rightClosed = Math.abs(p - 0.36) < 0.035;
    const leftClosed = Math.abs(p - 0.64) < 0.035;

    car(parent, ccx, cl);
    garageFrame(parent, gcx, gw);
    door(parent, gl, leftClosed);
    door(parent, gr, rightClosed);

    arrow(parent, gcx + 22, gcx - 22, 118, GREEN, "v");
    label(parent, ccx, GROUND_Y + 34, "Auto 5 m", CAR, 13);
    label(parent, gcx, ROOF_Y - 12, "Garage 2,4 m", MUTED, 13);
    if (leftClosed || rightClosed) {
      label(parent, gcx, ROOF_Y - 58, "ein Tor zu, Auto schaut heraus", DOOR_SHUT, 13);
    }

  }

  function render({ parent, t, state, SRT }) {
    SRT.clear(parent);
    bg(parent);
    // Versatz, damit das Standbild (t=0) den interessanten Moment zeigt.
    const p = ((t + PERIOD * 0.5) % PERIOD) / PERIOD;
    if ((state.view || "garage") === "garage") renderGarage(parent, p);
    else renderAuto(parent, p);
  }

  window.SRTSlide.register("garagenparadoxon", {
    initialState: { view: "garage" },
    showMotionControl: false,
    controls: [{
      type: "segmented",
      key: "view",
      label: "Bezugssystem",
      options: [
        { label: "Garagensystem", value: "garage", description: "Ruhesystem der Garage" },
        { label: "Autosystem", value: "auto", description: "Ruhesystem des Autos" }
      ]
    }],
    render
  });
})();
