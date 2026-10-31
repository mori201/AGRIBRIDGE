"use client";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { saveOpportunity } from "@/actions/partner";
import { BENEFICIARY_TYPES, OPP_REGIONS, PROJECT_STAGES, SECTORS } from "@/lib/constants";
import type { Opportunity } from "@/lib/types";
import { useState } from "react";

function Checks({ name, options, selected }: { name: string; options: { value: string; label: string }[]; selected: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} value={o.value} defaultChecked={selected.includes(o.value)} className="h-4 w-4 accent-[var(--color-brand-700)]" />{o.label}</label>
      ))}
    </div>
  );
}

export function OpportunityForm({ orgs, categories, opp }: { orgs: { id: string; name: string }[]; categories: { id: number; name: string }[]; opp?: Opportunity }) {
  const [mode, setMode] = useState(opp?.application_mode ?? "platform");
  const org = orgs.find((o) => o.id === opp?.organization_id) ?? orgs[0];
  return (
    <ActionForm action={saveOpportunity} refresh={false}>
      {(s) => (
        <div className="space-y-6">
          {opp && <input type="hidden" name="id" value={opp.id} />}
          <section className="grid gap-4 sm:grid-cols-2">
            <h2 className="text-lg font-bold sm:col-span-2">Informations générales</h2>
            <Field label="Organisation" htmlFor="organization_id"><Select id="organization_id" name="organization_id" defaultValue={org?.id}>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
            <Field label="Organisme financeur (affiché)" htmlFor="funder_name" error={fieldError(s, "funder_name")}><Input id="funder_name" name="funder_name" defaultValue={opp?.funder_name ?? org?.name} required /></Field>
            <Field label="Titre" htmlFor="title" error={fieldError(s, "title")} className="sm:col-span-2"><Input id="title" name="title" defaultValue={opp?.title} required maxLength={200} /></Field>
            <Field label="Type de financement" htmlFor="category_id" error={fieldError(s, "category_id")}><Select id="category_id" name="category_id" defaultValue={opp?.category_id ?? ""} required><option value="">Choisir…</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
            <Field label="Date limite (vide si permanente)" htmlFor="deadline" error={fieldError(s, "deadline")}><Input id="deadline" name="deadline" type="date" defaultValue={opp?.deadline ?? ""} /></Field>
            <Field label="Montant minimum (FCFA)" htmlFor="amount_min"><Input id="amount_min" name="amount_min" inputMode="numeric" defaultValue={opp?.amount_min ?? ""} /></Field>
            <Field label="Montant maximum (FCFA)" htmlFor="amount_max" error={fieldError(s, "amount_max")}><Input id="amount_max" name="amount_max" inputMode="numeric" defaultValue={opp?.amount_max ?? ""} /></Field>
            <Field label="Résumé (affiché sur les cartes)" htmlFor="summary" className="sm:col-span-2"><Input id="summary" name="summary" defaultValue={opp?.summary ?? ""} maxLength={400} /></Field>
            <Field label="Description détaillée (Markdown simple accepté : ## titre, - liste, **gras**)" htmlFor="description" error={fieldError(s, "description")} className="sm:col-span-2"><Textarea id="description" name="description" defaultValue={opp?.description} rows={8} required maxLength={20000} /></Field>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold">Ciblage et éligibilité</h2>
            <fieldset><legend className="mb-2 text-sm font-semibold">Zones géographiques</legend><Checks name="regions" options={OPP_REGIONS} selected={opp?.regions ?? ["national"]} />{fieldError(s, "regions") && <p className="mt-1 text-xs text-red-600">{fieldError(s, "regions")}</p>}</fieldset>
            <fieldset><legend className="mb-2 text-sm font-semibold">Secteurs concernés (aucun = tous)</legend><Checks name="sectors" options={SECTORS} selected={opp?.sectors ?? []} /></fieldset>
            <fieldset><legend className="mb-2 text-sm font-semibold">Bénéficiaires</legend><Checks name="beneficiary_types" options={BENEFICIARY_TYPES} selected={opp?.beneficiary_types ?? []} /></fieldset>
            <fieldset><legend className="mb-2 text-sm font-semibold">Maturité du projet</legend><Checks name="project_stages" options={PROJECT_STAGES} selected={opp?.project_stages ?? []} /></fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Critères d'éligibilité (un par ligne ; ajoutez « (souhaité) » si non obligatoire)" htmlFor="eligibility"><Textarea id="eligibility" name="eligibility" rows={5} defaultValue={(opp?.opportunity_eligibility ?? []).sort((a, b) => a.position - b.position).map((e) => (e.is_mandatory ? e.label : `${e.label} (souhaité)`)).join("\n")} /></Field>
              <Field label="Documents requis (un par ligne)" htmlFor="required_documents"><Textarea id="required_documents" name="required_documents" rows={5} defaultValue={(opp?.required_documents ?? []).join("\n")} /></Field>
            </div>
          </section>
          <section className="grid gap-4 sm:grid-cols-2">
            <h2 className="text-lg font-bold sm:col-span-2">Candidature et contact</h2>
            <Field label="Mode de candidature" htmlFor="application_mode" className="sm:col-span-2">
              <Select id="application_mode" name="application_mode" value={mode} onChange={(e) => setMode(e.target.value as "platform" | "external")}>
                <option value="platform">Sur AgriBridge (vous recevez et gérez les dossiers ici)</option>
                <option value="external">Sur notre site officiel (lien externe)</option>
              </Select>
            </Field>
            <Field label={`Lien officiel de candidature${mode === "external" ? " (obligatoire)" : " (facultatif)"}`} htmlFor="application_url" error={fieldError(s, "application_url")}><Input id="application_url" name="application_url" type="url" defaultValue={opp?.application_url ?? ""} placeholder="https://" /></Field>
            <Field label="Source officielle (page de l'appel)" htmlFor="source_url" error={fieldError(s, "source_url")}><Input id="source_url" name="source_url" type="url" defaultValue={opp?.source_url ?? ""} placeholder="https://" /></Field>
            <Field label="E-mail de contact" htmlFor="contact_email" error={fieldError(s, "contact_email")}><Input id="contact_email" name="contact_email" type="email" defaultValue={opp?.contact_email ?? ""} /></Field>
            <Field label="Téléphone de contact" htmlFor="contact_phone"><Input id="contact_phone" name="contact_phone" type="tel" defaultValue={opp?.contact_phone ?? ""} /></Field>
          </section>
          <div className="flex flex-wrap gap-2 border-t border-base pt-4">
            <SubmitButton size="lg" name="intent" value="submit" pendingText="Envoi…">Soumettre pour validation</SubmitButton>
            <SubmitButton size="lg" variant="outline" name="intent" value="draft" pendingText="Enregistrement…">Enregistrer en brouillon</SubmitButton>
          </div>
          <p className="text-xs text-muted">Toute opportunité est vérifiée par l&apos;équipe AgriBridge avant publication. Une modification d&apos;une opportunité publiée la renvoie en validation.</p>
        </div>
      )}
    </ActionForm>
  );
}
