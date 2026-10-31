import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Bell, SearchX, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { OPP_SELECT, OpportunityCard } from "@/components/opportunities/opportunity-card";
import { OpportunityFilters } from "@/components/opportunities/filters";
import { EmptyState, Notice, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { computeMatch } from "@/lib/matching";
import type { Opportunity } from "@/lib/types";

export const metadata: Metadata = {
  title: "Opportunités de financement agricole",
  description: "Subventions, appels à projets, concours, microcrédits et programmes d'incubation pour l'agriculture au Sénégal.",
};

const PAGE_SIZE = 18;
type SP = Record<string, string | undefined>;

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const profile = await getProfile();
  const { data: categories } = await supabase.from("opportunity_categories").select("id,name").order("id");

  const page = Math.max(1, Number(sp.page) || 1);
  let q = supabase.from("opportunities").select(OPP_SELECT, { count: "exact" }).eq("status", "published");
  if (sp.q) q = q.textSearch("search", sp.q.slice(0, 100), { type: "websearch", config: "french" });
  if (sp.region) q = q.or(`regions.cs.{${sp.region}},regions.cs.{national}`);
  if (sp.secteur) q = q.contains("sectors", [sp.secteur]);
  if (sp.type && /^\d+$/.test(sp.type)) q = q.eq("category_id", Number(sp.type));
  if (sp.beneficiaire) q = q.contains("beneficiary_types", [sp.beneficiaire]);
  if (sp.stade) q = q.contains("project_stages", [sp.stade]);
  if (sp.montant) {
    const m = Number(sp.montant);
    if (m > 20000000) q = q.gt("amount_max", 20000000);
    else if (m > 0) q = q.lte("amount_min", m);
  }
  const today = new Date().toISOString().slice(0, 10);
  if (sp.statut !== "toutes") q = q.or(`deadline.is.null,deadline.gte.${today}`);
  if (sp.echeance && /^\d+$/.test(sp.echeance)) {
    const until = new Date(Date.now() + Number(sp.echeance) * 86400000).toISOString().slice(0, 10);
    q = q.gte("deadline", today).lte("deadline", until);
  }
  const sort = sp.tri ?? (profile ? "pertinence" : "recent");
  q = sort === "echeance" ? q.order("deadline", { ascending: true, nullsFirst: false }) : q.order("published_at", { ascending: false });

  const usePertinence = sort === "pertinence" && profile;
  const { data, count, error } = usePertinence ? await q.limit(200) : await q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  let opps = (data ?? []) as unknown as Opportunity[];
  const matches = new Map(profile ? opps.map((o) => [o.id, computeMatch(profile, o)]) : []);
  if (usePertinence) {
    opps = [...opps].sort((a, b) => (matches.get(b.id)?.score ?? 0) - (matches.get(a.id)?.score ?? 0)).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }
  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);
  const link = (patch: SP) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/opportunites?${p.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Opportunités de financement"
        description="Subventions, appels à projets, concours, crédits et programmes d'accompagnement pour l'agriculture."
        actions={
          profile ? (
            <LinkButton href="/tableau-de-bord/opportunites#alertes" variant="outline" size="sm"><Bell className="h-4 w-4" /> Mes alertes</LinkButton>
          ) : (
            <LinkButton href="/inscription" variant="gold" size="sm"><Sparkles className="h-4 w-4" /> Recommandations personnalisées</LinkButton>
          )
        }
      />
      <Suspense>
        <OpportunityFilters categories={categories ?? []} />
      </Suspense>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          <strong className="text-[var(--text)]">{total}</strong> opportunité{total > 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted">Trier :</span>
          {[...(profile ? [["pertinence", "Pertinence"]] : []), ["recent", "Plus récentes"], ["echeance", "Date limite"]].map(([v, l]) => (
            <Link key={v} href={link({ tri: v, page: undefined })} className={`rounded-lg px-2.5 py-1 font-semibold ${sort === v ? "bg-brand-50 text-brand-800 dark:bg-brand-900/50 dark:text-brand-100" : "text-muted hover:bg-[var(--surface-2)]"}`}>
              {l}
            </Link>
          ))}
        </div>
      </div>
      {profile && !profile.onboarding_completed && (
        <Notice tone="info" className="mt-4">
          <Link href="/onboarding" className="font-semibold underline">Complétez votre profil</Link> pour obtenir un score de compatibilité fiable.
        </Notice>
      )}
      {error && <Notice tone="error" className="mt-4">Impossible de charger les opportunités. Réessayez dans un instant.</Notice>}
      {opps.length === 0 && !error ? (
        <EmptyState className="mt-6" icon={SearchX} title="Aucune opportunité ne correspond" description="Élargissez vos filtres ou créez une alerte pour être prévenu des nouvelles publications." action={<LinkButton href={profile ? "/tableau-de-bord/opportunites#alertes" : "/inscription"} variant="secondary"><Bell className="h-4 w-4" /> Créer une alerte</LinkButton>} />
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opps.map((o) => (
            <OpportunityCard key={o.id} opp={o} match={matches.get(o.id)} />
          ))}
        </div>
      )}
      {pages > 1 && (
        <nav className="mt-8 flex justify-center gap-2" aria-label="Pagination">
          {page > 1 && <LinkButton href={link({ page: String(page - 1) })} variant="outline" size="sm">Précédent</LinkButton>}
          <span className="px-3 py-2 text-sm text-muted">Page {page} / {pages}</span>
          {page < pages && <LinkButton href={link({ page: String(page + 1) })} variant="outline" size="sm">Suivant</LinkButton>}
        </nav>
      )}
      <p className="mt-10 text-center text-xs text-muted">
        Les opportunités marquées « Démo » sont fictives et servent uniquement à présenter la plateforme. AgriBridge ne garantit l&apos;obtention d&apos;aucun financement.
      </p>
    </div>
  );
}
