"use client";

import { Suspense } from "react";
import OAuthCallbackPage from "@/components/pages/OAuthCallbackPage";
import AuthPageFallback from "@/components/molecules/auth/AuthPageFallback";

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <OAuthCallbackPage />
    </Suspense>
  );
}
