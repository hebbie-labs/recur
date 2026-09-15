import { useState } from "react";
import { useRouter } from "next/navigation";
import { type LoginRequest } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";

function useLoginForm() {
  const [backendError, setBackendError] = useState<string | undefined>(
    undefined
  );
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (values: LoginRequest) => {
    setLoading(true);
    setBackendError(undefined);
    setSubmitDisabled(true);

    try {
      await login(values);
      router.replace("/");
    } catch (error) {
      setBackendError(
        error instanceof Error
          ? error.message
          : "Ein unbekannter Fehler ist aufgetreten"
      );
    } finally {
      setLoading(false);
      setSubmitDisabled(false);
    }
  };

  return { handleSubmit, backendError, loading, submitDisabled };
}

export { useLoginForm };
