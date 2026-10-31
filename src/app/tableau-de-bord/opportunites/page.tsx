import type { Metadata } from "next";
import { Bell, Bookmark, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRecommendations } from "@/lib/queries";
import { OPP_SELECT, OpportunityCard } from "@/components/opportunities/opportunity-card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { computeMatch } from "@/lib/matching";
import { labelOf, OPP_REGIONS, SECTORS } from "@/lib/constants";
import { AlertForm, DeleteAlertButton } from "./client";
import type { Opportunity } from "@/lib/types";

export const metadata: Metadata = { title: "Mes opportunités" };

export default async function Page() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const [{ data: saved }, recs, { data: alerts }, { data: cats }] = await Promise.all([
    supabase.from("saved_opportunities").select(`created_at, opportunities(${OPP_SELECT})`).eq("user_id", profile.id).order("created_at", { ascending: false }),
    getRecommendations(profile, 9),
    supabase.from("opportunity_alerts").select("*").order("created_at", { ascending: false }),
    supabase.from("opportunity_categories").select("id,name").order("id"),
  ]);
  const savedOpps = ((saved ?? []) as unknown as { opportunities: Opportunity | null }[]).map((s) => s.opportunities).filter(Boolean) as Opportunity[];

  return (
    <div className="space-y-8">
      <PageHeader title="Mes opportunités" description="Vos favoris, vos recommandations personnalisées et vos alertes." />
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Bookmark className="h-5 w-5" /> Enregistrées ({savedOpps.length})</h2>
        {savedOpps.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{savedOpps.map((o) => <OpportunityCard key={o.id} opp={o} match={computeMatch(profile, o)} />)}</div>
        ) : (
          <EmptyState icon={Bookmark} title="Aucune opportunité enregistrée" description="Cliquez sur « Enregistrer » sur une fiche pour la retrouver ici." action={<LinkButton href="/opportunites" variant="secondary">Explorer</LinkButton>} />
        )}
      </section>
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-gold-500" /> Compatibles avec votre profil</h2>
        {recs.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{recs.map((r) => <OpportunityCard key={r.opp.id} opp={r.opp as never} match={r.match} />)}</div> : <p className="text-sm text-muted">Aucune recommandation pour le moment.</p>}
      </section>
      <section id="alertes">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Alertes personnalisées</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted">Recevez une notification dès qu&apos;une opportunité correspondant à vos critères est publiée.</p>
            {(alerts ?? []).length > 0 && (
              <ul className="divide-y divide-[var(--border)] rounded-xl border border-base">
                {(alerts ?? []).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <div>
                      <p className="font-semibold">{a.name}</p>
                      <p className="text-xs text-muted">{[labelOf(OPP_REGIONS, a.region), labelOf(SECTORS, a.sector), cats?.find((c) => c.id === a.category_id)?.name, a.keyword && `« ${a.keyword} »`].filter(Boolean).join(" · ") || "Toutes les opportunités"}</p>
                    </div>
                    <DeleteAlertButton id={a.id} />
                  </li>
                ))}
              </ul>
            )}
            <AlertForm categories={cats ?? []} defaultRegion={profile.region} defaultSector={profile.sectors?.[0] ?? null} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
