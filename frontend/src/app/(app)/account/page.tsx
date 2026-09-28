"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import AccountPage from "@/components/pages/AccountPage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Dein Account konnte nicht angezeigt werden."
      fullScreen={false}
    >
      <AccountPage />
    </ReactErrorBoundary>
  );
}
