import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { setProductRemoved } from "@/actions/admin";
import { fcfa, relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Gestion des annonces" };

export default async function Page({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("products").select("id,title,price_fcfa,unit,status,is_demo,created_at, profiles(full_name), product_categories(name)").order("created_at", { ascending: false }).limit(200);
  if (statut) q = q.eq("status", statut);
  const { data } = await q;
  return (
    <div>
      <PageHeader title="Gestion des annonces" />
      <div className="mb-4 flex gap-1.5">{[["", "Toutes"], ["active", "Actives"], ["removed", "Retirées"], ["sold", "Vendues"]].map(([v, l]) => <Link key={v} href={v ? `?statut=${v}` : "?"} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${(statut ?? "") === v ? "bg-brand-700 text-white" : "border border-base"}`}>{l}</Link>)}</div>
      <ul className="surface divide-y divide-[var(--border)] rounded-2xl border border-base">
        {(data ?? []).map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1"><Link href={`/market/${p.id}`} className="font-semibold hover:underline">{p.title}</Link> {p.is_demo && <DemoBadge />}<p className="text-xs text-muted">{(p.profiles as unknown as { full_name: string })?.full_name} · {(p.product_categories as unknown as { name: string })?.name} · {fcfa(p.price_fcfa)}/{p.unit} · {relativeTime(p.created_at)}</p></div>
            <Badge tone={p.status === "removed" ? "red" : p.status === "active" ? "green" : "gray"}>{p.status}</Badge>
            {p.status === "removed" ? <ActionButton tone="success" action={setProductRemoved.bind(null, p.id, false)}>Rétablir</ActionButton> : <ActionButton tone="danger" confirmText="Retirer cette annonce ?" action={setProductRemoved.bind(null, p.id, true)}>Retirer</ActionButton>}
          </li>
        ))}
      </ul>
    </div>
  );
}
