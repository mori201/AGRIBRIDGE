import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { Handshake } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, Notice, PageHeader } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { CloseRequest, ExpertListingForm, RespondForm } from "./client";

export const metadata: Metadata = { title: "Accompagnement" };
const ST: Record<string, [string, string]> = { pending: ["En attente", "gold"], accepted: ["Acceptée", "green"], declined: ["Déclinée", "red"], completed: ["Terminée", "gray"] };

export default async function Page() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const [{ data: mine }, { data: myExpert }] = await Promise.all([
    supabase.from("expert_requests").select("id,subject,message,status,response,created_at,experts(id,full_name,title)").eq("user_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("experts").select("id,title,specialties,bio,availability,rate_fcfa,languages,is_active,is_verified").eq("profile_id", profile.id).maybeSingle(),
  ]);
  const { data: received } = myExpert ? await supabase.from("expert_requests").select("id,subject,message,status,response,created_at,user_id").eq("expert_id", myExpert.id).order("created_at", { ascending: false }) : { data: [] };
  const askerIds = [...new Set((received ?? []).map((r) => r.user_id))];
  const { data: askers } = askerIds.length ? await supabase.from("profiles").select("id,full_name").in("id", askerIds) : { data: [] };
  const name = (id: string) => askers?.find((a) => a.id === id)?.full_name ?? "Membre";

  return (
    <div className="space-y-6">
      <PageHeader title="Accompagnement" description="Vos demandes aux experts et, si vous êtes expert, les demandes reçues." actions={<LinkButton href="/expert" size="sm">Trouver un expert</LinkButton>} />
      <Card>
        <CardHeader><CardTitle>Mes demandes</CardTitle></CardHeader>
        <CardContent>
          {(mine ?? []).length === 0 ? <EmptyState icon={Handshake} title="Aucune demande" description="Contactez un expert depuis le répertoire AgriExpert." className="py-8" /> : (
            <ul className="space-y-3">
              {(mine as unknown as { id: string; subject: string; message: string; status: string; response: string | null; created_at: string; experts: { id: string; full_name: string; title: string } }[]).map((r) => (
                <li key={r.id} className="rounded-xl border border-base p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{r.subject}</p><Badge tone={ST[r.status][1]}>{ST[r.status][0]}</Badge></div>
                  <p className="text-sm text-muted">À <Link className="underline" href={`/expert/${r.experts.id}`}>{r.experts.full_name}</Link> · {relativeTime(r.created_at)}</p>
                  <p className="mt-2 whitespace-pre-line text-sm">{r.message}</p>
                  {r.response && <div className="mt-3 rounded-lg surface-2 p-3 text-sm"><p className="font-semibold">Réponse de l&apos;expert</p><p className="whitespace-pre-line">{r.response}</p></div>}
                  {["pending", "accepted"].includes(r.status) && <CloseRequest id={r.id} />}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {myExpert && (
        <Card>
          <CardHeader><CardTitle>Demandes reçues</CardTitle></CardHeader>
          <CardContent>
            {!myExpert.is_active && <Notice tone="warning" className="mb-3">Votre fiche expert est en attente de validation : elle n&apos;est pas encore visible dans le répertoire.</Notice>}
            {(received ?? []).length === 0 ? <p className="text-sm text-muted">Aucune demande reçue pour le moment.</p> : (
              <ul className="space-y-3">
                {(received ?? []).map((r) => (
                  <li key={r.id} className="rounded-xl border border-base p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{r.subject}</p><Badge tone={ST[r.status][1]}>{ST[r.status][0]}</Badge></div>
                    <p className="text-sm text-muted">De <Link href={`/membres/${r.user_id}`} className="underline">{name(r.user_id)}</Link> · {relativeTime(r.created_at)}</p>
                    <p className="mt-2 whitespace-pre-line text-sm">{r.message}</p>
                    <RespondForm id={r.id} status={r.status} response={r.response} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
      {(profile.role === "expert" || myExpert) && (
        <Card>
          <CardHeader><CardTitle>{myExpert ? "Ma fiche expert" : "Devenir expert AgriBridge"}</CardTitle></CardHeader>
          <CardContent><ExpertListingForm existing={myExpert} /></CardContent>
        </Card>
      )}
      {profile.role !== "expert" && !myExpert && (
        <p className="text-sm text-muted">Vous êtes agronome, technicien ou consultant ? Choisissez le type de profil « Expert agricole » dans <Link href="/tableau-de-bord/profil" className="underline">votre profil</Link> pour proposer vos services.</p>
      )}
    </div>
  );
}
