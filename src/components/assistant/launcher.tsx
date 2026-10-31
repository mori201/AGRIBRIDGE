"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Maximize2, Sparkles, X } from "lucide-react";
import { Chat } from "./chat";

export function AssistantLauncher({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);
  if (path.startsWith("/expert/assistant")) return null;
  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 px-4 text-white shadow-lg shadow-brand-900/30 transition hover:scale-105 lg:bottom-6"
        aria-label="Ouvrir l'assistant IA AgriBridge"
        aria-expanded={open}
      >
        <Sparkles className="h-5 w-5 text-gold-300" />
        <span className="hidden text-sm font-semibold sm:inline">Assistant IA</span>
      </button>
      {open && (
        <div role="dialog" aria-label="Assistant IA AgriBridge" className="surface fixed inset-x-2 bottom-20 z-50 flex h-[75dvh] animate-fade-in flex-col overflow-hidden rounded-2xl border border-base shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[400px] lg:bottom-24">
          <div className="flex items-center justify-between bg-brand-800 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold-300" />
              <div>
                <p className="text-sm font-bold">Assistant AgriBridge</p>
                <p className="text-[11px] text-brand-100">Français · Wolof · English</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/expert/assistant" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10" aria-label="Ouvrir en plein écran" onClick={() => setOpen(false)}>
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <Chat loggedIn={loggedIn} compact />
        </div>
      )}
    </>
  );
}
