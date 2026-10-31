import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { QuizRunner } from "./client";

export const metadata: Metadata = { title: "Quiz" };

export default async function Page({ params }: { params: Promise<{ slug: string; quizId: string }> }) {
  const { slug, quizId } = await params;
  const { user } = await requireUser(`/academy/${slug}/quiz/${quizId}`);
  if (!/^[0-9a-f-]{36}$/i.test(quizId)) notFound();
  const supabase = await createClient();
  const [{ data: quiz }, { data: questions }, { data: attempts }, { data: course }] = await Promise.all([
    supabase.from("quizzes").select("id,title,course_id").eq("id", quizId).maybeSingle(),
    supabase.rpc("get_quiz", { p_quiz: quizId }),
    supabase.from("quiz_attempts").select("score,passed,created_at").eq("quiz_id", quizId).eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("courses").select("pass_score,title").eq("slug", slug).maybeSingle(),
  ]);
  if (!quiz || !questions?.length || !course) notFound();
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href={`/academy/${slug}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> {course.title}</Link>
      <h1 className="text-2xl font-extrabold">{quiz.title}</h1>
      <p className="mt-1 text-muted">{questions.length} questions · score minimum {course.pass_score}% · la correction est calculée par le serveur.</p>
      {(attempts ?? []).length > 0 && <p className="mt-2 text-sm">Meilleur score : <strong>{Math.max(...(attempts ?? []).map((a) => a.score))}%</strong> ({attempts!.length} tentative(s) récentes)</p>}
      <QuizRunner quizId={quizId} slug={slug} questions={questions as { id: string; question: string; options: string[] }[]} passScore={course.pass_score} />
    </div>
  );
}
