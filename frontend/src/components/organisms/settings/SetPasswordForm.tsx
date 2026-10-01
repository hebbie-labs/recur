import { AlertCircle } from "lucide-react";
import { Formik, Form } from "formik";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FormPasswordField from "@/components/molecules/form/FormPasswordField";
import LoadingButton from "@/components/atoms/loading/LoadingButton";
import {
  useSetPasswordForm,
  type SetPasswordFormValues,
} from "@/hooks/useSetPasswordForm";

const setPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .min(8, "Muss mindestens 8 Zeichen lang sein")
    .required("Passwort ist erforderlich"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwörter stimmen nicht überein")
    .required("Bitte bestätige dein Passwort"),
});

type SetPasswordFormProps = {
  onSuccess?: () => void;
  /** Zeigt einen zusätzlichen "Später"-Button (Erinnerungs-Dialog). */
  onCancel?: () => void;
};

/** Formular für das erste Passwort eines über Google/GitHub entstandenen Accounts (#236) - genutzt im Erinnerungs-Dialog und auf der Account-Seite. */
function SetPasswordForm({ onSuccess, onCancel }: SetPasswordFormProps) {
  const { handleSubmit, backendError, loading } = useSetPasswordForm(onSuccess);

  return (
    <Formik<SetPasswordFormValues>
      initialValues={{ password: "", confirmPassword: "" }}
      validationSchema={setPasswordSchema}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, handleBlur, errors, touched }) => (
        <Form className="flex flex-col gap-3">
          {backendError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{backendError}</AlertDescription>
            </Alert>
          )}

          <FormPasswordField
            name="password"
            label="Neues Passwort"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={
              (touched.password || values.password.length > 0) &&
              !!errors.password
            }
            helperText={
              touched.password || values.password.length > 0
                ? errors.password
                : undefined
            }
          />
          <FormPasswordField
            name="confirmPassword"
            label="Passwort bestätigen"
            value={values.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={
              (touched.confirmPassword || values.confirmPassword.length > 0) &&
              !!errors.confirmPassword
            }
            helperText={
              touched.confirmPassword || values.confirmPassword.length > 0
                ? errors.confirmPassword
                : undefined
            }
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Später
              </Button>
            )}
            <LoadingButton type="submit" loading={loading}>
              Passwort setzen
            </LoadingButton>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export default SetPasswordForm;
