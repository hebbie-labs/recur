"use client";

import { Suspense } from "react";
import ResetPasswordPage from "@/components/pages/ResetPasswordPage";
import AuthPageFallback from "@/components/molecules/auth/AuthPageFallback";

export default function ResetPasswordRoute() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
