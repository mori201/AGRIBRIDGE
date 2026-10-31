import type { Metadata } from "next";
import { requirePartner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { APPLICATION_STATUSES, labelOf, REGIONS } from "@/lib/constants";

export const metadata: Metadata = { title: "Statistiques" };

export default async function Page() {
  const { orgs } = await requirePartner();
  const supabase = await createClient();
  const stats = await Promise.all(orgs.map(async (o) => ({ org: o, s: (await supabase.rpc("org_stats", { p_org: o.id })).data as { by_status: Record<string, number>; by_region: Record<string, number>; opportunities: number; published: number; saves: number; applications: number } | null })));
  const merge = (k: "by_status" | "by_region") => stats.reduce<Record<string, number>>((acc, { s }) => { Object.entries(s?.[k] ?? {}).forEach(([key, v]) => (acc[key] = (acc[key] ?? 0) + Number(v))); return acc; }, {});
  const byStatus = merge("by_status");
  const byRegion = merge("by_region");
  return (
    <div className="space-y-5">
      <PageHeader title="Statistiques et rapports" description="Indicateurs agrégés de vos programmes (aucune donnée personnelle)." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Candidatures par statut</CardTitle></CardHeader><CardContent><SimpleBarChart data={APPLICATION_STATUSES.filter((s) => !["brouillon", "preparation"].includes(s.value)).map((s) => ({ label: s.label.replace("En cours d'examen", "Examen"), value: byStatus[s.value] ?? 0 }))} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Candidats par région</CardTitle></CardHeader><CardContent><SimpleBarChart color="#c9a13b" data={Object.entries(byRegion).map(([k, v]) => ({ label: labelOf(REGIONS, k) || k, value: v }))} /></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Par organisation</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm"><thead className="text-left text-xs uppercase text-muted"><tr><th className="py-2">Organisation</th><th>Opportunités</th><th>Publiées</th><th>Enregistrements</th><th>Candidatures</th></tr></thead>
            <tbody>{stats.map(({ org, s }) => <tr key={org.id} className="border-t border-base"><td className="py-2 font-semibold">{org.name}</td><td>{s?.opportunities ?? 0}</td><td>{s?.published ?? 0}</td><td>{s?.saves ?? 0}</td><td>{s?.applications ?? 0}</td></tr>)}</tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
