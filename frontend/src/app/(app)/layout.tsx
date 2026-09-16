"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DefaultLayout from "@/components/templates/DefaultLayout";

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Deine Aufgaben";
  if (pathname === "/favorites") return "Deine Favoriten";
  if (pathname === "/calendar") return "Dein Kalender";
  if (pathname === "/archive") return "Dein Archiv";
  if (pathname === "/groups") return "Deine Gruppen";
  if (pathname.startsWith("/groups/join/")) return "Gruppe beitreten";
  if (pathname.startsWith("/groups/")) return "Gruppendetails";
  if (pathname === "/setting/privacy") return "Privatsphäre";
  if (pathname === "/setting/appearance") return "Erscheinungsbild";
  if (pathname === "/setting/account") return "Account";
  if (pathname === "/setting/notifications") return "Benachrichtigungen";
  return "";
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <DefaultLayout pageTitle={getPageTitle(pathname)}>
        {children}
      </DefaultLayout>
    </ProtectedRoute>
  );
}
