import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { REPORT_REASONS, labelOf } from "@/lib/constants";
import { relativeTime } from "@/lib/format";
import { ResolveForm } from "./client";
import { Flag } from "lucide-react";

export const metadata: Metadata = { title: "Signalements" };

const href = (t: string, id: string) => ({ opportunity: `/opportunites/${id}`, product: `/market/${id}`, post: `/communaute/post/${id}`, profile: `/membres/${id}`, comment: "/admin/communaute", message: "/admin/signalements" })[t] ?? "#";
const TARGET: Record<string, string> = { opportunity: "Opportunité", product: "Annonce", post: "Publication", comment: "Commentaire", profile: "Profil", message: "Message" };

export default async function Page({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut = "ouverts" } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("reports").select("id,target_type,target_id,reason,details,status,resolution_note,created_at, profiles!reports_reporter_id_fkey(full_name)").order("created_at", { ascending: false }).limit(100);
  q = statut === "ouverts" ? q.in("status", ["open", "reviewing"]) : q.in("status", ["resolved", "dismissed"]);
  const { data } = await q;
  return (
    <div>
      <PageHeader title="Gestion des signalements" />
      <div className="mb-4 flex gap-1.5">{[["ouverts", "À traiter"], ["traites", "Traités"]].map(([v, l]) => <Link key={v} href={`?statut=${v}`} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statut === v ? "bg-brand-700 text-white" : "border border-base"}`}>{l}</Link>)}</div>
      {(data ?? []).length === 0 ? <EmptyState icon={Flag} title="Aucun signalement" /> : (
        <div className="space-y-3">
          {(data ?? []).map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-1.5"><Badge tone="red">{labelOf(REPORT_REASONS, r.reason)}</Badge><Badge>{TARGET[r.target_type]}</Badge><Badge tone={r.status === "open" ? "gold" : r.status === "reviewing" ? "blue" : "gray"}>{r.status}</Badge></div>
                  <Link href={href(r.target_type, r.target_id)} className="mt-1 block text-sm font-semibold underline">Voir le contenu signalé</Link>
                  {r.details && <p className="mt-1 text-sm">{r.details}</p>}
                  <p className="text-xs text-muted">Par {(r.profiles as unknown as { full_name: string } | null)?.full_name ?? "compte supprimé"} · {relativeTime(r.created_at)}</p>
                  {r.resolution_note && <p className="mt-1 text-xs">Décision : {r.resolution_note}</p>}
                </div>
                {["open", "reviewing"].includes(r.status) && <ResolveForm id={r.id} />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
