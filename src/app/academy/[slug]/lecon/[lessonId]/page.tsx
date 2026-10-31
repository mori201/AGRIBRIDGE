import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, FileDown, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Markdown } from "@/lib/markdown";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { CompleteLessonButton } from "./client";

export const metadata: Metadata = { title: "Leçon" };

function embed(url: string) {
  const yt = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/.exec(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = /vimeo\.com\/(\d+)/.exec(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export default async function Page({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  const { user } = await requireUser(`/academy/${slug}/lecon/${lessonId}`);
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("id,title,is_premium, course_modules(id,title,position, lessons(id,title,position))").eq("slug", slug).maybeSingle();
  if (!course) notFound();
  const ordered = [...course.course_modules].sort((a, b) => a.position - b.position).flatMap((m) => [...m.lessons].sort((a, b) => a.position - b.position).map((l) => ({ ...l, module: m.title })));
  const { data: lesson } = await supabase.from("lessons").select("*").eq("id", lessonId).maybeSingle();
  if (!lesson) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Lock className="mx-auto h-10 w-10 text-gold-600" />
        <h1 className="mt-3 text-xl font-bold">Leçon réservée</h1>
        <p className="mt-1 text-muted">Cette leçon fait partie d&apos;une formation premium ou n&apos;existe plus.</p>
        <LinkButton href={`/academy/${slug}`} className="mt-5">Retour à la formation</LinkButton>
      </div>
    );
  }
  const idx = ordered.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;
  const { data: done } = await supabase.from("course_progress").select("lesson_id").eq("lesson_id", lessonId).eq("user_id", user.id).maybeSingle();
  const video = lesson.video_url ? embed(lesson.video_url) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href={`/academy/${slug}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> {course.title}</Link>
      <p className="text-sm font-semibold text-brand-700">{ordered[idx]?.module} · Leçon {idx + 1}/{ordered.length}</p>
      <h1 className="mt-1 text-2xl font-extrabold">{lesson.title}</h1>
      {video && (
        <div className="mt-5 aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe src={video} title={lesson.title} className="h-full w-full" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
        </div>
      )}
      {lesson.video_url && !video && <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block font-semibold text-brand-700 underline">Voir la vidéo</a>}
      <Card className="mt-5 p-5 sm:p-6"><Markdown source={lesson.content} /></Card>
      {lesson.pdf_url && (
        <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-base px-4 py-2.5 text-sm font-semibold hover:bg-[var(--surface-2)]"><FileDown className="h-4 w-4" /> Télécharger le support PDF</a>
      )}
      <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        {prev ? <LinkButton href={`/academy/${slug}/lecon/${prev.id}`} variant="ghost"><ArrowLeft className="h-4 w-4" /> Précédente</LinkButton> : <span />}
        {done ? (
          next ? <LinkButton href={`/academy/${slug}/lecon/${next.id}`}><CheckCircle2 className="h-4 w-4" /> Leçon suivante <ArrowRight className="h-4 w-4" /></LinkButton> : <LinkButton href={`/academy/${slug}`}><CheckCircle2 className="h-4 w-4" /> Retour à la formation</LinkButton>
        ) : (
          <CompleteLessonButton courseId={course.id} lessonId={lesson.id} slug={slug} nextHref={next ? `/academy/${slug}/lecon/${next.id}` : `/academy/${slug}`} />
        )}
      </div>
    </div>
  );
}
