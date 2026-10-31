"use client";
import { useState } from "react";
import { Flag, X } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { submitReport } from "@/actions/common";
import { Select, Textarea, Field } from "@/components/ui/field";
import { REPORT_REASONS } from "@/lib/constants";

export function ReportButton({ targetType, targetId, label = "Signaler" }: { targetType: string; targetId: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-red-600">
        <Flag className="h-3.5 w-3.5" /> {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Signaler un contenu">
          <div className="surface w-full max-w-md animate-fade-in rounded-2xl border border-base p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Signaler ce contenu</h2>
              <button onClick={() => setOpen(false)} aria-label="Fermer"><X className="h-5 w-5" /></button>
            </div>
            <ActionForm action={submitReport} refresh={false}>
              {(state) =>
                state?.ok ? (
                  <button onClick={() => setOpen(false)} type="button" className="w-full rounded-xl bg-brand-700 py-2.5 font-semibold text-white">Fermer</button>
                ) : (
                  <div className="space-y-3">
                    <input type="hidden" name="target_type" value={targetType} />
                    <input type="hidden" name="target_id" value={targetId} />
                    <Field label="Motif" htmlFor="reason">
                      <Select id="reason" name="reason" required>
                        {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </Select>
                    </Field>
                    <Field label="Détails (facultatif)" htmlFor="details">
                      <Textarea id="details" name="details" maxLength={2000} placeholder="Expliquez brièvement le problème" />
                    </Field>
                    <SubmitButton variant="danger" className="w-full" pendingText="Envoi…">Envoyer le signalement</SubmitButton>
                  </div>
                )
              }
            </ActionForm>
          </div>
        </div>
      )}
    </>
  );
}
