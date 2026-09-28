import AuthStatusCard from "./AuthStatusCard";

/** Suspense-Fallback für Routen, deren Seite selbst AuthStatusCard zeigt (useSearchParams() erzwingt eine Suspense-Grenze) - gleiche Kartenform wie der Inhalt danach, damit kein zweiter, andersartiger Spinner aufblitzt. */
function AuthPageFallback() {
  return (
    <AuthStatusCard status="loading" title="Wird geladen…" description="Einen Moment bitte." />
  );
}

export default AuthPageFallback;
