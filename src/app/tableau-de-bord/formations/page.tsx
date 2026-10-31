import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { GraduationCap, Heart } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader, Progress } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Mes formations" };

export default async function Page() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("course_enrollments").select("course_id,is_favorite,created_at,courses(slug,title,summary)").eq("user_id", profile.id).order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as { course_id: string; is_favorite: boolean; created_at: string; courses: { slug: string; title: string; summary: string | null } }[];
  const comps = await Promise.all(rows.map(async (r) => (await supabase.rpc("my_course_completion", { p_course: r.course_id })).data?.[0]));
  const { data: history } = await supabase.from("course_progress").select("completed_at, lessons(title), courses(title,slug)").eq("user_id", profile.id).order("completed_at", { ascending: false }).limit(8);
  return (
    <div className="space-y-6">
      <PageHeader title="Mes formations" actions={<LinkButton href="/academy" size="sm">Catalogue</LinkButton>} />
      {rows.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Vous ne suivez aucune formation" action={<LinkButton href="/academy" variant="secondary">Découvrir AgriAcademy</LinkButton>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r, i) => {
            const c = comps[i];
            const pct = c && c.total_lessons ? Math.round((c.done_lessons / c.total_lessons) * 100) : 0;
            return (
              <Link key={r.course_id} href={`/academy/${r.courses.slug}`} className="surface rounded-2xl border border-base p-4 hover:border-brand-300">
                <div className="flex items-start justify-between gap-2"><p className="font-bold">{r.courses.title}</p>{r.is_favorite && <Heart className="h-4 w-4 shrink-0 fill-red-500 text-red-500" />}</div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{r.courses.summary}</p>
                <div className="mt-3 flex justify-between text-xs"><span>{c?.done_lessons ?? 0}/{c?.total_lessons ?? 0} leçons</span>{pct === 100 ? <Badge tone="green">Terminée</Badge> : <span>{pct}%</span>}</div>
                <Progress value={pct} className="mt-1.5" />
              </Link>
            );
          })}
        </div>
      )}
      {(history ?? []).length > 0 && (
        <section>
          <h2 className="mb-2 font-bold">Historique récent</h2>
          <ul className="space-y-1 text-sm">
            {(history as unknown as { completed_at: string; lessons: { title: string }; courses: { title: string; slug: string } }[]).map((h, i) => (
              <li key={i} className="text-muted">✓ {h.lessons?.title} — <Link href={`/academy/${h.courses.slug}`} className="underline">{h.courses.title}</Link> · {relativeTime(h.completed_at)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
