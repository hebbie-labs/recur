import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { RegisterRequest } from "@/types/auth";

export type SignupFormValues = RegisterRequest & {
    confirmPassword: string;
    acceptTerms: boolean;
};

function useSignUpForm() {
    const { register } = useAuth();

    const [backendError, setBackendError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [submitDisabled, setSubmitDisabled] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState<string | undefined>(undefined);

    const handleSubmit = async (values: SignupFormValues) => {
        setLoading(true);
        setSubmitDisabled(true);
        setBackendError(undefined);

        try {
            const { confirmPassword, acceptTerms, ...request } = values;
            void confirmPassword;
            void acceptTerms;
            await register(request);
            // Kein Login mehr nach der Registrierung - das Konto muss erst per
            // E-Mail bestätigt werden. Statt einer Weiterleitung zeigt die Seite
            // jetzt einen "Bestätige deine E-Mail"-Hinweis an.
            setSubmittedEmail(request.email);
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

export { useSignUpForm };