import { SideNav, type NavItem } from "@/components/layout/side-nav";
import { requireAdmin } from "@/lib/auth";

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", exact: true },
  { href: "/admin/opportunites", label: "Opportunités", icon: "Megaphone" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "Users" },
  { href: "/admin/partenaires", label: "Partenaires", icon: "Building2" },
  { href: "/admin/formations", label: "Formations", icon: "GraduationCap" },
  { href: "/admin/annonces", label: "Annonces", icon: "Store" },
  { href: "/admin/communaute", label: "Modération", icon: "ShieldCheck" },
  { href: "/admin/experts", label: "Experts", icon: "BadgeCheck" },
  { href: "/admin/contenus", label: "Contenus", icon: "Newspaper" },
  { href: "/admin/signalements", label: "Signalements", icon: "Flag" },
  { href: "/admin/statistiques", label: "Statistiques", icon: "BarChart3" },
  { href: "/admin/parametres", label: "Paramètres", icon: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-7xl gap-8 px-4 py-6 lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start"><SideNav items={ITEMS} title="Administration" /></aside>
      <div className="min-w-0 pt-2 lg:pt-0">{children}</div>
    </div>
  );
}
