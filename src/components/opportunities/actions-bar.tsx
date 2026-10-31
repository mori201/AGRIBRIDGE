"use client";
import { useOptimistic, useTransition, useState } from "react";
import { Bookmark, BookmarkCheck, ClipboardList, ExternalLink, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startApplication, toggleSaveOpportunity } from "@/actions/opportunities";
import Link from "next/link";

export function SaveButton({ id, saved, compact = false }: { id: string; saved: boolean; compact?: boolean }) {
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(saved);
  return (
    <Button
      variant={optimistic ? "secondary" : "outline"}
      size={compact ? "sm" : "md"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          await toggleSaveOpportunity(id, `/opportunites/${id}`);
        })
      }
      aria-pressed={optimistic}
    >
      {optimistic ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {optimistic ? "Enregistrée" : "Enregistrer"}
    </Button>
  );
}

export function ApplyActions({ id, applicationId, mode, url, closed, loggedIn }: { id: string; applicationId?: string | null; mode: string; url: string | null; closed: boolean; loggedIn: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {applicationId ? (
        <Link href={`/tableau-de-bord/candidatures/${applicationId}`} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 font-semibold text-white hover:bg-brand-800">
          <ClipboardList className="h-4 w-4" /> Suivre ma candidature
        </Link>
      ) : (
        <Button
          size="lg"
          className="w-full"
          disabled={closed || pending}
          onClick={() =>
            start(async () => {
              const r = await startApplication(id);
              if (r && !r.ok) setErr(r.error);
            })
          }
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
          {closed ? "Candidatures clôturées" : mode === "platform" ? "Préparer ma candidature" : loggedIn ? "Préparer et suivre mon dossier" : "Se connecter pour candidater"}
        </Button>
      )}
      {mode === "external" && url && !closed && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-base font-semibold hover:bg-[var(--surface-2)]">
          Site officiel de candidature <ExternalLink className="h-4 w-4" />
        </a>
      )}
      {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
    </div>
  );
}

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) {
          try { await navigator.share({ title, url }); } catch {}
        } else {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }}
    >
      <Share2 className="h-4 w-4" /> {copied ? "Lien copié" : "Partager"}
    </button>
  );
}
