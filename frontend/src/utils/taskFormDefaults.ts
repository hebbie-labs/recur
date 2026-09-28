import { TaskFrequency, type TaskFrequency as TaskFrequencyType } from "@/types/task";
import { toDateOnlyString } from "@/utils/formatDate";

const QUARTER_HOUR_MS = 15 * 60 * 1000;

/** Rundet einen Zeitpunkt auf die nächste volle Viertelstunde auf (12:11 -> 12:15, 13:16 -> 13:30) - rechnet auf Basis der Unix-Epoche statt lokaler Stunden/Minuten, das funktioniert unabhängig von der Zeitzone, weil reale UTC-Offsets stets ein Vielfaches von 15 Minuten sind. */
export function roundUpToQuarterHour(date: Date): Date {
  return new Date(Math.ceil(date.getTime() / QUARTER_HOUR_MS) * QUARTER_HOUR_MS);
}

/** Kombiniert startDate + startTimeOfDay zu einem ISO-Instant; ist bei wiederkehrender Frequenz keins der beiden gesetzt, wird "jetzt" (aufgerundet) als Anker verwendet, da `occursOn` (calendarGrid.ts) startTime braucht, um die Aufgabe überhaupt im Kalender zu platzieren. Bei ONCE bleibt ein leerer Start optional. */
export function resolveStartTime(
  startDate: string,
  startTimeOfDay: string,
  frequency: TaskFrequencyType | ""
): string | null {
  if (startDate && startTimeOfDay) {
    return new Date(`${startDate}T${startTimeOfDay}`).toISOString();
  }

  if (frequency && frequency !== TaskFrequency.ONCE) {
    return roundUpToQuarterHour(new Date()).toISOString();
  }

  return null;
}

/** Das Backend verlangt bei POST /task eine @NotBlank description (Task.java) - bleibt sie beim schnellen Erstellen leer, wird ein generischer Platzhalter gesendet statt den Nutzer zur Eingabe zu zwingen. */
export function resolveDescription(description: string): string {
  return description.trim() || "Keine Beschreibung";
}

/** Das Backend verlangt bei POST /task ein @NotNull dateUntil (Task.java, OnCreate) - bleibt es leer, wird still "heute" eingesetzt (kein @Future-Zwang mehr), oder der bereits gewählte startDate falls der in der Zukunft liegt (sonst dateUntil < startDate; die "after-start"-Yup-Regel greift hier nicht, da sie nur bei manueller dateUntil-Eingabe läuft). */
export function resolveDateUntil(dateUntil: string, startDate: string): string {
  if (dateUntil) return dateUntil;

  const today = toDateOnlyString(new Date());
  return startDate && startDate > today ? startDate : today;
}
