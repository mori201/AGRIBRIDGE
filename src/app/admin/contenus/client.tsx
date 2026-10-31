"use client";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { saveBlogPost, saveWebinar } from "@/actions/admin";

export function BlogForm({ post }: { post?: { id: string; title: string; excerpt: string | null; content: string; category: string; is_published: boolean } }) {
  return (
    <ActionForm action={saveBlogPost} resetOnSuccess={!post}>
      {(s) => (
        <div className="grid gap-3 sm:grid-cols-2">
          {post && <input type="hidden" name="id" value={post.id} />}
          <Field label="Titre" htmlFor="b-title" error={fieldError(s, "title")}><Input id="b-title" name="title" defaultValue={post?.title} required /></Field>
          <Field label="Catégorie" htmlFor="b-cat"><Input id="b-cat" name="category" defaultValue={post?.category ?? "actualite"} /></Field>
          <Field label="Chapô" htmlFor="b-ex" className="sm:col-span-2"><Input id="b-ex" name="excerpt" defaultValue={post?.excerpt ?? ""} /></Field>
          <Field label="Contenu (Markdown simple)" htmlFor="b-content" error={fieldError(s, "content")} className="sm:col-span-2"><Textarea id="b-content" name="content" defaultValue={post?.content} rows={10} required /></Field>
          <Checkbox name="is_published" label="Publier" defaultChecked={post?.is_published ?? true} />
          <div className="sm:col-span-2"><SubmitButton>Enregistrer</SubmitButton></div>
        </div>
      )}
    </ActionForm>
  );
}

export function WebinarForm() {
  return (
    <ActionForm action={saveWebinar} resetOnSuccess>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="title" placeholder="Titre" required aria-label="Titre" />
        <Input name="starts_at" type="datetime-local" required aria-label="Date et heure" />
        <Input name="speaker" placeholder="Intervenant" aria-label="Intervenant" />
        <Input name="url" type="url" placeholder="Lien de connexion (facultatif)" aria-label="Lien" />
        <Textarea name="description" placeholder="Description" className="sm:col-span-2" aria-label="Description" />
        <SubmitButton>Programmer</SubmitButton>
      </div>
    </ActionForm>
  );
}
