"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, MoreHorizontal, Repeat2, Trash2 } from "lucide-react";
import { deletePost, sharePost, toggleLike } from "@/actions/community";
import { ReportButton } from "@/components/report-button";

export function LikeButton({ postId, liked, count, loggedIn }: { postId: string; liked: boolean; count: number; loggedIn: boolean }) {
  const [on, setOn] = useState(liked);
  const [n, setN] = useState(count);
  const [, start] = useTransition();
  const router = useRouter();
  return (
    <button
      aria-pressed={on}
      aria-label={on ? "Je n'aime plus" : "J'aime"}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold hover:bg-[var(--surface-2)] ${on ? "text-red-600" : "text-muted"}`}
      onClick={() => {
        if (!loggedIn) return router.push("/connexion?next=/communaute");
        setOn(!on);
        setN((x) => x + (on ? -1 : 1));
        start(async () => { await toggleLike(postId); });
      }}
    >
      <Heart className={`h-4 w-4 ${on ? "fill-current" : ""}`} /> {n}
    </button>
  );
}

export function ShareButton({ postId, loggedIn }: { postId: string; loggedIn: boolean }) {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button disabled={pending || done} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted hover:bg-[var(--surface-2)]" onClick={() => { if (!loggedIn) return router.push("/connexion?next=/communaute"); start(async () => { const r = await sharePost(postId); if (r.ok) { setDone(true); router.refresh(); } }); }}>
      <Repeat2 className="h-4 w-4" /> {done ? "Partagé" : "Partager"}
    </button>
  );
}

export function PostMenu({ postId, mine, loggedIn }: { postId: string; mine: boolean; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!loggedIn) return null;
  return (
    <div className="relative">
      <button aria-label="Options" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="rounded-lg p-1.5 text-muted hover:bg-[var(--surface-2)]"><MoreHorizontal className="h-4 w-4" /></button>
      {open && (
        <div className="surface absolute right-0 z-10 mt-1 w-44 rounded-xl border border-base p-2 shadow-lg" onMouseLeave={() => setOpen(false)}>
          {mine ? (
            <button disabled={pending} onClick={() => confirm("Supprimer cette publication ?") && start(async () => { await deletePost(postId); router.refresh(); })} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Supprimer</button>
          ) : (
            <div className="px-2 py-1.5"><ReportButton targetType="post" targetId={postId} /></div>
          )}
        </div>
      )}
    </div>
  );
}
