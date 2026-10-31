import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { setExpertFlags } from "@/actions/admin";
import { EXPERT_SPECIALTIES, labelsOf } from "@/lib/constants";

export const metadata: Metadata = { title: "Gestion des experts" };

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from("experts").select("id,full_name,title,specialties,is_active,is_verified,is_demo,profile_id,created_at").order("is_active").order("created_at", { ascending: false });
  return (
    <div>
      <PageHeader title="Gestion des experts" description="Activez les fiches après vérification des qualifications." />
      <ul className="surface divide-y divide-[var(--border)] rounded-2xl border border-base">
        {(data ?? []).map((e) => (
          <li key={e.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1"><Link href={`/expert/${e.id}`} className="font-semibold hover:underline">{e.full_name}</Link> {e.is_demo && <DemoBadge />}<p className="text-xs text-muted">{e.title} · {labelsOf(EXPERT_SPECIALTIES, e.specialties).join(", ")}</p></div>
            {e.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="gold">En attente</Badge>}
            {e.is_verified && <Badge tone="blue">Vérifié</Badge>}
            <ActionButton tone={e.is_active ? "danger" : "success"} action={setExpertFlags.bind(null, e.id, { is_active: !e.is_active })}>{e.is_active ? "Désactiver" : "Activer"}</ActionButton>
            <ActionButton action={setExpertFlags.bind(null, e.id, { is_verified: !e.is_verified })}>{e.is_verified ? "Retirer le badge" : "Marquer vérifié"}</ActionButton>
          </li>
        ))}
      </ul>
    </div>
  );
}
