"use client";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input, Textarea } from "@/components/ui/field";
import { submitContact } from "@/actions/common";

export function ContactForm() {
  return (
    <ActionForm action={submitContact} resetOnSuccess refresh={false}>
      {(s) => (
        <div className="space-y-4">
          <Field label="Nom" htmlFor="name" error={fieldError(s, "name")}><Input id="name" name="name" required autoComplete="name" /></Field>
          <Field label="E-mail" htmlFor="email" error={fieldError(s, "email")}><Input id="email" name="email" type="email" required autoComplete="email" /></Field>
          <Field label="Objet" htmlFor="subject" error={fieldError(s, "subject")}><Input id="subject" name="subject" required /></Field>
          <Field label="Message" htmlFor="message" error={fieldError(s, "message")}><Textarea id="message" name="message" rows={6} required maxLength={5000} /></Field>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <SubmitButton size="lg" className="w-full" pendingText="Envoi…">Envoyer</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}
