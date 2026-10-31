import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, CheckCircle2, Circle, Clock, Crown, FileQuestion, Lock, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice, Progress } from "@/components/ui/misc";
import { COURSE_CATEGORIES, COURSE_LEVELS, labelOf } from "@/lib/constants";
import { CourseActions } from "./client";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*, course_modules(id,title,position, lessons(id,title,duration_minutes,position)), quizzes(id,title,module_id)")
    .eq("slug", slug)
    .maybeSingle();
  return data as CourseFull | null;
}

type CourseFull = {
  id: string; slug: string; title: string; summary: string | null; description: string | null; category: string; level: string;
  duration_minutes: number | null; is_premium: boolean; is_demo: boolean; instructor: string | null; pass_score: number;
  course_modules: { id: string; title: string; position: number; lessons: { id: string; title: string; duration_minutes: number | null; position: number }[] }[];
  quizzes: { id: string; title: string; module_id: string | null }[];
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await load((await params).slug);
  return c ? { title: c.title, description: c.summary ?? undefined } : { title: "Formation introuvable" };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const course = await load(slug);
  if (!course) notFound();
  const user = await getUser();
  const supabase = await createClient();
  const modules = [...(course.course_modules ?? [])].sort((a, b) => a.position - b.position).map((m) => ({ ...m, lessons: [...(m.lessons ?? [])].sort((a, b) => a.position - b.position) }));
  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
  const premiumLocked = course.is_premium && totalLessons === 0; // RLS masque les leçons premium aux non-abonnés

  let enrolled = false, favorite = false, done = new Set<string>(), completion: { total_lessons: number; done_lessons: number; total_quizzes: number; passed_quizzes: number } | null = null, certificate: string | null = null;
  const passed = new Set<string>();
  if (user) {
    const [{ data: e }, { data: prog }, { data: comp }, { data: cert }, { data: attempts }] = await Promise.all([
      supabase.from("course_enrollments").select("is_favorite").eq("course_id", course.id).eq("user_id", user.id).maybeSingle(),
      supabase.from("course_progress").select("lesson_id").eq("course_id", course.id).eq("user_id", user.id),
      supabase.rpc("my_course_completion", { p_course: course.id }),
      supabase.from("certificates").select("code").eq("course_id", course.id).eq("user_id", user.id).maybeSingle(),
      supabase.from("quiz_attempts").select("quiz_id,passed").eq("user_id", user.id).eq("passed", true),
    ]);
    enrolled = Boolean(e);
    favorite = Boolean(e?.is_favorite);
    done = new Set((prog ?? []).map((p) => p.lesson_id));
    completion = comp?.[0] ?? null;
    certificate = cert?.code ?? null;
    (attempts ?? []).forEach((a) => passed.add(a.quiz_id));
  }
  const pct = completion && completion.total_lessons ? Math.round((completion.done_lessons / completion.total_lessons) * 100) : 0;
  const eligible = Boolean(completion && completion.total_lessons > 0 && completion.done_lessons >= completion.total_lessons && completion.passed_quizzes >= completion.total_quizzes);
  const firstUndone = modules.flatMap((m) => m.lessons).find((l) => !done.has(l.id)) ?? modules[0]?.lessons[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link href="/academy" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> Toutes les formations</Link>
      <div className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white sm:p-8">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="leaf">{labelOf(COURSE_CATEGORIES, course.category)}</Badge>
          {course.is_premium ? <Badge tone="gold"><Crown className="h-3 w-3" /> Premium</Badge> : <Badge tone="green">Gratuite</Badge>}
          {course.is_demo && <DemoBadge label="Contenu de démonstration" />}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{course.title}</h1>
        <p className="mt-2 max-w-2xl text-brand-100">{course.description ?? course.summary}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-brand-100">
          <span>{labelOf(COURSE_LEVELS, course.level)}</span>
          {course.duration_minutes && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {course.duration_minutes} min</span>}
          <span>{totalLessons || "—"} leçons</span>
          {course.instructor && <span>Par {course.instructor}</span>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {premiumLocked && (
            <Notice tone="warning" title="Formation premium">
              Le contenu de cette formation est réservé aux membres premium. Le paiement en ligne (Wave, Orange Money) n&apos;est pas encore activé : <Link href="/contact" className="underline">contactez-nous</Link> pour y accéder.
            </Notice>
          )}
          {modules.map((m, mi) => (
            <Card key={m.id} className="overflow-hidden">
              <div className="border-b border-base px-5 py-3"><p className="text-xs font-semibold text-muted">Module {mi + 1}</p><p className="font-bold">{m.title}</p></div>
              <ul className="divide-y divide-[var(--border)]">
                {m.lessons.length === 0 && <li className="flex items-center gap-2 px-5 py-3 text-sm text-muted"><Lock className="h-4 w-4" /> Contenu réservé</li>}
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <Link href={user ? `/academy/${slug}/lecon/${l.id}` : `/connexion?next=/academy/${slug}/lecon/${l.id}`} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-[var(--surface-2)]">
                      {done.has(l.id) ? <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" /> : <Circle className="h-5 w-5 shrink-0 text-muted" />}
                      <span className="flex-1">{l.title}</span>
                      {l.duration_minutes && <span className="text-xs text-muted">{l.duration_minutes} min</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          {(course.quizzes ?? []).map((q: { id: string; title: string }) => (
            <Link key={q.id} href={user ? `/academy/${slug}/quiz/${q.id}` : `/connexion?next=/academy/${slug}/quiz/${q.id}`} className="surface flex items-center gap-3 rounded-2xl border border-base p-4 hover:border-brand-300">
              <FileQuestion className="h-6 w-6 text-gold-600" />
              <div className="flex-1"><p className="font-bold">{q.title}</p><p className="text-xs text-muted">Score minimum : {course.pass_score}%</p></div>
              {passed.has(q.id) ? <Badge tone="green">Réussi</Badge> : <Badge tone="gold">À passer</Badge>}
            </Link>
          ))}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            {user && enrolled && (
              <>
                <div className="flex justify-between text-sm font-semibold"><span>Progression</span><span>{pct}%</span></div>
                <Progress value={pct} className="mb-4 mt-2" />
              </>
            )}
            <CourseActions courseId={course.id} slug={slug} enrolled={enrolled} favorite={favorite} loggedIn={Boolean(user)} premium={course.is_premium} premiumLocked={premiumLocked} startHref={firstUndone ? `/academy/${slug}/lecon/${firstUndone.id}` : null} eligible={eligible} certificate={certificate} />
          </Card>
          <Card className="p-5 text-sm">
            <p className="flex items-center gap-2 font-bold"><Award className="h-4 w-4 text-gold-600" /> Certificat de réussite</p>
            <p className="mt-1 text-muted">Délivré uniquement après avoir terminé toutes les leçons et réussi {course.quizzes?.length ? "tous les quiz" : "la formation"} (score ≥ {course.pass_score}%). Vérifiable publiquement grâce à son code unique.</p>
            {completion && <p className="mt-2 text-xs">Leçons : {completion.done_lessons}/{completion.total_lessons} · Quiz réussis : {completion.passed_quizzes}/{completion.total_quizzes}</p>}
          </Card>
          {!user && <p className="flex items-center gap-1.5 text-xs text-muted"><PlayCircle className="h-4 w-4" /> Connectez-vous pour suivre votre progression.</p>}
        </aside>
      </div>
    </div>
  );
}
