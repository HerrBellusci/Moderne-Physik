# Entfernt: Vertiefung „Eigenschaften des Laserlichts" (zeitliche/räumliche Kohärenz)

Beim Umbau von `02_laser_ausflug_umbau.qmd` (Juli 2026) aus dem Resonator-Abschnitt entfernt; die Vertiefung wird später nach fachdidaktischer Literatur neu gefasst. Enthalten sind die eingeklappte Vertiefung samt der beiden Simulationen (`laser-zeitliche-koharenz`, `laser-koharenz-arten`, Skripte `assets/animations/laser/used/zeitliche-koharenz.js` und `koharenz-arten.js`), die Box „Michelson-Morley ohne Laser" (mit Zitat @haverkamp2022waveoptics) und der rote Kasten „Vorbehalt".

---

<details class="mp-details">
<summary>Vertiefung: Eigenschaften des Laserlichts</summary>

Laserlicht ist besonders gut geordnet: Es ist zeitlich und räumlich viel kohärenter als Licht aus den meisten anderen Quellen. Zwei Wellen heißen kohärent, wenn ihre Phasenverschiebung zueinander konstant bleibt. Das ist der feste Versatz aus dem Abschnitt zur stimulierten Emission. Man unterscheidet zwei Arten von Kohärenz: zeitliche und räumliche Kohärenz.

**Zeitliche Kohärenz** betrifft den zeitlichen Verlauf der Welle an einem festen Ort. Vergleiche die Welle dort mit der Welle, die kurze Zeit $\tau$ später ankommt. Bleibt die Phasenverschiebung dabei konstant, ist das Licht zeitlich kohärent. Die Zeitspanne, über die das gilt, heißt Kohärenzzeit $\tau_c$. Sie hängt direkt an der Breite $\Delta\lambda$ der Spektrallinie: Je schmaler die Linie, desto länger hält die Welle ihren Takt. „Sehr einfarbig" und „zeitlich kohärent" beschreiben dieselbe Eigenschaft, einmal im Spektrum und einmal im Wellenzug.

Oft wird die Kohärenzzeit als Strecke angegeben: die Kohärenzlänge $L_c = c \cdot \tau_c$, der Weg, den das Licht in der Kohärenzzeit zurücklegt. Lass dich vom Wort „Länge" nicht täuschen: $L_c$ liegt längs der Ausbreitungsrichtung und gehört zur zeitlichen Kohärenz. Mit der Ordnung quer zum Strahl hat sie nichts zu tun.

Die Simulation zeigt einen Wellenzug, der an dir vorbeiläuft. An den gestrichelten Linien springt die Phase: Dort vergisst die Welle ihren Takt. Das ungestörte Stück dazwischen ist die Kohärenzlänge, die Zeit, in der es vorbeiläuft, die Kohärenzzeit. Vergleiche die drei Lichtquellen.

::: {.content-visible when-format="html"}
```{=html}
<figure class="srt-workbook-figure srt-workbook-figure--caption-inside">
  <div class="srt-workbook-stage" data-srt-animation="laser-zeitliche-koharenz" data-srt-motion-control data-srt-label="Interaktive Darstellung zur zeitlichen Kohärenz. Ein Wellenzug läuft von links nach rechts durch das Bild. Gestrichelte Linien markieren Phasensprünge, dazwischen liegt das ungestörte Stück, die Kohärenzlänge. Bei der Glühlampe sind die Stücke sehr kurz, bei der Spektrallampe mittellang, beim Laser länger als der Bildausschnitt."></div>
</figure>
```
:::

::: {.content-visible unless-format="html"}
::: {.srt-workbook-fallback}
In der HTML-Version erscheint hier eine Simulation: ein vorbeilaufender Wellenzug mit Phasensprüngen. Das ungestörte Stück zwischen zwei Sprüngen ist die Kohärenzlänge; bei der Glühlampe ist es sehr kurz, beim Laser länger als der Bildausschnitt.
:::
:::

**Räumliche Kohärenz** betrifft die Richtung quer zum Strahl. Vergleiche zwei Punkte im Strahlquerschnitt: Schwingen sie in fester Phasenbeziehung zueinander, ist das Licht räumlich kohärent. Das gelingt, wenn alle Wellenzüge parallel laufen: Dann behalten sie ihren Versatz zueinander auf dem ganzen Weg. Laufen die Wellenzüge aufgefächert in verschiedene Richtungen, wächst der Versatz quer zum Strahl immer weiter an; eine feste Beziehung bleibt höchstens über winzige Ausschnitte. Beim Laser erzwingt der Resonator die Parallelität: Nur Licht entlang seiner Achse wird verstärkt. Diese Ordnung quer zum Strahl steckt hinter der starken Bündelung.

In der zweiten Simulation stellst du drei Dinge selbst ein: ob die Quelle eine Farbe oder mehrere Farben aussendet, ob die Wellenzüge parallel oder aufgefächert laufen, und ob sie gleichphasig starten oder mit festem Versatz. Eine Farbe ergibt zeitliche Kohärenz. Parallele Wellenzüge ergeben räumliche Kohärenz: Der Versatz quer zum Strahl bleibt fest. Gleichphasig liegen die Wellenberge auf einer ebenen Front, das ist der strengste Fall und das passende Bild für den Laser. Schaltest du auf festen Versatz, ist die Front keine Ebene mehr, sie wandert aber unverändert mit: Das Licht bleibt räumlich kohärent. Eine Farbe und parallele Wellenzüge zusammen sind Licht wie aus dem Laser, mehrere Farben und aufgefächerte Wellenzüge Licht wie aus der Glühlampe.

::: {.content-visible when-format="html"}
```{=html}
<figure class="srt-workbook-figure srt-workbook-figure--caption-inside">
  <div class="srt-workbook-stage" data-srt-animation="laser-koharenz-arten" data-srt-motion-control data-srt-label="Interaktive Darstellung mit drei Umschaltern. Fünf Wellenzüge verlassen eine Quelle. Der erste Umschalter wählt zwischen einer Farbe und mehreren Farben, der zweite zwischen parallelen und aufgefächerten Richtungen, der dritte zwischen gleichphasigem Start und festem Phasenversatz. Bei einer Farbe verbindet eine gestrichelte Linie die Wellenberge: bei parallelen, gleichphasigen Wellenzügen eine gerade, ebene Front, bei festem Versatz eine Zickzack-Linie, die unverändert mitwandert, bei aufgefächerten eine gekrümmte. Eine Statuszeile zeigt an, ob das Licht zeitlich und räumlich kohärent ist. Eine Farbe plus parallel entspricht dem Laser, mehrere Farben plus aufgefächert der Glühlampe."></div>
</figure>
```
:::

::: {.content-visible unless-format="html"}
::: {.srt-workbook-fallback}
In der HTML-Version erscheint hier eine Simulation mit drei Umschaltern: eine Farbe oder mehrere Farben, parallele oder aufgefächerte Wellenzüge, gleichphasiger Start oder fester Versatz. Eine Farbe ergibt zeitliche, parallele Wellenzüge räumliche Kohärenz; auch mit festem Versatz bleibt das Licht räumlich kohärent. Eine Farbe plus parallel entspricht dem Laser, mehrere Farben plus aufgefächert der Glühlampe.
:::
:::

Zeitliche und räumliche Kohärenz lassen sich getrennt verändern. Eine Spektrallampe mit Farbfilter liefert zeitlich recht kohärentes Licht: Der Farbfilter lässt nur einen schmalen Wellenlängenbereich durch. Räumlich bleibt ihr Licht nur über kleine Bereiche geordnet: Die Lampe ist eine ausgedehnte Quelle.

Zu jeder Kohärenzart gehört ein Prüf-Versuch. Der Doppelspalt prüft die räumliche Kohärenz: Seine zwei Spalte greifen zwei Punkte aus dem Strahlquerschnitt heraus. Ein stabiles Streifenmuster entsteht, wenn die Phasenbeziehung dieser zwei Punkte fest ist. Eine ausgedehnte Lampe direkt vor dem Doppelspalt liefert darum kein Muster; historisch half ein enger Vorspalt, der die Quelle klein macht. Das Michelson-Interferometer prüft die zeitliche Kohärenz: Es überlagert die Welle mit einer zeitversetzten Kopie ihrer selbst, der Wegunterschied der Arme ist der Zeitversatz. Davon handelt die folgende Box.

::: {.callout-note title="Michelson-Morley ohne Laser"}
Wie konnten Michelson und Morley 1887 Interferenzstreifen beobachten, ganz ohne Laser? In heutigen Abbildungen und Demonstrationen steckt im Michelson-Interferometer meist einer; im Originalversuch ([Abschnitt 1.2](01_srt_raum_und_zeit.qmd#michelson-morley-experiment)) arbeiteten Michelson und Morley mit Lampenlicht. Die Antwort steckt im halbdurchlässigen Spiegel: Er teilt jeden Wellenzug in zwei Kopien, die am Ende wieder aufeinandertreffen. Jede Welle überlagert sich also mit ihrer eigenen Kopie, und mit der ist sie automatisch kohärent, solange der Wegunterschied der beiden Arme kleiner bleibt als ihre Kohärenzlänge.

Bei Lampenlicht ist diese Kohärenzlänge winzig: Die beiden Arme mussten fast exakt gleich lang sein, das Einstellen war Feinarbeit. Für diese Feinarbeit nutzten Michelson und Morley das gelbe Licht einer Natriumflamme: Es ist einfarbig, hat damit eine größere Kohärenzlänge als weißes Licht, und seine Streifen sind leichter zu finden.

Ein Laser mit seiner großen Kohärenzlänge macht solche Experimente zu bequemen Tischversuchen ohne großen Aufbau: In der Sammlung des Instituts steht ein 3D-gedrucktes Exemplar eines solchen Interferometers; den Aufbau beschreibt @haverkamp2022waveoptics. Kilometerlange Interferometer wie zur Messung von Gravitationswellen sind ganz auf den Laser angewiesen: Nur Laserlicht bleibt über solche Strecken gebündelt und schwingt dort noch als ununterbrochener Wellenzug, ohne Phasensprung.
:::

::: {.mp-box .mp-misconception}
<div class="mp-title">Vorbehalt</div>

Diese Vertiefung und ihre Simulationen vereinfachen die Bedeutung von Kohärenz stark. Sie steht an dieser Stelle, weil jetzt alle Bausteine gelegt sind: Zeitliche und räumliche Kohärenz sind der physikalische Blick auf die besonderen Eigenschaften des Laserlichts:

- Es ist sehr einfarbig.
- Es divergiert kaum und bleibt gebündelt.
- Es eignet sich hervorragend für Interferenzversuche.

Die strenge Theorie dahinter arbeitet statistisch: Sie mittelt das Produkt zweier Feldstärken über die Zeit (Korrelationsfunktionen) und kennt alle Zwischenstufen zwischen kohärent und inkohärent. Diese Theorie ist mathematisch anspruchsvoll, und für das Verständnis, wie ein Laser funktioniert, brauchst du sie nicht. Sie beschreibt präzise, was sein Licht auszeichnet. Für dieses Workbook reicht das Bild der festen Phasenbeziehung.
:::

Beim Laser haben beide Arten dieselbe Ursache: Die stimulierte Emission füllt eine einzige Mode des Resonators mit Photonen. Eine Mode hat eine feste Wellenlänge, und ihr Licht läuft parallel zur Resonatorachse. Die feste Wellenlänge hängt mit der zeitlichen Kohärenz zusammen, die gemeinsame Richtung mit der räumlichen. Keine der besonderen Eigenschaften des Laserlichts erzeugt die anderen: Sie entstehen gemeinsam, weil praktisch das gesamte Licht in derselben Mode steckt und die stimulierte Emission die Wellenzüge in fester Phasenbeziehung zueinander hält.

</details>
