"use client";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input } from "@/components/ui/field";
import { requestPasswordReset } from "@/actions/auth";

export function ForgotForm() {
  return (
    <ActionForm action={requestPasswordReset} refresh={false}>
      {(s) =>
        s?.ok ? null : (
          <div className="space-y-4">
            <Field label="Adresse e-mail" htmlFor="email" error={fieldError(s, "email")}>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </Field>
            <SubmitButton className="w-full" size="lg" pendingText="Envoi…">Envoyer le lien</SubmitButton>
          </div>
        )
      }
    </ActionForm>
  );
}
