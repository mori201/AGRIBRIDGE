import type { Metadata } from "next";
import Link from "next/link";
import { AlarmClock, ArrowRight, Award, Bookmark, ClipboardList, GraduationCap, Newspaper, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRecommendations, profileCompletion } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Notice, Progress, StatCard } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { daysUntil, formatDate, relativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Tableau de bord" };

const STATUS_COLORS: Record<string, string> = { brouillon: "#9ca3af", preparation: "#0ea5e9", soumis: "#c9a13b", en_examen: "#8b5cf6", accepte: "#1f6a39", refuse: "#ef4444" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ bienvenue?: string; erreur?: string }> }) {
  const sp = await searchParams;
  const { profile } = await requireUser();
  const supabase = await createClient();
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [recs, { data: apps }, { count: savedCount }, { data: enrollments }, { count: certCount }, { data: notifs }, { data: recent }, { data: news }, { data: savedSoon }] = await Promise.all([
    getRecommendations(profile, 3),
    supabase.from("applications").select("id,status,reminder_at,updated_at,opportunities(id,title,deadline)").eq("user_id", profile.id).order("updated_at", { ascending: false }),
    supabase.from("saved_opportunities").select("opportunity_id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("course_enrollments").select("course_id, courses(id,slug,title)").eq("user_id", profile.id).limit(4),
    supabase.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("notifications").select("id,title,body,link,created_at,read_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("opportunities").select("id,title,funder_name,published_at,is_demo").eq("status", "published").order("published_at", { ascending: false }).limit(4),
    supabase.from("blog_posts").select("slug,title,published_at").eq("is_published", true).order("published_at", { ascending: false }).limit(3),
    supabase.from("saved_opportunities").select("opportunities(id,title,deadline)").eq("user_id", profile.id),
  ]);

  const completion = profileCompletion(profile);
  type AppRow = { id: string; status: string; reminder_at: string | null; opportunities: { id: string; title: string; deadline: string | null } | null };
  const appRows = (apps ?? []) as unknown as AppRow[];
  const byStatus = APPLICATION_STATUSES.map((s) => ({ label: s.label.replace("En cours d'examen", "Examen"), value: appRows.filter((a) => a.status === s.value).length, color: STATUS_COLORS[s.value] }));

  // Alertes : échéances proches (opportunités enregistrées / candidatures) + rappels
  const deadlines = new Map<string, { id: string; title: string; deadline: string; href: string }>();
  for (const s of (savedSoon ?? []) as unknown as { opportunities: { id: string; title: string; deadline: string | null } | null }[]) {
    const o = s.opportunities;
    if (o?.deadline && o.deadline >= today && o.deadline <= in14) deadlines.set(o.id, { id: o.id, title: o.title, deadline: o.deadline, href: `/opportunites/${o.id}` });
  }
  for (const a of appRows) {
    const o = a.opportunities;
    if (o?.deadline && o.deadline >= today && o.deadline <= in14 && !["soumis", "en_examen", "accepte", "refuse"].includes(a.status)) deadlines.set(o.id, { id: o.id, title: o.title, deadline: o.deadline, href: `/tableau-de-bord/candidatures/${a.id}` });
  }
  const reminders = appRows.filter((a) => a.reminder_at && a.reminder_at <= in14);

  // Progression des formations
  const courseIds = (enrollments ?? []).map((e: { course_id: string }) => e.course_id);
  const progress = await Promise.all(courseIds.map(async (cid: string) => (await supabase.rpc("my_course_completion", { p_course: cid })).data?.[0]));

  const firstName = profile.full_name.replace(/\(.*?\)/, "").trim().split(" ")[0] || "et bienvenue";

  return (
    <div className="space-y-6">
      {sp.erreur === "acces" && <Notice tone="error">Vous n&apos;avez pas accès à cette section.</Notice>}
      {sp.bienvenue && <Notice tone="success" title="Profil enregistré 🎉">Voici vos premières recommandations personnalisées.</Notice>}
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-brand-100">Bonjour</p>
          <h1 className="text-2xl font-extrabold">{firstName} 👋</h1>
          <p className="mt-1 text-sm text-brand-100">Voici où en sont vos projets aujourd&apos;hui.</p>
        </div>
        <div className="w-full max-w-xs rounded-2xl bg-white/10 p-4">
          <div className="flex justify-between text-sm"><span>Profil complété</span><strong>{completion.percent}%</strong></div>
          <Progress value={completion.percent} tone="gold" className="mt-2 bg-white/20" />
          {completion.percent < 100 && <Link href="/tableau-de-bord/profil" className="mt-2 inline-block text-xs font-semibold text-gold-300 underline">Compléter : {completion.missing.slice(0, 3).join(", ")}</Link>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Candidatures" value={appRows.length} icon={ClipboardList} />
        <StatCard label="Opportunités enregistrées" value={savedCount ?? 0} icon={Bookmark} tone="gold" />
        <StatCard label="Formations suivies" value={courseIds.length} icon={GraduationCap} tone="blue" />
        <StatCard label="Certificats" value={certCount ?? 0} icon={Award} />
      </div>

      {(deadlines.size > 0 || reminders.length > 0) && (
        <Card className="border-gold-300">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlarmClock className="h-5 w-5 text-gold-600" /> Alertes et rappels</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-[var(--border)]">
              {[...deadlines.values()].sort((a, b) => a.deadline.localeCompare(b.deadline)).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={d.href} className="font-medium hover:underline">{d.title}</Link>
                  <Badge tone={(daysUntil(d.deadline) ?? 99) <= 3 ? "red" : "gold"}>J-{daysUntil(d.deadline)}</Badge>
                </li>
              ))}
              {reminders.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/tableau-de-bord/candidatures/${r.id}`} className="font-medium hover:underline">Rappel : {r.opportunities?.title}</Link>
                  <span className="text-muted">{formatDate(r.reminder_at)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-gold-500" /> Recommandées pour vous</h2>
          <Link href="/tableau-de-bord/opportunites" className="text-sm font-semibold text-brand-700 hover:underline">Tout voir</Link>
        </div>
        {recs.length ? (
          <div className="grid gap-4 md:grid-cols-3">{recs.map((r) => <OpportunityCard key={r.opp.id} opp={r.opp as never} match={r.match} />)}</div>
        ) : (
          <EmptyState icon={Sparkles} title="Pas encore de recommandation" description="Complétez votre profil pour recevoir des suggestions." action={<LinkButton href="/onboarding" variant="secondary">Compléter mon profil</LinkButton>} />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Mes candidatures</CardTitle><Link href="/tableau-de-bord/candidatures" className="text-sm font-semibold text-brand-700 hover:underline">Gérer</Link></CardHeader>
          <CardContent><SimpleBarChart data={byStatus} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Progression des formations</CardTitle><Link href="/academy" className="text-sm font-semibold text-brand-700 hover:underline">Catalogue</Link></CardHeader>
          <CardContent className="space-y-4">
            {(enrollments ?? []).length === 0 ? (
              <EmptyState icon={GraduationCap} title="Aucune formation en cours" action={<LinkButton href="/academy" variant="secondary" size="sm">Découvrir les formations</LinkButton>} className="py-6" />
            ) : (
              (enrollments as unknown as { course_id: string; courses: { slug: string; title: string } }[]).map((e, i) => {
                const p = progress[i];
                const pct = p && p.total_lessons ? Math.round((p.done_lessons / p.total_lessons) * 100) : 0;
                return (
                  <Link key={e.course_id} href={`/academy/${e.courses.slug}`} className="block">
                    <div className="flex justify-between text-sm"><span className="font-medium">{e.courses.title}</span><span className="text-muted">{pct}%</span></div>
                    <Progress value={pct} className="mt-1.5" />
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Activités récentes</CardTitle></CardHeader>
          <CardContent>
            {(notifs ?? []).length === 0 ? <p className="text-sm text-muted">Aucune activité pour l&apos;instant.</p> : (
              <ul className="space-y-3">
                {(notifs ?? []).map((n) => (
                  <li key={n.id} className="text-sm">
                    <Link href={n.link ?? "/tableau-de-bord/notifications"} className="font-medium hover:underline">{n.title}</Link>
                    <p className="text-xs text-muted">{relativeTime(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Récemment publiées</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(recent ?? []).map((o) => (
                <li key={o.id} className="text-sm">
                  <Link href={`/opportunites/${o.id}`} className="font-medium hover:underline">{o.title}</Link>
                  <p className="text-xs text-muted">{o.funder_name} · {relativeTime(o.published_at)}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Newspaper className="h-4 w-4" /> Actualités agricoles</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(news ?? []).map((b) => (
                <li key={b.slug} className="text-sm"><Link href={`/blog/${b.slug}`} className="font-medium hover:underline">{b.title}</Link></li>
              ))}
            </ul>
            <LinkButton href="/expert/assistant" variant="secondary" size="sm" className="mt-4 w-full"><Sparkles className="h-4 w-4" /> Demander à l&apos;assistant IA <ArrowRight className="h-4 w-4" /></LinkButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
