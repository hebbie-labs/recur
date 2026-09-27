"use client";

import { Suspense } from "react";
import VerifyEmailPage from "@/components/pages/VerifyEmailPage";
import AuthPageFallback from "@/components/molecules/auth/AuthPageFallback";

export default function VerifyEmailRoute() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <VerifyEmailPage />
    </Suspense>
  );
}
