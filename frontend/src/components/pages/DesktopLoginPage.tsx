import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthStatusCard from "@/components/molecules/auth/AuthStatusCard";

// 32 Byte als Base64url ohne Padding - passt zu DesktopLoginCodeService im
// Backend. Ein Code in anderer Form wird gar nicht erst an die App gereicht.
const CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

// Zwischenstation des Desktop-Logins: Das Backend leitet nach dem
// Provider-Login hierher statt direkt auf recur://, weil der Browser einen
// Sprung auf ein fremdes Protokoll ohne Klick auf der Seite blockiert - und
// ein Service Worker (installierte PWA) eine Weiterleitung auf recur://
// gar nicht erst durchreicht. Der Button liefert den nötigen Klick.
function DesktopLoginPage() {
  const searchParams = useSearchParams();
  // Einmal merken und danach aus der URL entfernen, damit der Code nicht in
  // Adresszeile und Browser-Verlauf stehen bleibt.
  const [code] = useState(() => searchParams.get("code"));
  const hasTriedAutoOpen = useRef(false);
  const isValid = code !== null && CODE_PATTERN.test(code);

  const openApp = () => {
    if (isValid) {
      window.location.href = `recur://auth?code=${code}`;
    }
  };

  useEffect(() => {
    if (!isValid || hasTriedAutoOpen.current) return;
    hasTriedAutoOpen.current = true;
    window.history.replaceState(null, "", "/auth/desktop");
    window.location.href = `recur://auth?code=${code}`;
  }, [isValid, code]);

  if (!isValid) {
    return (
      <AuthStatusCard
        status="error"
        title="Link ungültig"
        description="Bitte starte die Anmeldung in der Recur-App erneut."
      />
    );
  }

  return (
    <AuthStatusCard
      status="loading"
      title="Anmeldung erfolgreich"
      description="Recur sollte sich gleich öffnen. Falls nicht, klicke auf den Button. Danach kannst du dieses Fenster schließen."
      action={{ label: "Recur öffnen", onClick: openApp }}
    />
  );
}

export default DesktopLoginPage;
