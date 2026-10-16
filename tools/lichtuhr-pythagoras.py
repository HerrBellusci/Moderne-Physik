#!/usr/bin/env python3
"""Statische Lichtuhr-Skizze mit den lokalen MathJax-Zeichen erzeugen.

Aufruf: python3 tools/lichtuhr-pythagoras.py
Benötigt Chromium und Python 3, keine zusätzlichen Python-Pakete.
"""
import base64
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/images/lichtuhr-pythagoras-bahnsteig.svg"
FONT = ROOT / "assets/fonts/6xK3dSBYKcSV-LCoeQqfX1RYOo3qOK7l.woff2"

# Anfang A=(210,338), Reflexion B=(510,98), rechter Winkel C=(510,338).
# Die dritte Spiegelposition illustriert die weitere Bewegung nach rechts.
SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" role="img" aria-labelledby="title desc">
<title id="title">Halber Tick einer Lichtuhr im Bahnsteigsystem</title>
<desc id="desc">Ein Lichtpuls läuft vom unteren Spiegel links schräg nach rechts zum oberen Spiegel. Der Lichtweg c Delta t durch 2 bildet mit dem Spiegelabstand D und der Verschiebung v Delta t durch 2 ein rechtwinkliges Dreieck. Die Spiegel bewegen sich nach rechts.</desc>
<defs>
  <linearGradient id="mirror" x2="0" y2="1"><stop stop-color="#eef1f4"/><stop offset="1" stop-color="#b5c0ca"/></linearGradient>
  <marker id="light-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0 0 10 5 0 10 2.5 5Z" fill="#e50050"/></marker>
  <marker id="speed-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 10 5 0 10 2.5 5Z" fill="#243447"/></marker>
</defs>
<rect x="5" y="5" width="890" height="490" rx="14" fill="white" stroke="#8795a5" stroke-width="2"/>
<text x="28" y="44" font-family="Source Sans Pro, sans-serif" font-size="25" fill="#243447">Bahnsteigsystem</text>
<g stroke="#a8b4c0" stroke-width="1.6" stroke-dasharray="7 6" fill="none">
  <path d="M210 98V338"/><path d="M770 98V338"/>
</g>
<g fill="url(#mirror)" stroke="#243447" stroke-width="1.7">
  <rect x="135" y="80" width="150" height="18"/>
  <rect x="135" y="338" width="150" height="18"/>
  <rect x="435" y="80" width="150" height="18"/>
  <rect x="435" y="338" width="150" height="18"/>
</g>
<g fill="url(#mirror)" stroke="#8795a5" stroke-width="1.7" opacity="0.5">
  <rect x="695" y="80" width="150" height="18"/>
  <rect x="695" y="338" width="150" height="18"/>
</g>
<g stroke="#243447" stroke-width="2" fill="none">
  <path d="M210 338H510V98" stroke-dasharray="6 5"/>
  <path d="M488 338V316H510"/>
</g>
<path d="M210 338 510 98" fill="none" stroke="#e50050" stroke-width="3" marker-end="url(#light-arrow)"/>
<g id="formula-light" fill="#e50050"/>
<g id="formula-distance" fill="#243447"/>
<g id="formula-shift" fill="#243447"/>
<path d="M300 450H660" fill="none" stroke="#243447" stroke-width="2.8" marker-end="url(#speed-arrow)"/>
<g id="formula-speed" fill="#243447"/>
</svg>'''


def main():
    chromium = shutil.which("chromium") or shutil.which("chromium-browser")
    if not chromium:
        raise SystemExit("Chromium ist nicht installiert.")
    font = base64.b64encode(FONT.read_bytes()).decode()
    svg = SVG.replace("<defs>", '<defs><style>@font-face{font-family:"Source Sans Pro";src:url(data:font/woff2;base64,' + font + ') format("woff2");font-weight:400}</style>')
    formulas = [
        ["formula-light", r"c\,\frac{\Delta t}{2}", 315, 180],
        ["formula-distance", "D", 540, 220],
        ["formula-shift", r"v\,\frac{\Delta t}{2}", 360, 388],
        ["formula-speed", "v", 480, 474],
    ]
    script = r'''
MathJax.startup.promise.then(() => {
  for (const [id, tex, x, y] of FORMULAS) {
    const formula = MathJax.tex2svg(tex, {display: true}).querySelector('svg');
    const box = formula.getAttribute('viewBox').split(/\s+/).map(Number);
    // MathJax verwendet 1000 SVG-Einheiten pro em. Alle Formeln: 36 px/em.
    const width = box[2] * 0.036;
    const height = box[3] * 0.036;
    formula.setAttribute('x', x - width / 2);
    formula.setAttribute('y', y - height / 2);
    formula.setAttribute('width', width);
    formula.setAttribute('height', height);
    formula.removeAttribute('style');
    formula.style.color = document.getElementById(id).getAttribute('fill');
    document.getElementById(id).append(formula);
  }
  const result = new XMLSerializer().serializeToString(document.querySelector('svg'));
  document.body.innerHTML = '<pre id="result"></pre>';
  document.getElementById('result').textContent = result;
});'''.replace("FORMULAS", json.dumps(formulas))
    document = '<!doctype html><meta charset="utf-8">' + svg
    document += '<script>window.MathJax={svg:{fontCache:"none"},startup:{typeset:false}};</script>'
    document += '<script src="' + (ROOT / 'assets/mathjax/tex-svg-full.js').as_uri() + '"></script>'
    document += '<script>' + script + '</script>'
    with tempfile.TemporaryDirectory(prefix="lichtuhr-svg-") as directory:
        source = Path(directory) / "render.html"
        source.write_text(document)
        result = subprocess.run([
            chromium, "--headless", "--no-sandbox", "--disable-gpu",
            "--disable-background-networking", "--no-first-run",
            "--user-data-dir=" + str(Path(directory) / "browser"),
            "--allow-file-access-from-files", "--virtual-time-budget=3000",
            "--dump-dom", source.as_uri(),
        ], capture_output=True, text=True, check=True, timeout=30)
    match = re.search(r'<pre id="result">(.*?)</pre>', result.stdout, re.S)
    if not match:
        raise SystemExit("MathJax hat keine fertige SVG-Grafik ausgegeben.")
    output = html.unescape(match.group(1))
    tree = ET.fromstring(output)
    ns = {"s": "http://www.w3.org/2000/svg"}
    if len(tree.findall('.//s:svg', ns)) != 4:
        raise SystemExit("Die vier Formelbeschriftungen sind unvollständig.")
    OUTPUT.write_text(output + "\n")
    print(OUTPUT)


if __name__ == "__main__":
    main()
