import { Moon, Sun } from "lucide-react";

import { Button } from "./../ui/button";
import { useTheme } from "./themeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme} className="touch-hitbox">
      {theme === "dark" ? (
        <Moon className="h-[1.2rem] w-[1.2rem] scale-0 rotate-90 bg-none transition-all dark:scale-100 dark:rotate-0" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      )}
      <span className="sr-only">Toggle theme (current: {theme})</span>
    </Button>
  );
}
