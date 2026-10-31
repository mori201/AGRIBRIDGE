"use client";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { updateOrganization } from "@/actions/profile";
import { ORG_TYPES } from "@/lib/constants";

type Org = { id: string; name: string; type: string; description: string | null; website: string | null; email: string | null; phone: string | null };

export function OrgForm({ org }: { org: Org }) {
  return (
    <ActionForm action={updateOrganization}>
      {(s) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={org.id} />
          <Field label="Nom" htmlFor={`n-${org.id}`} error={fieldError(s, "name")}><Input id={`n-${org.id}`} name="name" defaultValue={org.name} required /></Field>
          <Field label="Type" htmlFor={`t-${org.id}`}><Select id={`t-${org.id}`} name="type" defaultValue={org.type}>{ORG_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></Field>
          <Field label="Site web" htmlFor={`w-${org.id}`} error={fieldError(s, "website")}><Input id={`w-${org.id}`} name="website" type="url" defaultValue={org.website ?? ""} /></Field>
          <Field label="E-mail" htmlFor={`e-${org.id}`} error={fieldError(s, "email")}><Input id={`e-${org.id}`} name="email" type="email" defaultValue={org.email ?? ""} /></Field>
          <Field label="Téléphone" htmlFor={`p-${org.id}`}><Input id={`p-${org.id}`} name="phone" defaultValue={org.phone ?? ""} /></Field>
          <Field label="Présentation" htmlFor={`d-${org.id}`} className="sm:col-span-2"><Textarea id={`d-${org.id}`} name="description" defaultValue={org.description ?? ""} maxLength={3000} /></Field>
          <div className="sm:col-span-2"><SubmitButton>Enregistrer</SubmitButton></div>
        </div>
      )}
    </ActionForm>
  );
}
