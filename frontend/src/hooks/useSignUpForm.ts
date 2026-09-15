import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { RegisterRequest } from "@/types/auth";

export type SignupFormValues = RegisterRequest & {
    confirmPassword: string;
    acceptTerms: boolean;
};

function useSignUpForm() {
    const { register } = useAuth();
    const router = useRouter();

    const [backendError, setBackendError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [submitDisabled, setSubmitDisabled] = useState(false);

    const handleSubmit = async (values: SignupFormValues) => {
        setLoading(true);
        setSubmitDisabled(true);
        setBackendError(undefined);

        try {
            const { confirmPassword, acceptTerms, ...request } = values;
            void confirmPassword;
            void acceptTerms;
            await register(request);
            router.replace("/");
        } catch (error) {
            setBackendError(
                error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten"
            );
        } finally {
            setLoading(false);
            setSubmitDisabled(false);
        }
    };

    return { handleSubmit, backendError, loading, submitDisabled };
}

export { useSignUpForm };