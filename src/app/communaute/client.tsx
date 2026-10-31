"use client";
import { useState } from "react";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Input, Select, Textarea } from "@/components/ui/field";
import { createGroup } from "@/actions/community";
import { POST_CATEGORIES } from "@/lib/constants";

export function CreateGroupForm() {
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} className="mt-3 w-full rounded-xl border border-dashed border-base py-2 text-sm font-semibold hover:bg-[var(--surface-2)]">+ Créer un groupe</button>;
  return (
    <ActionForm action={createGroup} resetOnSuccess className="mt-3">
      {(s) => (
        <div className="space-y-2">
          <Input name="name" placeholder="Nom du groupe" required maxLength={80} aria-label="Nom du groupe" />
          {fieldError(s, "name") && <p className="text-xs text-red-600">{fieldError(s, "name")}</p>}
          <Select name="category" aria-label="Catégorie">{POST_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select>
          <Textarea name="description" placeholder="Description (facultatif)" maxLength={500} rows={2} aria-label="Description" />
          <SubmitButton size="sm" className="w-full">Créer</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}
