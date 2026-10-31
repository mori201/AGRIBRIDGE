"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Archive, Eye, Pencil, Trash2 } from "lucide-react";
import { archiveOpportunity, deleteOpportunity } from "@/actions/partner";

export function OppRowActions({ id, status }: { id: string; status: string }) {
  const [p, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const btn = "rounded-lg p-2 hover:bg-[var(--surface-2)]";
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/opportunites/${id}`} className={btn} aria-label="Aperçu"><Eye className="h-4 w-4" /></Link>
      <Link href={`/partenaire/opportunites/${id}`} className={btn} aria-label="Modifier"><Pencil className="h-4 w-4" /></Link>
      {status === "published" ? (
        <button disabled={p} className={btn} aria-label="Archiver" onClick={() => confirm("Archiver cette opportunité ? Elle ne sera plus visible.") && start(async () => { await archiveOpportunity(id); })}><Archive className="h-4 w-4" /></button>
      ) : (
        <button disabled={p} className={`${btn} text-red-600`} aria-label="Supprimer" onClick={() => confirm("Supprimer définitivement ?") && start(async () => { const r = await deleteOpportunity(id); if (!r.ok) setErr(r.error); })}><Trash2 className="h-4 w-4" /></button>
      )}
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}
