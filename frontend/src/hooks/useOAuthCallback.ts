import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { exchangeOAuth2Token } from "@/services/authService";

type OAuthCallbackStatus = "loading" | "error";

export function useOAuthCallback() {
    const router = useRouter();
    const { completeOAuthLogin } = useAuth();

    const [status, setStatus] = useState<OAuthCallbackStatus>("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        // Der Handoff-Token kommt nicht mehr aus der URL, sondern aus einem
        // HttpOnly-Cookie, das der OAuth2-Redirect gesetzt hat - siehe
        // authService.exchangeOAuth2Token.
        exchangeOAuth2Token()
            .then((response) => completeOAuthLogin(response.token))
            .then(() => router.replace("/"))
            .catch((err) => {
                setStatus("error");
                setErrorMessage(err instanceof Error ? err.message : "Google-Login fehlgeschlagen.");
            });
    }, [completeOAuthLogin, router]);

    return { status, errorMessage };
}