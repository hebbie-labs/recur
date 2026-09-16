import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import LoadingButton from "@/components/atoms/LoadingButton";
import { resendVerification } from "@/services/authService";

type ResendVerificationFormProps = {
  /**
   * Bekannte E-Mail-Adresse (z.B. gerade blockierter Login) - wenn gesetzt,
   * wird kein Eingabefeld angezeigt, nur der Button. Ohne Adresse (z.B.
   * abgelaufener Link ohne Kontext) fragt das Formular sie selbst ab.
   */
  email?: string;
  className?: string;
};

function ResendVerificationForm({ email, className }: ResendVerificationFormProps) {
  const [inputEmail, setInputEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const targetEmail = email ?? inputEmail;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
    <form onSubmit={handleSubmit} className={className ? className + " flex flex-col gap-2" : "flex flex-col gap-2"}>
      {!email && (
        <Input
          type="email"
          placeholder="E-Mail"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          required
        />
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <LoadingButton
        type="submit"
        variant="outline"
        size="sm"
        loading={loading}
        disabled={!targetEmail}
      >
        Bestätigungs-E-Mail erneut senden
      </LoadingButton>
    </form>
  );
}

export default ResendVerificationForm;
