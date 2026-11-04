"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { resendConfirmation, signIn } from "@/actions/auth";

function Resend({ emailRef }: { emailRef: React.RefObject<HTMLInputElement | null> }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="rounded-xl border border-base p-3">
      <Button type="button" variant="secondary" size="sm" className="w-full" disabled={pending} onClick={() => start(async () => { const r = await resendConfirmation(emailRef.current?.value ?? ""); setMsg(r.ok ? { ok: true, text: r.message ?? "" } : { ok: false, text: r.error }); })}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />} Renvoyer l&apos;e-mail de confirmation
      </Button>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-brand-700" : "text-red-600"}`} role="status">{msg.text}</p>}
    </div>
  );
}

export function LoginForm({ next }: { next: string }) {
  const emailRef = useRef<HTMLInputElement>(null);
  return (
    <ActionForm action={signIn}>
      {(s) => (
        <div className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Adresse e-mail" htmlFor="email" error={fieldError(s, "email")}>
            <Input ref={emailRef} id="email" name="email" type="email" autoComplete="email" required inputMode="email" />
          </Field>
          <Field label="Mot de passe" htmlFor="password" error={fieldError(s, "password")}>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </Field>
          {s && !s.ok && (s.data as { unconfirmed?: boolean } | undefined)?.unconfirmed && <Resend emailRef={emailRef} />}
          <div className="text-right text-sm">
            <Link href="/mot-de-passe-oublie" className="font-semibold text-brand-700 underline">Mot de passe oublié ?</Link>
          </div>
          <SubmitButton className="w-full" size="lg" pendingText="Connexion…">Se connecter</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}
