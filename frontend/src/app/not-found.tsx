"use client";

import { useRouter } from "next/navigation";
import ErrorPage from "@/components/pages/ErrorPage";

export default function NotFound() {
  const router = useRouter();
  return (
    <ErrorPage
      errorCode={404}
      errorMessage="Seite nicht gefunden"
      buttonText="Zurück zur Startseite"
      resetErrorBoundary={() => router.push("/")}
    />
  );
}
