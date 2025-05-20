import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const darkModeActive = currentTheme === "dark" || (!currentTheme && prefersDark);

    document.documentElement.setAttribute("data-theme", darkModeActive ? "dark" : "light");
    setIsDark(darkModeActive);
  }, []);

  const handleToggle = () => {
    const newMode = !isDark;
    document.documentElement.setAttribute("data-theme", newMode ? "dark" : "light");
    setIsDark(newMode);
  };

  return (
    <label className="swap swap-rotate p-2 bg-base-200 rounded-full">
      <input
        type="checkbox"
        checked={isDark}
        onChange={handleToggle}
      />
      <Moon className="swap-on w-5 h-5 text-yellow-400" />
      <Sun className="swap-off w-5 h-5 text-gray-800" />
    </label>
  );
}

