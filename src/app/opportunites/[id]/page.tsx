import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Building2, CalendarClock, CheckCircle2, CircleDashed, FileText, HelpCircle, Mail, MapPin, Phone, ShieldCheck, Users, Wallet, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice, Progress } from "@/components/ui/misc";
import { Markdown } from "@/lib/markdown";
import { amountRange, daysUntil, deadlineStatus, formatDate } from "@/lib/format";
import { BENEFICIARY_TYPES, labelsOf, OPP_REGIONS, PROJECT_STAGES, SECTORS } from "@/lib/constants";
import { computeMatch } from "@/lib/matching";
import { DeadlineBadge } from "@/components/opportunities/opportunity-card";
import { ApplyActions, SaveButton, ShareButton } from "@/components/opportunities/actions-bar";
import { ReportButton } from "@/components/report-button";
import { LinkButton } from "@/components/ui/button";
import type { Opportunity } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("*, opportunity_categories(name,slug), organizations(name,slug,is_verified), opportunity_eligibility(id,label,is_mandatory,position)")
    .eq("id", id)
    .maybeSingle();
  return data as unknown as Opportunity | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const opp = await load((await params).id);
  if (!opp) return { title: "Opportunité introuvable" };
  return { title: opp.title, description: opp.summary ?? opp.description.slice(0, 160) };
}

export default async function OpportunityPage({ params }: Props) {
  const { id } = await params;
  const opp = await load(id);
  if (!opp) notFound();
  const profile = await getProfile();
  const supabase = await createClient();
  let saved = false;
  let applicationId: string | null = null;
  if (profile) {
    const [{ data: s }, { data: a }] = await Promise.all([
      supabase.from("saved_opportunities").select("opportunity_id").eq("opportunity_id", id).eq("user_id", profile.id).maybeSingle(),
      supabase.from("applications").select("id").eq("opportunity_id", id).eq("user_id", profile.id).maybeSingle(),
    ]);
    saved = Boolean(s);
    applicationId = a?.id ?? null;
  }
  const match = profile ? computeMatch(profile, opp) : null;
  const closed = deadlineStatus(opp.deadline) === "cloturee";
  const days = daysUntil(opp.deadline);
  const eligibility = [...(opp.opportunity_eligibility ?? [])].sort((a, b) => a.position - b.position);
  const isPublished = opp.status === "published";

  const facts = [
    { icon: Wallet, label: "Montant", value: amountRange(opp.amount_min, opp.amount_max) },
    { icon: CalendarClock, label: "Date limite", value: opp.deadline ? `${formatDate(opp.deadline)}${days !== null && days >= 0 ? ` (J-${days})` : ""}` : "Sans date limite" },
    { icon: MapPin, label: "Zone", value: opp.regions.includes("national") ? "Tout le Sénégal" : labelsOf(OPP_REGIONS, opp.regions).join(", ") || "Non précisé" },
    { icon: Users, label: "Bénéficiaires", value: labelsOf(BENEFICIARY_TYPES, opp.beneficiary_types).join(", ") || "Tous" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link href="/opportunites" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]">
        <ArrowLeft className="h-4 w-4" /> Toutes les opportunités
      </Link>

      {opp.is_demo && (
        <Notice tone="demo" title="Opportunité de démonstration" className="mb-4">
          Cette opportunité est <strong>fictive</strong>. Elle sert uniquement à présenter le fonctionnement d&apos;AgriBridge et ne correspond à aucun financement réel.
        </Notice>
      )}
      {!isPublished && (
        <Notice tone="warning" className="mb-4">Cette opportunité n&apos;est pas publiée (statut : {opp.status}). Elle n&apos;est visible que par son organisme et l&apos;administration.</Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <Badge tone="leaf">{opp.opportunity_categories?.name}</Badge>
              <DeadlineBadge deadline={opp.deadline} />
              {opp.is_demo && <DemoBadge label="Démo — fictive" />}
              {opp.is_premium && <Badge tone="gold">Programme mis en avant</Badge>}
            </div>
            <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{opp.title}</h1>
            <p className="mt-2 flex items-center gap-2 font-semibold text-muted">
              <Building2 className="h-4 w-4" /> {opp.funder_name}
              {opp.organizations?.is_verified && <span title="Organisation vérifiée par AgriBridge"><ShieldCheck className="h-4 w-4 text-brand-600" /></span>}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.label} className="surface flex gap-3 rounded-xl border border-base p-3.5">
                <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                <div>
                  <p className="text-xs font-medium text-muted">{f.label}</p>
                  <p className="text-sm font-semibold">{f.value}</p>
                </div>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent><Markdown source={opp.description} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Critères d&apos;éligibilité</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div><dt className="font-semibold">Secteurs</dt><dd className="text-muted">{labelsOf(SECTORS, opp.sectors).join(", ") || "Tous secteurs"}</dd></div>
                <div><dt className="font-semibold">Maturité du projet</dt><dd className="text-muted">{labelsOf(PROJECT_STAGES, opp.project_stages).join(", ") || "Tous stades"}</dd></div>
              </dl>
              {eligibility.length > 0 && (
                <ul className="space-y-2">
                  {eligibility.map((e) => (
                    <li key={e.id} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <span>{e.label}{!e.is_mandatory && <span className="text-muted"> (souhaité)</span>}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Documents requis</CardTitle></CardHeader>
            <CardContent>
              {opp.required_documents.length ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {opp.required_documents.map((d) => (
                    <li key={d} className="flex items-center gap-2 rounded-lg surface-2 px-3 py-2 text-sm"><FileText className="h-4 w-4 shrink-0 text-brand-600" /> {d}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Non précisés : consultez l&apos;appel officiel.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contact et source</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {opp.contact_email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted" /> <a className="underline" href={`mailto:${opp.contact_email}`}>{opp.contact_email}</a></p>}
              {opp.contact_phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted" /> <a className="underline" href={`tel:${opp.contact_phone}`}>{opp.contact_phone}</a></p>}
              <p>
                <span className="font-semibold">Source officielle : </span>
                {opp.source_url ? <a href={opp.source_url} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline">{opp.source_url}</a> : <span className="text-muted">{opp.is_demo ? "Aucune (opportunité fictive)" : "Publiée directement par l'organisme sur AgriBridge"}</span>}
              </p>
              <p><span className="font-semibold">Vérifiée par AgriBridge le : </span>{opp.verified_at ? formatDate(opp.verified_at) : <span className="text-muted">non vérifiée</span>}</p>
              <p className="text-muted">Publiée le {formatDate(opp.published_at ?? opp.created_at)}</p>
            </CardContent>
          </Card>
          <div className="flex items-center gap-4">
            <ShareButton title={opp.title} />
            {profile && <ReportButton targetType="opportunity" targetId={opp.id} />}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <ApplyActions id={opp.id} applicationId={applicationId} mode={opp.application_mode} url={opp.application_url} closed={closed} loggedIn={Boolean(profile)} />
            {profile && <div className="mt-2"><SaveButton id={opp.id} saved={saved} /></div>}
            <p className="mt-3 text-xs text-muted">
              {opp.application_mode === "platform" ? "La candidature se dépose sur AgriBridge : elle sera transmise à l'organisme." : "La candidature se fait sur le site de l'organisme. AgriBridge vous aide à préparer et suivre votre dossier."}
            </p>
          </Card>

          {match ? (
            <Card className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-bold">Correspondance avec votre profil</p>
                <span className="text-lg font-extrabold text-brand-700 dark:text-leaf-300">{match.score}%</span>
              </div>
              <Progress value={match.score} tone={match.level === "forte" ? "brand" : "gold"} />
              <ul className="mt-4 space-y-2 text-sm">
                {match.criteria.map((c) => (
                  <li key={c.key} className="flex gap-2">
                    {c.state === "met" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" /> : c.state === "missing" ? <XCircle className="h-4 w-4 shrink-0 text-red-500" /> : <CircleDashed className="h-4 w-4 shrink-0 text-muted" />}
                    <span>
                      <span className="font-medium">{c.label}</span>
                      <span className="text-muted"> — {c.state === "met" ? "rempli" : c.state === "missing" ? "non rempli" : "à compléter"}</span>
                      {c.detail && <span className="block text-xs text-muted">{c.detail}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              {match.toVerify.length > 0 && (
                <div className="mt-4 rounded-xl surface-2 p-3 text-sm">
                  <p className="mb-1 flex items-center gap-1.5 font-semibold"><HelpCircle className="h-4 w-4" /> À vérifier par vous-même</p>
                  <ul className="list-disc space-y-0.5 pl-5 text-muted">{match.toVerify.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
              )}
              <div className="mt-4 text-sm">
                <p className="mb-1 font-semibold">Prochaines étapes</p>
                <ol className="list-decimal space-y-1 pl-5 text-muted">{match.nextSteps.map((s) => <li key={s}>{s}</li>)}</ol>
              </div>
              <p className="mt-4 flex gap-1.5 text-xs text-muted"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Score indicatif : il ne garantit pas l&apos;obtention du financement. La décision appartient à l&apos;organisme.</p>
            </Card>
          ) : (
            <Card className="p-5 text-sm">
              <p className="font-bold">Suis-je éligible ?</p>
              <p className="mt-1 text-muted">Créez votre profil gratuit pour voir les critères que vous remplissez et ceux qui manquent.</p>
              <LinkButton href={`/inscription?next=/opportunites/${opp.id}`} className="mt-3 w-full" variant="gold">Créer mon compte</LinkButton>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
