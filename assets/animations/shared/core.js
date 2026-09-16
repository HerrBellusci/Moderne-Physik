(function () {
  const NS = "http://www.w3.org/2000/svg";

  function el(name, attrs = {}, parent) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    parent.appendChild(node);
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function addText(parent, x, y, value, className, attrs = {}) {
    const nextAttrs = { ...attrs };
    const inlineStyleAttrs = ["fill", "font-size", "font-weight", "letter-spacing", "pointer-events"];
    const styles = nextAttrs.style ? [nextAttrs.style] : [];
    inlineStyleAttrs.forEach((key) => {
      if (nextAttrs[key] === undefined) return;
      const value = key === "font-size" && /^-?\d+(\.\d+)?$/.test(String(nextAttrs[key]))
        ? `${nextAttrs[key]}px`
        : nextAttrs[key];
      styles.push(`${key}: ${value}`);
      delete nextAttrs[key];
    });
    if (styles.length) nextAttrs.style = styles.join("; ");
    const text = el("text", { x, y, class: className, ...nextAttrs }, parent);
    setMixedText(text, value);
    return text;
  }

  // Größenzeichen stehen kursiv (SI-Regeln, Konzeption „Formeln"):
  // Abschnitte zwischen Sternchen ("*v* = 0,4 *c*") werden als kursive
  // tspans gesetzt; Text ohne Sternchen bleibt unverändert.
  function setMixedText(node, value) {
    const str = String(value);
    if (!str.includes("*")) {
      node.textContent = str;
      return;
    }
    str.split("*").forEach((part, index) => {
      if (!part) return;
      const tspan = document.createElementNS(NS, "tspan");
      if (index % 2 === 1) tspan.setAttribute("font-style", "italic");
      tspan.textContent = part;
      node.appendChild(tspan);
    });
  }

  function textLines(parent, lines, x, y, className, lineHeight = 24) {
    clear(parent);
    lines.forEach((line, index) => {
      const tspan = document.createElementNS(NS, "tspan");
      tspan.setAttribute("x", x);
      tspan.setAttribute("y", y + index * lineHeight);
      tspan.setAttribute("class", className);
      tspan.textContent = line;
      parent.appendChild(tspan);
    });
  }

  function register(id, definition) {
    window.SRTSlide.animations[id] = typeof definition === "function"
      ? { render: definition }
      : definition;
  }

  window.SRTSlide = {
    animations: {},
    register,
    el,
    clear,
    addText,
    textLines
  };
})();
