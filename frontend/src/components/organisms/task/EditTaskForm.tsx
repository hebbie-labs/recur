import { ChevronRight } from "lucide-react";
import { Formik } from "formik";
import type { Task, TaskCategory, TaskFrequency } from "@/types/task";
import AppDialog from "@/components/molecules/dialog/AppDialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { editTaskValidationSchema } from "@/schemas/taskSchema";
import {
  TaskBasicsFields,
  TaskDetailFields,
} from "@/components/organisms/task/Form";
import useEditTaskForm, {
  type EditableTaskFields,
} from "@/hooks/useEditTaskForm";

type EditTaskFormProps = {
  task: Task;
  onClose: () => void;
  onTaskUpdated?: (task: Task) => void;
};

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
        category: task.category ?? ("" as TaskCategory),
        frequency: task.frequency ?? ("" as TaskFrequency),
        progress: task.progress ?? 0,
        dateUntil: task.dateUntil ? task.dateUntil.slice(0, 10) : "",
        durationMinutes: task.durationMinutes ?? null,
        startDate: localStartDate,
        startTimeOfDay: localStartTime,
        projectId: task.project?.id ?? "",
        reminderLeadTime: task.reminderLeadTime ?? "",
      }}
      onSubmit={handleSubmit}
      validationSchema={editTaskValidationSchema}
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
          <form onSubmit={formikHandleSubmit}>
            <TaskBasicsFields
              values={values}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />

            <Collapsible className="group/edit-details mt-2">
              <CollapsibleTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start px-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4 transition-transform group-data-open/edit-details:rotate-90" />
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
      )}
    </Formik>
  );
}

export default EditTaskForm;
