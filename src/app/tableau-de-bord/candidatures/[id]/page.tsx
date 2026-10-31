import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, History, Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice, Progress } from "@/components/ui/misc";
import { DemoBadge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "@/components/status-badge";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { formatDate, relativeTime } from "@/lib/format";
import { ApplicationForm, Checklist, DeleteApplication, Documents } from "./client";

export const metadata: Metadata = { title: "Ma candidature" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { profile } = await requireUser();
  const supabase = await createClient();
  const { data: app } = await supabase
    .from("applications")
    .select("*, opportunities(id,title,funder_name,deadline,application_url,application_mode,required_documents,is_demo,contact_email)")
    .eq("id", id)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!app) notFound();
  const [{ data: docs }, { data: history }] = await Promise.all([
    supabase.from("application_documents").select("id,name,storage_path,size_bytes,created_at").eq("application_id", id).order("created_at"),
    supabase.from("application_history").select("id,from_status,to_status,changed_by,created_at").eq("application_id", id).order("created_at", { ascending: false }),
  ]);
  const opp = app.opportunities as { id: string; title: string; funder_name: string; deadline: string | null; application_url: string | null; application_mode: string; required_documents: string[]; is_demo: boolean; contact_email: string | null };
  const checklist = (app.checklist ?? {}) as Record<string, boolean>;
  const done = opp.required_documents.filter((d) => checklist[d]).length;
  const readiness = opp.required_documents.length ? Math.round((done / opp.required_documents.length) * 100) : 0;
  const managedByPartner = opp.application_mode === "platform";
  const label = (s: string | null) => APPLICATION_STATUSES.find((x) => x.value === s)?.label ?? s;

  return (
    <div className="space-y-5">
      <Link href="/tableau-de-bord/candidatures" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> Mes candidatures</Link>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">{opp.title}</h1>
          <p className="text-muted">{opp.funder_name} {opp.deadline && <>· date limite {formatDate(opp.deadline)}</>}</p>
        </div>
        <div className="flex items-center gap-2"><ApplicationStatusBadge status={app.status} />{opp.is_demo && <DemoBadge />}</div>
      </div>

      {managedByPartner ? (
        <Notice tone="info">Candidature déposée sur AgriBridge : lorsque vous passez le statut à « Soumis », votre dossier et votre profil sont transmis à l&apos;organisme, qui mettra ensuite le statut à jour.</Notice>
      ) : (
        <Notice tone="info">
          La candidature officielle se fait sur le site de l&apos;organisme. Préparez ici votre dossier, puis mettez à jour le statut manuellement après votre dépôt.
          {opp.application_url && <a href={opp.application_url} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-1 font-semibold underline">Site officiel <ExternalLink className="h-3.5 w-3.5" /></a>}
        </Notice>
      )}
      {app.partner_note && <Notice tone="success" title="Message de l'organisme">{app.partner_note}</Notice>}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Suivi du dossier</CardTitle></CardHeader>
            <CardContent>
              <ApplicationForm app={{ id: app.id, status: app.status, notes: app.notes, motivation: app.motivation, reminder_at: app.reminder_at }} managedByPartner={managedByPartner} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Documents ({docs?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              <Documents appId={app.id} docs={docs ?? []} />
              <p className="mt-3 flex gap-1.5 text-xs text-muted"><Info className="h-3.5 w-3.5 shrink-0" /> Vos documents sont stockés de façon privée. Ils ne sont visibles par l&apos;organisme que si vous soumettez votre candidature via AgriBridge.</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-2 flex justify-between text-sm font-semibold"><span>Dossier prêt</span><span>{readiness}%</span></div>
            <Progress value={readiness} />
            <p className="mb-3 mt-4 text-sm font-semibold">Documents requis</p>
            {opp.required_documents.length ? <Checklist appId={app.id} items={opp.required_documents} checked={checklist} /> : <p className="text-sm text-muted">Non précisés par l&apos;organisme.</p>}
          </Card>
          <Card className="p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> Historique</p>
            <ol className="space-y-3 border-l border-base pl-4 text-sm">
              {(history ?? []).map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600" />
                  <p className="font-medium">{h.from_status ? `${label(h.from_status)} → ${label(h.to_status)}` : `Création (${label(h.to_status)})`}</p>
                  <p className="text-xs text-muted">{relativeTime(h.created_at)}{h.changed_by && h.changed_by !== profile.id ? " · par l'organisme" : ""}</p>
                </li>
              ))}
            </ol>
          </Card>
          <Link href={`/opportunites/${opp.id}`} className="block text-center text-sm font-semibold text-brand-700 hover:underline">Revoir la fiche de l&apos;opportunité</Link>
          {["brouillon", "preparation"].includes(app.status) && <DeleteApplication id={app.id} />}
        </div>
      </div>
    </div>
  );
}
