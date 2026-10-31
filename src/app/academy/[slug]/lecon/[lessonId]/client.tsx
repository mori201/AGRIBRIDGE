"use client";
import { useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeLesson } from "@/actions/academy";

export function CompleteLessonButton({ courseId, lessonId, slug, nextHref }: { courseId: string; lessonId: string; slug: string; nextHref: string }) {
  const [pending, start] = useTransition();
  return (
    <Button disabled={pending} onClick={() => start(async () => { await completeLesson(courseId, lessonId, slug, nextHref); })}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Marquer comme terminée et continuer
    </Button>
  );
}
