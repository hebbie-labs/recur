import { Formik, Form as FormikForm } from "formik";
import * as yup from "yup";
import AppDialog from "@/components/molecules/dialog/AppDialog";
import FormTextField from "@/components/molecules/form/FormTextField";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useGroupsContext } from "@/contexts/GroupsContext";
import type { Group } from "@/services/groupService";

type CreateGroupDialogProps = {
  onClose: () => void;
  onCreated?: (group: Group) => void;
};

const validationSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, "Name muss mindestens 2 Zeichen lang sein")
    .max(60, "Name darf maximal 60 Zeichen lang sein")
    .required("Name ist erforderlich"),
});

function CreateGroupDialog({ onClose, onCreated }: CreateGroupDialogProps) {
  const { createGroup } = useGroupsContext();

  return (
    <Formik
      initialValues={{ name: "" }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          const group = await createGroup(values.name.trim());
          showSuccessToast("Gruppe erfolgreich erstellt.");
          onCreated?.(group);
          onClose();
        } catch (err) {
          showErrorToast(
            err instanceof Error ? err.message : "Fehler beim Erstellen der Gruppe."
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
          title="Neue Gruppe erstellen"
          onSubmit={() => handleSubmit()}
          loading={isSubmitting}
          submitDisabled={isSubmitting}
          submitLabel="Erstellen"
        >
          <FormikForm onSubmit={handleSubmit}>
            <FormTextField
              name="name"
              label="Gruppenname"
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

export default CreateGroupDialog;
