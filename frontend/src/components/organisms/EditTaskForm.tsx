import { Formik } from "formik";
import type { Task } from "@/services/taskService";
import * as yup from "yup";
import AppDialog from "@/components/molecules/AppDialog";
import Form from "./Form";
import useEditTaskForm, {
  type EditableTaskFields,
} from "@/hooks/useEditTaskForm";

type EditTaskFormProps = {
  task: Task;
  onClose: () => void;
  onTaskUpdated?: (task: Task) => void;
};

const validationSchema = yup.object().shape({
  name: yup.string(),
  description: yup.string(),
  category: yup.string(),
  projectId: yup.string(),
  progress: yup
    .number()
    .min(0, "Fortschritt muss mindestens 0 sein")
    .max(100, "Fortschritt darf höchstens 100 sein"),
  frequency: yup.string(),
  dateUntil: yup
    .date()
    .nullable()
    .min(yup.ref("startDate"), "Fälligkeitsdatum muss nach dem Startdatum liegen"),
  // Leere Strings müssen explizit auf null transformiert werden: Yups
  // number()/date()-Cast wandelt "" sonst in NaN/Invalid Date um, was trotz
  // .nullable() als Typfehler durchfällt statt als "leer" zu gelten.
  durationMinutes: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .min(1, "Dauer muss mindestens 1 Minute betragen")
    .nullable(),
  // Startdatum/-zeit sind optional (z.B. aus dem Quartalsplan importierte
  // Aufgaben haben keine), aber wenn eines gesetzt ist, muss auch das andere
  // gesetzt sein - sonst lässt sich kein vollständiger startTime bilden.
  startDate: yup
    .date()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .nullable()
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

function toLocalDateParts(isoString: string) {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");

  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

function EditTaskForm({ task, onClose, onTaskUpdated }: EditTaskFormProps) {
  const { date: localStartDate, time: localStartTime } = task.startTime
    ? toLocalDateParts(task.startTime)
    : { date: "", time: "" };

  const { loading, handleSubmit } = useEditTaskForm({
    task,
    onClose,
    onTaskUpdated,
  });

  return (
    <Formik<EditableTaskFields>
      initialValues={{
        name: task.name ?? "",
        description: task.description ?? "",
        category: task.category ?? "",
        frequency: task.frequency ?? "",
        progress: task.progress ?? 0,
        dateUntil: task.dateUntil ? task.dateUntil.slice(0, 10) : "",
        durationMinutes: task.durationMinutes ?? null,
        startDate: localStartDate,
        startTimeOfDay: localStartTime,
        projectId: task.project?.id ?? "",
      }}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({
        values,
        handleChange,
        handleBlur,
        handleSubmit: formikHandleSubmit,
        errors,
        touched,
        dirty,
        isValid,
      }) => (
        <AppDialog
          open
          onClose={onClose}
          title="Bearbeite die Details der Aufgabe"
          onSubmit={() => formikHandleSubmit()}
          loading={loading}
          submitDisabled={loading || !dirty || !isValid}
        >
          <Form
            onSubmit={formikHandleSubmit}
            values={values}
            handleChange={handleChange}
            handleBlur={handleBlur}
            errors={errors}
            touched={touched}
            className="addTaskForm"
          />
        </AppDialog>
      )}
    </Formik>
  );
}

export default EditTaskForm;
