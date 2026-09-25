import { useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Formik, Form } from "formik";
import * as yup from "yup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup } from "@/components/ui/field";
import FormPasswordField from "@/components/molecules/form/FormPasswordField";
import LoadingButton from "@/components/atoms/loading/LoadingButton";
import { useResetPasswordForm, type ResetPasswordFormValues } from "@/hooks/useResetPasswordForm";

const resetPasswordSchema = yup.object().shape({
    newPassword: yup.string().min(8, "Muss mindestens 8 Zeichen lang sein").required("Passwort ist erforderlich"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("newPassword")], "Passwörter stimmen nicht überein")
        .required("Bitte bestätige dein Passwort"),
});

function ResetPasswordPage() {
    const { handleSubmit, backendError, loading, submitDisabled, submitted, token, router } =
        useResetPasswordForm();

    useEffect(() => {
        if (!token) {
            router.replace("/forgot-password");
        }
    }, [token, router]);

    if (!token) {
        return null;
    }

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-background px-4 py-8">
            <Card className="w-full max-w-sm border-none shadow-lg">
                {submitted ? (
                    <CardHeader className="flex flex-col items-center gap-3 text-center pb-2">
                        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                            <CheckCircle2 className="size-7 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-semibold tracking-tight">
                            Passwort zurückgesetzt
                        </CardTitle>
                        <CardDescription className="text-base text-muted-foreground">
                            Dein Passwort wurde erfolgreich geändert. Du kannst dich jetzt mit
                            deinem neuen Passwort anmelden.
                        </CardDescription>
                        <Button className="w-full font-semibold" onClick={() => router.push("/login")}>
                            Zum Login
                        </Button>
                    </CardHeader>
                ) : (
                    <CardContent className="p-6">
                        <Formik<ResetPasswordFormValues>
                            initialValues={{ newPassword: "", confirmPassword: "" }}
                            validationSchema={resetPasswordSchema}
                            onSubmit={handleSubmit}
                        >
                            {({ values, handleChange, handleBlur, errors, touched }) => (
                                <Form className="flex flex-col gap-6">
                                    <FieldGroup>
                                        <div className="flex flex-col items-center gap-1 text-center">
                                            <h1 className="text-2xl font-bold">Neues Passwort</h1>
                                            <p className="text-sm text-balance text-muted-foreground">
                                                Wähle ein neues Passwort für dein Konto
                                            </p>
                                        </div>

                                        {backendError && (
                                            <Alert variant="destructive">
                                                <AlertCircle />
                                                <AlertDescription className="flex flex-col gap-2">
                                                    {backendError}
                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        className="p-0 self-start"
                                                        onClick={() => router.push("/forgot-password")}
                                                    >
                                                        Neuen Link anfordern
                                                    </Button>
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <FormPasswordField
                                            name="newPassword"
                                            label="Neues Passwort"
                                            value={values.newPassword}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={
                                                (touched.newPassword || values.newPassword.length > 0) &&
                                                !!errors.newPassword
                                            }
                                            helperText={
                                                touched.newPassword || values.newPassword.length > 0
                                                    ? errors.newPassword
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

                                        <Field>
                                            <LoadingButton
                                                type="submit"
                                                className="w-full font-semibold"
                                                loading={loading}
                                                disabled={submitDisabled}
                                            >
                                                Passwort speichern
                                            </LoadingButton>
                                        </Field>
                                    </FieldGroup>
                                </Form>
                            )}
                        </Formik>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

export default ResetPasswordPage;
