import { useState } from "react";
import { forgotPassword } from "@/services/authService";

export type ForgotPasswordFormValues = {
    email: string;
};

function useForgotPasswordForm() {
    const [backendError, setBackendError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [submitDisabled, setSubmitDisabled] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState<string | undefined>(undefined);

    const handleSubmit = async (values: ForgotPasswordFormValues) => {
        setLoading(true);
        setSubmitDisabled(true);
        setBackendError(undefined);

        try {
            await forgotPassword(values);
            // Immer die gleiche "Prüfe deine E-Mails"-Bestätigung, unabhängig davon,
            // ob das Konto existiert - der Backend-Endpoint ist bewusst enumeration-safe.
            setSubmittedEmail(values.email);
        } catch (error) {
            setBackendError(
                error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten"
            );
        } finally {
            setLoading(false);
            setSubmitDisabled(false);
        }
    };

    return { handleSubmit, backendError, loading, submitDisabled, submittedEmail };
}

export { useForgotPasswordForm };
