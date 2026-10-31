import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { setOrgVerified } from "@/actions/admin";
import { ORG_TYPES, labelOf } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { AddMemberForm, PlanForm } from "./client";

export const metadata: Metadata = { title: "Gestion des partenaires" };

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from("organizations").select("id,name,type,website,email,is_verified,is_demo,created_at, organization_members(member_role, profiles(full_name)), subscriptions(plan,status), opportunities(count)").order("is_verified").order("created_at", { ascending: false });
  return (
    <div className="space-y-4">
      <PageHeader title="Partenaires et organisations" description="Validez les organisations, gérez leurs membres et leur formule." />
      {(data ?? []).map((o) => {
        const subs = (o.subscriptions as { plan: string; status: string }[]).filter((s) => s.status === "active");
        return (
          <Card key={o.id} className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="flex flex-wrap items-center gap-2 font-bold">{o.name} {o.is_verified ? <Badge tone="green">Vérifiée</Badge> : <Badge tone="gold">À vérifier</Badge>} {o.is_demo && <DemoBadge />}</p>
                <p className="text-sm text-muted">{labelOf(ORG_TYPES, o.type)} · créée le {formatDate(o.created_at)} · {(o.opportunities as { count: number }[])?.[0]?.count ?? 0} opportunité(s) · formule {subs[0]?.plan ?? "gratuit"}</p>
                <p className="text-xs text-muted">{[o.website, o.email].filter(Boolean).join(" · ")}</p>
                <p className="mt-1 text-xs">Membres : {(o.organization_members as unknown as { member_role: string; profiles: { full_name: string } }[]).map((m) => `${m.profiles?.full_name} (${m.member_role})`).join(", ") || "aucun"}</p>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                {o.is_verified ? <ActionButton tone="danger" confirmText="Retirer la vérification ?" action={setOrgVerified.bind(null, o.id, false)}>Retirer la vérification</ActionButton> : <ActionButton tone="success" action={setOrgVerified.bind(null, o.id, true)}>Valider l&apos;organisation</ActionButton>}
                <AddMemberForm orgId={o.id} />
                <PlanForm orgId={o.id} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
