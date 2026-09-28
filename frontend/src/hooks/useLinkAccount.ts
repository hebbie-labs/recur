import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { confirmOAuth2Link, declineOAuth2Link, getOAuth2Link } from "@/services/authService";
import type { OAuth2LinkInfo } from "@/types/auth";

export type LinkAccountFormValues = {
    password: string;
};

type LinkAccountStatus = "loading" | "ready" | "error";

/** Verknüpfungs-Bestätigung nach dem OAuth2-Redirect (#236): die ausstehende Verknüpfung liegt serverseitig im HttpOnly oauth_link_pending-Cookie, hier wird sie nur angezeigt und bestätigt/abgelehnt. */
function useLinkAccount() {
    const router = useRouter();
    const { completeOAuthLogin } = useAuth();

    const [status, setStatus] = useState<LinkAccountStatus>("loading");
    const [linkInfo, setLinkInfo] = useState<OAuth2LinkInfo | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [backendError, setBackendError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        getOAuth2Link()
            .then((info) => {
                setLinkInfo(info);
                setStatus("ready");
            })
            .catch((err) => {
                setLoadError(err instanceof Error ? err.message : "Verknüpfungsanfrage konnte nicht geladen werden");
                setStatus("error");
            });
    }, []);

    const handleConfirm = async (values: LinkAccountFormValues) => {
        setLoading(true);
        setBackendError(undefined);

        try {
            await confirmOAuth2Link(linkInfo?.passwordRequired ? values.password : undefined);
            await completeOAuthLogin();
            router.replace("/");
        } catch (error) {
            setBackendError(
                error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten"
            );
            setLoading(false);
        }
    };

    const handleDecline = async () => {
        setLoading(true);
        await declineOAuth2Link();
        router.replace("/auth/error?code=LINK_DECLINED");
    };

    return { status, linkInfo, loadError, backendError, loading, handleConfirm, handleDecline, router };
}

export { useLinkAccount };
