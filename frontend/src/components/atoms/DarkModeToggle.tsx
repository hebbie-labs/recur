import { Moon, Sun } from "lucide-react";
import useDarkMode from "@/hooks/useDarkMode";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

function DarkModeToggle() {
  const { isDark, toggleDark } = useDarkMode();

  return (
    <DropdownMenuItem onClick={() => toggleDark(!isDark)}>
      {isDark ? (
        <>
          <Moon className="h-4 w-4" />
          <span>Dark Mode</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          <span>Light Mode</span>
        </>
      )}
    </DropdownMenuItem>
  );
}

export default DarkModeToggle;
