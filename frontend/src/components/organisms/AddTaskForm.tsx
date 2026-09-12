import { Formik } from "formik";
import { Separator } from "@/components/ui/separator";
import type { Task, TaskCategory, TaskFrequency } from "@/services/taskService";
import useAddTaskForm from "@/hooks/useAddTaskForm";
import useFormCache from "@/hooks/useFormCache";
import AppDialog from "@/components/molecules/AppDialog";
import { taskValidationSchema } from "@/schemas/taskSchema";
import Form, { type FormValues } from "@/components/organisms/Form";
import { Button } from "@/components/ui/button";

import type { AddTaskPrefill } from "@/contexts/AddTaskContext";

type AddTaskFormProps = {
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
  prefill?: AddTaskPrefill;
};

const CACHE_KEY = "add-task-form";

function AddTaskForm({ onClose, onTaskCreated, prefill }: AddTaskFormProps) {
  const { loading, submitDisabled, handleSubmit } = useAddTaskForm({
    onClose,
    onTaskCreated,
  });

  return (
    <Formik<FormValues>
      initialValues={{
        name: "",
        description: "",
        category: "" as TaskCategory,
        frequency: "" as TaskFrequency,
        dateUntil: "",
        durationMinutes: null,
        startDate: "",
        startTimeOfDay: "",
        startTime: null,
        projectId: "",
        ...prefill,
      }}
      onSubmit={async (values, formikHelpers) => {
        await handleSubmit(values);

        // Cache nach erfolgreichem Erstellen entfernen
        localStorage.removeItem(CACHE_KEY);

        formikHelpers.resetForm();
      }}
      validationSchema={taskValidationSchema}
      enableReinitialize
    >
      {({
        values,
        setValues,
        handleChange,
        handleSubmit: formikHandleSubmit,
        handleBlur,
        errors,
        touched,
      }) => {
        const { clearCache } = useFormCache(
          CACHE_KEY,
          values,
          setValues
        );

        return (
          <AppDialog
            open
            onClose={onClose}
            onSubmit={formikHandleSubmit}
            loading={loading}
            submitDisabled={submitDisabled}
          >
            <h2 className="mb-2 text-lg font-bold">
              Neue Aufgabe hinzufügen
            </h2>

            <Separator className="flex" />
          <Button
                variant="link"
                className="text-sm text-gray-500 hover:text-gray-700 flex flex-col items-end "
                onClick={() => {
                  clearCache();

                  setValues({
                    name: "",
                    description: "",
                    category: "",
                    frequency: "",
                    dateUntil: "",
                    durationMinutes: null,
                    startDate: "",
                    startTimeOfDay: "",
                    startTime: null,
                    projectId: "",
                  });
                }}
              >
            Reset              
            </Button>

            <Form
              onSubmit={formikHandleSubmit}
              values={values}
              handleChange={handleChange}
              handleBlur={handleBlur}
              errors={errors}
              touched={touched}
            />
          </AppDialog>
        );
      }}
    </Formik>
  );
}

export default AddTaskForm;