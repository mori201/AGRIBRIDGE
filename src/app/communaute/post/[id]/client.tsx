"use client";
import { useTransition } from "react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Textarea } from "@/components/ui/field";
import { addComment, deleteComment } from "@/actions/community";

export function CommentForm({ postId }: { postId: string }) {
  return (
    <ActionForm action={addComment} resetOnSuccess>
      <input type="hidden" name="post_id" value={postId} />
      <Textarea name="content" placeholder="Votre réponse…" required maxLength={2000} rows={3} aria-label="Votre commentaire" />
      <SubmitButton className="mt-2" pendingText="Envoi…">Publier</SubmitButton>
    </ActionForm>
  );
}

export function DeleteCommentButton({ id, postId }: { id: string; postId: string }) {
  const [p, start] = useTransition();
  return <button disabled={p} className="text-xs font-semibold text-red-600 hover:underline" onClick={() => confirm("Supprimer ce commentaire ?") && start(async () => { await deleteComment(id, postId); })}>Supprimer</button>;
}
