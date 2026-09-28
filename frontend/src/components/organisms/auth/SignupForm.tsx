import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import GoogleLoginButton from "../../atoms/GoogleLoginButton";
import LoadingButton from "../../atoms/loading/LoadingButton";
import FormTextField from "../../molecules/form/FormTextField";
import FormPasswordField from "../../molecules/form/FormPasswordField";
import {
  Form as FormikForm,
  type FormikTouched,
  type FormikErrors,
} from "formik";
import type { FormEvent, ChangeEvent, FocusEvent } from "react";
import type { SignupFormValues } from "@/hooks/useSignUpForm";
import GitHubLoginButton from "../../atoms/GitHubLoginButton";

type SignupFormProps = {
  navigate: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  values: SignupFormValues;
  errors: FormikErrors<SignupFormValues>;
  touched: FormikTouched<SignupFormValues>;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleBlur: (
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  setFieldValue: (field: string, value: unknown) => void;
  loading?: boolean;
  submitDisabled?: boolean;
  backendError?: string;
};

function SignupForm({
  navigate,
  onSubmit,
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  setFieldValue,
  loading,
  submitDisabled,
  backendError,
}: SignupFormProps) {
  const router = useRouter();
  return (
    <FormikForm className="flex flex-col gap-6" onSubmit={onSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Konto erstellen</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Fülle das Formular aus, um dein Konto zu erstellen
          </p>
        </div>

        {backendError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{backendError}</AlertDescription>
          </Alert>
        )}

        <FormTextField
          name="firstName"
          label="Vorname"
          value={values.firstName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={
            (touched.firstName || values.firstName.length > 0) &&
            !!errors.firstName
          }
          helperText={
            touched.firstName || values.firstName.length > 0
              ? errors.firstName
              : undefined
          }
        />

        <FormTextField
          name="lastName"
          label="Nachname"
          value={values.lastName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={
            (touched.lastName || values.lastName.length > 0) &&
            !!errors.lastName
          }
          helperText={
            touched.lastName || values.lastName.length > 0
              ? errors.lastName
              : undefined
          }
        />

        <FormTextField
          name="email"
          label="E-Mail"
          type="email"
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
              : "Muss mindestens 8 Zeichen lang sein."
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
              : "Bitte bestätige dein Passwort."
          }
        />

        <Field orientation="horizontal">
          <Checkbox
            id="acceptTerms"
            checked={values.acceptTerms}
            onCheckedChange={(checked) =>
              setFieldValue("acceptTerms", checked === true)
            }
            aria-invalid={touched.acceptTerms && !!errors.acceptTerms}
          />
          <label
            htmlFor="acceptTerms"
            className="text-sm text-muted-foreground"
          >
            Ich akzeptiere die{" "}
            <button
              type="button"
              className="text-primary underline underline-offset-4 hover:text-foreground"
              onClick={() => router.push("/datenschutz")}
            >
              Datenschutzerklärung
            </button>{" "}
            und die{" "}
            <button
              type="button"
              className="text-primary underline underline-offset-4 hover:text-foreground"
              onClick={() => router.push("/agb")}
            >
              Nutzungsbedingungen
            </button>
            .
          </label>
        </Field>
        {touched.acceptTerms && (
          <FieldError errors={[{ message: errors.acceptTerms }]} />
        )}

        <Field>
          <LoadingButton
            type="submit"
            className="w-full font-semibold"
            loading={loading}
            disabled={submitDisabled}
          >
            Konto erstellen
          </LoadingButton>
        </Field>

        <FieldSeparator>Oder weiter mit</FieldSeparator>

        <Field>
          <GoogleLoginButton />
          <GitHubLoginButton />
          <FieldDescription className="px-6 text-center">
            Bereits ein Konto?{" "}
            <Button variant="link" onClick={navigate} className="p-0">
              Anmelden
            </Button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </FormikForm>
  );
}

export default SignupForm;
