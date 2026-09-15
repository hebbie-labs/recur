import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type OAuthCallbackStatus = "loading" | "error";

export function useOAuthCallback() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { completeOAuthLogin } = useAuth();

    const token = searchParams.get("token");

    const [status, setStatus] = useState<OAuthCallbackStatus>(token ? "loading" : "error");
    const [errorMessage, setErrorMessage] = useState<string | null>(
        token ? null : "Kein Token in der Antwort von Google erhalten."
    );

    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        if (!token) return;

        completeOAuthLogin(token)
            .then(() => router.replace("/"))
            .catch((err) => {
                setStatus("error");
                setErrorMessage(err instanceof Error ? err.message : "Google-Login fehlgeschlagen.");
            });
    }, [token, completeOAuthLogin, router]);

    return { status, errorMessage };
}