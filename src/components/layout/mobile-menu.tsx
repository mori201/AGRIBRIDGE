"use client";
import Link from "@/components/ui/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/opportunites", label: "Financements & appels à projets" },
  { href: "/academy", label: "AgriAcademy — Formations" },
  { href: "/expert", label: "AgriExpert — Assistant & experts" },
  { href: "/market", label: "AgriMarket — Marketplace" },
  { href: "/communaute", label: "AgriCommunity" },
  { href: "/blog", label: "Actualités" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/a-propos", label: "À propos" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function MobileMenu({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-[var(--surface-2)] lg:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu" aria-expanded={open}>
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden lg:block">
        <ThemeToggle />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="surface absolute right-0 top-0 flex h-full w-[86%] max-w-sm animate-fade-in flex-col p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-bold">Menu</span>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-[var(--surface-2)]" onClick={() => setOpen(false)} aria-label="Fermer le menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-xl px-3 py-3 font-semibold hover:bg-[var(--surface-2)]">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto grid gap-2 pt-4">
              {loggedIn ? (
                <Link href="/tableau-de-bord" className="rounded-xl bg-brand-700 px-4 py-3 text-center font-semibold text-white">
                  Mon espace
                </Link>
              ) : (
                <>
                  <Link href="/inscription" className="rounded-xl bg-brand-700 px-4 py-3 text-center font-semibold text-white">
                    Créer mon compte
                  </Link>
                  <Link href="/connexion" className="rounded-xl border border-base px-4 py-3 text-center font-semibold">
                    Connexion
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
