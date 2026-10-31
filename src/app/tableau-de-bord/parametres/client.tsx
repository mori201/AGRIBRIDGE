"use client";
import { useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Checkbox, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { deleteMyAccount, exportMyData, saveNotificationPrefs } from "@/actions/account";

export function NotificationPrefs({ email, deadlines }: { email: boolean; deadlines: boolean }) {
  return (
    <ActionForm action={saveNotificationPrefs}>
      <div className="space-y-3">
        <Checkbox name="notify_email" defaultChecked={email} label="Recevoir les notifications importantes par e-mail (lorsque l'envoi d'e-mails est configuré)" />
        <Checkbox name="notify_deadlines" defaultChecked={deadlines} label="Afficher les alertes de dates limites dans mon tableau de bord" />
        <SubmitButton variant="secondary" size="sm">Enregistrer</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function ExportData() {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <Button variant="outline" disabled={pending} onClick={() => start(async () => {
        const json = await exportMyData();
        if (!json) { setErr("Export impossible pour le moment."); return; }
        const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        const a = document.createElement("a");
        a.href = url; a.download = `agribridge-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`; a.click();
        URL.revokeObjectURL(url);
      })}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Exporter mes données
      </Button>
      {err && <p className="text-red-600">{err}</p>}
    </>
  );
}

export function DeleteAccount() {
  return (
    <ActionForm action={deleteMyAccount} refresh={false}>
      <div className="flex flex-wrap gap-2">
        <Input name="confirm" placeholder="Tapez SUPPRIMER" aria-label="Confirmation" className="max-w-xs" autoComplete="off" />
        <SubmitButton variant="danger" pendingText="Suppression…">Supprimer définitivement</SubmitButton>
      </div>
    </ActionForm>
  );
}
