"use client";
import Link from "@/components/ui/link";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input } from "@/components/ui/field";
import { signIn } from "@/actions/auth";

export function LoginForm({ next }: { next: string }) {
  return (
    <ActionForm action={signIn} refresh={false}>
      {(s) => (
        <div className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Adresse e-mail" htmlFor="email" error={fieldError(s, "email")}>
            <Input id="email" name="email" type="email" autoComplete="email" required inputMode="email" />
          </Field>
          <Field label="Mot de passe" htmlFor="password" error={fieldError(s, "password")}>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </Field>
          <div className="text-right text-sm">
            <Link href="/mot-de-passe-oublie" className="font-semibold text-brand-700 underline">Mot de passe oublié ?</Link>
          </div>
          <SubmitButton className="w-full" size="lg" pendingText="Connexion…">Se connecter</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}
