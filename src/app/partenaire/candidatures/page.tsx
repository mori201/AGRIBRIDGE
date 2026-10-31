import type { Metadata } from "next";
import Link from "next/link";
import { Download, Inbox } from "lucide-react";
import { requirePartner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Select } from "@/components/ui/field";
import { ApplicationStatusBadge } from "@/components/status-badge";
import { APPLICATION_STATUSES, PROJECT_STAGES, REGIONS, SECTORS, labelOf, labelsOf, ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Candidatures reçues" };

type Row = { id: string; status: string; submitted_at: string | null; user_id: string; opportunity_id: string; opportunities: { title: string } };
type P = { id: string; full_name: string; role: string; region: string | null; sectors: string[] };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { orgs } = await requirePartner();
  const supabase = await createClient();
  const orgIds = orgs.map((o) => o.id);
  const { data: opps } = await supabase.from("opportunities").select("id,title").in("organization_id", orgIds).eq("application_mode", "platform").order("created_at", { ascending: false });
  let q = supabase.from("applications").select("id,status,submitted_at,user_id,opportunity_id,opportunities!inner(title,organization_id)").eq("shared_with_partner", true).in("opportunities.organization_id", orgIds).order("submitted_at", { ascending: false }).limit(500);
  if (sp.opportunite) q = q.eq("opportunity_id", sp.opportunite);
  if (sp.statut) q = q.eq("status", sp.statut);
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id,full_name,role,region,sectors").in("id", ids) : { data: [] as P[] };
  const pmap = new Map(((people ?? []) as P[]).map((p) => [p.id, p]));
  let filtered = rows;
  if (sp.region) filtered = filtered.filter((r) => pmap.get(r.user_id)?.region === sp.region);
  if (sp.secteur) filtered = filtered.filter((r) => pmap.get(r.user_id)?.sectors?.includes(sp.secteur!));
  if (sp.type) filtered = filtered.filter((r) => pmap.get(r.user_id)?.role === sp.type);
  const exportQs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div>
      <PageHeader title="Candidatures reçues" description="Seules les candidatures que les candidats ont soumises via AgriBridge sont visibles ici." actions={<a href={`/api/partenaire/export?${exportQs}`} className="inline-flex h-9 items-center gap-2 rounded-xl border border-base px-3 text-sm font-semibold hover:bg-[var(--surface-2)]"><Download className="h-4 w-4" /> Export CSV</a>} />
      <form className="mb-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6" action="/partenaire/candidatures">
        <Select name="opportunite" defaultValue={sp.opportunite ?? ""} aria-label="Opportunité" className="lg:col-span-2"><option value="">Toutes les opportunités</option>{(opps ?? []).map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</Select>
        <Select name="statut" defaultValue={sp.statut ?? ""} aria-label="Statut"><option value="">Tous statuts</option>{APPLICATION_STATUSES.filter((s) => !["brouillon", "preparation"].includes(s.value)).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select>
        <Select name="region" defaultValue={sp.region ?? ""} aria-label="Région"><option value="">Toutes régions</option>{REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select>
        <Select name="secteur" defaultValue={sp.secteur ?? ""} aria-label="Secteur"><option value="">Tous secteurs</option>{SECTORS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select>
        <div className="flex gap-2"><Select name="type" defaultValue={sp.type ?? ""} aria-label="Type de bénéficiaire"><option value="">Tous profils</option>{["agripreneur", "producteur", "cooperative", "pme"].map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</Select><button className="rounded-xl bg-brand-700 px-3 text-sm font-semibold text-white">OK</button></div>
      </form>
      {filtered.length === 0 ? <EmptyState icon={Inbox} title="Aucune candidature" description="Les candidatures apparaîtront ici dès qu'un candidat soumettra son dossier." /> : (
        <div className="surface overflow-x-auto rounded-2xl border border-base">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase text-muted"><tr className="border-b border-base"><th className="p-3">Candidat</th><th className="p-3">Profil</th><th className="p-3">Région</th><th className="p-3">Opportunité</th><th className="p-3">Soumise le</th><th className="p-3">Statut</th></tr></thead>
            <tbody>
              {filtered.map((r) => {
                const p = pmap.get(r.user_id);
                return (
                  <tr key={r.id} className="border-b border-base last:border-0 hover:bg-[var(--surface-2)]">
                    <td className="p-3"><Link href={`/partenaire/candidatures/${r.id}`} className="font-semibold hover:underline">{p?.full_name ?? "Candidat"}</Link><p className="text-xs text-muted">{labelsOf(SECTORS, p?.sectors).slice(0, 2).join(", ")}</p></td>
                    <td className="p-3">{ROLE_LABELS[p?.role ?? ""]}</td>
                    <td className="p-3">{labelOf(REGIONS, p?.region)}</td>
                    <td className="p-3">{r.opportunities.title}</td>
                    <td className="p-3">{r.submitted_at ? formatDate(r.submitted_at, { day: "numeric", month: "short" }) : "—"}</td>
                    <td className="p-3"><ApplicationStatusBadge status={r.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">Stades de projet disponibles : {PROJECT_STAGES.map((s) => s.label).join(", ")}. Les données des candidats sont confidentielles : utilisez-les uniquement pour l&apos;instruction de leur dossier.</p>
    </div>
  );
}
