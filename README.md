# Interaktives Quarto-Workbook „Moderne Physik"

Digitales Lehr-Workbook zur modernen Physik (spezielle Relativitätstheorie, Laser) für Lehramtsstudierende der Sekundarstufe I. Entstanden im Rahmen einer Masterarbeit an der Belluni. Gebaut mit [Quarto](https://quarto.org) als Buch-Projekt.

## Bauen

```bash
quarto render        # ganzes Buch nach _book/
quarto preview       # lokale Vorschau mit Live-Reload
```

Die aktiven Kapitel und ihre Reihenfolge stehen in `_quarto.yml`. Der Build wurde mit Quarto 1.9.36 geprüft.

## Aufbau

| Datei oder Ordner | Aufgabe |
| --- | --- |
| `index.qmd` | Vorwort und Hinweise zur Benutzung |
| `01_srt_raum_und_zeit_umbau.qmd` | SRT 1: Raum und Zeit |
| `03_srt_impuls_und_energie_umbau.qmd` | SRT 2: Impuls und Energie |
| `02_laser_ausflug_umbau.qmd` | Laser-Kapitel |
| `references.qmd`, `references-*.bib` | Literaturseite mit zwei getrennten Literaturverzeichnissen |
| `assets/animations/srt1-raum-und-zeit/` | Veranschaulichungen des ersten SRT-Kapitels, nach Thema geordnet |
| `assets/animations/srt2-impuls-und-energie/` | Veranschaulichungen des zweiten SRT-Kapitels |
| `assets/animations/laser/` | Veranschaulichungen des Laser-Kapitels |
| `assets/animations/shared/` | Gemeinsame Zeichenfunktionen, Formelsatz und Bedienung der Veranschaulichungen |
| `assets/styles/` | Gestaltung von Lernkästen, Formelwiederholungen und Kapiteln; lokale Schriftkonfiguration |
| `assets/images/`, `assets/task-icons/` | Abbildungen, Video-Vorschaubild und verwendete Aufgabensymbole |
| `assets/scripts/`, `assets/includes/` | Videosteuerung und Anpassung des Inhaltsverzeichnisses |
| `assets/fonts/`, `assets/mathjax/` | Lokal bereitgestellte Schriftarten und Formeldarstellung |
| `Videos einbinden/` | Selbst erstellte Zugvideos für das Workbook |
| `_extensions/pandoc-ext/multibib/` | Quarto-Erweiterung für zwei Literaturverzeichnisse |
| `tools/` | Filter und Nachbearbeitung beim Bauen des Workbooks |
| `alt-nicht-eingebunden/` | Frühere Kapitel und unbenutzte Veranschaulichungen; nicht Teil der Website |
| `.github/workflows/publish.yml` | Baut das Workbook und veröffentlicht `_book/` mit GitHub Pages |
| `licenses/`, `THIRD-PARTY-NOTICES.md` | Lizenztexte und Herkunft der Drittkomponenten |

`_extensions` ist der von Quarto vorgesehene Ordnername und darf nicht beliebig umbenannt werden. `_book/` und `.quarto/` entstehen lokal beim Bauen und gehören nicht in die Versionsverwaltung.

## Änderungen an Gestaltung und Veranschaulichungen

Die Kapitel binden ihre Skripte und zusätzlichen Stylesheets im Kopf der jeweiligen QMD-Datei ein. Globale Gestaltung steht in `_quarto.yml`, insbesondere `assets/styles/learning-boxes.css`. Werden Dateien verschoben, müssen diese Einbindungen und die Bildpfade im Kapitel angepasst werden. Gemeinsame Änderungen unter `assets/animations/shared/` können mehrere Kapitel betreffen.

`tools/learning-goal-icons.lua` ergänzt das Symbol an Lernzielkästen automatisch. Die unterschiedlichen Aufgabensymbole stehen dagegen ausdrücklich bei der jeweiligen Aufgabe in der QMD-Datei. Der Filter ist deshalb nur für Lernzielkästen zuständig.

`tools/strip-polyfill.py` entfernt nach dem Rendern das von Quarto eingefügte externe Polyfill-Skript von cdnjs.cloudflare.com. Es entfernt weder beliebige externe Links noch beliebige Bibliotheken. Der Schritt ist in `_quarto.yml` eingetragen.

## Drittkomponenten

- **MathJax 3.2.2**, Apache-2.0: lokale Formeldarstellung in `assets/mathjax/`.
- **Source Sans Pro**, SIL Open Font License 1.1: lokale Schriftdateien in `assets/fonts/`. `assets/styles/no-webfont.scss` unterbindet den Google-Fonts-Import des Themes.
- **multibib**, ISC: Pandoc-Filter in `_extensions/pandoc-ext/multibib/`. Die mitgelieferte Fassung wurde lokal angepasst und liest `multibib:` statt `bibliography:`. Bei einem Update muss diese Anpassung erhalten bleiben.
- **Quarto und seine HTML-Komponenten**: Navigation, Suche, Theme und Bedienelemente werden beim Rendern nach `_book/site_libs/` kopiert. Komponenten und Lizenztexte sind in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) aufgeführt.
- **Übernommene Abbildungen**: Das Laser-Warnzeichen von Wikimedia Commons ist gemeinfrei; das archivierte Ätherwind-Bild steht unter CC BY 3.0. Herkunft und Bedingungen stehen ebenfalls in den [Drittanbieter-Hinweisen](THIRD-PARTY-NOTICES.md).

Skripte, Stylesheets, Schriftdateien und die MathJax-Datei für die Formeldarstellung werden aus diesem Repository beziehungsweise dem Quarto-Build bereitgestellt.
