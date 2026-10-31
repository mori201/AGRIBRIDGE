"use client";
import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";
import { submitQuiz } from "@/actions/academy";
import { cn } from "@/lib/utils";

export function QuizRunner({ quizId, slug, questions, passScore }: { quizId: string; slug: string; questions: { id: string; question: string; options: string[] }[]; passScore: number }) {
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const complete = answers.every((a) => a !== null);
  return (
    <div className="mt-6 space-y-4">
      {result && (
        <Notice tone={result.passed ? "success" : "warning"} title={result.passed ? `Bravo, quiz réussi (${result.score}%) !` : `Score : ${result.score}% — il faut ${passScore}% pour réussir.`}>
          {result.passed ? "Revenez à la formation pour obtenir votre certificat si toutes les leçons sont terminées." : "Relisez les leçons puis retentez votre chance."}
        </Notice>
      )}
      {err && <Notice tone="error">{err}</Notice>}
      {questions.map((q, qi) => (
        <fieldset key={q.id} className="surface rounded-2xl border border-base p-4">
          <legend className="px-1 font-semibold">{qi + 1}. {q.question}</legend>
          <div className="mt-2 space-y-2">
            {q.options.map((o, oi) => {
              const chosen = answers[qi] === oi;
              const isCorrect = result?.correct[qi] === oi;
              return (
                <label key={oi} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition", chosen ? "border-brand-600 bg-brand-50 dark:bg-brand-900/30" : "border-base", result && isCorrect && "border-brand-600 bg-brand-50", result && chosen && !isCorrect && "border-red-400 bg-red-50 dark:bg-red-950/30")}>
                  <input type="radio" name={q.id} className="accent-[var(--color-brand-700)]" checked={chosen} disabled={Boolean(result)} onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))} />
                  <span className="flex-1">{o}</span>
                  {result && isCorrect && <CheckCircle2 className="h-4 w-4 text-brand-600" />}
                  {result && chosen && !isCorrect && <XCircle className="h-4 w-4 text-red-500" />}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-2">
        {!result ? (
          <Button size="lg" disabled={!complete || pending} onClick={() => start(async () => { setErr(null); const r = await submitQuiz(quizId, answers as number[]); if (r.ok && r.data) setResult(r.data); else if (!r.ok) setErr(r.error); })}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Valider mes réponses
          </Button>
        ) : (
          <>
            <LinkButton href={`/academy/${slug}`} size="lg">Retour à la formation</LinkButton>
            {!result.passed && <Button variant="outline" size="lg" onClick={() => { setResult(null); setAnswers(questions.map(() => null)); }}><RotateCcw className="h-4 w-4" /> Recommencer</Button>}
          </>
        )}
      </div>
    </div>
  );
}
