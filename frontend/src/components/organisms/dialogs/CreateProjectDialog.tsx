import { Formik, Form as FormikForm } from "formik";
import * as yup from "yup";
import AppDialog from "@/components/molecules/dialog/AppDialog";
import FormTextField from "@/components/molecules/form/FormTextField";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useGroupsContext } from "@/contexts/GroupsContext";

type CreateProjectDialogProps = {
  groupId: string;
  onClose: () => void;
};

const validationSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, "Name muss mindestens 2 Zeichen lang sein")
    .max(60, "Name darf maximal 60 Zeichen lang sein")
    .required("Name ist erforderlich"),
});

function CreateProjectDialog({ groupId, onClose }: CreateProjectDialogProps) {
  const { createProject } = useGroupsContext();

  return (
    <Formik
      initialValues={{ name: "" }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          await createProject(groupId, values.name.trim());
          showSuccessToast("Projekt erfolgreich erstellt.");
          onClose();
        } catch (err) {
          showErrorToast(
            err instanceof Error ? err.message : "Fehler beim Erstellen des Projekts."
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, handleChange, handleBlur, handleSubmit, errors, touched, isSubmitting }) => (
        <AppDialog
          open
          onClose={onClose}
          title="Neues Projekt erstellen"
          onSubmit={() => handleSubmit()}
          loading={isSubmitting}
          submitDisabled={isSubmitting}
          submitLabel="Erstellen"
        >
          <FormikForm onSubmit={handleSubmit}>
            <FormTextField
              name="name"
              label="Projektname"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.name && !!errors.name}
              helperText={touched.name ? errors.name : undefined}
            />
          </FormikForm>
        </AppDialog>
      )}
    </Formik>
  );
}

export default CreateProjectDialog;
