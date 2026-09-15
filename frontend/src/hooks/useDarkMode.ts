import { useState } from "react";

function useDarkMode() {
  // The blocking inline script in src/app/layout.tsx already set the
  // "dark" class on <html> before this component ever rendered client-side
  // - just read it back instead of re-deriving from localStorage/matchMedia
  // and flipping state in an effect (that's what caused the load-time flash
  // this replaces). typeof-guard keeps this safe if ever rendered ahead of
  // that script for some reason (e.g. during SSR).
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  const toggleDark = (pressed: boolean) => {
    setIsDark(pressed);
    document.documentElement.classList.toggle("dark", pressed);
    localStorage.setItem("theme", pressed ? "dark" : "light");
  };

  return { isDark, toggleDark };
}

export default useDarkMode;
