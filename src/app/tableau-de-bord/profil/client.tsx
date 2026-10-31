"use client";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Avatar } from "@/components/ui/misc";
import { saveProfileForm, uploadAvatar } from "@/actions/profile";
import { EXPERIENCE_LEVELS, LANGUAGES, PROFILE_TYPES, PROJECT_STAGES, REGIONS, SECTORS } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export function AvatarForm({ name, avatar }: { name: string; avatar: string | null }) {
  return (
    <ActionForm action={uploadAvatar} resetOnSuccess>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={name} src={avatar} size={64} />
        <Input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="max-w-xs pt-2" aria-label="Choisir une photo" required />
        <SubmitButton variant="secondary" pendingText="Envoi…">Mettre à jour</SubmitButton>
      </div>
      <p className="mt-2 text-xs text-muted">JPG, PNG ou WebP, 2 Mo maximum. La photo est visible publiquement.</p>
    </ActionForm>
  );
}

export function ProfileForm({ profile }: { profile: Profile }) {
  return (
    <ActionForm action={saveProfileForm}>
      {(s) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet" htmlFor="full_name" error={fieldError(s, "full_name")}><Input id="full_name" name="full_name" defaultValue={profile.full_name} required /></Field>
          {profile.role === "admin" ? <input type="hidden" name="role" value="agripreneur" disabled /> : (
            <Field label="Type de profil" htmlFor="role"><Select id="role" name="role" defaultValue={profile.role}>{PROFILE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>
          )}
          <Field label="Région" htmlFor="region"><Select id="region" name="region" defaultValue={profile.region ?? ""}><option value="">—</option>{REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select></Field>
          <Field label="Niveau d'expérience" htmlFor="experience_level"><Select id="experience_level" name="experience_level" defaultValue={profile.experience_level ?? ""}><option value="">—</option>{EXPERIENCE_LEVELS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select></Field>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-semibold">Secteurs (6 max.)</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {SECTORS.map((sec) => (
                <label key={sec.value} className="flex items-center gap-2 text-sm"><input type="checkbox" name="sectors" value={sec.value} defaultChecked={profile.sectors?.includes(sec.value)} className="h-4 w-4 accent-[var(--color-brand-700)]" />{sec.label}</label>
              ))}
            </div>
            {fieldError(s, "sectors") && <p className="mt-1 text-xs text-red-600">{fieldError(s, "sectors")}</p>}
          </fieldset>
          <Field label="Type de projet" htmlFor="project_type" className="sm:col-span-2"><Input id="project_type" name="project_type" defaultValue={profile.project_type ?? ""} maxLength={200} /></Field>
          <Field label="Stade du projet" htmlFor="project_stage"><Select id="project_stage" name="project_stage" defaultValue={profile.project_stage ?? ""}><option value="">—</option>{PROJECT_STAGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select></Field>
          <Field label="Besoin de financement" htmlFor="funding_need"><Select id="funding_need" name="funding_need" defaultValue={profile.funding_need === null ? "" : String(profile.funding_need)}><option value="">Non précisé</option><option value="true">Oui</option><option value="false">Non</option></Select></Field>
          <Field label="Montant recherché (FCFA)" htmlFor="funding_amount" error={fieldError(s, "funding_amount")}><Input id="funding_amount" name="funding_amount" inputMode="numeric" defaultValue={profile.funding_amount ?? ""} /></Field>
          <Field label="Langue préférée" htmlFor="preferred_language"><Select id="preferred_language" name="preferred_language" defaultValue={profile.preferred_language}>{LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</Select></Field>
          <Field label="Téléphone (privé)" htmlFor="phone" error={fieldError(s, "phone")}><Input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} /></Field>
          <Field label="Présentation (publique)" htmlFor="bio" className="sm:col-span-2"><Textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} maxLength={1000} /></Field>
          <div className="sm:col-span-2"><SubmitButton>Enregistrer le profil</SubmitButton></div>
        </div>
      )}
    </ActionForm>
  );
}
