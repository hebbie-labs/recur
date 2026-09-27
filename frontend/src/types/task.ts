import type { ReminderLeadTime } from "@/types/notifications";

export const TaskFrequency = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
  ONCE: "ONCE",
} as const;

export type TaskFrequency = (typeof TaskFrequency)[keyof typeof TaskFrequency];

export const TaskCategory = {
  WORK: "WORK",
  PERSONAL: "PERSONAL",
  SCHOOL: "SCHOOL",
  OTHER: "OTHER",
} as const;

export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];

/** Wer ein geteiltes Projekt-Task erledigt/zugeordnet hat - Kurzform von User. */
export interface TaskPerson {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

/** Projekt-Referenz auf einem geteilten Gruppen-Task. */
export interface TaskProject {
  id: string;
  name: string;
  isArchived: boolean;
}

export interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  frequency: TaskFrequency;
  description: string;
  dateUntil: string;
  progress: number;
  dateCreated: string;
  /** Vom Server bei jedem Save neu gesetzt - Basis für den Sync-Merge (Last-Write-Wins). */
  updatedAt?: string | null;
  daysInSpan?: number | null;
  amountDid?: number | null;
  /** Zeitpunkt des letzten Fortschritts-Increments - vom Server aus completions abgeleitet (#152). */
  lastAmountDidAt?: string | null;
  /** Completion-Historie als Datums-Strings (YYYY-MM-DD) - Source of Truth für amountDid/progress, Basis für die Verlaufs-Liste und den Abhaken-Toggle (#152). */
  completions?: string[] | null;
  isFavorite?: boolean | null;
  isArchived: boolean;
  durationMinutes?: number | null;
  startTime?: string | null;
  /**
   * Erinnerungs-Vorlauf-Override des aktuellen Users für diesen Task
   * (#102-Follow-up); null/undefined nutzt die Kontoeinstellung. Wird vom
   * Server pro Betrachter befüllt (siehe TaskService#maskMembers) und über
   * einen eigenen Endpoint gesetzt (setTaskReminderLeadTime), nicht über
   * createTask/patchTask.
   */
  reminderLeadTime?: ReminderLeadTime | null;
  /** Gesetzt <=> geteiltes Item eines Gruppen-Projekts statt persönlicher Task. */
  project?: TaskProject | null;
  /** Wer den Task zuletzt als erledigt markiert hat (nur bei Projekt-Tasks relevant). */
  completedBy?: TaskPerson | null;
  /** Self-Service zugewiesene Mitglieder (nur bei Projekt-Tasks relevant). */
  assignedMembers?: TaskPerson[];
  /** Wer den Task bereits individuell für sich archiviert hat (nur bei Projekt-Tasks relevant). */
  archivedBy?: TaskPerson[];
}

/** Fields the server owns and the client must never send on create/patch. */
export type ServerOwnedFields =
  | "id"
  | "dateCreated"
  | "updatedAt"
  | "lastAmountDidAt"
  | "completions"
  | "project"
  | "completedBy"
  | "isArchived"
  | "assignedMembers"
  | "archivedBy"
  | "reminderLeadTime";

/** Payload shape for creating a new task (no id/dateCreated yet). */
export type NewTask = Omit<Task, ServerOwnedFields> & { projectId?: string | null };

/** Options for patchTask: partial task fields plus query-param flags. */
export type PatchTaskOptions = {
  task?: Partial<Omit<Task, ServerOwnedFields>> & { projectId?: string | null };
  resetProgress?: boolean;
  favorite?: boolean;
  archived?: boolean;
  /** Nur noch für geteilte Projekt-Tasks (#152: persönliche Tasks laufen über addTaskCompletion/removeTaskCompletion). */
  amountDid?: number;
  /** Setzt den Task explizit zurück auf persönlich (kein Projekt mehr). */
  unassignProject?: boolean;
  /** Undo für deleteTask bei einem für dich ausgeblendeten Projekt-Task - macht nur mit `false` Sinn, siehe deleteTask. */
  hidden?: boolean;
};
