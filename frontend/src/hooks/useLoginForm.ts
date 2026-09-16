import { useState } from "react";
import { useRouter } from "next/navigation";
import { type LoginRequest } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";
import { EmailNotVerifiedError } from "@/services/authService";

function useLoginForm() {
  const [backendError, setBackendError] = useState<string | undefined>(
    undefined
  );
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | undefined>(undefined);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (values: LoginRequest) => {
    setLoading(true);
    setBackendError(undefined);
    setUnverifiedEmail(undefined);
    setSubmitDisabled(true);

    try {
      await login(values);
      router.replace("/");
    } catch (error) {
      if (error instanceof EmailNotVerifiedError) {
        setBackendError(error.message);
        setUnverifiedEmail(values.email);
      } else {
        setBackendError(
          error instanceof Error
            ? error.message
            : "Ein unbekannter Fehler ist aufgetreten"
        );
      }
    } finally {
      setLoading(false);
      setSubmitDisabled(false);
    }
  };

  return { handleSubmit, backendError, unverifiedEmail, loading, submitDisabled };
}

export { useLoginForm };
