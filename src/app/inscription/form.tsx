"use client";
import Link from "next/link";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { signUp } from "@/actions/auth";
import { PROFILE_TYPES } from "@/lib/constants";

export function RegisterForm({ defaultRole }: { defaultRole: string }) {
  return (
    <ActionForm action={signUp} refresh={false}>
      {(s) =>
        s?.ok ? null : (
          <div className="space-y-4">
            <Field label="Nom complet" htmlFor="full_name" error={fieldError(s, "full_name")}>
              <Input id="full_name" name="full_name" autoComplete="name" required maxLength={120} />
            </Field>
            <Field label="Vous êtes" htmlFor="role" error={fieldError(s, "role")}>
              <Select id="role" name="role" defaultValue={PROFILE_TYPES.some((p) => p.value === defaultRole) ? defaultRole : "agripreneur"}>
                {PROFILE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </Field>
            <Field label="Adresse e-mail" htmlFor="email" error={fieldError(s, "email")}>
              <Input id="email" name="email" type="email" autoComplete="email" required inputMode="email" />
            </Field>
            <Field label="Mot de passe" htmlFor="password" error={fieldError(s, "password")} hint="8 caractères minimum, avec au moins une lettre et un chiffre.">
              <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
            </Field>
            <Checkbox name="terms" label={<>J&apos;accepte les <Link href="/conditions" className="underline" target="_blank">conditions d&apos;utilisation</Link> et la <Link href="/confidentialite" className="underline" target="_blank">politique de confidentialité</Link>.</>} />
            {fieldError(s, "terms") && <p className="text-xs text-red-600">{fieldError(s, "terms")}</p>}
            <SubmitButton className="w-full" size="lg" pendingText="Création du compte…">Créer mon compte</SubmitButton>
          </div>
        )
      }
    </ActionForm>
  );
}
