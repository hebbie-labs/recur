import { TaskFrequency, type TaskFrequency as TaskFrequencyType, type Task } from "@/types/task";
import { toDateOnlyString } from "@/utils/formatDate";

// Wie viele Tage ein Frequenz-Intervall abdeckt (#152) - identisch zu
// TaskUtil im Backend, Basis für "max. 1 Completion pro Intervall". ONCE hat
// kein Intervall-Konzept (kein Eintrag).
export const FREQUENCY_INTERVAL_DAYS: Partial<Record<TaskFrequencyType, number>> = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
  YEARLY: 365,
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// new Date("YYYY-MM-DD") parsed als UTC-Mitternacht (ISO-8601-Regel), nicht
// als lokaler Kalendertag - würde nahe Tageswechsel je nach Zeitzone einen
// Tag verschieben. Eigene Komponenten-Konstruktion umgeht das (#152: "Tag" =
// lokaler Kalendertag des Browsers, siehe toDateOnlyString).
export function parseDateOnly(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toLocalMidnight(instant: string): Date {
  const d = new Date(instant);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function today(): string {
  return toDateOnlyString(new Date());
}

type CompletionTask = Pick<Task, "dateCreated" | "frequency" | "completions">;

/** Welches Frequenz-Intervall (seit dateCreated) ein Datum abdeckt - null bei ONCE/fehlender Frequenz, spiegelt TaskUtil#intervalIndexOf im Backend (#152). */
export function intervalIndexOf(task: CompletionTask, dateOnly: string): number | null {
  const intervalDays = FREQUENCY_INTERVAL_DAYS[task.frequency];
  if (!intervalDays || !task.dateCreated) return null;

  const created = toLocalMidnight(task.dateCreated);
  const target = parseDateOnly(dateOnly);
  const daysBetween = Math.round((target.getTime() - created.getTime()) / ONE_DAY_MS);
  return Math.floor(daysBetween / intervalDays);
}

/** Completion-Datum, das das aktuell laufende Intervall abdeckt (falls vorhanden) - Basis für den primären Abhaken-Toggle (#152). */
export function currentPeriodCompletion(task: CompletionTask): string | null {
  const completions = task.completions ?? [];

  if (task.frequency === TaskFrequency.ONCE) {
    return completions[0] ?? null;
  }

  const currentIndex = intervalIndexOf(task, today());
  if (currentIndex === null) return null;

  return completions.find((date) => intervalIndexOf(task, date) === currentIndex) ?? null;
}

type DoneCheckTask = CompletionTask & {
  progress?: number | null;
  lastAmountDidAt?: string | null;
  project?: unknown;
};

// Geteilte Projekt-Tasks haben keine Completion-Historie (#152 gilt nur für
// persönliche Tasks, siehe TaskService#addCompletion) und laufen weiterhin
// über die alte, rein zeitbasierte Rolling-Window-Sperre ab dem letzten Klick
// (kein Kalender-/Zeitzonen-Abgleich, kein Rückgängig, siehe #136).
function legacyDoneForCurrentPeriod(task: DoneCheckTask): boolean {
  const clampedProgress = Math.min(100, Math.max(0, task.progress ?? 0));
  if (task.frequency === TaskFrequency.ONCE) {
    return clampedProgress >= 100;
  }
  const intervalDays = FREQUENCY_INTERVAL_DAYS[task.frequency];
  return Boolean(
    task.lastAmountDidAt &&
      intervalDays &&
      new Date().getTime() - new Date(task.lastAmountDidAt).getTime() < intervalDays * ONE_DAY_MS
  );
}

/** Ob das aktuell laufende Frequenz-Intervall bereits erledigt ist - für persönliche Tasks completion-basiert (#152, toggle-bar), für geteilte Projekt-Tasks die alte zeitbasierte Sperre (#136, unverändert). */
export function isDoneForCurrentPeriod(task: DoneCheckTask): boolean {
  if (task.project) {
    return legacyDoneForCurrentPeriod(task);
  }
  return currentPeriodCompletion(task) !== null;
}

export type PastInterval = {
  index: number;
  /** Stellvertretendes Datum (Intervall-Start) - wird beim Abhaken als Completion-Datum verwendet. */
  representativeDate: string;
  completedOn: string | null;
};

/** Bereits abgelaufene Frequenz-Intervalle vor dem aktuellen, neueste zuerst - Basis für die Verlaufs-Liste (#152). ONCE hat kein Intervall-Konzept -> leere Liste. */
export function pastIntervals(task: CompletionTask): PastInterval[] {
  const intervalDays = FREQUENCY_INTERVAL_DAYS[task.frequency];
  if (!intervalDays || !task.dateCreated) return [];

  const currentIndex = intervalIndexOf(task, today());
  if (currentIndex === null || currentIndex <= 0) return [];

  const created = toLocalMidnight(task.dateCreated);
  const completionsByIndex = new Map<number, string>();
  (task.completions ?? []).forEach((date) => {
    const index = intervalIndexOf(task, date);
    if (index !== null) completionsByIndex.set(index, date);
  });

  const intervals: PastInterval[] = [];
  for (let index = currentIndex - 1; index >= 0; index--) {
    const start = new Date(created.getTime() + index * intervalDays * ONE_DAY_MS);
    intervals.push({
      index,
      representativeDate: toDateOnlyString(start),
      completedOn: completionsByIndex.get(index) ?? null,
    });
  }
  return intervals;
}
