"use client";
import { useTransition } from "react";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { closeExpertRequest, respondExpertRequest } from "@/actions/experts";
import { requestExpertListing } from "@/actions/profile";
import { EXPERT_SPECIALTIES } from "@/lib/constants";

export function RespondForm({ id, status, response }: { id: string; status: string; response: string | null }) {
  if (status === "completed" || status === "declined") return null;
  return (
    <ActionForm action={respondExpertRequest} className="mt-3">
      <div className="space-y-2">
        <input type="hidden" name="id" value={id} />
        <Textarea name="response" defaultValue={response ?? ""} placeholder="Votre réponse, vos disponibilités, vos conditions…" aria-label="Réponse" maxLength={5000} />
        <div className="flex flex-wrap gap-2">
          <Select name="status" defaultValue={status === "pending" ? "accepted" : status} aria-label="Statut" className="max-w-[200px]"><option value="accepted">Accepter</option><option value="declined">Décliner</option><option value="completed">Marquer terminée</option></Select>
          <SubmitButton size="md">Envoyer</SubmitButton>
        </div>
      </div>
    </ActionForm>
  );
}

export function CloseRequest({ id }: { id: string }) {
  const [p, start] = useTransition();
  return <Button variant="ghost" size="sm" className="mt-2" disabled={p} onClick={() => start(async () => { await closeExpertRequest(id); })}>Clôturer la demande</Button>;
}

export function ExpertListingForm({ existing }: { existing: { title: string; specialties: string[]; bio: string | null; availability: string | null; rate_fcfa: number | null; languages: string[] } | null }) {
  return (
    <ActionForm action={requestExpertListing}>
      {(s) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titre professionnel" htmlFor="title" error={fieldError(s, "title")}><Input id="title" name="title" defaultValue={existing?.title} placeholder="Ex. Agronome, consultant en financement" required /></Field>
          <Field label="Tarif indicatif par séance (FCFA, facultatif)" htmlFor="rate_fcfa"><Input id="rate_fcfa" name="rate_fcfa" inputMode="numeric" defaultValue={existing?.rate_fcfa ?? ""} /></Field>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-semibold">Spécialités</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">{EXPERT_SPECIALTIES.map((sp) => <label key={sp.value} className="flex items-center gap-2 text-sm"><input type="checkbox" name="specialties" value={sp.value} defaultChecked={existing?.specialties.includes(sp.value)} className="h-4 w-4 accent-[var(--color-brand-700)]" />{sp.label}</label>)}</div>
            {fieldError(s, "specialties") && <p className="mt-1 text-xs text-red-600">{fieldError(s, "specialties")}</p>}
          </fieldset>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-semibold">Langues</legend>
            <div className="flex gap-4">{[["fr", "Français"], ["wo", "Wolof"], ["en", "Anglais"]].map(([v, l]) => <label key={v} className="flex items-center gap-2 text-sm"><input type="checkbox" name="languages" value={v} defaultChecked={existing ? existing.languages.includes(v) : v === "fr"} className="h-4 w-4 accent-[var(--color-brand-700)]" />{l}</label>)}</div>
          </fieldset>
          <Field label="Disponibilités" htmlFor="availability" className="sm:col-span-2"><Input id="availability" name="availability" defaultValue={existing?.availability ?? ""} placeholder="Ex. du lundi au vendredi, 9h–17h" /></Field>
          <Field label="Présentation" htmlFor="bio" error={fieldError(s, "bio")} className="sm:col-span-2"><Textarea id="bio" name="bio" defaultValue={existing?.bio ?? ""} rows={5} required /></Field>
          <div className="sm:col-span-2"><SubmitButton>{existing ? "Mettre à jour ma fiche" : "Envoyer ma fiche pour validation"}</SubmitButton></div>
        </div>
      )}
    </ActionForm>
  );
}
