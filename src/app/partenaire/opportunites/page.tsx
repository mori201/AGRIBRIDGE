import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { Megaphone, PlusCircle } from "lucide-react";
import { requirePartner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, Notice, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { OPP_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { OppRowActions } from "./row-actions";

export const metadata: Metadata = { title: "Mes appels à projets" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const { orgs } = await requirePartner();
  const supabase = await createClient();
  const { data } = await supabase.from("opportunities").select("id,title,status,deadline,review_note,is_demo,application_mode,updated_at, applications(count)").in("organization_id", orgs.map((o) => o.id)).order("updated_at", { ascending: false });
  return (
    <div>
      <PageHeader title="Appels à projets" description="Créez, modifiez et suivez vos opportunités." actions={<LinkButton href="/partenaire/opportunites/nouvelle" size="sm"><PlusCircle className="h-4 w-4" /> Nouvelle</LinkButton>} />
      {ok === "soumise" && <Notice tone="success" className="mb-4">Opportunité soumise : l&apos;équipe AgriBridge la vérifie avant publication. Vous serez notifié.</Notice>}
      {ok === "brouillon" && <Notice tone="success" className="mb-4">Brouillon enregistré.</Notice>}
      {(data ?? []).length === 0 ? <EmptyState icon={Megaphone} title="Aucune opportunité" action={<LinkButton href="/partenaire/opportunites/nouvelle">Publier une opportunité</LinkButton>} /> : (
        <div className="surface overflow-x-auto rounded-2xl border border-base">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase text-muted"><tr className="border-b border-base"><th className="p-3">Titre</th><th className="p-3">Statut</th><th className="p-3">Date limite</th><th className="p-3">Candidatures</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>
              {(data ?? []).map((o) => (
                <tr key={o.id} className="border-b border-base last:border-0">
                  <td className="p-3"><Link href={`/partenaire/opportunites/${o.id}`} className="font-semibold hover:underline">{o.title}</Link> {o.is_demo && <DemoBadge />}{o.status === "rejected" && o.review_note && <p className="mt-1 text-xs text-red-600">Motif : {o.review_note}</p>}</td>
                  <td className="p-3"><Badge tone={o.status === "published" ? "green" : o.status === "pending_review" ? "gold" : o.status === "rejected" ? "red" : "gray"}>{OPP_STATUS_LABELS[o.status]}</Badge></td>
                  <td className="p-3">{o.deadline ? formatDate(o.deadline, { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                  <td className="p-3">{o.application_mode === "platform" ? <Link href={`/partenaire/candidatures?opportunite=${o.id}`} className="underline">{(o.applications as { count: number }[])?.[0]?.count ?? 0}</Link> : <span className="text-muted">Externe</span>}</td>
                  <td className="p-3"><OppRowActions id={o.id} status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
