"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ErrorPage from "@/components/pages/ErrorPage";

function OAuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
