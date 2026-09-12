import type { FormEvent, ChangeEvent, FocusEvent } from "react";
import { Form as FormikForm } from "formik";
import type { FormikErrors, FormikTouched } from "formik";
import { TaskFrequency, type TaskCategory } from "@/services/taskService";
import FormTextField from "@/components/molecules/FormTextField";
import FormDateField from "@/components/molecules/FormDateField";
import FormSelector from "@/components/molecules/FormSelector";
import FormTimeField from "@/components/molecules/FormTimeField";
import ProjectSelector from "@/components/molecules/ProjectSelector";

export type FormValues = {
  name: string;
  description: string;
  category: TaskCategory | "";
  frequency: TaskFrequency | "";
  dateUntil: string;
  durationMinutes: number | null;
  startDate: string;
  startTimeOfDay: string;
  startTime: string | null;
  projectId: string;
};

type FormProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  values: FormValues;
  errors: FormikErrors<FormValues>;
  touched: FormikTouched<FormValues>;
  className?: string;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleBlur: (
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
};

function Form({
  onSubmit,
  values,
  handleChange,
  handleBlur,
  errors,
  touched,
  className,
}: FormProps) {
  return (
    <FormikForm onSubmit={onSubmit} className={className}>
      <FormTextField
        name="name"
        label="Name"
        value={values.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={(touched.name || values.name.length > 0) && !!errors.name}
        helperText={
          touched.name || values.name.length > 0 ? errors.name : undefined
        }
      />
      <FormTextField
        name="description"
        label="Beschreibung"
        value={values.description}
        onChange={handleChange}
        onBlur={handleBlur}
        error={
          (touched.description || values.description.length > 0) &&
          !!errors.description
        }
        helperText={
          touched.description || values.description.length > 0
            ? errors.description
            : undefined
        }
      />
      <FormSelector variant="category" />
      <FormSelector variant="frequency" />
      <ProjectSelector />
      <FormTextField
        name="durationMinutes"
        label="Dauer (Minuten)"
        value={values.durationMinutes ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        error={
          (touched.durationMinutes || (values.durationMinutes ?? 0) > 0) &&
          !!errors.durationMinutes
        }
        helperText={
          touched.durationMinutes || (values.durationMinutes ?? 0) > 0
            ? errors.durationMinutes
            : undefined
        }
      />
      <FormDateField name="startDate" label="Startdatum" />
      <FormTimeField
        name="startTimeOfDay"
        label="Startzeit"
        value={values.startTimeOfDay}
        onChange={handleChange}
        onBlur={handleBlur}
        error={
          (touched.startTimeOfDay || values.startTimeOfDay.length > 0) &&
          !!errors.startTimeOfDay
        }
        helperText={
          touched.startTimeOfDay || values.startTimeOfDay.length > 0
            ? errors.startTimeOfDay
            : undefined
        }
      />

      <FormDateField
        name="dateUntil"
        label={
          values.frequency === TaskFrequency.ONCE || values.frequency === ""
            ? "Fälligkeitsdatum"
            : "Wiederholt bis"
        }
      />
    </FormikForm>
  );
}
export default Form;
