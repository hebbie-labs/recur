"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

type ProtectedRouteProps = {
  children: ReactNode;
};

/**
 * Wraps a route that requires authentication.
 * - While the initial auth check is running, shows a loading state
 *   (prevents a flash of the login page for already-logged-in users).
 * - If not authenticated, redirects to /login.
 * - Otherwise renders the protected content.
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;