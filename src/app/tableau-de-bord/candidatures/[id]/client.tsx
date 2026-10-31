"use client";
import { useState, useTransition } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { deleteApplication, deleteApplicationDocument, getDocumentUrl, toggleChecklistItem, updateApplication, uploadApplicationDocument } from "@/actions/applications";
import { relativeTime } from "@/lib/format";

type App = { id: string; status: string; notes: string | null; motivation: string | null; reminder_at: string | null };

export function ApplicationForm({ app, managedByPartner }: { app: App; managedByPartner: boolean }) {
  const locked = managedByPartner && ["en_examen", "accepte", "refuse"].includes(app.status);
  const options = APPLICATION_STATUSES.filter((s) => !managedByPartner || ["brouillon", "preparation", "soumis"].includes(s.value) || s.value === app.status);
  return (
    <ActionForm action={updateApplication}>
      <div className="space-y-4">
        <input type="hidden" name="id" value={app.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Statut" htmlFor="status" hint={locked ? "Statut géré par l'organisme." : undefined}>
            <Select id="status" name="status" defaultValue={app.status} disabled={locked}>
              {options.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
            {locked && <input type="hidden" name="status" value={app.status} />}
          </Field>
          <Field label="Me rappeler le" htmlFor="reminder_at" hint="Le rappel apparaît dans votre tableau de bord.">
            <Input id="reminder_at" name="reminder_at" type="date" defaultValue={app.reminder_at ?? ""} />
          </Field>
        </div>
        <Field label={managedByPartner ? "Lettre de motivation / présentation du projet (transmise à l'organisme)" : "Brouillon de présentation du projet"} htmlFor="motivation">
          <Textarea id="motivation" name="motivation" defaultValue={app.motivation ?? ""} rows={6} maxLength={10000} />
        </Field>
        <Field label="Notes personnelles (privées)" htmlFor="notes">
          <Textarea id="notes" name="notes" defaultValue={app.notes ?? ""} rows={3} maxLength={10000} />
        </Field>
        <SubmitButton>Enregistrer</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function Checklist({ appId, items, checked }: { appId: string; items: string[]; checked: Record<string, boolean> }) {
  const [state, setState] = useState(checked);
  const [, start] = useTransition();
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it}>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[var(--color-brand-700)]"
              checked={Boolean(state[it])}
              onChange={(e) => {
                const v = e.target.checked;
                setState((s) => ({ ...s, [it]: v }));
                start(async () => { await toggleChecklistItem(appId, it, v); });
              }}
            />
            <span className={state[it] ? "text-muted line-through" : ""}>{it}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export function Documents({ appId, docs }: { appId: string; docs: { id: string; name: string; storage_path: string; size_bytes: number | null; created_at: string }[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {docs.length > 0 && (
        <ul className="divide-y divide-[var(--border)] rounded-xl border border-base">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{d.name}</p>
                <p className="text-xs text-muted">{d.size_bytes ? `${Math.ceil(d.size_bytes / 1024)} Ko · ` : ""}{relativeTime(d.created_at)}</p>
              </div>
              <button aria-label={`Télécharger ${d.name}`} className="rounded-lg p-2 hover:bg-[var(--surface-2)]" onClick={async () => { setBusy(d.id); const url = await getDocumentUrl(d.storage_path); setBusy(null); if (url) window.open(url, "_blank", "noopener"); }}>
                {busy === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </button>
              <button aria-label={`Supprimer ${d.name}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={async () => { if (confirm("Supprimer ce document ?")) { setBusy(d.id); await deleteApplicationDocument(d.id, appId); setBusy(null); } }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <ActionForm action={uploadApplicationDocument} resetOnSuccess>
        <input type="hidden" name="application_id" value={appId} />
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Nom du document" htmlFor="docname"><Input id="docname" name="name" placeholder="Ex. Pièce d'identité" maxLength={200} /></Field>
          <Field label="Fichier (PDF, image, Word, Excel — 10 Mo max.)" htmlFor="file"><Input id="file" name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" className="pt-2" /></Field>
          <SubmitButton pendingText="Envoi…"><Upload className="h-4 w-4" /> Ajouter</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}

export function DeleteApplication({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="text-center">
      <Button variant="ghost" size="sm" className="text-red-600" disabled={pending} onClick={() => confirm("Supprimer définitivement cette candidature et ses documents ?") && start(async () => { const r = await deleteApplication(id); if (r && !r.ok) setErr(r.error); })}>
        <Trash2 className="h-4 w-4" /> Supprimer la candidature
      </Button>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
