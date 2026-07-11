"""Entfernt das von Quarto eingefuegte externe Polyfill-Skript aus allen HTML-Seiten
(Selbst-Hosting-Linie des Workbooks: keine externen Skript-Quellen)."""
import glob, re

for f in glob.glob("_book/**/*.html", recursive=True):
    with open(f, encoding="utf-8") as fh:
        s = fh.read()
    n = re.sub(r'\s*<script src="https://cdnjs\.cloudflare\.com/polyfill/[^"]*"></script>', "", s)
    if n != s:
        with open(f, "w", encoding="utf-8") as fh:
            fh.write(n)
