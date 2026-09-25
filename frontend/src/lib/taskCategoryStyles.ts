import { TaskCategory } from "@/types/task";

export const categoryLabels: Record<TaskCategory, string> = {
  [TaskCategory.WORK]: "Arbeit",
  [TaskCategory.PERSONAL]: "Persönlich",
  [TaskCategory.SCHOOL]: "Schule",
  [TaskCategory.OTHER]: "Andere",
};

export const ALL_CATEGORIES_LABEL = "Alle";

export const frequencyLabels: Record<string, string> = {
  DAILY: "Täglich",
  WEEKLY: "Wöchentlich",
  MONTHLY: "Monatlich",
  YEARLY: "Jährlich",
  ONCE: "Einmalig",
};
