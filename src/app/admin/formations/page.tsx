import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { deleteRow } from "@/actions/admin";
import { LessonForm, ModuleForm, QuestionForm, CourseForm } from "./client";

export const metadata: Metadata = { title: "Gestion des formations" };

type C = { id: string; slug: string; title: string; summary: string | null; description: string | null; category: string; level: string; duration_minutes: number | null; instructor: string | null; pass_score: number; is_premium: boolean; is_published: boolean; is_demo: boolean;
  course_modules: { id: string; title: string; position: number; lessons: { id: string; title: string; position: number }[] }[]; quizzes: { id: string; quiz_questions: { id: string; question: string }[] }[] };

export default async function Page({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*, course_modules(id,title,position, lessons(id,title,position)), quizzes(id, quiz_questions(id,question))").order("created_at");
  const courses = (data ?? []) as C[];
  const current = courses.find((c) => c.id === edit);
  return (
    <div className="space-y-5">
      <PageHeader title="Gestion des formations" />
      <Card className="p-5"><h2 className="mb-3 font-bold">{current ? `Modifier : ${current.title}` : "Nouvelle formation"}</h2><CourseForm key={current?.id ?? "new"} course={current} />{current && <Link href="/admin/formations" className="mt-2 inline-block text-sm underline">Annuler</Link>}</Card>
      {courses.map((c) => (
        <Card key={c.id} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2"><Link href={`/academy/${c.slug}`} className="font-bold hover:underline">{c.title}</Link>{c.is_published ? <Badge tone="green">Publiée</Badge> : <Badge>Non publiée</Badge>}{c.is_premium && <Badge tone="gold">Premium</Badge>}{c.is_demo && <DemoBadge />}</div>
            <div className="flex gap-2"><Link href={`?edit=${c.id}`} className="inline-flex h-8 items-center rounded-lg border border-base px-2.5 text-xs font-semibold">Modifier</Link><ActionButton tone="danger" confirmText="Supprimer la formation et tout son contenu ?" action={deleteRow.bind(null, "courses", c.id, "/admin/formations")}>Supprimer</ActionButton></div>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-brand-700">Contenu : {c.course_modules.length} module(s), {c.course_modules.reduce((n, m) => n + m.lessons.length, 0)} leçon(s), {c.quizzes.reduce((n, q) => n + q.quiz_questions.length, 0)} question(s)</summary>
            <div className="mt-3 space-y-3">
              {[...c.course_modules].sort((a, b) => a.position - b.position).map((m) => (
                <div key={m.id} className="rounded-xl border border-base p-3">
                  <div className="flex items-center justify-between"><p className="font-semibold">{m.position}. {m.title}</p><ActionButton tone="danger" confirmText="Supprimer ce module ?" action={deleteRow.bind(null, "course_modules", m.id, "/admin/formations")}>Supprimer</ActionButton></div>
                  <ul className="mt-2 space-y-1 text-sm">{[...m.lessons].sort((a, b) => a.position - b.position).map((l) => <li key={l.id} className="flex items-center justify-between gap-2"><span>• {l.title}</span><ActionButton tone="danger" action={deleteRow.bind(null, "lessons", l.id, "/admin/formations")}>×</ActionButton></li>)}</ul>
                  <LessonForm moduleId={m.id} next={m.lessons.length + 1} />
                </div>
              ))}
              <ModuleForm courseId={c.id} next={c.course_modules.length + 1} />
              <div className="rounded-xl border border-base p-3">
                <p className="font-semibold">Quiz final</p>
                <ul className="mt-2 space-y-1 text-sm">{c.quizzes.flatMap((q) => q.quiz_questions).map((qq) => <li key={qq.id} className="flex items-center justify-between gap-2"><span>• {qq.question}</span><ActionButton tone="danger" action={deleteRow.bind(null, "quiz_questions", qq.id, "/admin/formations")}>×</ActionButton></li>)}</ul>
                <QuestionForm courseId={c.id} />
              </div>
            </div>
          </details>
        </Card>
      ))}
    </div>
  );
}
