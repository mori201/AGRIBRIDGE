"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("agb-theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button onClick={toggle} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-[var(--surface-2)]" aria-label={dark ? "Activer le mode clair" : "Activer le mode sombre"}>
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

/** Script inline anti-flash : applique le thème avant le premier rendu. */
export const themeScript = `try{var t=localStorage.getItem('agb-theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}`;
