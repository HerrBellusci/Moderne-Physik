# Interaktives Quarto-Workbook „Moderne Physik"

Digitales Lehr-Workbook zur modernen Physik (spezielle Relativitätstheorie, Laser) für Lehramtsstudierende der Sekundarstufe I. Entstanden im Rahmen einer Masterarbeit an der PH Karlsruhe. Gebaut mit [Quarto](https://quarto.org) als Buch-Projekt; die didaktischen Gestaltungsregeln stehen im Kapitel „Konzeption des Workbooks" (`00_konzeption.qmd`).

## Bauen

```bash
quarto render        # ganzes Buch nach _book/
quarto preview       # lokale Vorschau mit Live-Reload
```

## Aufbau

- `00_konzeption.qmd` – Konzeption: legt Aufbau und Elemente des Workbooks fest und begründet sie.
- `01_…`, `02_…`, `03_….qmd` – Kapitel; Dateien mit dem Zusatz `_umbau` sind die nach der Konzeption überarbeiteten Fassungen und stehen zum Vergleich neben den Originalen.
- `assets/animations/` – alle Animationen, Simulationen und Diagramme als eigenständige JavaScript/SVG-Programme, ohne externe Bibliotheken. Gemeinsame Design-Basis (u. a. der Pause-Button) in `assets/animations/shared/`.
- `assets/learning-boxes.css` – Stile der wiederkehrenden Elemente (Lernziel-Streifen, Aufgaben-Boxen, rote Kästen, Rand-Stichwörter).

## Drittkomponenten

Das gerenderte Buch lädt keine Skripte von fremden Servern; alles Nötige liegt im Projekt bzw. wird von Quarto lokal nach `_book/site_libs/` gelegt.

- **MathJax 3** (`assets/mathjax/tex-svg-full.js`, Lizenz Apache-2.0): lokal mitgelieferte Bibliothek für die Formeldarstellung, eingebunden über `html-math-method` in `_quarto.yml`. Die Datei ist der offizielle minifizierte Single-File-Build (`tex-svg-full`), bezogen über jsDelivr (Stand Juli 2026).
- **Source Sans Pro** (`assets/fonts/`, Lizenz SIL Open Font License 1.1): lokal mitgelieferte Schrift des Themes. `assets/no-webfont.scss` schaltet den Google-Fonts-Import des Bootswatch-Themes ab, `assets/fonts/source-sans-pro.css` bindet die lokalen Dateien ein.
- `tools/strip-polyfill.py`: Post-Render-Schritt (in `_quarto.yml` registriert), der das von Quartos MathJax-Vorlage eingefügte externe Polyfill-Skript aus den HTML-Seiten entfernt. Bitte nicht löschen, sonst schlägt `quarto render` fehl.
- Eingebettete Videos (YouTube, über `youtube-nocookie.com`) sind die einzigen Inhalte, die eine Internetverbindung benötigen.
