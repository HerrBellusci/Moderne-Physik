<!-- Entwurf: Abschnitt Laserdiode, aus 02_laser_ausflug.qmd ausgelagert. -->
<!-- Zugehörige Simulation: assets/animations/laser/used/halbleiter.js -->

## Der Laser im Alltag: die Laserdiode

::: {.callout-note title="Relevanz"}
Der häufigste Laser der Welt steckt nicht im Labor, sondern in Alltagsgeräten: im Laserpointer, im Blu-ray-Player, in jedem Glasfasernetz, das Internetdaten überträgt. Dieser Laser ist ein Halbleiterkristall, kleiner als ein Millimeter: die Laserdiode.
:::

::: {.mp-goal-strip}
Du <u>beschreibst</u> den Aufbau einer Laserdiode.

Du <u>erklärst</u>, wie eine Laserdiode gepumpt wird und was die Laserschwelle bedeutet.
:::

Ein Halbleiterkristall besitzt statt einzelner scharfer Energieniveaus zwei breite Energiebereiche, die **Energiebänder**: das untere Valenzband und das obere Leitungsband. Dazwischen liegt eine Lücke, der **Bandabstand**. Er übernimmt die Rolle des Niveauabstands: Wechselt ein Elektron vom Leitungsband ins Valenzband, wird die Energie als Photon frei. Der Bandabstand legt die Farbe des Lichts fest.

Gepumpt wird mit elektrischem Strom. Die Diode besteht aus zwei unterschiedlich behandelten (dotierten) Halbleiterschichten. Fließt Strom in Durchlassrichtung, gelangen von der einen Seite Elektronen und von der anderen Seite Löcher, also fehlende Elektronen, in die dünne Grenzschicht dazwischen. Dort treffen sie aufeinander: Ein Elektron füllt ein Loch und gibt die Energie als Photon ab. Bis hierhin beschreibt das eine gewöhnliche Leuchtdiode (LED).

Bei kleinem Strom bleibt es dabei: Die Photonen entstehen durch spontane Emission und verlassen den Kristall in alle Richtungen. Steigt der Strom, sammeln sich in der Grenzschicht so viele Elektronen im Leitungsband, dass eine Besetzungsinversion entsteht. Jetzt überwiegt die stimulierte Emission, und das Licht wird verstärkt. Der Strom, ab dem das geschieht, heißt **Laserschwelle**.

Den Resonator liefert der Kristall gleich mit: Seine glatten Endflächen reflektieren einen Teil des Lichts zurück in die Grenzschicht. Das genügt, weil die Verstärkung auf der kurzen Strecke sehr groß ist. Durch eine der Endflächen tritt der Laserstrahl aus.

In der Simulation regelst du den Strom durch die Laserdiode. Unterhalb der Laserschwelle entstehen wenige Photonen in zufällige Richtungen, die Diode leuchtet wie eine LED. Oberhalb der Schwelle tritt ein Laserstrahl aus der Endfläche aus.

::: {.content-visible when-format="html"}
```{=html}
<figure class="srt-workbook-figure srt-workbook-figure--caption-inside">
  <div class="srt-workbook-stage" data-srt-animation="laser-halbleiter" data-srt-viewbox-h="430" data-srt-motion-control data-srt-label="Interaktive Simulation einer Laserdiode im Querschnitt: p-Schicht, aktive Zone und n-Schicht zwischen zwei Kontakten, die glatten Endflächen wirken als Spiegel. Ein Regler stellt den Strom ein. Unterhalb der Laserschwelle entstehen wenige Photonen in zufällige Richtungen wie bei einer LED. Oberhalb der Schwelle baut sich in der aktiven Zone rotes Licht auf und ein Laserstrahl tritt aus der rechten Endfläche aus."></div>
</figure>
```
:::

::: {.content-visible unless-format="html"}
::: {.srt-workbook-fallback}
In der HTML-Version erscheint hier eine Simulation: eine Laserdiode im Querschnitt mit einem Regler für den Strom. Unterhalb der Laserschwelle leuchtet sie wie eine LED in alle Richtungen, oberhalb tritt ein Laserstrahl aus der Endfläche aus.
:::
:::

::: {.mp-box .mp-task}
<span class="mp-task-kind mp-task-kind-think" aria-label="Denkcheck">
  <img src="assets/task-icons/think.png" alt="" aria-hidden="true">
  Denkcheck
</span>

Eine Laserdiode wird mit einem Strom knapp unterhalb der Laserschwelle betrieben.

<u>Erkläre</u>, dass sie dabei Licht aussendet, aber keinen Laserstrahl.
:::

<details class="mp-details">
<summary>Mögliche Lösung anzeigen</summary>

Unterhalb der Laserschwelle gibt es noch keine Besetzungsinversion in der Grenzschicht. Elektronen und Löcher treffen zwar aufeinander und senden dabei Photonen aus, aber durch spontane Emission: zu zufälligen Zeitpunkten und in zufällige Richtungen. Ohne Inversion überwiegt die Absorption, das Licht wird beim Hin- und Herlaufen zwischen den Endflächen abgeschwächt statt verstärkt. Die Diode leuchtet wie eine LED, ein gerichteter, verstärkter Strahl entsteht erst oberhalb der Schwelle.

</details>

::: {.mp-box .mp-task}
<span class="mp-task-kind mp-task-kind-transfer" aria-label="Transfer">
  <img src="assets/task-icons/transfer.png" alt="" aria-hidden="true">
  Transfer
</span>

DVD-Player lesen ihre Scheiben mit rotem Laserlicht (650 nm), Blu-ray-Player mit violettem (405 nm). Kürzere Wellenlängen lassen sich auf kleinere Punkte bündeln, so passen mehr Daten auf die Scheibe.

<u>Erkläre</u>, welche Eigenschaft des Halbleiterkristalls für die kürzere Wellenlänge geändert werden muss.
:::

<details class="mp-details">
<summary>Mögliche Lösung anzeigen</summary>

Die Wellenlänge des Laserlichts hängt an der Energie der ausgesandten Photonen, und diese Energie entspricht dem Bandabstand des Halbleiters. Violettes Licht hat eine kürzere Wellenlänge als rotes, seine Photonen tragen mehr Energie. Der Blu-ray-Laser braucht darum ein Halbleitermaterial mit größerem Bandabstand.

</details>

::: {.mp-box .mp-context}
<div class="mp-title">Die Laserdiode im Überblick</div>

- **Lasermedium:** die dünne Grenzschicht eines Halbleiterkristalls. Energiebänder übernehmen die Rolle der Energieniveaus.
- **Pumpquelle:** der elektrische Strom durch die Diode. Oberhalb der Laserschwelle entsteht die Besetzungsinversion.
- **Resonator:** die glatten Endflächen des Kristalls. Durch eine von ihnen tritt der Strahl aus.
:::

::: {.mp-box .mp-core}
<div class="mp-title">Kernaussage</div>

Die Laserdiode ist der häufigste Laser. Ihr Lasermedium ist die Grenzschicht eines Halbleiterkristalls, gepumpt wird mit elektrischem Strom. Unterhalb der Laserschwelle leuchtet sie wie eine LED, oberhalb überwiegt die stimulierte Emission und ein Laserstrahl tritt aus. Der Bandabstand des Halbleiters legt die Wellenlänge des Lichts fest.
:::
