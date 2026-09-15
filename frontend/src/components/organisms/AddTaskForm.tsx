import { ChevronRight, RotateCcw } from "lucide-react";
import { Formik, type FormikProps } from "formik";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Task, TaskCategory, TaskFrequency } from "@/services/taskService";
import useAddTaskForm from "@/hooks/useAddTaskForm";
import useFormCache from "@/hooks/useFormCache";
import AppDialog from "@/components/molecules/AppDialog";
import { taskValidationSchema } from "@/schemas/taskSchema";
import {
  TaskBasicsFields,
  TaskDetailFields,
  type FormValues,
} from "@/components/organisms/Form";

import type { AddTaskPrefill } from "@/contexts/AddTaskContext";

type AddTaskFormProps = {
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
  prefill?: AddTaskPrefill;
};

const CACHE_KEY = "add-task-form";

// Kategorie/Frequenz sind vorbelegt statt Pflichtfelder - der Nutzer muss sie
// nur anfassen, wenn der Default nicht passt (siehe #65).
const INITIAL_VALUES: FormValues = {
  name: "",
  description: "",
  category: "OTHER" as TaskCategory,
  frequency: "ONCE" as TaskFrequency,
  dateUntil: "",
  durationMinutes: null,
  startDate: "",
  startTimeOfDay: "",
  projectId: "",
};

function AddTaskForm({ onClose, onTaskCreated, prefill }: AddTaskFormProps) {
  const { loading, submitDisabled, handleSubmit } = useAddTaskForm({
    onClose,
    onTaskCreated,
  });

  return (
    <Formik<FormValues>
      initialValues={{
        ...INITIAL_VALUES,
        ...prefill,
      }}
      onSubmit={async (values, formikHelpers) => {
        const created = await handleSubmit(values);
        if (!created) return;

        // Cache nach erfolgreichem Erstellen entfernen
        localStorage.removeItem(CACHE_KEY);

        formikHelpers.resetForm();
      }}
      validationSchema={taskValidationSchema}
      enableReinitialize
    >
      {(formik) => (
        <AddTaskFormFields
          formik={formik}
          onClose={onClose}
          loading={loading}
          submitDisabled={submitDisabled}
        />
      )}
    </Formik>
  );
}

// Formik's render-prop callback above isn't a component React tracks hook
// order for, so useFormCache (a hook) can't be called directly inside it -
// this wrapper component is the fix, not just a style preference.
function AddTaskFormFields({
  formik,
  onClose,
  loading,
  submitDisabled,
}: {
  formik: FormikProps<FormValues>;
  onClose: () => void;
  loading: boolean;
  submitDisabled: boolean;
}) {
  const {
    values,
    setValues,
    handleChange,
    handleSubmit: formikHandleSubmit,
    handleBlur,
    errors,
    touched,
  } = formik;

  const { clearCache } = useFormCache(CACHE_KEY, values, setValues);

  const handleReset = () => {
    clearCache();
    setValues(INITIAL_VALUES);
  };

  return (
    <AppDialog
      open
      onClose={onClose}
      onSubmit={() => formikHandleSubmit()}
      loading={loading}
      submitDisabled={submitDisabled}
      submitLabel="Aufgabe erstellen"
    >
      <h2 className="mb-2 pr-16 text-lg font-bold">Neue Aufgabe hinzufügen</h2>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 right-10 text-muted-foreground hover:text-foreground"
              onClick={handleReset}
              aria-label="Formular zurücksetzen"
            >
              <RotateCcw />
            </Button>
          }
        />
        <TooltipContent>Zurücksetzen</TooltipContent>
      </Tooltip>

      <Separator className="mb-3" />

      <form onSubmit={formikHandleSubmit}>
        <TaskBasicsFields
          values={values}
          errors={errors}
          touched={touched}
          handleChange={handleChange}
          handleBlur={handleBlur}
          autoFocusName
        />

        <Collapsible className="group/add-details mt-2">
          <CollapsibleTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start px-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4 transition-transform group-data-open/add-details:rotate-90" />
                Weitere Details
              </Button>
            }
          />
          <CollapsibleContent>
            <TaskDetailFields values={values} />
          </CollapsibleContent>
        </Collapsible>
      </form>
    </AppDialog>
  );
}

export default AddTaskForm;
