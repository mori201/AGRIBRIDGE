import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { ActionButton } from "@/components/admin/action-button";
import { RoleSelect } from "@/components/admin/role-select";
import { setUserSuspended } from "@/actions/admin";
import { ROLE_LABELS, labelOf, REGIONS } from "@/lib/constants";
import { formatDate, relativeTime } from "@/lib/format";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createClient();
  const me = await getUser();
  const { data } = await supabase.rpc("admin_list_users", { p_search: sp.q || null, p_role: sp.role || null, p_limit: 50, p_offset: (page - 1) * 50 });
  type U = { id: string; full_name: string; email: string; role: string; region: string | null; is_suspended: boolean; is_demo: boolean; onboarding_completed: boolean; created_at: string; last_sign_in_at: string | null };
  const users = (data ?? []) as U[];
  return (
    <div>
      <PageHeader title="Gestion des utilisateurs" />
      <form className="mb-4 flex flex-wrap gap-2" action="/admin/utilisateurs">
        <Input name="q" defaultValue={sp.q} placeholder="Nom ou e-mail" className="max-w-xs" aria-label="Recherche" />
        <Select name="role" defaultValue={sp.role ?? ""} className="max-w-[220px]" aria-label="Rôle"><option value="">Tous les rôles</option>{Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        <button className="rounded-xl bg-brand-700 px-4 font-semibold text-white">Filtrer</button>
      </form>
      <div className="surface overflow-x-auto rounded-2xl border border-base">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-left text-xs uppercase text-muted"><tr className="border-b border-base"><th className="p-3">Utilisateur</th><th className="p-3">Rôle</th><th className="p-3">Région</th><th className="p-3">Inscription</th><th className="p-3">Dernière connexion</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-base last:border-0">
                <td className="p-3"><Link href={`/membres/${u.id}`} className="font-semibold hover:underline">{u.full_name || "—"}</Link> {u.is_demo && <DemoBadge />} {u.is_suspended && <Badge tone="red">Suspendu</Badge>}<p className="text-xs text-muted">{u.email}</p></td>
                <td className="p-3">{u.id === me?.id ? <Badge tone="green">{ROLE_LABELS[u.role]}</Badge> : <RoleSelect id={u.id} role={u.role} />}</td>
                <td className="p-3">{labelOf(REGIONS, u.region) || "—"}</td>
                <td className="p-3">{formatDate(u.created_at, { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="p-3">{u.last_sign_in_at ? relativeTime(u.last_sign_in_at) : "—"}</td>
                <td className="p-3">{u.id !== me?.id && (u.is_suspended ? <ActionButton tone="success" action={setUserSuspended.bind(null, u.id, false)}>Réactiver</ActionButton> : <ActionButton tone="danger" confirmText="Suspendre ce compte ?" action={setUserSuspended.bind(null, u.id, true)}>Suspendre</ActionButton>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-center gap-3 text-sm">
        {page > 1 && <Link className="underline" href={`?${new URLSearchParams({ ...sp, page: String(page - 1) } as Record<string, string>)}`}>Précédent</Link>}
        {users.length === 50 && <Link className="underline" href={`?${new URLSearchParams({ ...sp, page: String(page + 1) } as Record<string, string>)}`}>Suivant</Link>}
      </div>
    </div>
  );
}
