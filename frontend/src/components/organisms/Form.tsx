import { useEffect, type ChangeEvent, type FocusEvent } from "react";
import { useFormikContext, type FormikErrors, type FormikTouched } from "formik";
import { TaskFrequency, type TaskCategory } from "@/services/taskService";
import FormTextField from "@/components/molecules/FormTextField";
import FormTextAreaField from "@/components/molecules/FormTextAreaField";
import FormDateField from "@/components/molecules/FormDateField";
import FormDateTimeField from "@/components/molecules/FormDateTimeField";
import FormDurationField from "@/components/molecules/FormDurationField";
import FormSelector from "@/components/molecules/FormSelector";
import ProjectSelector from "@/components/molecules/ProjectSelector";
import { toDateOnlyString } from "@/utils/formatDate";
import { roundUpToQuarterHour } from "@/utils/taskFormDefaults";

export type FormValues = {
  name: string;
  description: string;
  category: TaskCategory | "";
  frequency: TaskFrequency | "";
  dateUntil: string;
  durationMinutes: number | null;
  startDate: string;
  startTimeOfDay: string;
  projectId: string;
};

// Fehler werden nur nach dem Verlassen des Felds (touched) angezeigt, nicht
// schon während des Tippens - Formik validiert trotzdem laufend im
// Hintergrund, die Meldung aktualisiert sich also sofort, sobald sie einmal
// sichtbar ist.
type FieldErrorProps<K extends keyof FormValues> = {
  name: K;
  touched: FormikTouched<FormValues>;
  errors: FormikErrors<FormValues>;
};

function fieldErrorProps<K extends keyof FormValues>({
  name,
  touched,
  errors,
}: FieldErrorProps<K>) {
  const error = !!touched[name] && !!errors[name];
  return {
    error,
    helperText: touched[name] ? (errors[name] as string | undefined) : undefined,
  };
}

type BasicsFieldsProps = {
  values: FormValues;
  errors: FormikErrors<FormValues>;
  touched: FormikTouched<FormValues>;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleBlur: (
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  autoFocusName?: boolean;
};

/** Name, Beschreibung, Kategorie - die Felder, die immer sichtbar sind (Step 1 beim Add-Dialog, oben im Edit-Dialog). */
export function TaskBasicsFields({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  autoFocusName,
}: BasicsFieldsProps) {
  return (
    <>
      <FormTextField
        name="name"
        label="Name"
        value={values.name}
        onChange={handleChange}
        onBlur={handleBlur}
        autoFocus={autoFocusName}
        {...fieldErrorProps({ name: "name", touched, errors })}
      />
      <FormTextAreaField
        name="description"
        label="Beschreibung"
        value={values.description}
        onChange={handleChange}
        onBlur={handleBlur}
        {...fieldErrorProps({ name: "description", touched, errors })}
      />
      <FormSelector variant="category" />
    </>
  );
}

type DetailFieldsProps = {
  values: FormValues;
};

/** Frequenz, Fälligkeitsdatum, Dauer, Projekt, Start - optionale/defaultierte Felder (Step 2 beim Add-Dialog, "Weitere Details" beim Edit-Dialog). */
export function TaskDetailFields({ values }: DetailFieldsProps) {
  const { setFieldValue } = useFormikContext<FormValues>();

  // Wechselt die Frequenz auf wiederkehrend, während Start noch leer ist,
  // wird "jetzt" sichtbar vorbelegt statt den Anker erst beim Absenden still
  // zu setzen (siehe utils/taskFormDefaults.ts) - eine wiederkehrende Aufgabe
  // ohne startTime würde im Kalender sonst nie erscheinen (occursOn).
  useEffect(() => {
    const isRecurring =
      values.frequency !== "" && values.frequency !== TaskFrequency.ONCE;

    if (!isRecurring || values.startDate) return;

    const rounded = roundUpToQuarterHour(new Date());
    const pad = (n: number) => String(n).padStart(2, "0");

    setFieldValue("startDate", toDateOnlyString(rounded));
    setFieldValue(
      "startTimeOfDay",
      `${pad(rounded.getHours())}:${pad(rounded.getMinutes())}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.frequency]);

  return (
    <>
      <FormSelector variant="frequency" />
      <FormDateField
        name="dateUntil"
        label={
          values.frequency === TaskFrequency.ONCE || values.frequency === ""
            ? "Fälligkeitsdatum"
            : "Wiederholt bis"
        }
      />
      <FormDurationField />
      <ProjectSelector />
      <FormDateTimeField label="Start" />
    </>
  );
}
