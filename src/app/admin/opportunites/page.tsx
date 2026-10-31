import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { OPP_STATUS_LABELS, labelsOf, OPP_REGIONS } from "@/lib/constants";
import { amountRange, formatDate } from "@/lib/format";
import { AdminOppForm, ReviewForm } from "./client";

export const metadata: Metadata = { title: "Gestion des opportunités" };

export default async function Page({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut = "pending_review" } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("opportunities").select("id,title,funder_name,status,deadline,amount_min,amount_max,regions,is_demo,is_premium,verified_at,source_url,review_note,application_mode,created_at, organizations(name,is_verified), opportunity_categories(name)").order("updated_at", { ascending: false }).limit(100);
  if (statut !== "toutes") q = q.eq("status", statut);
  const [{ data }, { data: cats }] = await Promise.all([q, supabase.from("opportunity_categories").select("id,name").order("id")]);
  const tabs = [["pending_review", "À valider"], ["published", "Publiées"], ["rejected", "Refusées"], ["draft", "Brouillons"], ["archived", "Archivées"], ["toutes", "Toutes"]];
  return (
    <div className="space-y-5">
      <PageHeader title="Gestion des opportunités" description="Vérifiez chaque opportunité avant publication : source officielle, critères, dates, montants." />
      <div className="flex flex-wrap gap-1.5">{tabs.map(([v, l]) => <Link key={v} href={`?statut=${v}`} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statut === v ? "bg-brand-700 text-white" : "border border-base"}`}>{l}</Link>)}</div>
      {(data ?? []).length === 0 && <p className="text-sm text-muted">Aucune opportunité dans cette catégorie.</p>}
      <div className="space-y-3">
        {(data ?? []).map((o) => (
          <Card key={o.id} className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5"><Badge tone={o.status === "published" ? "green" : o.status === "pending_review" ? "gold" : o.status === "rejected" ? "red" : "gray"}>{OPP_STATUS_LABELS[o.status]}</Badge>{o.is_demo && <DemoBadge />}{o.is_premium && <Badge tone="gold">Mise en avant</Badge>}<Badge tone="leaf">{(o.opportunity_categories as unknown as { name: string })?.name}</Badge></div>
                <Link href={`/opportunites/${o.id}`} className="mt-1 block font-bold hover:underline">{o.title}</Link>
                <p className="text-sm text-muted">{o.funder_name}{(o.organizations as unknown as { name: string; is_verified: boolean } | null) && ` · org. ${(o.organizations as unknown as { name: string; is_verified: boolean }).is_verified ? "vérifiée" : "NON vérifiée"}`} · {amountRange(o.amount_min, o.amount_max)} · {labelsOf(OPP_REGIONS, o.regions).slice(0, 3).join(", ")} · limite {o.deadline ? formatDate(o.deadline) : "—"}</p>
                <p className="text-xs text-muted">Source : {o.source_url ? <a href={o.source_url} target="_blank" rel="noopener noreferrer" className="underline">{o.source_url}</a> : "non fournie"} · vérifiée : {o.verified_at ? formatDate(o.verified_at) : "non"} · candidature {o.application_mode === "platform" ? "sur AgriBridge" : "externe"}</p>
              </div>
              <ReviewForm id={o.id} status={o.status} premium={o.is_premium} />
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <h2 className="mb-1 text-lg font-bold">Ajouter une opportunité réelle (veille)</h2>
        <p className="mb-4 text-sm text-muted">Pour référencer un appel publié par un organisme non inscrit. La source officielle et la date de vérification sont obligatoires et seront affichées.</p>
        <AdminOppForm categories={cats ?? []} />
      </Card>
    </div>
  );
}
