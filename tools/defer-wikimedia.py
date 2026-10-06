"""Entfernt abrufbare Wikimedia-Medienquellen vor der Auslieferung des HTML.

Die Freigabe wird anschließend im Sitzungsspeicher des Browser-Tabs gehalten. Bloßes Entfernen von Quellen per Browser-JavaScript käme zu spät.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import re


def wikimedia(value):
    host = (urlsplit(value).hostname or "").lower()
    return host == "wikimedia.org" or host.endswith(".wikimedia.org")


class DeferredMedia(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.offsets = [0]
        self.offsets.extend(m.end() for m in re.finditer("\n", source))
        self.edits = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        replacements = []
        if tag in {"img", "video", "audio", "source", "iframe", "embed"}:
            for name in ("src", "poster", "srcset"):
                value = attrs.get(name) or ""
                urls = [part.strip().split()[0] for part in value.split(",") if part.strip()] if name == "srcset" else [value]
                if any(wikimedia(url) for url in urls):
                    replacements.append(name)
        # Quarto's lightbox must not discover the external image before consent.
        if tag == "a" and "lightbox" in (attrs.get("class") or "").split() and wikimedia(attrs.get("href") or ""):
            replacements.extend(["href", "class"])
        if not replacements:
            return
        raw = self.get_starttag_text()
        changed = raw
        for name in replacements:
            changed = re.sub(r"(?i)(\s)" + name + r"(\s*=)", r"\1data-wikimedia-" + name + r"\2", changed, count=1)
        line, column = self.getpos()
        start = self.offsets[line - 1] + column
        self.edits.append((start, start + len(raw), changed))

    handle_startendtag = handle_starttag

    def result(self):
        output = self.source
        for start, end, replacement in reversed(self.edits):
            output = output[:start] + replacement + output[end:]
        return output


for path in Path("_book").rglob("*.html"):
    source = path.read_text(encoding="utf-8")
    parser = DeferredMedia(source)
    parser.feed(source)
    if parser.edits:
        path.write_text(parser.result(), encoding="utf-8")
