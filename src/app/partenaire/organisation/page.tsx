import type { Metadata } from "next";
import { requirePartner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrgForm } from "./client";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Mon organisation" };

export default async function Page() {
  const { orgs } = await requirePartner();
  const supabase = await createClient();
  const details = await Promise.all(orgs.map(async (o) => {
    const [{ data: members }, { data: subs }] = await Promise.all([
      supabase.from("organization_members").select("user_id,member_role,profiles(full_name)").eq("organization_id", o.id),
      supabase.from("subscriptions").select("plan,status,starts_at,ends_at").eq("organization_id", o.id).order("starts_at", { ascending: false }).limit(1),
    ]);
    return { o, members: (members ?? []) as unknown as { user_id: string; member_role: string; profiles: { full_name: string } }[], sub: subs?.[0] };
  }));
  return (
    <div className="space-y-5">
      <PageHeader title="Gestion de l'organisation" />
      {details.map(({ o, members, sub }) => (
        <Card key={o.id}>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>{o.name}</CardTitle>{o.is_verified ? <Badge tone="green">Vérifiée</Badge> : <Badge tone="gold">En vérification</Badge>}</CardHeader>
          <CardContent className="space-y-5">
            {["owner", "manager"].includes(o.member_role) ? <OrgForm org={o} /> : <p className="text-sm text-muted">Seuls les responsables peuvent modifier l&apos;organisation.</p>}
            <div>
              <p className="mb-2 text-sm font-bold">Membres de l&apos;équipe</p>
              <ul className="text-sm">{members.map((m) => <li key={m.user_id}>{m.profiles?.full_name} <span className="text-muted">— {({ owner: "Responsable", manager: "Gestionnaire", member: "Membre" } as Record<string, string>)[m.member_role]}</span></li>)}</ul>
              <p className="mt-2 text-xs text-muted">Pour ajouter un collaborateur, écrivez-nous depuis la page Contact avec son e-mail de compte AgriBridge.</p>
            </div>
            <div className="rounded-xl surface-2 p-3 text-sm">
              <p className="font-bold">Abonnement</p>
              {sub ? <p>Formule <strong>{sub.plan}</strong> · {sub.status} depuis le {formatDate(sub.starts_at)}{sub.ends_at && ` jusqu'au ${formatDate(sub.ends_at)}`}</p> : <p>Formule gratuite.</p>}
              <p className="mt-1 text-xs text-muted">Les formules partenaires (programmes mis en avant, tableaux de bord avancés) sont activées sur convention. Aucun paiement en ligne n&apos;est encore intégré.</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
