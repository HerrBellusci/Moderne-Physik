# Drittkomponenten und übernommene Abbildungen

Diese Hinweise betreffen fremde Bestandteile. Sie ändern weder deren Lizenzbedingungen noch legen sie eine neue Lizenz für das eigene Workbook fest. Stand der Prüfung: 16.09.2026, lokaler Build mit Quarto 1.9.36.

## Im Repository mitgeliefert

| Bestandteil | Herkunft und Rechte | Lizenztext |
| --- | --- | --- |
| MathJax 3.2.2, `assets/mathjax/tex-svg-full.js` | [MathJax](https://github.com/mathjax/MathJax/tree/3.2.2), Apache-2.0 | [LICENSE](assets/mathjax/LICENSE) |
| mhchemParser 4.1.1, Bestandteil der MathJax-Datei | Copyright 2015–2021 Martin Hensel; [mhchemParser](https://github.com/mhchem/mhchemParser), Apache-2.0. Der ursprüngliche Hinweis ist in der unveränderten MathJax-Datei enthalten. | [Apache-2.0](assets/mathjax/LICENSE) |
| Source Sans Pro, `assets/fonts/` | Adobe Systems Incorporated; Copyright 2010–2018, Reserved Font Name „Source“, SIL OFL 1.1. Copyright aus den mitgelieferten Fontdateien. | [OFL.txt](assets/fonts/OFL.txt) |
| multibib, lokal angepasste Fassung | Copyright 2018–2024 Albert Krewinkel; [pandoc-ext/multibib](https://github.com/pandoc-ext/multibib). Maßgeblich ist der ISC-Hinweis im mitgelieferten Lua-Code. Anpassung: Metadaten aus `multibib:`. | [ISC](licenses/multibib-ISC.txt) |

## Beim Rendern von Quarto bereitgestellt

Die folgenden Komponenten wurden im lokalen HTML-Build gefunden. Ihre Lizenzhinweise in den erzeugten Dateien bleiben erhalten; vollständige Texte liegen zusätzlich in `licenses/`. Bei Updates von Quarto sind die Versionsangaben und Lizenztexte erneut abzugleichen.

| Bestandteil | Herkunft | Lizenztext |
| --- | --- | --- |
| Quarto HTML-Skripte | [Posit / Quarto](https://github.com/quarto-dev/quarto-cli) | [MIT](licenses/quarto-MIT.txt) |
| Bootstrap 5.3.1 | [Bootstrap Authors](https://github.com/twbs/bootstrap/tree/v5.3.1) | [MIT](licenses/bootstrap-MIT.txt) |
| Bootstrap Icons 1.13.1 | [Bootstrap Authors](https://github.com/twbs/icons/tree/v1.13.1) | [MIT](licenses/bootstrap-icons-MIT.txt) |
| Bootswatch, Theme Cosmo | [Thomas Park / Bootswatch](https://github.com/thomaspark/bootswatch) | [MIT](licenses/bootswatch-MIT.txt) |
| Headroom.js 0.12.0 | [Nick Williams](https://github.com/WickyNilliams/headroom.js) | [MIT](licenses/headroom-MIT.txt) |
| AnchorJS 5.0.0 | [Bryan Braun](https://github.com/bryanbraun/anchorjs) | [MIT](licenses/anchor-MIT.txt) |
| Tippy.js | [Atomiks](https://github.com/atomiks/tippyjs) | [MIT](licenses/tippy-MIT.txt) |
| Popper 2.11.7 | [Popper Authors](https://github.com/floating-ui/floating-ui/tree/v2.11.7) | [MIT](licenses/popper-MIT.txt) |
| clipboard.js 2.0.11 | [Zeno Rocha](https://github.com/zenorocha/clipboard.js) | [MIT](licenses/clipboard-MIT.txt) |
| Fuse.js 6.6.2 | [Kiro Risk](https://github.com/krisk/Fuse/tree/v6.6.2) | [Apache-2.0](licenses/fuse-Apache-2.0.txt) |
| Algolia Autocomplete 1.19.1 | [Algolia und Mitwirkende](https://github.com/algolia/autocomplete) | [MIT](licenses/autocomplete-MIT.txt) |

## Abbildungen und Medien

- `assets/images/legacy-srt-galaxie.jpg`: NGC 7319, Aufnahme von **NASA, ESA and the Hubble SM4 ERO Team**. [Originalaufnahme „Galactic wreckage in Stephan's Quintet“, heic0910i, ESA/Hubble](https://esahubble.org/images/heic0910i/), veröffentlicht am 9. September 2009. Der [Ausschnitt auf Wikimedia Commons](https://commons.wikimedia.org/wiki/File:NGC_7319.jpg) wurde von Rbrausse am 5. Oktober 2011 hochgeladen; die hiesige, kleinere Fassung wurde aus dem ursprünglichen Arbeitsblatt übernommen. Nutzung unter [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) gemäß der [ausdrücklichen Freigabe von ESA/Hubble](https://esahubble.org/copyright/). Der vollständige Bildcredit, der Hinweis auf den Ausschnitt sowie Quellen- und Lizenzlinks stehen auch unmittelbar an der Abbildung. Der ältere Gemeinfreiheitsbaustein auf Commons wird nicht als Lizenzgrundlage übernommen, weil er ESA-Material ab 2009 selbst ausnimmt. Die eigene Workbook-Lizenz gilt nicht für diese Aufnahme.
- `assets/images/legacy-linienvergleich.svg`: Eigene schematische Darstellung der Aufgabenwerte 513 nm und 525 nm. Keine Messdaten und keine übernommenen Bildbestandteile. Sie ersetzt die ursprünglich im Aufgabenblatt enthaltene Abbildung 37-27 aus Halliday/Resnick/Walker, *Fundamentals of Physics*, für die keine freie Nutzungslizenz nachgewiesen wurde. Eine deutsche Fassung derselben Abbildung ist lokal in Halliday et al. (2017), S. 1331, Aufgabe 37.28, Abb. 37.A28 nachgewiesen. Die übernommene Spektrumdatei gehört nicht mehr zum öffentlichen Projekt. Der Unterschied zwischen den Zahlen im ursprünglichen Aufgabentext und den Linienpositionen der ursprünglichen Abbildung wird auf der Legacy-Seite erläutert.
- `assets/images/iso-7010-w004-laser.svg`: Warnzeichen W004 „Warnung vor Laserstrahl“. Zeichnung von Maxxl2, spätere Bearbeitungen laut Dateiversionsgeschichte. [Dateiseite auf Wikimedia Commons](https://commons.wikimedia.org/wiki/File:ISO_7010_W004.svg). Dort als gemeinfrei (Public Domain) freigegeben; zusätzlich uneingeschränkte Nutzungserlaubnis, soweit eine Gemeinfrei-Erklärung nicht möglich ist. Der Quellenhinweis bleibt auch in der Bildunterschrift des Laser-Kapitels erhalten. Die eigene Workbook-Lizenz gilt nicht für dieses Zeichen.
