import type { Metadata } from "next";
import { BarChart3, Building2, CheckCircle2, FileSpreadsheet, Filter, Megaphone, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/button";
import { DemoBadge } from "@/components/ui/badge";
import { ORG_TYPES, labelOf } from "@/lib/constants";

export const metadata: Metadata = { title: "Partenaires", description: "ONG, banques, IMF, fondations et programmes publics : publiez vos appels à projets et recevez des candidatures qualifiées." };

export default async function Page() {
  const supabase = await createClient();
  const { data: orgs } = await supabase.from("organizations").select("id,name,type,description,website,is_demo").eq("is_verified", true).order("name");
  const features = [
    [Megaphone, "Publiez vos programmes", "Appels à projets, subventions, crédits, concours, incubation."],
    [Filter, "Filtrez les bénéficiaires", "Par région, secteur, type de structure et maturité du projet."],
    [CheckCircle2, "Gérez les candidatures", "Statuts, messages aux candidats, historique, documents."],
    [FileSpreadsheet, "Exportez", "Export CSV des candidatures qui vous ont été transmises."],
    [BarChart3, "Mesurez", "Statistiques agrégées de vos programmes."],
    [ShieldCheck, "En confiance", "Accès strictement limité aux données de vos propres programmes."],
  ] as const;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-8 text-white sm:p-12">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Partenaires institutionnels</h1>
        <p className="mt-3 max-w-2xl text-brand-100">Touchez des milliers d&apos;agripreneurs qualifiés au Sénégal et simplifiez l&apos;instruction de vos dossiers.</p>
        <div className="mt-6 flex flex-wrap gap-3"><LinkButton href="/inscription?profil=institution" variant="gold" size="lg">Devenir partenaire</LinkButton><LinkButton href="/contact" size="lg" className="bg-white/10 hover:bg-white/20">Demander une démonstration</LinkButton></div>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(([Icon, t, d]) => <div key={t} className="surface rounded-2xl border border-base p-5"><Icon className="h-6 w-6 text-brand-600" /><p className="mt-3 font-bold">{t}</p><p className="mt-1 text-sm text-muted">{d}</p></div>)}
      </div>
      <h2 className="mt-14 text-2xl font-extrabold">Organisations vérifiées</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(orgs ?? []).map((o) => (
          <div key={o.id} className="surface rounded-2xl border border-base p-5">
            <p className="flex flex-wrap items-center gap-2 font-bold"><Building2 className="h-5 w-5 text-brand-600" /> {o.name} {o.is_demo && <DemoBadge />}</p>
            <p className="text-xs text-muted">{labelOf(ORG_TYPES, o.type)}</p>
            {o.description && <p className="mt-2 line-clamp-3 text-sm">{o.description}</p>}
            {o.website && <a href={o.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-brand-700 underline">Site web</a>}
          </div>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-muted">Formules : accès gratuit à la publication · abonnements institutionnels pour la mise en avant et les outils avancés de gestion des candidatures (sur convention).</p>
    </div>
  );
}
