import Link from "next/link";
import { Bell, LayoutDashboard } from "lucide-react";
import { Logo } from "./logo";
import { LinkButton } from "@/components/ui/button";
import { getProfile, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";
import { MobileMenu } from "./mobile-menu";

export const MAIN_NAV = [
  { href: "/opportunites", label: "Financements" },
  { href: "/academy", label: "AgriAcademy" },
  { href: "/expert", label: "AgriExpert" },
  { href: "/market", label: "AgriMarket" },
  { href: "/communaute", label: "Communauté" },
];

export async function Header() {
  const user = await getUser();
  const profile = user ? await getProfile() : null;
  let unread = 0;
  if (user) {
    const supabase = await createClient();
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    unread = count ?? 0;
  }
  return (
    <header className="sticky top-0 z-40 border-b border-base bg-[var(--surface)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/75">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-brand-700 focus:px-3 focus:py-2 focus:text-white">
        Aller au contenu
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" aria-label="AgriBridge — accueil" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Navigation principale" className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {MAIN_NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user && profile ? (
            <>
              <Link href="/tableau-de-bord/notifications" className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-[var(--surface-2)]" aria-label={`Notifications${unread ? ` (${unread} non lues)` : ""}`}>
                <Bell className="h-5 w-5" />
                {unread > 0 && <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-gold-500 px-1 text-center text-[10px] font-bold leading-4 text-brand-950">{unread > 9 ? "9+" : unread}</span>}
              </Link>
              <LinkButton href="/tableau-de-bord" variant="secondary" size="sm" className="hidden sm:inline-flex">
                <LayoutDashboard className="h-4 w-4" /> Mon espace
              </LinkButton>
              <UserMenu name={profile.full_name || user.email || "Mon compte"} role={profile.role} avatar={profile.avatar_url} />
            </>
          ) : (
            <>
              <LinkButton href="/connexion" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Connexion
              </LinkButton>
              <LinkButton href="/inscription" size="sm">
                Rejoindre
              </LinkButton>
            </>
          )}
          <MobileMenu loggedIn={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}
