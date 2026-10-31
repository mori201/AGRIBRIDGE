"use client";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input, Select } from "@/components/ui/field";
import { createAlert, deleteAlert } from "@/actions/opportunities";
import { REGIONS, SECTORS } from "@/lib/constants";

export function AlertForm({ categories, defaultRegion, defaultSector }: { categories: { id: number; name: string }[]; defaultRegion: string | null; defaultSector: string | null }) {
  return (
    <ActionForm action={createAlert} resetOnSuccess>
      {(s) => (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <Field label="Nom de l'alerte" htmlFor="alert-name" error={fieldError(s, "name")}><Input id="alert-name" name="name" required placeholder="Ex. Maraîchage Thiès" maxLength={100} /></Field>
          <Field label="Région" htmlFor="alert-region"><Select id="alert-region" name="region" defaultValue={defaultRegion ?? ""}><option value="">Toutes</option>{REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select></Field>
          <Field label="Secteur" htmlFor="alert-sector"><Select id="alert-sector" name="sector" defaultValue={defaultSector ?? ""}><option value="">Tous</option>{SECTORS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select></Field>
          <Field label="Type" htmlFor="alert-cat"><Select id="alert-cat" name="category_id"><option value="">Tous</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <div className="flex gap-2"><Input name="keyword" placeholder="Mot-clé" aria-label="Mot-clé" maxLength={100} /><SubmitButton pendingText="…">Créer</SubmitButton></div>
        </div>
      )}
    </ActionForm>
  );
}

export function DeleteAlertButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button aria-label="Supprimer l'alerte" disabled={pending} onClick={() => start(async () => { await deleteAlert(id); })} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
