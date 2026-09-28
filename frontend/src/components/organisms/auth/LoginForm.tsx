import { Form, type FormikTouched, type FormikErrors } from "formik";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import FormTextField from "../../molecules/form/FormTextField";
import LoadingButton from "../../atoms/loading/LoadingButton";
import GoogleLoginButton from "../../atoms/GoogleLoginButton";
import type { LoginRequest } from "@/types/auth";
import type { FormEvent, ChangeEvent, FocusEvent } from "react";
import FormPasswordField from "../../molecules/form/FormPasswordField";
import GitHubLoginButton from "../../atoms/GitHubLoginButton";

type LoginFormProps = {
  navigate: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  values: LoginRequest;
  errors: FormikErrors<LoginRequest>;
  touched: FormikTouched<LoginRequest>;
  className?: string;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleBlur: (
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  loading?: boolean;
  submitDisabled?: boolean;
  backendError?: string;
};

function LoginForm({
  navigate,
  onSubmit,
  values,
  handleChange,
  handleBlur,
  errors,
  touched,
  loading,
  submitDisabled,
  backendError,
}: LoginFormProps) {
  return (
    <Form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Willkommen zurück</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Melde dich bei deinem Konto an
          </p>
        </div>

        {backendError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{backendError}</AlertDescription>
          </Alert>
        )}

        <FormTextField
          name="email"
          label="E-Mail"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={(touched.email || values.email.length > 0) && !!errors.email}
          helperText={
            touched.email || values.email.length > 0 ? errors.email : undefined
          }
        />
        <FormPasswordField
          name="password"
          label="Passwort"
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

        <FieldDescription className="self-end text-right text-xs">
          Passwort vergessen? Diese Funktion ist aktuell vorübergehend nicht
          verfügbar.
        </FieldDescription>

        <Field>
          <LoadingButton
            type="submit"
            className="w-full font-semibold"
            loading={loading}
            disabled={submitDisabled}
          >
            Anmelden
          </LoadingButton>
        </Field>

        <FieldSeparator>Oder weiter mit</FieldSeparator>

        <Field>
          <GoogleLoginButton />
          <GitHubLoginButton />
          <FieldDescription className="px-6 text-center">
            Noch kein Konto?{" "}
            <Button variant="link" onClick={navigate} className="p-0">
              Registrieren
            </Button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </Form>
  );
}

export default LoginForm;
