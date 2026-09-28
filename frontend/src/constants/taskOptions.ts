import type { TaskCategory, TaskFrequency } from "@/types/task";
import type { ReminderLeadTime } from "@/types/notifications";

export const CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: "WORK", label: "Arbeit" },
  { value: "PERSONAL", label: "Persönlich" },
  { value: "SCHOOL", label: "Schule" },
  { value: "OTHER", label: "Andere" },
];

export const FREQUENCY_OPTIONS: { value: TaskFrequency; label: string }[] = [
  { value: "DAILY", label: "Täglich" },
  { value: "WEEKLY", label: "Wöchentlich" },
  { value: "MONTHLY", label: "Monatlich" },
  { value: "YEARLY", label: "Jährlich" },
  { value: "ONCE", label: "Einmalig" },
];

export const LEAD_TIME_OPTIONS: { value: ReminderLeadTime; label: string }[] = [
  { value: "AT_DUE_TIME", label: "Zum Fälligkeitszeitpunkt" },
  { value: "ONE_HOUR", label: "1 Stunde vorher" },
  { value: "SIX_HOURS", label: "6 Stunden vorher" },
  { value: "TWENTY_FOUR_HOURS", label: "24 Stunden vorher" },
  { value: "THREE_DAYS", label: "3 Tage vorher" },
];

export const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 h" },
  { value: 90, label: "1,5 h" },
];