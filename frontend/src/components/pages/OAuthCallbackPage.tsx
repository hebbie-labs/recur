import { useRouter } from "next/navigation";
import AuthStatusCard from "@/components/molecules/auth/AuthStatusCard";
import { useOAuthCallback } from "@/hooks/useOAuthCallback";

function OAuthCallbackPage() {
    const { status, errorMessage } = useOAuthCallback();
    const router = useRouter();

    return (
        <AuthStatusCard
            status={status}
            title={status === "error" ? "Anmeldung fehlgeschlagen" : "Anmeldung läuft…"}
            description={
                status === "error"
                    ? errorMessage ?? "Beim Google-Login ist ein Fehler aufgetreten."
                    : "Du wirst gleich weitergeleitet."
            }
            action={
                status === "error"
                    ? { label: "Zurück zum Login", onClick: () => router.push("/login") }
                    : undefined
            }
        />
    );
}

export default OAuthCallbackPage;
