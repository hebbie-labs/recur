import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/services/authService";

export type ResetPasswordFormValues = {
    newPassword: string;
    confirmPassword: string;
};

function useResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [backendError, setBackendError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [submitDisabled, setSubmitDisabled] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (values: ResetPasswordFormValues) => {
        if (!token) return;

        setLoading(true);
        setSubmitDisabled(true);
        setBackendError(undefined);

        try {
            await resetPassword({ token, newPassword: values.newPassword });
            setSubmitted(true);
        } catch (error) {
            setBackendError(
                error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten"
            );
        } finally {
            setLoading(false);
            setSubmitDisabled(false);
        }
    };

    return { handleSubmit, backendError, loading, submitDisabled, submitted, token, router };
}

export { useResetPasswordForm };
