"use client";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createOrganization } from "@/actions/profile";
import { ORG_TYPES } from "@/lib/constants";

export function CreateOrgForm() {
  return (
    <ActionForm action={createOrganization}>
      {(s) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom de l'organisation" htmlFor="name" error={fieldError(s, "name")} className="sm:col-span-2"><Input id="name" name="name" required maxLength={160} /></Field>
          <Field label="Type" htmlFor="type"><Select id="type" name="type">{ORG_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></Field>
          <Field label="Site web" htmlFor="website" error={fieldError(s, "website")}><Input id="website" name="website" type="url" placeholder="https://" /></Field>
          <Field label="E-mail" htmlFor="email" error={fieldError(s, "email")}><Input id="email" name="email" type="email" /></Field>
          <Field label="Téléphone" htmlFor="phone"><Input id="phone" name="phone" type="tel" /></Field>
          <Field label="Présentation" htmlFor="description" className="sm:col-span-2"><Textarea id="description" name="description" maxLength={3000} /></Field>
          <div className="sm:col-span-2"><SubmitButton size="lg">Créer mon organisation</SubmitButton><p className="mt-2 text-xs text-muted">Vous pourrez préparer vos opportunités immédiatement. Le badge « vérifié » et la visibilité publique de l&apos;organisation sont accordés après contrôle par l&apos;équipe AgriBridge.</p></div>
        </div>
      )}
    </ActionForm>
  );
}
