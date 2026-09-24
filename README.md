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
| `02_srt_impuls_und_energie_umbau.qmd` | SRT 2: Impuls und Energie |
| `03_laser_ausflug_umbau.qmd` | Laser-Kapitel |
| `legacy-arbeitsblaetter.qmd` | Zusatzseite mit den ersten beiden ursprünglichen SRT-Arbeitsblättern |
| `references.qmd`, `references-*.bib` | Literaturseite mit zwei getrennten Literaturverzeichnissen |
| `assets/animations/srt1-raum-und-zeit/` | Veranschaulichungen des ersten SRT-Kapitels, nach Thema geordnet |
| `assets/animations/srt2-impuls-und-energie/` | Veranschaulichungen des zweiten SRT-Kapitels |
| `assets/animations/laser/` | Veranschaulichungen des Laser-Kapitels |
| `assets/animations/shared/` | Gemeinsame Zeichenfunktionen, Formelsatz und Bedienung der Veranschaulichungen |
| `assets/animations/zukuenftig/` | Fachlich noch ungeklärte Animationsentwürfe; ausdrücklich vom veröffentlichten Build ausgeschlossen |
| `assets/styles/` | Gestaltung von Lernkästen, Formelwiederholungen und Kapiteln; lokale Schriftkonfiguration |
| `assets/images/`, `assets/task-icons/` | Eigene Abbildungen und verwendete Aufgabensymbole |
| `assets/scripts/`, `assets/includes/` | Videosteuerung und Anpassung des Inhaltsverzeichnisses |
| `assets/fonts/`, `assets/mathjax/` | Lokal bereitgestellte Schriftarten und Formeldarstellung |
| `Videos einbinden/` | Selbst erstellte Zugvideos für das Workbook |
| `_extensions/pandoc-ext/multibib/` | Quarto-Erweiterung für zwei Literaturverzeichnisse |
| `tools/` | Filter und Nachbearbeitung beim Bauen des Workbooks |
| `planung/zukuenftige-kapitel/` | Vorläufige, nicht veröffentlichte Kapitelgerüste für eine mögliche spätere Erweiterung |
| `.github/workflows/publish.yml` | Baut das Workbook und veröffentlicht `_book/` mit GitHub Pages |
| `licenses/`, `THIRD-PARTY-NOTICES.md` | Lizenztexte und Herkunft der Drittkomponenten |

Die Legacy-Arbeitsblätter werden über `book.page-footer` eingebunden und aus beiden SRT-Kapiteln verlinkt. Die Zusatzseite erhält keinen Eintrag in `book.chapters`.

`_extensions` ist der von Quarto vorgesehene Ordnername und darf nicht beliebig umbenannt werden. `_book/` und `.quarto/` entstehen lokal beim Bauen und gehören nicht in die Versionsverwaltung.

## Änderungen an Gestaltung und Veranschaulichungen

Die Kapitel binden ihre Skripte und zusätzlichen Stylesheets im Kopf der jeweiligen QMD-Datei ein. Globale Gestaltung steht in `_quarto.yml`, insbesondere `assets/styles/learning-boxes.css`. Werden Dateien verschoben, müssen diese Einbindungen und die Bildpfade im Kapitel angepasst werden. Gemeinsame Änderungen unter `assets/animations/shared/` können mehrere Kapitel betreffen.

`tools/learning-goal-icons.lua` ergänzt das Symbol an Lernzielkästen automatisch. Die unterschiedlichen Aufgabensymbole stehen dagegen ausdrücklich bei der jeweiligen Aufgabe in der QMD-Datei. Der Filter ist deshalb nur für Lernzielkästen zuständig.

`tools/strip-polyfill.py` entfernt nach dem Rendern das von Quarto eingefügte externe Polyfill-Skript von cdnjs.cloudflare.com. Es entfernt weder beliebige externe Links noch beliebige Bibliotheken. Der Schritt ist in `_quarto.yml` eingetragen.

## Lizenz der eigenen Inhalte

Für neue eigene Texte, Aufgaben, Abbildungen und Videos gilt vorläufig **CC BY-NC-SA 4.0**, soweit daran eigene Rechte bestehen. Eigener Programmcode ist von dieser Freigabe ausgenommen und erhält bis zur gesonderten Lizenzentscheidung keine zusätzliche Nutzungslizenz. Bereits wirksam unter CC BY-SA 4.0 veröffentlichte eigene Bestandteile bleiben unter dieser Lizenz nutzbar. Die Nutzung des veröffentlichten Workbooks im Browser ist gestattet.

Die [Lizenzübersicht](LICENSE.md) erläutert den Geltungsbereich und den Übergang zwischen den Fassungen. Fremde Bestandteile behalten ihre eigenen Bedingungen.

## Drittkomponenten

- **MathJax 3.2.2**, Apache-2.0: lokale Formeldarstellung in `assets/mathjax/`.
- **Source Sans Pro**, SIL Open Font License 1.1: lokale Schriftdateien in `assets/fonts/`. `assets/styles/no-webfont.scss` unterbindet den Google-Fonts-Import des Themes.
- **multibib**, ISC: Pandoc-Filter in `_extensions/pandoc-ext/multibib/`. Die mitgelieferte Fassung wurde lokal angepasst und liest `multibib:` statt `bibliography:`. Bei einem Update muss diese Anpassung erhalten bleiben.
- **Quarto und seine HTML-Komponenten**: Navigation, Suche, Theme und Bedienelemente werden beim Rendern nach `_book/site_libs/` kopiert. Komponenten und Lizenztexte sind in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) aufgeführt.
- **Übernommene Abbildungen**: Das Foto von Maimans Rubinlaser ist unter CC0 1.0 freigegeben. Die Übersicht des elektromagnetischen Spektrums von Horst Frank und Jailbird wird unverändert unter CC BY-SA 3.0 mitgeliefert. Weitere Bildquellen, individuelle Bedingungen und Angaben zu ergänzten Beschriftungen stehen in den [Drittanbieter-Hinweisen](THIRD-PARTY-NOTICES.md) sowie unmittelbar an den Abbildungen.

- **Externe Medien**: Galaxienaufnahme, Laserwarnzeichen, Maiman-Foto, Spektrumgrafik und Tattoo-Video werden direkt von Wikimedia geladen. Ihre Dateien werden nicht mit dem Repository ausgeliefert. Quellen und Lizenzen stehen an den Medien und in den [Drittanbieter-Hinweisen](THIRD-PARTY-NOTICES.md). Die Darstellung benötigt eine Internetverbindung und erreichbare Quelldateien. Das Tattoo-Video beginnt pausiert bei Sekunde 26. Die Vorträge von Royal Institution und MIT OpenCourseWare sind als externe Links aufgenommen.
- **Bildvergrößerung**: Die Spektrumgrafik lässt sich innerhalb der Seite öffnen. Dafür verwendet Quarto die lokal mitgelieferte Bibliothek GLightbox (MIT-Lizenz), siehe [Drittanbieter-Hinweise](THIRD-PARTY-NOTICES.md).

Skripte, Stylesheets, Schriftdateien und die MathJax-Datei für die Formeldarstellung werden aus diesem Repository beziehungsweise dem Quarto-Build bereitgestellt.
