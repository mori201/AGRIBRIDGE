"use client";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { saveCategory, saveSettings } from "@/actions/admin";

export function SettingsForm({ limits, general }: { limits: { ai_hourly_limit?: number }; general: { announcement?: string; contact_email?: string; maintenance?: boolean } }) {
  return (
    <ActionForm action={saveSettings}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Messages IA par utilisateur et par heure" htmlFor="ai"><Input id="ai" name="ai_hourly_limit" inputMode="numeric" defaultValue={limits.ai_hourly_limit ?? 30} /></Field>
        <Field label="E-mail de contact public" htmlFor="ce"><Input id="ce" name="contact_email" type="email" defaultValue={general.contact_email ?? ""} /></Field>
        <Field label="Bandeau d'annonce (accueil)" htmlFor="an" className="sm:col-span-2"><Input id="an" name="announcement" defaultValue={general.announcement ?? ""} maxLength={300} /></Field>
        <Checkbox name="maintenance" label="Afficher un bandeau de maintenance" defaultChecked={general.maintenance} />
        <div className="sm:col-span-2"><SubmitButton>Enregistrer</SubmitButton></div>
      </div>
    </ActionForm>
  );
}

export function CategoryForm({ table }: { table: string }) {
  return (
    <ActionForm action={saveCategory} resetOnSuccess className="mt-2">
      <div className="flex gap-2"><input type="hidden" name="table" value={table} /><Input name="name" placeholder="Nouvelle catégorie" required aria-label="Nom de la catégorie" /><SubmitButton size="sm" variant="secondary">Ajouter</SubmitButton></div>
    </ActionForm>
  );
}
