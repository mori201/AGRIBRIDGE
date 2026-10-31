import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ClipboardList, Flag, GraduationCap, Megaphone, MessagesSquare, Store, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Administration" };

export default async function Page() {
  const supabase = await createClient();
  const { data: s } = await supabase.rpc("admin_stats");
  const { data: logs } = await supabase.from("audit_logs").select("id,action,entity,entity_id,created_at,details").order("created_at", { ascending: false }).limit(10);
  const signups = ((s?.signups_30d ?? []) as { day: string; n: number }[]).map((d) => ({ label: d.day.slice(5), value: d.n }));
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard administrateur" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Utilisateurs" value={s?.users ?? 0} icon={Users} />
        <StatCard label="Opportunités publiées" value={s?.opportunities_published ?? 0} icon={Megaphone} />
        <StatCard label="À valider" value={s?.opportunities_pending ?? 0} icon={Megaphone} tone="gold" hint="Opportunités en attente" />
        <StatCard label="Signalements ouverts" value={s?.reports_open ?? 0} icon={Flag} tone="red" />
        <StatCard label="Organisations" value={s?.organizations ?? 0} icon={Building2} hint={`${s?.organizations_pending ?? 0} à vérifier`} />
        <StatCard label="Candidatures" value={s?.applications ?? 0} icon={ClipboardList} tone="blue" />
        <StatCard label="Inscriptions aux formations" value={s?.enrollments ?? 0} icon={GraduationCap} />
        <StatCard label="Annonces actives" value={s?.products ?? 0} icon={Store} tone="gold" />
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {(s?.opportunities_pending ?? 0) > 0 && <Link className="rounded-full bg-gold-100 px-3 py-1.5 font-semibold text-gold-700" href="/admin/opportunites">{s.opportunities_pending} opportunité(s) à valider →</Link>}
        {(s?.organizations_pending ?? 0) > 0 && <Link className="rounded-full bg-gold-100 px-3 py-1.5 font-semibold text-gold-700" href="/admin/partenaires">{s.organizations_pending} organisation(s) à vérifier →</Link>}
        {(s?.reports_open ?? 0) > 0 && <Link className="rounded-full bg-red-50 px-3 py-1.5 font-semibold text-red-700" href="/admin/signalements">{s.reports_open} signalement(s) →</Link>}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Inscriptions (30 jours)</CardTitle></CardHeader><CardContent><SimpleBarChart data={signups} /></CardContent></Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessagesSquare className="h-4 w-4" /> Journal d&apos;audit</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">{(logs ?? []).map((l) => <li key={l.id} className="flex justify-between gap-3"><span><strong>{l.action}</strong> · {l.entity}{l.details?.title ? ` — ${l.details.title}` : l.details?.name ? ` — ${l.details.name}` : ""}</span><span className="shrink-0 text-xs text-muted">{relativeTime(l.created_at)}</span></li>)}</ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
