import { SideNav, type NavItem } from "@/components/layout/side-nav";
import { requirePartner } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { CreateOrgForm } from "./create-org";
import { Building2 } from "lucide-react";

const ITEMS: NavItem[] = [
  { href: "/partenaire", label: "Tableau de bord", icon: "LayoutDashboard", exact: true },
  { href: "/partenaire/opportunites", label: "Appels à projets", icon: "Megaphone" },
  { href: "/partenaire/opportunites/nouvelle", label: "Publier", icon: "PlusCircle", exact: true },
  { href: "/partenaire/candidatures", label: "Candidatures", icon: "Inbox" },
  { href: "/partenaire/statistiques", label: "Statistiques", icon: "BarChart3" },
  { href: "/partenaire/organisation", label: "Organisation", icon: "Building2" },
];

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { orgs } = await requirePartner();
  if (orgs.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card className="p-6">
          <Building2 className="h-10 w-10 text-brand-600" />
          <h1 className="mt-3 text-2xl font-extrabold">Créez votre espace partenaire</h1>
          <p className="mt-1 text-muted">ONG, banques, IMF, fondations, incubateurs et programmes publics : publiez vos appels à projets, recevez des candidatures qualifiées et suivez vos programmes.</p>
          <div className="mt-6"><CreateOrgForm /></div>
        </Card>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl gap-8 px-4 py-6 lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <SideNav items={ITEMS} title="Espace partenaire" />
        <p className="mt-3 hidden px-3 text-xs text-muted lg:block">{orgs.map((o) => o.name).join(", ")}</p>
      </aside>
      <div className="min-w-0 pt-2 lg:pt-0">{children}</div>
    </div>
  );
}
