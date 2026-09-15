import {
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameMonth,
  format,
  getISOWeek,
} from "date-fns";
import { de } from "date-fns/locale";
import { TaskCategory, type Task, type TaskCategory as TaskCategoryType } from "@/services/taskService";

/**
 * Canonical per-category accent colors, shared by the calendar's category
 * dots/filter chips and TaskCard's category badge - the single color source
 * for a task's category across the app.
 */
export const categoryDot: Record<TaskCategoryType, string> = {
  [TaskCategory.WORK]: "bg-rose-500",
  [TaskCategory.PERSONAL]: "bg-blue-500",
  [TaskCategory.SCHOOL]: "bg-emerald-500",
  [TaskCategory.OTHER]: "bg-zinc-400",
};

export const categoryBorder: Record<TaskCategoryType, string> = {
  [TaskCategory.WORK]: "border-l-rose-500",
  [TaskCategory.PERSONAL]: "border-l-blue-500",
  [TaskCategory.SCHOOL]: "border-l-emerald-500",
  [TaskCategory.OTHER]: "border-l-zinc-400",
};

export type CalendarDay = {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
};

/** One Monday-Sunday row of the month grid, with its ISO-8601 week number. */
export type CalendarWeek = {
  weekNumber: number;
  days: CalendarDay[];
  isCurrentWeek: boolean;
};

export function getWeekDays(anchor: Date): CalendarDay[] {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return { date, isToday: isSameDay(date, new Date()), isCurrentMonth: true };
  });
}

export function getMonthGrid(anchor: Date): CalendarWeek[] {
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: CalendarDay[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    days.push({
      date: cursor,
      isToday: isSameDay(cursor, new Date()),
      isCurrentMonth: isSameMonth(cursor, anchor),
    });
  }

  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7);
    weeks.push({
      // Alle 7 Tage einer Montag-Sonntag-Zeile liegen in derselben ISO-Woche,
      // die Wochennummer lässt sich also an einem beliebigen Tag ablesen.
      weekNumber: getISOWeek(weekDays[0].date),
      days: weekDays,
      isCurrentWeek: weekDays.some((day) => day.isToday),
    });
  }
  return weeks;
}

export function getWeekLabel(days: CalendarDay[]): string {
  const firstDay = days[0].date;
  const lastDay = days[6].date;

  if (firstDay.getMonth() === lastDay.getMonth()) {
    return `${format(firstDay, "d.", { locale: de })} – ${format(
      lastDay,
      "d. MMMM yyyy",
      { locale: de }
    )}`;
  }

  if (firstDay.getFullYear() === lastDay.getFullYear()) {
    return `${format(firstDay, "d. MMMM", { locale: de })} – ${format(
      lastDay,
      "d. MMMM yyyy",
      { locale: de }
    )}`;
  }

  return `${format(firstDay, "d. MMMM yyyy", { locale: de })} – ${format(
    lastDay,
    "d. MMMM yyyy",
    { locale: de }
  )}`;
}

export function getMonthLabel(anchor: Date): string {
  return format(anchor, "MMMM yyyy", { locale: de });
}

/** Whether a (possibly recurring) task occurs on the given calendar day. */
export function occursOn(task: Task, date: Date): boolean {
  if (!task.startTime) {
    // Tasks without a startTime (e.g. imported from the Quartalsplan) only
    // carry a due date. For a one-off task that due date IS the occurrence;
    // a repeating task has no anchor to derive a pattern from, so it can't
    // be placed at all.
    return task.frequency === "ONCE" && isSameDay(new Date(task.dateUntil), date);
  }

  const taskDate = new Date(task.startTime);
  const taskUntilDate = new Date(task.dateUntil);

  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const start = new Date(taskDate);
  start.setHours(0, 0, 0, 0);
  const until = new Date(taskUntilDate);
  until.setHours(0, 0, 0, 0);

  if (day < start || day > until) return false;

  switch (task.frequency) {
    case "DAILY":
      return true;
    case "WEEKLY":
      return taskDate.getDay() === date.getDay();
    case "MONTHLY":
      return taskDate.getDate() === date.getDate();
    case "YEARLY":
      return (
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    case "ONCE":
      return isSameDay(taskDate, date);
    default:
      return false;
  }
}

/** Sorts tasks occurring on a day by their start time (earliest first). */
export function sortByStartTime(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
    const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
    return aTime - bTime;
  });
}
