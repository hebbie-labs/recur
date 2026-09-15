import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import DarkModeToggle from "@/components/atoms/DarkModeToggle";

function AppSidebarUserMenu() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <DropdownMenuContent align="end" sideOffset={8} className="min-w-48">
      <DropdownMenuItem onClick={() => router.push("/setting/account")}>
        <User className="h-4 w-4" />
        Account
      </DropdownMenuItem>
      <DarkModeToggle />
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={logout}>
        <LogOut className="h-4 w-4" />
        Abmelden
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export default AppSidebarUserMenu;
