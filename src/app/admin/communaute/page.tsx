import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { deleteRow, setCommentHidden, setPostHidden } from "@/actions/admin";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Modération de la communauté" };

export default async function Page() {
  const supabase = await createClient();
  const [{ data: posts }, { data: comments }, { data: groups }] = await Promise.all([
    supabase.from("posts").select("id,content,is_hidden,is_demo,created_at,kind, profiles!posts_author_id_fkey(full_name)").order("is_hidden", { ascending: false }).order("created_at", { ascending: false }).limit(60),
    supabase.from("comments").select("id,post_id,content,is_hidden,created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(40),
    supabase.from("groups").select("id,name,slug,is_demo").order("created_at", { ascending: false }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Modération de la communauté" description="Les publications signalées par 3 membres sont masquées automatiquement en attendant votre décision." />
      <section>
        <h2 className="mb-2 font-bold">Publications</h2>
        <ul className="surface divide-y divide-[var(--border)] rounded-2xl border border-base">
          {(posts ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-start gap-3 p-3 text-sm">
              <div className="min-w-0 flex-1"><p className="text-xs text-muted">{(p.profiles as unknown as { full_name: string })?.full_name} · {relativeTime(p.created_at)} {p.is_demo && <DemoBadge />} {p.is_hidden && <Badge tone="red">Masquée</Badge>}</p><Link href={`/communaute/post/${p.id}`} className="line-clamp-2 hover:underline">{p.content}</Link></div>
              {p.is_hidden ? <ActionButton tone="success" action={setPostHidden.bind(null, p.id, false)}>Rétablir</ActionButton> : <ActionButton tone="danger" action={setPostHidden.bind(null, p.id, true)}>Masquer</ActionButton>}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 font-bold">Commentaires récents</h2>
        <ul className="surface divide-y divide-[var(--border)] rounded-2xl border border-base">
          {(comments ?? []).map((c) => (
            <li key={c.id} className="flex items-start gap-3 p-3 text-sm">
              <div className="min-w-0 flex-1"><p className="text-xs text-muted">{(c.profiles as unknown as { full_name: string })?.full_name} · {relativeTime(c.created_at)} {c.is_hidden && <Badge tone="red">Masqué</Badge>}</p><Link href={`/communaute/post/${c.post_id}`} className="line-clamp-2 hover:underline">{c.content}</Link></div>
              {c.is_hidden ? <ActionButton tone="success" action={setCommentHidden.bind(null, c.id, false)}>Rétablir</ActionButton> : <ActionButton tone="danger" action={setCommentHidden.bind(null, c.id, true)}>Masquer</ActionButton>}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 font-bold">Groupes</h2>
        <ul className="surface divide-y divide-[var(--border)] rounded-2xl border border-base">
          {(groups ?? []).map((g) => <li key={g.id} className="flex items-center justify-between gap-3 p-3 text-sm"><Link href={`/communaute/groupes/${g.slug}`} className="font-semibold hover:underline">{g.name} {g.is_demo && <DemoBadge />}</Link><ActionButton tone="danger" confirmText="Supprimer ce groupe et ses publications ?" action={deleteRow.bind(null, "groups", g.id, "/admin/communaute")}>Supprimer</ActionButton></li>)}
        </ul>
      </section>
    </div>
  );
}
