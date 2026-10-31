import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { Bookmark, CheckCircle2, Clock, Inbox, Megaphone, PlusCircle } from "lucide-react";
import { requirePartner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Notice, PageHeader, StatCard } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "@/components/status-badge";
import { OPP_STATUS_LABELS } from "@/lib/constants";
import { daysUntil, formatDate, relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Espace partenaire" };

export default async function Page() {
  const { orgs } = await requirePartner();
  const supabase = await createClient();
  const orgIds = orgs.map((o) => o.id);
  const stats = await Promise.all(orgIds.map(async (id) => (await supabase.rpc("org_stats", { p_org: id })).data as Record<string, number> | null));
  const sum = (k: string) => stats.reduce((n, s) => n + Number(s?.[k] ?? 0), 0);
  const [{ data: opps }, { data: apps }] = await Promise.all([
    supabase.from("opportunities").select("id,title,status,deadline,review_note").in("organization_id", orgIds).order("updated_at", { ascending: false }).limit(6),
    supabase.from("applications").select("id,status,submitted_at,user_id,opportunities!inner(title,organization_id)").eq("shared_with_partner", true).in("opportunities.organization_id", orgIds).order("submitted_at", { ascending: false }).limit(6),
  ]);
  const ids = [...new Set((apps ?? []).map((a) => a.user_id))];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id,full_name").in("id", ids) : { data: [] };
  const unverified = orgs.filter((o) => !o.is_verified);
  const soon = (opps ?? []).filter((o) => o.status === "published" && o.deadline && (daysUntil(o.deadline) ?? 99) <= 14 && (daysUntil(o.deadline) ?? -1) >= 0);
  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord institutionnel" description={orgs.map((o) => o.name).join(" · ")} actions={<LinkButton href="/partenaire/opportunites/nouvelle"><PlusCircle className="h-4 w-4" /> Publier une opportunité</LinkButton>} />
      {unverified.length > 0 && <Notice tone="warning" title="Organisation en cours de vérification">{unverified.map((o) => o.name).join(", ")} : vous pouvez préparer et soumettre vos opportunités ; l&apos;organisation apparaîtra publiquement après validation.</Notice>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Opportunités publiées" value={sum("published")} icon={Megaphone} />
        <StatCard label="En attente de validation" value={sum("pending")} icon={Clock} tone="gold" />
        <StatCard label="Candidatures reçues" value={sum("applications")} icon={Inbox} tone="blue" />
        <StatCard label="Enregistrements par les utilisateurs" value={sum("saves")} icon={Bookmark} />
      </div>
      {soon.length > 0 && <Notice tone="info" title="Échéances proches">{soon.map((o) => `${o.title} (${formatDate(o.deadline)})`).join(" · ")}</Notice>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Mes appels à projets</CardTitle><Link href="/partenaire/opportunites" className="text-sm font-semibold text-brand-700 hover:underline">Gérer</Link></CardHeader>
          <CardContent>
            <ul className="divide-y divide-[var(--border)]">
              {(opps ?? []).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/partenaire/opportunites/${o.id}`} className="font-medium hover:underline">{o.title}</Link>
                  <Badge tone={o.status === "published" ? "green" : o.status === "pending_review" ? "gold" : o.status === "rejected" ? "red" : "gray"}>{OPP_STATUS_LABELS[o.status]}</Badge>
                </li>
              ))}
              {(opps ?? []).length === 0 && <li className="py-4 text-sm text-muted">Aucune opportunité. <Link href="/partenaire/opportunites/nouvelle" className="underline">Publier la première</Link>.</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Dernières candidatures</CardTitle><Link href="/partenaire/candidatures" className="text-sm font-semibold text-brand-700 hover:underline">Toutes</Link></CardHeader>
          <CardContent>
            <ul className="divide-y divide-[var(--border)]">
              {(apps ?? []).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/partenaire/candidatures/${a.id}`} className="min-w-0"><p className="truncate font-medium hover:underline">{people?.find((p) => p.id === a.user_id)?.full_name ?? "Candidat"}</p><p className="truncate text-xs text-muted">{(a.opportunities as unknown as { title: string }).title} · {a.submitted_at ? relativeTime(a.submitted_at) : ""}</p></Link>
                  <ApplicationStatusBadge status={a.status} />
                </li>
              ))}
              {(apps ?? []).length === 0 && <li className="flex items-center gap-2 py-4 text-sm text-muted"><CheckCircle2 className="h-4 w-4" /> Aucune candidature reçue pour l&apos;instant.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
