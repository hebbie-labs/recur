import * as yup from "yup";
import { TaskCategory, TaskFrequency } from "@/services/taskService";
import { toDateOnlyString } from "@/utils/formatDate";

const RECURRING_FREQUENCIES: string[] = [
  TaskFrequency.DAILY,
  TaskFrequency.WEEKLY,
  TaskFrequency.MONTHLY,
  TaskFrequency.YEARLY,
];

function isRecurring(frequency: unknown): boolean {
  return typeof frequency === "string" && RECURRING_FREQUENCIES.includes(frequency);
}

// Gemeinsame Feld-Validatoren für Add- und Edit-Formular - beide Formulare
// teilen sich denselben Field-Satz (Form.tsx), nur die Required-Regeln für
// Add unterschieden sich (Edit erlaubt PATCH-typisch alles optional zu lassen,
// ausser Name/Kategorie/Frequenz, die ein Task immer braucht).
const nameSchema = yup
  .string()
  .trim()
  .min(2, "Name muss mindestens 2 Zeichen lang sein")
  .max(40, "Name darf maximal 40 Zeichen lang sein")
  .required("Name ist erforderlich");

const descriptionSchema = yup
  .string()
  .trim()
  .max(200, "Beschreibung darf maximal 200 Zeichen lang sein");

const categorySchema = yup.string().oneOf(Object.values(TaskCategory));

const frequencySchema = yup.string().oneOf(Object.values(TaskFrequency));

// Fälligkeitsdatum ist nur bei wiederkehrender Frequenz erforderlich (wird
// dort gebraucht, um das Ende der Wiederholung zu kennen) - bei einer
// einmaligen Aufgabe bleibt es optional (der Payload-Builder setzt beim
// Absenden bei Bedarf still "morgen" ein, siehe utils/taskFormDefaults.ts).
const dateUntilSchema = yup
  .date()
  .nullable()
  .when("frequency", {
    is: isRecurring,
    then: (schema) => schema.required("Fälligkeitsdatum ist erforderlich"),
  })
  .test(
    "after-start",
    "Fälligkeitsdatum muss nach dem Startdatum liegen",
    function (value) {
      const startDate = this.parent.startDate;
      if (!value || !startDate) return true;
      return value.getTime() >= startDate.getTime();
    }
  );

// Leere Strings müssen explizit auf null transformiert werden: Yups
// number()/date()-Cast wandelt "" sonst in NaN/Invalid Date um, was trotz
// .nullable() als Typfehler durchfällt statt als "leer" zu gelten.
const durationMinutesSchema = yup
  .number()
  .transform((value, originalValue) => (originalValue === "" ? null : value))
  .min(1, "Dauer muss mindestens 1 Minute betragen")
  .nullable();

const startDateSchema = yup
  .date()
  .transform((value, originalValue) => (originalValue === "" ? null : value))
  .nullable()
  .test(
    "not-in-past",
    "Startdatum darf nicht in der Vergangenheit liegen",
    (value) => {
      if (!value) return true;
      return toDateOnlyString(value) >= toDateOnlyString(new Date());
    }
  );

const startTimeOfDaySchema = yup
  .string()
  .nullable()
  .test(
    "time-format",
    "Ungültiges Zeitformat (Format muss HH:mm sein)",
    (value) => !value || /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(value)
  );

const projectIdSchema = yup.string();

export const taskValidationSchema = yup.object({
  name: nameSchema,
  description: descriptionSchema,
  category: categorySchema,
  frequency: frequencySchema,
  projectId: projectIdSchema,
  dateUntil: dateUntilSchema,
  durationMinutes: durationMinutesSchema,
  startDate: startDateSchema,
  startTimeOfDay: startTimeOfDaySchema,
});

export const editTaskValidationSchema = yup.object({
  name: nameSchema,
  description: descriptionSchema,
  category: categorySchema,
  frequency: frequencySchema,
  projectId: projectIdSchema,
  progress: yup
    .number()
    .min(0, "Fortschritt muss mindestens 0 sein")
    .max(100, "Fortschritt darf höchstens 100 sein"),
  dateUntil: dateUntilSchema,
  durationMinutes: durationMinutesSchema,
  startDate: startDateSchema,
  startTimeOfDay: startTimeOfDaySchema,
});
