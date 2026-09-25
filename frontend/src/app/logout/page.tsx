"use client";

import { Suspense } from "react";
import LogoutPage from "@/components/pages/LogoutPage";
import AuthPageFallback from "@/components/molecules/auth/AuthPageFallback";

export default function LogoutRoutePage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <LogoutPage />
    </Suspense>
  );
}
