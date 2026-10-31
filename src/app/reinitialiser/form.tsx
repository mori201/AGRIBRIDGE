"use client";
import Link from "@/components/ui/link";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input } from "@/components/ui/field";
import { updatePassword } from "@/actions/auth";

export function ResetForm() {
  return (
    <ActionForm action={updatePassword} refresh={false}>
      {(s) =>
        s?.ok ? (
          <Link href="/tableau-de-bord" className="block rounded-xl bg-brand-700 py-3 text-center font-semibold text-white">Aller à mon espace</Link>
        ) : (
          <div className="space-y-4">
            <Field label="Nouveau mot de passe" htmlFor="password" error={fieldError(s, "password")}>
              <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
            </Field>
            <Field label="Confirmer" htmlFor="confirm" error={fieldError(s, "confirm")}>
              <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
            </Field>
            <SubmitButton className="w-full" size="lg">Mettre à jour</SubmitButton>
          </div>
        )
      }
    </ActionForm>
  );
}
