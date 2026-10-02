"use client";

import { Suspense } from "react";
import DesktopLoginPage from "@/components/pages/DesktopLoginPage";

// useSearchParams braucht eine Suspense-Grenze, sonst bricht der Build ab.
export default function DesktopLoginRoute() {
  return (
    <Suspense>
      <DesktopLoginPage />
    </Suspense>
  );
}
