"use client";

import { Suspense } from "react";
import VerifyEmailPage from "@/components/pages/VerifyEmailPage";
import { Spinner } from "@/components/ui/spinner";

export default function VerifyEmailRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      }
    >
      <VerifyEmailPage />
    </Suspense>
  );
}
