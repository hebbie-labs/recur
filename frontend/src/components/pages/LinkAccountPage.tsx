import { AlertCircle, Link2 } from "lucide-react";
import { Formik, Form } from "formik";
import * as yup from "yup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup } from "@/components/ui/field";
import FormPasswordField from "@/components/molecules/form/FormPasswordField";
import AuthStatusCard from "@/components/molecules/auth/AuthStatusCard";
import LoadingButton from "@/components/atoms/loading/LoadingButton";
import {
  useLinkAccount,
  type LinkAccountFormValues,
} from "@/hooks/useLinkAccount";
import type { AuthProviderType } from "@/types/auth";

const PROVIDER_LABELS: Record<AuthProviderType, string> = {
  LOCAL: "Recur",
  GOOGLE: "Google",
  GITHUB: "GitHub",
};

const passwordSchema = yup.object().shape({
  password: yup.string().required("Passwort ist erforderlich"),
});

function LinkAccountPage() {
  const {
    status,
    linkInfo,
    loadError,
    backendError,
    loading,
    handleConfirm,
    handleDecline,
    router,
  } = useLinkAccount();

  if (status === "loading") {
    return (
      <AuthStatusCard
        status="loading"
        title="Einen Moment…"
        description="Verknüpfungsanfrage wird geladen."
      />
    );
  }

  if (status === "error" || !linkInfo) {
    return (
      <AuthStatusCard
        status="error"
        title="Verknüpfung nicht möglich"
        description={
          loadError ??
          "Die Verknüpfungsanfrage ist abgelaufen. Bitte melde dich erneut an."
        }
        action={{
          label: "Zurück zum Login",
          onClick: () => router.push("/login"),
        }}
      />
    );
  }

  const providerLabel = PROVIDER_LABELS[linkInfo.provider];

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-background px-4 py-8">
      <Card className="w-full max-w-sm border-none shadow-lg">
        <CardContent className="p-6">
          <Formik<LinkAccountFormValues>
            initialValues={{ password: "" }}
            validationSchema={
              linkInfo.passwordRequired ? passwordSchema : undefined
            }
            onSubmit={handleConfirm}
          >
            {({ values, handleChange, handleBlur, errors, touched }) => (
              <Form className="flex flex-col gap-6">
                <FieldGroup>
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                      <Link2 className="size-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Konto verknüpfen?</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                      Es gibt bereits ein Recur-Konto mit{" "}
                      <span className="font-medium text-foreground">
                        {linkInfo.email}
                      </span>
                      .{" "}
                      {linkInfo.passwordRequired
                        ? `Gib das Passwort dieses Kontos ein, um dein ${providerLabel}-Konto damit zu verknüpfen.`
                        : `Möchtest du dein ${providerLabel}-Konto damit verknüpfen?`}
                    </p>
                  </div>

                  {backendError && (
                    <Alert variant="destructive">
                      <AlertCircle />
                      <AlertDescription>{backendError}</AlertDescription>
                    </Alert>
                  )}

                  {linkInfo.passwordRequired && (
                    <div className="flex flex-col gap-1">
                      <FormPasswordField
                        name="password"
                        label="Passwort"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={!!touched.password && !!errors.password}
                        helperText={
                          touched.password ? errors.password : undefined
                        }
                      />
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 self-end"
                        onClick={() => router.push("/forgot-password")}
                      >
                        Passwort vergessen?
                      </Button>
                    </div>
                  )}

                  <Field>
                    <LoadingButton
                      type="submit"
                      className="w-full font-semibold"
                      loading={loading}
                    >
                      Verknüpfen
                    </LoadingButton>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                      onClick={handleDecline}
                    >
                      Abbrechen
                    </Button>
                  </Field>
                </FieldGroup>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
}

export default LinkAccountPage;
