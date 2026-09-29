"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ErrorPage from "@/components/pages/ErrorPage";

// Stabile Codes vom Backend (OAuth2ErrorCode, #236) statt Klartext - so kann
// jeder Fall auf den passenden nächsten Schritt verweisen.
const OAUTH_ERRORS: Record<string, { status: number; message: string; buttonText: string; target: string }> = {
  ACCOUNT_ALREADY_EXISTS: {
    status: 409,
    message: "Account existiert bereits, bitte einloggen.",
    buttonText: "Zum Login",
    target: "/login",
  },
  LINK_DECLINED: {
    status: 409,
    message: "Account mit dieser E-Mail existiert bereits, bitte verknüpfen oder andere E-Mail verwenden.",
    buttonText: "Zurück zur Registrierung",
    target: "/register",
  },
};

function OAuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const known = OAUTH_ERRORS[searchParams.get("code") ?? ""];

  if (known) {
    return (
      <ErrorPage
        errorCode={known.status}
        errorMessage={known.message}
        buttonText={known.buttonText}
        resetErrorBoundary={() => router.push(known.target)}
      />
    );
  }

  return (
    <ErrorPage
      errorCode={401}
      errorMessage={searchParams.get("message") ?? "Google-Login fehlgeschlagen."}
      buttonText="Zurück zum Login"
      resetErrorBoundary={() => router.push("/login")}
    />
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <OAuthErrorPage />
    </Suspense>
  );
}
