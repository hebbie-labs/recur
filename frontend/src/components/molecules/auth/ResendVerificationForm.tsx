import { useState } from "react";
import { Input } from "@/components/ui/input";
import LoadingButton from "@/components/atoms/loading/LoadingButton";
import { resendVerification } from "@/services/authService";

type ResendVerificationFormProps = {
  /** Bekannte E-Mail-Adresse (z.B. gerade blockierter Login) - wenn gesetzt, wird kein Eingabefeld angezeigt, nur der Button; ohne Adresse fragt das Formular sie selbst ab. */
  email?: string;
  className?: string;
};

function ResendVerificationForm({ email, className }: ResendVerificationFormProps) {
  const [inputEmail, setInputEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const targetEmail = email ?? inputEmail;

  // Plain onClick, not a <form onSubmit> - this component is embedded inside
  // LoginForm's own Formik <Form>, and a nested <form> is invalid HTML with
  // undefined submit behavior (observed: it triggered a native full-page
  // reload instead of this handler, wiping the outer form's state).
  const handleSubmit = async () => {
    if (!targetEmail) return;

    setLoading(true);
    setError(undefined);
    try {
      await resendVerification({ email: targetEmail });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten"
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <p className={className ? className + " text-sm text-muted-foreground" : "text-sm text-muted-foreground"}>
        Falls das Konto existiert, haben wir eine neue Bestätigungs-E-Mail gesendet.
      </p>
    );
  }

  return (
    <div className={className ? className + " flex flex-col gap-2" : "flex flex-col gap-2"}>
      {!email && (
        <Input
          type="email"
          placeholder="E-Mail"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          required
        />
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <LoadingButton
        type="button"
        variant="outline"
        size="sm"
        loading={loading}
        disabled={!targetEmail}
        onClick={handleSubmit}
      >
        Bestätigungs-E-Mail erneut senden
      </LoadingButton>
    </div>
  );
}

export default ResendVerificationForm;
