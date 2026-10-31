import { cn } from "@/lib/utils";
import * as React from "react";

const tones: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  green: "bg-brand-50 text-brand-800 dark:bg-brand-900/50 dark:text-brand-100",
  leaf: "bg-leaf-100 text-brand-800",
  gold: "bg-gold-100 text-gold-700 dark:bg-gold-700/30 dark:text-gold-100",
  red: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200",
  blue: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200",
  purple: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200",
  orange: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200",
};

export function Badge({ tone = "gray", className, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone] ?? tones.gray, className)} {...p} />;
}

export function DemoBadge({ label = "Démo" }: { label?: string }) {
  return (
    <Badge tone="orange" title="Contenu fictif de démonstration">
      {label}
    </Badge>
  );
}
