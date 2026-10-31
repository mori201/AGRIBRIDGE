"use client";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Field, Input, Textarea } from "@/components/ui/field";
import { requestExpert } from "@/actions/experts";

export function ExpertRequestForm({ expertId }: { expertId: string }) {
  return (
    <ActionForm action={requestExpert} resetOnSuccess>
      {(s) => (
        <div className="space-y-3">
          <input type="hidden" name="expert_id" value={expertId} />
          <Field label="Objet" htmlFor="subject" error={fieldError(s, "subject")}><Input id="subject" name="subject" required maxLength={200} placeholder="Ex. Diagnostic de mon verger" /></Field>
          <Field label="Votre besoin" htmlFor="message" error={fieldError(s, "message")}><Textarea id="message" name="message" required rows={5} maxLength={5000} placeholder="Décrivez votre exploitation, le problème rencontré, vos disponibilités…" /></Field>
          <SubmitButton className="w-full" pendingText="Envoi…">Envoyer la demande</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}
