import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { CalendarDays, GraduationCap, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CourseCard, type CourseLite } from "@/components/academy/course-card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { COURSE_CATEGORIES, COURSE_LEVELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { DemoBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "AgriAcademy — Formations agricoles", description: "Formations gratuites et premium : entrepreneuriat agricole, gestion financière, techniques de production, préparation aux financements." };

export default async function Page({ searchParams }: { searchParams: Promise<{ categorie?: string; niveau?: string; acces?: string; q?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("courses").select("id,slug,title,summary,category,level,duration_minutes,is_premium,is_demo,cover_url").eq("is_published", true).order("created_at");
  if (sp.categorie) q = q.eq("category", sp.categorie);
  if (sp.niveau) q = q.eq("level", sp.niveau);
  if (sp.acces === "gratuit") q = q.eq("is_premium", false);
  if (sp.acces === "premium") q = q.eq("is_premium", true);
  if (sp.q) q = q.ilike("title", `%${sp.q.replace(/[%_,()]/g, " ").slice(0, 60)}%`);
  const [{ data: courses }, { data: webinars }] = await Promise.all([q, supabase.from("webinars").select("*").gte("starts_at", new Date().toISOString()).order("starts_at").limit(4)]);
  const chip = (key: string, value: string, label: string) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    const on = sp[key as keyof typeof sp] === value;
    if (on) p.delete(key); else p.set(key, value);
    return <Link key={value} href={`/academy?${p}`} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${on ? "bg-brand-700 text-white" : "border border-base hover:bg-[var(--surface-2)]"}`}>{label}</Link>;
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="AgriAcademy" description="Formez-vous à votre rythme : vidéos, supports, quiz et certificats de réussite." />
      <form className="mb-4" action="/academy">
        <input type="search" name="q" defaultValue={sp.q} placeholder="Rechercher une formation…" aria-label="Rechercher une formation" className="h-12 w-full rounded-xl border border-base surface px-4 text-[15px]" />
      </form>
      <div className="mb-2 flex flex-wrap gap-2">{chip("acces", "gratuit", "Gratuites")}{chip("acces", "premium", "Premium")}{COURSE_LEVELS.map((l) => chip("niveau", l.value, l.label))}</div>
      <div className="mb-6 flex flex-wrap gap-2">{COURSE_CATEGORIES.map((c) => chip("categorie", c.value, c.label))}</div>
      {(courses ?? []).length === 0 ? (
        <EmptyState icon={GraduationCap} title="Aucune formation trouvée" description="Modifiez vos filtres." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(courses as CourseLite[]).map((c, i) => <CourseCard key={c.id} c={c} i={i} />)}</div>
      )}
      <section className="mt-12">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Video className="h-5 w-5" /> Webinaires à venir</h2>
        {(webinars ?? []).length === 0 ? <p className="text-sm text-muted">Aucun webinaire programmé pour le moment.</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {(webinars ?? []).map((w) => (
              <div key={w.id} className="surface flex gap-4 rounded-2xl border border-base p-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700"><CalendarDays className="h-6 w-6" /></div>
                <div>
                  <p className="flex items-center gap-2 font-bold">{w.title} {w.is_demo && <DemoBadge />}</p>
                  <p className="text-sm text-muted">{formatDate(w.starts_at, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}{w.speaker && ` · ${w.speaker}`}</p>
                  {w.description && <p className="mt-1 text-sm">{w.description}</p>}
                  {w.url ? <a href={w.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-brand-700 underline">Rejoindre</a> : <p className="mt-1 text-xs text-muted">Lien communiqué avant la session.</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
