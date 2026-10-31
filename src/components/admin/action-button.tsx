"use client";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

export function ActionButton({ action, children, confirmText, tone = "default", className }: { action: () => Promise<ActionResult>; children: React.ReactNode; confirmText?: string; tone?: "default" | "danger" | "success"; className?: string }) {
  const [p, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const cls = { default: "border-base hover:bg-[var(--surface-2)]", danger: "border-red-200 text-red-700 hover:bg-red-50", success: "border-brand-200 text-brand-800 hover:bg-brand-50" }[tone];
  return (
    <span className="inline-flex flex-col">
      <button disabled={p} onClick={() => (!confirmText || confirm(confirmText)) && start(async () => { const r = await action(); setErr(r.ok ? null : r.error); })} className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold disabled:opacity-50", cls, className)}>
        {p && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{children}
      </button>
      {err && <span className="mt-0.5 text-[11px] text-red-600">{err}</span>}
    </span>
  );
}
