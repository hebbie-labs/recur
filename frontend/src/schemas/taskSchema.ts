import * as yup from "yup";
import { TaskCategory, TaskFrequency } from "@/services/taskService";

export const taskValidationSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, "Name muss mindestens 2 Zeichen lang sein")
    .max(40, "Name darf maximal 40 Zeichen lang sein")
    .required("Name ist erforderlich"),

  description: yup
    .string()
    .trim()
    .max(200, "Beschreibung darf maximal 200 Zeichen lang sein")
    .required("Beschreibung ist erforderlich"),

  category: yup
    .string()
    .oneOf(Object.values(TaskCategory))
    .required("Kategorie ist erforderlich"),

  frequency: yup
    .string()
    .oneOf(Object.values(TaskFrequency))
    .required("Frequenz ist erforderlich"),

  projectId: yup.string(),

  dateUntil: yup
    .date()
    .required("Fälligkeitsdatum ist erforderlich")
    .test(
      "after-start",
      "Fälligkeitsdatum muss nach dem Startdatum liegen",
      function (value) {
        const startDate = this.parent.startDate;
        if (!value || !startDate) return true;
        return value.getTime() >= startDate.getTime();
      }
    ),

  // Leere Strings müssen explizit auf null transformiert werden: Yups
  // number()/date()-Cast wandelt "" sonst in NaN/Invalid Date um, was trotz
  // .nullable() als Typfehler durchfällt statt als "leer" zu gelten.
  durationMinutes: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .min(1, "Dauer muss mindestens 1 Minute betragen")
    .nullable(),

  // Startdatum/-zeit sind optional (z.B. ein ganztägiger/mehrtägiger Eintrag
  // wie "Ferien" hat keine feste Uhrzeit), aber wenn eines gesetzt ist, muss
  // auch das andere gesetzt sein - sonst lässt sich kein startTime bilden.
  startDate: yup
    .date()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .nullable()
    .test("future", "Startdatum muss in der Zukunft liegen", (value) => {
      if (!value) return true;
      return value.getTime() >= Date.now();
    })
    .test(
      "start-pair",
      "Datum und Uhrzeit müssen beide gesetzt sein oder beide leer bleiben",
      function (value) {
        return Boolean(value) === Boolean(this.parent.startTimeOfDay);
      }
    ),

  startTimeOfDay: yup
    .string()
    .nullable()
    .test(
      "start-pair",
      "Datum und Uhrzeit müssen beide gesetzt sein oder beide leer bleiben",
      function (value) {
        return Boolean(value) === Boolean(this.parent.startDate);
      }
    )
    .test(
      "time-format",
      "Ungültiges Zeitformat (Format muss HH:mm sein)",
      (value) => !value || /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(value)
    )
    .test("min-time", "Die Zeit muss ab 08:00 Uhr liegen", (value) => {
      if (!value) return true;
      return value >= "08:00";
    })
    .test("max-time", "Die Zeit muss vor oder um 23:00 Uhr liegen", (value) => {
      if (!value) return true;
      return value <= "23:00";
    }),
});
