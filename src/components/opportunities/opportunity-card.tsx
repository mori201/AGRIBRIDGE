import Link from "next/link";
import { CalendarClock, MapPin, Wallet } from "lucide-react";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { amountRange, daysUntil, deadlineStatus, DEADLINE_LABELS, formatDate } from "@/lib/format";
import { labelsOf, OPP_REGIONS } from "@/lib/constants";
import type { Opportunity } from "@/lib/types";
import type { MatchResult } from "@/lib/matching";
import { cn } from "@/lib/utils";

export function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const s = deadlineStatus(deadline);
  const tone = { ouverte: "green", bientot: "gold", cloturee: "red", permanente: "blue" }[s];
  return <Badge tone={tone}>{DEADLINE_LABELS[s]}</Badge>;
}

export function MatchBadge({ match }: { match: MatchResult }) {
  const tone = match.level === "forte" ? "green" : match.level === "moyenne" ? "gold" : "gray";
  return (
    <Badge tone={tone} title="Correspondance indicative avec votre profil">
      {match.score}% compatible
    </Badge>
  );
}

export function OpportunityCard({ opp, match, className }: { opp: Opportunity; match?: MatchResult; className?: string }) {
  const days = daysUntil(opp.deadline);
  const regions = opp.regions.includes("national") ? "Tout le Sénégal" : labelsOf(OPP_REGIONS, opp.regions).slice(0, 3).join(", ");
  return (
    <Link href={`/opportunites/${opp.id}`} className={cn("group surface flex flex-col rounded-2xl border border-base p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg", opp.is_premium && "ring-1 ring-gold-300", className)}>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Badge tone="leaf">{opp.opportunity_categories?.name ?? "Opportunité"}</Badge>
        <DeadlineBadge deadline={opp.deadline} />
        {opp.is_demo && <DemoBadge />}
        {match && <MatchBadge match={match} />}
      </div>
      <h3 className="line-clamp-2 text-base font-bold leading-snug group-hover:text-brand-700 dark:group-hover:text-leaf-300">{opp.title}</h3>
      <p className="mt-1 text-sm font-medium text-muted">{opp.funder_name}</p>
      {opp.summary && <p className="mt-2 line-clamp-2 text-sm text-muted">{opp.summary}</p>}
      <div className="mt-auto space-y-1.5 pt-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-gold-700 dark:text-gold-300">
          <Wallet className="h-4 w-4" aria-hidden /> {amountRange(opp.amount_min, opp.amount_max)}
        </p>
        <p className="flex items-center gap-2 text-muted">
          <MapPin className="h-4 w-4" aria-hidden /> <span className="truncate">{regions || "Non précisé"}</span>
        </p>
        <p className="flex items-center gap-2 text-muted">
          <CalendarClock className="h-4 w-4" aria-hidden />
          {opp.deadline ? (
            <span>
              {formatDate(opp.deadline)}
              {days !== null && days >= 0 && <span className={cn("ml-1 font-semibold", days <= 10 && "text-red-600")}>· J-{days}</span>}
            </span>
          ) : (
            "Sans date limite"
          )}
        </p>
      </div>
    </Link>
  );
}

export const OPP_SELECT = "id,title,summary,funder_name,category_id,amount_min,amount_max,regions,sectors,beneficiary_types,project_stages,required_documents,deadline,application_mode,is_demo,is_premium,status,published_at,created_at,opportunity_categories(name,slug)";
