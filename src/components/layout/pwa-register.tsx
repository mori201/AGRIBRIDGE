"use client";
import { useEffect, useState } from "react";
import { Download, WifiOff, X } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PwaRegister() {
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    try {
      setDismissed(localStorage.getItem("agb-install-dismissed") === "1");
    } catch {
      setDismissed(false);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BIPEvent);
    };
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <>
      {offline && (
        <div className="fixed inset-x-0 top-16 z-50 mx-auto flex w-fit items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg" role="status">
          <WifiOff className="h-4 w-4" /> Hors connexion — les pages déjà consultées restent disponibles.
        </div>
      )}
      {installEvt && !dismissed && (
        <div className="surface fixed bottom-20 left-4 right-4 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-base p-3 shadow-xl lg:bottom-6 lg:left-6 lg:right-auto">
          <Download className="h-5 w-5 shrink-0 text-brand-700" />
          <p className="flex-1 text-sm">Installez AgriBridge sur votre écran d&apos;accueil.</p>
          <button
            className="rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white"
            onClick={async () => {
              await installEvt.prompt();
              setInstallEvt(null);
            }}
          >
            Installer
          </button>
          <button
            aria-label="Ignorer"
            onClick={() => {
              setDismissed(true);
              try {
                localStorage.setItem("agb-install-dismissed", "1");
              } catch {}
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
