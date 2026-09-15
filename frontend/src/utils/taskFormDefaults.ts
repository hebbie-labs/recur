import { TaskFrequency, type TaskFrequency as TaskFrequencyType } from "@/services/taskService";
import { toDateOnlyString } from "@/utils/formatDate";

const QUARTER_HOUR_MS = 15 * 60 * 1000;

/**
 * Rundet einen Zeitpunkt auf die nächste volle Viertelstunde auf
 * (12:11 -> 12:15, 13:16 -> 13:30) - der automatisch gesetzte Start soll auf
 * eine "runde" Uhrzeit fallen statt auf die exakte Sekunde des Erstellens.
 * Rechnet auf Basis der Unix-Epoche statt lokaler Stunden/Minuten, das
 * funktioniert unabhängig von der Zeitzone, weil reale UTC-Offsets stets
 * ein Vielfaches von 15 Minuten sind.
 */
export function roundUpToQuarterHour(date: Date): Date {
  return new Date(Math.ceil(date.getTime() / QUARTER_HOUR_MS) * QUARTER_HOUR_MS);
}

/**
 * Kombiniert startDate + startTimeOfDay zu einem ISO-Instant. Ist bei
 * wiederkehrender Frequenz keins der beiden gesetzt, wird "jetzt" (auf die
 * nächste Viertelstunde aufgerundet) als Anker verwendet - `occursOn`
 * (calendarGrid.ts) braucht startTime, um eine wiederkehrende Aufgabe
 * überhaupt im Kalender platzieren zu können, sonst würde sie dort nie
 * erscheinen. Bei ONCE bleibt ein leerer Start optional.
 */
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

/**
 * Das Backend verlangt bei POST /task eine @NotBlank description (Task.java)
 * - bleibt sie beim schnellen Erstellen leer, wird ein generischer Platzhalter
 * gesendet statt den Nutzer zur Eingabe zu zwingen.
 */
export function resolveDescription(description: string): string {
  return description.trim() || "Keine Beschreibung";
}

/**
 * Das Backend verlangt bei POST /task ein @NotNull dateUntil (Task.java,
 * OnCreate-Gruppe) - auch für einmalige Aufgaben. Bleibt das Feld beim
 * schnellen Erstellen leer, wird stillschweigend "heute" eingesetzt, statt
 * den Nutzer zur Eingabe zu zwingen (ein @Future-Zwang existiert nicht mehr,
 * ein Fälligkeitsdatum von heute ist also gültig).
 *
 * Wurde daneben bereits ein Start gewählt, der nach heute liegt, muss der
 * Default darauf Rücksicht nehmen - sonst entstünde eine Aufgabe, die vor
 * ihrem eigenen Start schon fällig ist (dateUntil < startDate). Die
 * "after-start"-Yup-Regel greift hier nicht, weil sie nur läuft, wenn der
 * Nutzer selbst ein dateUntil eingetippt hat, nicht bei diesem nachträglichen
 * Default.
 */
export function resolveDateUntil(dateUntil: string, startDate: string): string {
  if (dateUntil) return dateUntil;

  const today = toDateOnlyString(new Date());
  return startDate && startDate > today ? startDate : today;
}
