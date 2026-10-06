# Digitales Workbook „Moderne Physik“

Ein interaktives Workbook zur modernen Physik für Lehramtsstudierende der Sekundarstufe I. Die Konzeption und die ersten Kapitelprototypen werden im Rahmen einer Masterarbeit entwickelt. Die schriftliche Konzeption ist nicht Teil dieses Repositorys. Das Workbook wird mit [Quarto](https://quarto.org) als Buchprojekt erstellt.

## Bauen

[Quarto](https://quarto.org/docs/get-started/) installieren und im Projektordner ausführen:

```bash
quarto render    # erstellt das Buch in _book/
quarto preview   # öffnet eine lokale Vorschau
```

Die Veröffentlichung über GitHub Pages verwendet Quarto 1.9.36. Die Kapitel und ihre Reihenfolge stehen in `_quarto.yml`.

## Aufbau

| Datei oder Ordner | Inhalt |
| --- | --- |
| `index.qmd` | Einstieg und Hinweise zur Nutzung |
| `01_srt_raum_und_zeit_umbau.qmd` | Spezielle Relativitätstheorie: Raum und Zeit |
| `02_srt_impuls_und_energie_umbau.qmd` | Spezielle Relativitätstheorie: Impuls und Energie |
| `03_laser_ausflug_umbau.qmd` | Laser |
| `legacy-arbeitsblaetter.qmd` | Frühere Arbeitsblätter |
| `datenschutz.qmd` | Datenschutzhinweise, derzeit Arbeitsfassung zur lokalen Prüfung |
| `references.qmd`, `references-*.bib` | Literaturseite und Literaturdaten |
| `assets/` | Gestaltung, Abbildungen, Symbole, Schriften, Skripte und Veranschaulichungen |
| `assets/videos/` | Eingebundene eigene Videos, nach Kapiteln geordnet |
| `_extensions/` | Quarto-Erweiterung für die Literaturverzeichnisse |
| `tools/` | Filter und Nachbearbeitung beim Bauen |
| `planung/` | Entwürfe für weitere Kapitel |
| `.github/workflows/publish.yml` | Erstellt das Buch und veröffentlicht es über GitHub Pages |

Die Gestaltung der Kästen und die Schriftkonfiguration liegen unter `assets/styles/`. Die Veranschaulichungen liegen unter `assets/animations/`, eigene Abbildungen und Aufgabensymbole unter `assets/images/` und `assets/task-icons/`. Unter `assets/scripts/` und `assets/includes/` liegen Funktionen für die Videowiedergabe und das Inhaltsverzeichnis. Schriftdateien und MathJax für die Formeln werden lokal aus `assets/fonts/` und `assets/mathjax/` bereitgestellt.

Die frühere Arbeitsblattseite ist über die Fußzeile und aus den SRT-Kapiteln erreichbar. Sie gehört nicht zur regulären Kapitelabfolge. `_book/` und `.quarto/` entstehen beim Bauen und werden nicht versioniert.

Lernziel-Symbole ergänzt `tools/learning-goal-icons.lua` automatisch. Das Warnsymbol der roten Lernhürden wird über `assets/styles/learning-boxes.css` eingefügt. Die Symbole der Aufgaben stehen bei den jeweiligen Aufgaben, weil sie je nach Aufgabentyp wechseln. `tools/strip-polyfill.py` entfernt beim Bauen ein von Quarto eingebundenes externes Polyfill-Skript. So lädt das Buch dieses Skript nicht von einem fremden Server.

## Lizenz und fremde Bestandteile

Eigene Texte, Aufgaben, Abbildungen und Videos stehen unter [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.de). Eigener Programmcode steht unter der [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0). Die Bedingungen und den genauen Geltungsbereich beschreibt [LICENSE.md](LICENSE.md).

Fremde Bestandteile sind von diesen Freigaben ausgenommen. Ihre Herkunft, Verwendung und jeweiligen Lizenzbedingungen stehen in den [Drittanbieter-Hinweisen](THIRD-PARTY-NOTICES.md). Angaben zu übernommenen Medien stehen zusätzlich direkt bei den jeweiligen Abbildungen und Videos. Extern eingebundene Medien benötigen eine Internetverbindung.

## Externe Medien und Datenschutz

Wikimedia-Bilder und -Videos bleiben in der HTML-Ausgabe zunächst gesperrt. Eine zentrale Freigabe am Seitenanfang erlaubt die Wikimedia-Medien auch beim Kapitelwechsel im selben Browser-Tab. Die Entscheidung wird unter `workbook-wikimedia-v1` in sessionStorage gespeichert. In der Fußzeile lassen sich über „Externe Medien“ die Einstellungen öffnen. „Freigabe widerrufen“ speichert die Ablehnung und lädt die Seite erneut mit gesperrten Medien. Beim Schließen des Tabs endet die Sitzung. Ohne verfügbare Sitzungsspeicherung gilt die Entscheidung nur für den aktuellen Seitenaufruf. Quellen und Lizenzen bleiben sichtbar. Eigene Veranschaulichungen benötigen keine solche Freigabe. Das Tattoo-Video wird erst nach Freigabe abgerufen und bei Sekunde 26 pausiert bereitgestellt.

`tools/defer-wikimedia.py` entfernt beim Bauen abrufbare Wikimedia-Medienquellen aus dem fertigen HTML und hält sie in inaktiven Datenattributen vor. `assets/scripts/external-media.js` setzt sie erst nach Freigabe ein. Für eine Vorschau dieses Verhaltens das vollständige Buch mit `quarto render` bauen und `_book/` über einen lokalen Webserver öffnen. Auch nach einzelnen Seitenänderungen muss die Nachbearbeitung gelaufen sein. Ohne JavaScript bleiben externe Medien gesperrt. Neue Einbindungen sind vor Veröffentlichung auf ungewollte Abrufe zu prüfen, insbesondere externe Vorschaubilder, CSS-Hintergründe oder zusätzliche Skripte.

Die Datenschutzhinweise sind über die Fußzeile erreichbar. Rechtlich erforderliche Betreiberangaben, Rechtsgrundlagen, mögliche Drittlandübermittlungen und die Informationen zu Betroffenenrechten sind vor Veröffentlichung zu vervollständigen. Die technische Mediensperre ersetzt diese Klärung nicht.
