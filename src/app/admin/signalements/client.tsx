"use client";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Checkbox, Select, Textarea } from "@/components/ui/field";
import { resolveReport } from "@/actions/admin";

export function ResolveForm({ id }: { id: string }) {
  return (
    <ActionForm action={resolveReport} className="w-full md:w-80">
      <div className="space-y-2">
        <input type="hidden" name="id" value={id} />
        <Select name="status" aria-label="Décision" className="h-10"><option value="resolved">Résolu</option><option value="dismissed">Rejeté (non fondé)</option><option value="reviewing">En cours d&apos;examen</option></Select>
        <Checkbox name="action" value="take_down" label="Retirer / masquer le contenu (ou suspendre le profil)" />
        <Textarea name="resolution_note" placeholder="Note interne" rows={2} aria-label="Note" />
        <SubmitButton size="sm" className="w-full">Enregistrer</SubmitButton>
      </div>
    </ActionForm>
  );
}
