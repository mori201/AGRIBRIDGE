"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dbError, uuid } from "@/lib/actions-helpers";
import type { ActionResult } from "@/lib/types";

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function enroll(courseId: string, slug: string): Promise<ActionResult> {
  const { supabase, user } = await ctx();
  if (!user) redirect(`/connexion?next=/academy/${slug}`);
  const { data: course } = await supabase.from("courses").select("is_premium").eq("id", courseId).single();
  if (!course) return { ok: false, error: "Formation introuvable." };
  if (course.is_premium) {
    const { data: premium } = await supabase.rpc("has_premium");
    if (!premium) return { ok: false, error: "Cette formation est premium. Le paiement en ligne n'est pas encore disponible : contactez-nous pour y accéder." };
  }
  const { error } = await supabase.from("course_enrollments").upsert({ user_id: user.id, course_id: courseId }, { onConflict: "user_id,course_id", ignoreDuplicates: true });
  if (error) return dbError(error);
  revalidatePath(`/academy/${slug}`);
  return { ok: true, message: "Inscription confirmée. Bonne formation !" };
}

export async function toggleFavoriteCourse(courseId: string, slug: string, fav: boolean): Promise<ActionResult> {
  const { supabase, user } = await ctx();
  if (!user) redirect(`/connexion?next=/academy/${slug}`);
  const { error } = await supabase.from("course_enrollments").upsert({ user_id: user.id, course_id: courseId, is_favorite: fav }, { onConflict: "user_id,course_id" });
  if (error) return dbError(error);
  revalidatePath(`/academy/${slug}`);
  return { ok: true };
}

export async function completeLesson(courseId: string, lessonId: string, slug: string, nextHref: string | null): Promise<ActionResult> {
  const { supabase, user } = await ctx();
  if (!user) redirect(`/connexion?next=/academy/${slug}`);
  if (!uuid.safeParse(lessonId).success) return { ok: false, error: "Leçon invalide." };
  await supabase.from("course_enrollments").upsert({ user_id: user.id, course_id: courseId }, { onConflict: "user_id,course_id", ignoreDuplicates: true });
  const { error } = await supabase.from("course_progress").upsert({ user_id: user.id, lesson_id: lessonId, course_id: courseId }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
  if (error) return dbError(error);
  revalidatePath(`/academy/${slug}`);
  if (nextHref) redirect(nextHref);
  return { ok: true };
}

export async function submitQuiz(quizId: string, answers: number[]): Promise<ActionResult<{ score: number; passed: boolean; correct: number[] }>> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "Connectez-vous pour passer le quiz." };
  const { data, error } = await supabase.rpc("submit_quiz", { p_quiz: quizId, p_answers: answers });
  if (error) return dbError(error);
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, data: { score: row.score, passed: row.passed, correct: row.correct } };
}

export async function claimCertificate(courseId: string, slug: string): Promise<ActionResult<{ code: string }>> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "Non connecté." };
  const { data, error } = await supabase.rpc("claim_certificate", { p_course: courseId });
  if (error) return dbError(error);
  revalidatePath(`/academy/${slug}`);
  revalidatePath("/tableau-de-bord/certificats");
  return { ok: true, data: { code: data as string }, message: "Certificat délivré !" };
}
