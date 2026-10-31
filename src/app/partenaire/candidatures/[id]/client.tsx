"use client";
import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Select, Textarea, Field } from "@/components/ui/field";
import { partnerSetStatus } from "@/actions/partner";
import { getDocumentUrl } from "@/actions/applications";

export function PartnerStatusForm({ id, status, note }: { id: string; status: string; note: string | null }) {
  return (
    <ActionForm action={partnerSetStatus}>
      <div className="space-y-3">
        <input type="hidden" name="id" value={id} />
        <Field label="Statut" htmlFor="status">
          <Select id="status" name="status" defaultValue={["brouillon", "preparation"].includes(status) ? "soumis" : status}>
            <option value="soumis">Soumis (reçu)</option><option value="en_examen">En cours d&apos;examen</option><option value="accepte">Accepté</option><option value="refuse">Refusé</option>
          </Select>
        </Field>
        <Field label="Message au candidat (facultatif)" htmlFor="note"><Textarea id="note" name="note" defaultValue={note ?? ""} maxLength={3000} placeholder="Ex. pièce manquante, date d'entretien…" /></Field>
        <SubmitButton className="w-full">Mettre à jour et notifier</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PartnerDocs({ docs }: { docs: { id: string; name: string; storage_path: string; size_bytes: number | null }[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!docs.length) return <p className="text-sm text-muted">Aucun document joint.</p>;
  return (
    <ul className="divide-y divide-[var(--border)] rounded-xl border border-base">
      {docs.map((d) => (
        <li key={d.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
          <FileText className="h-4 w-4 text-brand-600" /><span className="flex-1 truncate">{d.name}</span>
          <button className="rounded-lg p-2 hover:bg-[var(--surface-2)]" aria-label={`Ouvrir ${d.name}`} onClick={async () => { setBusy(d.id); const u = await getDocumentUrl(d.storage_path); setBusy(null); if (u) window.open(u, "_blank", "noopener"); }}>
            {busy === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </button>
        </li>
      ))}
    </ul>
  );
}
