"use client";
import { ActionForm, SubmitButton } from "@/components/forms";
import { addOrgMemberByEmail, setOrgPlan } from "@/actions/admin";

const inp = "h-8 rounded-lg border border-base surface px-2 text-xs";
export function AddMemberForm({ orgId }: { orgId: string }) {
  return (
    <ActionForm action={addOrgMemberByEmail} resetOnSuccess>
      <div className="flex gap-1">
        <input type="hidden" name="organization_id" value={orgId} />
        <input name="email" type="email" placeholder="E-mail du membre" className={inp} aria-label="E-mail" required />
        <select name="member_role" className={inp} aria-label="Rôle"><option value="manager">Gestionnaire</option><option value="member">Membre</option><option value="owner">Responsable</option></select>
        <SubmitButton size="sm" variant="outline" className="h-8 text-xs">Ajouter</SubmitButton>
      </div>
    </ActionForm>
  );
}
export function PlanForm({ orgId }: { orgId: string }) {
  return (
    <ActionForm action={setOrgPlan}>
      <div className="flex gap-1">
        <input type="hidden" name="organization_id" value={orgId} />
        <select name="plan" className={inp} aria-label="Formule"><option value="gratuit">Gratuit</option><option value="partenaire">Partenaire</option><option value="partenaire_pro">Partenaire Pro</option></select>
        <input name="ends_at" type="date" className={inp} aria-label="Fin" />
        <SubmitButton size="sm" variant="outline" className="h-8 text-xs">Appliquer</SubmitButton>
      </div>
    </ActionForm>
  );
}
