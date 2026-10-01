import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { setPassword } from "@/services/authService";

export type SetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

/** Erstes Passwort für einen Account, der bisher nur über Google/GitHub angemeldet war (#236) - aktualisiert danach den User im AuthContext (hasPassword). */
function useSetPasswordForm(onSuccess?: () => void) {
  const { updateUser } = useAuth();

  const [backendError, setBackendError] = useState<string | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: SetPasswordFormValues) => {
    setLoading(true);
    setBackendError(undefined);

    try {
      const updated = await setPassword({ password: values.password });
      updateUser(updated);
      onSuccess?.();
    } catch (error) {
      setBackendError(
        error instanceof Error
          ? error.message
          : "Ein unbekannter Fehler ist aufgetreten",
      );
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, backendError, loading };
}

export { useSetPasswordForm };
