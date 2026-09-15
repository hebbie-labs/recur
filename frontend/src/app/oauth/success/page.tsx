"use client";

import { Suspense } from "react";
import OAuthCallbackPage from "@/components/pages/OAuthCallbackPage";
import { Spinner } from "@/components/ui/spinner";

export default function OAuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      }
    >
      <OAuthCallbackPage />
    </Suspense>
  );
}
