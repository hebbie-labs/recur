import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { revokeRefreshToken } from "@/services/authService";

const REDIRECT_DELAY_MS = 1200;

/** Revokes the session and holds on this page briefly so the user actually sees why they're being sent to /login, instead of an instant, silent redirect (#145); access/refresh-token cookies are cleared server-side by /auth/logout itself (#160). */
export function useLogoutRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const expired = searchParams.get("reason") === "expired";

    useEffect(() => {
        revokeRefreshToken();
        const timer = setTimeout(() => router.replace("/login"), REDIRECT_DELAY_MS);
        return () => clearTimeout(timer);
    }, [router]);

    return {
        title: expired ? "Sitzung abgelaufen" : "Abmeldung läuft…",
        description: "Du wirst weitergeleitet.",
    };
}
