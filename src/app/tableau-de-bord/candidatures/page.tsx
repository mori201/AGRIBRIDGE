import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/status-badge";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { daysUntil, formatDate, relativeTime } from "@/lib/format";
import { DemoBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Mes candidatures" };

export default async function Page({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const { profile } = await requireUser();
  const supabase = await createClient();
  let q = supabase.from("applications").select("id,status,updated_at,reminder_at,submitted_at,opportunities(id,title,funder_name,deadline,is_demo,application_mode)").eq("user_id", profile.id).order("updated_at", { ascending: false });
  if (statut && APPLICATION_STATUSES.some((s) => s.value === statut)) q = q.eq("status", statut);
  const { data } = await q;
  type Row = { id: string; status: string; updated_at: string; reminder_at: string | null; opportunities: { id: string; title: string; funder_name: string; deadline: string | null; is_demo: boolean; application_mode: string } };
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <PageHeader title="Mes candidatures" description="Préparez vos dossiers, ajoutez vos documents et suivez chaque étape." actions={<LinkButton href="/opportunites" size="sm">Trouver une opportunité</LinkButton>} />
      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link href="/tableau-de-bord/candidatures" className={`rounded-full px-3 py-1.5 text-sm font-semibold ${!statut ? "bg-brand-700 text-white" : "border border-base"}`}>Toutes</Link>
        {APPLICATION_STATUSES.map((s) => (
          <Link key={s.value} href={`?statut=${s.value}`} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statut === s.value ? "bg-brand-700 text-white" : "border border-base"}`}>{s.label}</Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Aucune candidature" description="Depuis la fiche d'une opportunité, cliquez sur « Préparer ma candidature » pour commencer votre dossier." action={<LinkButton href="/opportunites">Parcourir les opportunités</LinkButton>} />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const d = daysUntil(r.opportunities.deadline);
            return (
              <li key={r.id}>
                <Link href={`/tableau-de-bord/candidatures/${r.id}`} className="surface flex flex-col gap-2 rounded-2xl border border-base p-4 transition hover:border-brand-300 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-bold">{r.opportunities.title} {r.opportunities.is_demo && <DemoBadge />}</p>
                    <p className="text-sm text-muted">{r.opportunities.funder_name} · mis à jour {relativeTime(r.updated_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-sm">
                    {r.opportunities.deadline && <span className={d !== null && d >= 0 && d <= 7 ? "font-semibold text-red-600" : "text-muted"}>Limite : {formatDate(r.opportunities.deadline, { day: "numeric", month: "short" })}</span>}
                    <ApplicationStatusBadge status={r.status} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
