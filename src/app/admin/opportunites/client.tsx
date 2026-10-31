"use client";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { adminCreateOpportunity, reviewOpportunity } from "@/actions/admin";
import { BENEFICIARY_TYPES, OPP_REGIONS, SECTORS } from "@/lib/constants";

export function ReviewForm({ id, status, premium }: { id: string; status: string; premium: boolean }) {
  return (
    <ActionForm action={reviewOpportunity} className="w-full shrink-0 lg:w-80">
      {(s) => (
        <div className="space-y-2">
          <input type="hidden" name="id" value={id} />
          <Select name="decision" defaultValue={status === "pending_review" ? "published" : status} aria-label="Décision" className="h-10">
            <option value="published">Publier</option><option value="rejected">Refuser</option><option value="pending_review">Remettre en attente</option><option value="archived">Archiver</option>
          </Select>
          <Textarea name="review_note" placeholder="Note à l'organisme (obligatoire en cas de refus)" rows={2} aria-label="Note" />
          {fieldError(s, "review_note") && <p className="text-xs text-red-600">{fieldError(s, "review_note")}</p>}
          <div className="flex flex-wrap gap-3"><Checkbox name="verified" label="Informations vérifiées aujourd'hui" defaultChecked={status === "pending_review"} /><Checkbox name="is_premium" label="Mise en avant" defaultChecked={premium} /></div>
          <SubmitButton size="sm" className="w-full">Valider la décision</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}

export function AdminOppForm({ categories }: { categories: { id: number; name: string }[] }) {
  return (
    <ActionForm action={adminCreateOpportunity} resetOnSuccess>
      {(s) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Titre" htmlFor="a-title" error={fieldError(s, "title")}><Input id="a-title" name="title" required /></Field>
          <Field label="Organisme financeur" htmlFor="a-funder" error={fieldError(s, "funder_name")}><Input id="a-funder" name="funder_name" required /></Field>
          <Field label="Type" htmlFor="a-cat"><Select id="a-cat" name="category_id">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Date limite" htmlFor="a-dl"><Input id="a-dl" name="deadline" type="date" /></Field>
          <Field label="Montant min (FCFA)" htmlFor="a-min"><Input id="a-min" name="amount_min" inputMode="numeric" /></Field>
          <Field label="Montant max (FCFA)" htmlFor="a-max"><Input id="a-max" name="amount_max" inputMode="numeric" /></Field>
          <Field label="Source officielle (URL)" htmlFor="a-src" error={fieldError(s, "source_url")}><Input id="a-src" name="source_url" type="url" required /></Field>
          <Field label="Date de vérification" htmlFor="a-ver" error={fieldError(s, "verified_at")}><Input id="a-ver" name="verified_at" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
          <Field label="Lien de candidature" htmlFor="a-url" className="sm:col-span-2"><Input id="a-url" name="application_url" type="url" /></Field>
          <Field label="Résumé" htmlFor="a-sum" className="sm:col-span-2"><Input id="a-sum" name="summary" maxLength={400} /></Field>
          <Field label="Description" htmlFor="a-desc" error={fieldError(s, "description")} className="sm:col-span-2"><Textarea id="a-desc" name="description" rows={4} required /></Field>
          <Field label="Documents requis (un par ligne)" htmlFor="a-docs" className="sm:col-span-2"><Textarea id="a-docs" name="required_documents" rows={3} /></Field>
          <fieldset className="sm:col-span-2"><legend className="mb-1 text-sm font-semibold">Zones</legend><div className="flex flex-wrap gap-x-3 gap-y-1">{OPP_REGIONS.map((r) => <label key={r.value} className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="regions" value={r.value} defaultChecked={r.value === "national"} />{r.label}</label>)}</div></fieldset>
          <fieldset className="sm:col-span-2"><legend className="mb-1 text-sm font-semibold">Secteurs</legend><div className="flex flex-wrap gap-x-3 gap-y-1">{SECTORS.map((r) => <label key={r.value} className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="sectors" value={r.value} />{r.label}</label>)}</div></fieldset>
          <fieldset className="sm:col-span-2"><legend className="mb-1 text-sm font-semibold">Bénéficiaires</legend><div className="flex flex-wrap gap-x-3 gap-y-1">{BENEFICIARY_TYPES.map((r) => <label key={r.value} className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="beneficiary_types" value={r.value} />{r.label}</label>)}</div></fieldset>
          <div className="sm:col-span-2"><SubmitButton>Publier l&apos;opportunité vérifiée</SubmitButton></div>
        </div>
      )}
    </ActionForm>
  );
}
