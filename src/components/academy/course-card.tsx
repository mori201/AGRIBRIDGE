import Link from "@/components/ui/link";
import { Clock, Crown, GraduationCap } from "lucide-react";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { COURSE_CATEGORIES, COURSE_LEVELS, labelOf } from "@/lib/constants";

export type CourseLite = { id: string; slug: string; title: string; summary: string | null; category: string; level: string; duration_minutes: number | null; is_premium: boolean; is_demo: boolean; cover_url: string | null };

const GRADIENTS = ["from-brand-600 to-brand-800", "from-leaf-500 to-brand-700", "from-gold-500 to-gold-700", "from-brand-500 to-brand-900"];

export function CourseCard({ c, i = 0 }: { c: CourseLite; i?: number }) {
  return (
    <Link href={`/academy/${c.slug}`} className="group surface flex flex-col overflow-hidden rounded-2xl border border-base transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`relative grid h-28 place-items-center bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} text-white`}>
        <GraduationCap className="h-10 w-10 opacity-80" aria-hidden />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {c.is_premium ? <Badge tone="gold"><Crown className="h-3 w-3" /> Premium</Badge> : <Badge tone="green">Gratuite</Badge>}
          {c.is_demo && <DemoBadge />}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold text-brand-700 dark:text-leaf-300">{labelOf(COURSE_CATEGORIES, c.category)}</p>
        <h3 className="mt-1 line-clamp-2 font-bold group-hover:text-brand-700">{c.title}</h3>
        {c.summary && <p className="mt-1 line-clamp-2 text-sm text-muted">{c.summary}</p>}
        <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-muted">
          <span>{labelOf(COURSE_LEVELS, c.level)}</span>
          {c.duration_minutes && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.duration_minutes} min</span>}
        </div>
      </div>
    </Link>
  );
}
