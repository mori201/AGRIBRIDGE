"use client";
import { ImagePlus } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Select, Textarea } from "@/components/ui/field";
import { createPost } from "@/actions/community";
import { POST_CATEGORIES } from "@/lib/constants";

export function Composer({ groupId, isAdmin }: { groupId?: string; isAdmin?: boolean }) {
  return (
    <ActionForm action={createPost} resetOnSuccess className="surface rounded-2xl border border-base p-4">
      {groupId && <input type="hidden" name="group_id" value={groupId} />}
      <label htmlFor="post-content" className="sr-only">Votre publication</label>
      <Textarea id="post-content" name="content" placeholder="Partagez une expérience, posez une question à la communauté…" maxLength={5000} rows={3} required />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select name="kind" aria-label="Type" className="h-10 w-auto"><option value="post">Publication</option><option value="question">Question</option>{isAdmin && <option value="actualite">Actualité</option>}</Select>
        <Select name="category" aria-label="Catégorie" className="h-10 w-auto">{POST_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select>
        <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-base px-3 text-sm font-semibold hover:bg-[var(--surface-2)]">
          <ImagePlus className="h-4 w-4" /> Photo / vidéo
          <input type="file" name="media" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" className="sr-only" />
        </label>
        <SubmitButton className="ml-auto" pendingText="Publication…">Publier</SubmitButton>
      </div>
      <p className="mt-2 text-xs text-muted">Restez bienveillant. Les arnaques, spams et contenus abusifs sont supprimés et peuvent entraîner la suspension du compte.</p>
    </ActionForm>
  );
}
