# Prompt-Historie: Besetzungsinversions-Simulation

Wörtliche, unkorrigierte Prompts aus der Entstehung der Simulation `assets/animations/laser/used/besetzungsinversion.js`, in Reihenfolge, mit der jeweiligen Wirkung. Rohmaterial für die Dokumentation des KI-gestützten Erstellungsprozesses in der Masterarbeit. Diese Datei ist bewusst kein Teil des gerenderten Workbooks.

Die Simulation entstand im selben Chat-Verlauf, in dem zuvor die Animationen zu Absorption, spontaner und stimulierter Emission gebaut wurden; der Verlauf trug also bereits Design-Kontext. Vorbilder der Simulation waren eine Lehrbuch-Abbildung (Giancoli, Physik, S. 1354, Abb. 40.18), die dem ersten Auftrag als Referenz beilag, und eine Animation auf LeifiPhysik („Lichtverstärkung durch wiederholte stimulierte Emission“, leifiphysik.de, Abb. 4).

## 1. Der Auftrag (zusammen mit der Referenz-Abbildung)

> Damit ein stimmulierter emssion überwiegt müssen also mehr atome im höheren Energie niveau sein als im niegrigeren hier und erst später meta stabilen zustand oder ich würd das hier trennen und auch ne Simulation bauen mit den beiden zuständen

Wirkung: erste Version, zwei Zustände nebeneinander (normale Besetzung / Inversion), Atome als Punkte auf E1/E2, angelehnt an die Buchabbildung.

## 2. Interaktiv machen, Prozesse zeigen

> Vielleicht können wir die animation direkt so bauen ds man die stimulierte emssion auslösen kann also einmal ein photon was bei der normalen besetzung ein tritt und es kommt eben zu spontaner emssion und absorption und einmal eben ein photon was häufig stimuliert emitiert und beim design ähnlich wie in der setion darüber verstehst du was ich möchte ?

Wirkung: Photonendurchlauf ergänzt, Design-Vorgabe „wie im Abschnitt darüber" (rote Wellenpakete, gleiche Farben).

## 3. Die Niveaus fehlten

> Man sieht hier aber nicht mehr die beiden zustände E2 und E1 und verstehst was mir fehlt ?

Wirkung: Jedes Atom wurde zum Zwei-Niveau-Symbol mit Elektronpunkt, Übergänge sichtbar.

## 4. Physikalische Korrektur

> Okey gut aber nicht alle sind in im energetisch höheren zustand lass auch eins im niedrigeren so wie auch bei der normalen besetzung da ist es ja schon zumteil so

Wirkung: Inversion heißt Mehrheit oben, nicht alle oben. Ein Atom blieb im Grundzustand.

## 5. Bedienung umgebaut

> Der photonen senden button ist komplett unnötig außedern ist es vllt besser wenn man mit einem button wechsel kann von normale besetzung und bestzungsinversion und auch den text dann unter der Simulation kann man weg machen […] Bei allen ich mein wenn die im text auftauchen

Wirkung: „Photon senden" entfernt, Umschalter normale Besetzung ↔ Besetzungsinversion, ein Medium statt zwei, Beschreibung in den Fließtext.

## 6. Bugfix und Vereinfachung

> der kopf des pfeils bleibt noch bei der normalen besetzung und lass die sponatene amission nach der absoption weg

Wirkung: Pfeilkopf übernahm die Opacity nicht (blieb beim Ausblenden stehen), behoben; die gekoppelte spontane Rückabgabe nach der Absorption entfiel.

## Ergänzend (Benennung, ohne Änderung der Simulation)

> außerdem schreibst du animation animation ist es nur wenn es interaktiv ist

## Einordnung

Der Prozess war iterativ: ein grober Auftrag, dann fünf Korrekturschleifen, in denen nacheinander fachliche Fehler (alle Atome oben), Darstellungslücken (Niveaus unsichtbar), das Bedienkonzept (überflüssiger Button) und ein Rendering-Bug behoben wurden. Das aufgeräumte Zwei-Schritt-Muster („beschreibe erst, baue dann"), das die Konzeption als Best Practice nennt, ist die nachträglich destillierte Lehre aus solchen Verläufen, kein Protokoll dieses Verlaufs.
