import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { requirePartner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/misc";
import { ApplicationStatusBadge } from "@/components/status-badge";
import { EXPERIENCE_LEVELS, PROJECT_STAGES, REGIONS, ROLE_LABELS, SECTORS, labelOf, labelsOf, APPLICATION_STATUSES } from "@/lib/constants";
import { fcfa, formatDate, relativeTime } from "@/lib/format";
import { Markdown } from "@/lib/markdown";
import { PartnerDocs, PartnerStatusForm } from "./client";

export const metadata: Metadata = { title: "Dossier de candidature" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await requirePartner();
  const supabase = await createClient();
  const { data: app } = await supabase.from("applications").select("id,status,submitted_at,motivation,partner_note,user_id,checklist, opportunities(id,title,required_documents)").eq("id", id).eq("shared_with_partner", true).maybeSingle();
  if (!app) notFound();
  const [{ data: cand }, { data: docs }, { data: history }] = await Promise.all([
    supabase.rpc("candidate_profile", { p: app.user_id }),
    supabase.from("application_documents").select("id,name,storage_path,size_bytes,created_at").eq("application_id", id),
    supabase.from("application_history").select("id,from_status,to_status,created_at").eq("application_id", id).order("created_at", { ascending: false }),
  ]);
  const c = cand?.[0];
  const opp = app.opportunities as unknown as { id: string; title: string; required_documents: string[] };
  const label = (s: string | null) => APPLICATION_STATUSES.find((x) => x.value === s)?.label ?? s;
  return (
    <div className="space-y-5">
      <Link href="/partenaire/candidatures" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> Candidatures</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">{c?.full_name ?? "Candidat"}</h1><p className="text-muted">{opp.title} · soumise le {app.submitted_at ? formatDate(app.submitted_at) : "—"}</p></div>
        <ApplicationStatusBadge status={app.status} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Profil du candidat</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-3"><Avatar name={c?.full_name} size={48} /><div><p className="font-bold">{c?.full_name}</p><p className="text-sm text-muted">{ROLE_LABELS[c?.role ?? ""]} · membre depuis {c?.created_at ? formatDate(c.created_at, { month: "long", year: "numeric" }) : "—"}</p></div></div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted">Région</dt><dd className="font-semibold">{labelOf(REGIONS, c?.region) || "—"}</dd></div>
                <div><dt className="text-muted">Secteurs</dt><dd className="font-semibold">{labelsOf(SECTORS, c?.sectors).join(", ") || "—"}</dd></div>
                <div><dt className="text-muted">Expérience</dt><dd className="font-semibold">{labelOf(EXPERIENCE_LEVELS, c?.experience_level) || "—"}</dd></div>
                <div><dt className="text-muted">Stade du projet</dt><dd className="font-semibold">{labelOf(PROJECT_STAGES, c?.project_stage) || "—"}</dd></div>
                <div><dt className="text-muted">Montant recherché</dt><dd className="font-semibold">{c?.funding_amount ? fcfa(c.funding_amount) : "—"}</dd></div>
                <div><dt className="text-muted">Projet</dt><dd className="font-semibold">{c?.project_type || "—"}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                {c?.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-700 underline"><Mail className="h-4 w-4" /> {c.email}</a>}
                {c?.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-700 underline"><Phone className="h-4 w-4" /> {c.phone}</a>}
              </div>
              {c?.bio && <p className="mt-3 text-sm text-muted">{c.bio}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Présentation du projet</CardTitle></CardHeader>
            <CardContent>{app.motivation ? <Markdown source={app.motivation} /> : <p className="text-sm text-muted">Aucune présentation fournie.</p>}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Documents ({docs?.length ?? 0})</CardTitle></CardHeader>
            <CardContent><PartnerDocs docs={docs ?? []} /></CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-5"><p className="mb-3 font-bold">Décision</p><PartnerStatusForm id={app.id} status={app.status} note={app.partner_note} /></Card>
          <Card className="p-5 text-sm">
            <p className="mb-2 font-bold">Pièces déclarées prêtes par le candidat</p>
            <ul className="space-y-1">{opp.required_documents.map((d) => <li key={d}>{(app.checklist as Record<string, boolean>)?.[d] ? "✅" : "⬜"} {d}</li>)}</ul>
          </Card>
          <Card className="p-5 text-sm">
            <p className="mb-2 font-bold">Historique</p>
            <ul className="space-y-1.5">{(history ?? []).map((h) => <li key={h.id}>{h.from_status ? `${label(h.from_status)} → ` : ""}{label(h.to_status)} <span className="text-xs text-muted">· {relativeTime(h.created_at)}</span></li>)}</ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
