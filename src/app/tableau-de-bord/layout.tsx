import { SideNav, type NavItem } from "@/components/layout/side-nav";
import { requireUser } from "@/lib/auth";

const ITEMS: NavItem[] = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: "LayoutDashboard", exact: true },
  { href: "/tableau-de-bord/opportunites", label: "Mes opportunités", icon: "Bookmark" },
  { href: "/tableau-de-bord/candidatures", label: "Mes candidatures", icon: "ClipboardList" },
  { href: "/tableau-de-bord/formations", label: "Mes formations", icon: "GraduationCap" },
  { href: "/tableau-de-bord/certificats", label: "Mes certificats", icon: "Award" },
  { href: "/tableau-de-bord/annonces", label: "Mes annonces", icon: "Store" },
  { href: "/tableau-de-bord/messages", label: "Messages", icon: "MessageCircle" },
  { href: "/tableau-de-bord/demandes-expert", label: "Accompagnement", icon: "Handshake" },
  { href: "/tableau-de-bord/notifications", label: "Notifications", icon: "Bell" },
  { href: "/tableau-de-bord/profil", label: "Mon profil", icon: "User" },
  { href: "/tableau-de-bord/parametres", label: "Paramètres", icon: "Settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="mx-auto max-w-7xl gap-8 px-4 py-6 lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <SideNav items={ITEMS} title="Mon espace" />
      </aside>
      <div className="min-w-0 pt-2 lg:pt-0">{children}</div>
    </div>
  );
}
