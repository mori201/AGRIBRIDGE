"use client";
import Link from "@/components/ui/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/misc";
import { ROLE_LABELS } from "@/lib/constants";
import { Building2, LogOut, Settings, Shield, User } from "lucide-react";

export function UserMenu({ name, role, avatar }: { name: string; role: string; avatar: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);
  const item = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-[var(--surface-2)]";
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" className="rounded-full" aria-label="Menu du compte">
        <Avatar name={name} src={avatar} size={38} />
      </button>
      {open && (
        <div role="menu" className="surface absolute right-0 mt-2 w-64 animate-fade-in rounded-2xl border border-base p-2 shadow-xl">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-bold">{name}</p>
            <p className="text-xs text-muted">{ROLE_LABELS[role] ?? role}</p>
          </div>
          <hr className="my-1 border-base" />
          <Link role="menuitem" href="/tableau-de-bord/profil" className={item} onClick={() => setOpen(false)}>
            <User className="h-4 w-4" /> Mon profil
          </Link>
          {(role === "institution" || role === "admin") && (
            <Link role="menuitem" href="/partenaire" className={item} onClick={() => setOpen(false)}>
              <Building2 className="h-4 w-4" /> Espace partenaire
            </Link>
          )}
          {role === "admin" && (
            <Link role="menuitem" href="/admin" className={item} onClick={() => setOpen(false)}>
              <Shield className="h-4 w-4" /> Administration
            </Link>
          )}
          <Link role="menuitem" href="/tableau-de-bord/parametres" className={item} onClick={() => setOpen(false)}>
            <Settings className="h-4 w-4" /> Paramètres
          </Link>
          <form action="/auth/signout" method="post">
            <button role="menuitem" className={`${item} w-full text-red-600`}>
              <LogOut className="h-4 w-4" /> Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
