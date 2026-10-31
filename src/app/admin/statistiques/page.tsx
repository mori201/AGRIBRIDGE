import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { APPLICATION_STATUSES, REGIONS, ROLE_LABELS, labelOf } from "@/lib/constants";

export const metadata: Metadata = { title: "Statistiques globales" };

export default async function Page() {
  const supabase = await createClient();
  const { data: s } = await supabase.rpc("admin_stats");
  const toBars = (o: Record<string, number> | undefined, label: (k: string) => string) => Object.entries(o ?? {}).map(([k, v]) => ({ label: label(k), value: Number(v) }));
  return (
    <div className="space-y-5">
      <PageHeader title="Statistiques globales" description="Données agrégées et anonymisées." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Utilisateurs par type</CardTitle></CardHeader><CardContent><SimpleBarChart data={toBars(s?.users_by_role, (k) => (ROLE_LABELS[k] ?? k).split(" ")[0])} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Utilisateurs par région</CardTitle></CardHeader><CardContent><SimpleBarChart color="#c9a13b" data={toBars(s?.users_by_region, (k) => labelOf(REGIONS, k) || k)} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Candidatures par statut</CardTitle></CardHeader><CardContent><SimpleBarChart data={toBars(s?.applications_by_status, (k) => labelOf(APPLICATION_STATUSES, k))} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Activité</CardTitle></CardHeader><CardContent><SimpleBarChart color="#4c9e66" data={[{ label: "Formations", value: s?.courses ?? 0 }, { label: "Inscriptions", value: s?.enrollments ?? 0 }, { label: "Certificats", value: s?.certificates ?? 0 }, { label: "Annonces", value: s?.products ?? 0 }, { label: "Publications", value: s?.posts ?? 0 }]} /></CardContent></Card>
      </div>
    </div>
  );
}
