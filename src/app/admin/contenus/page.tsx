import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { deleteRow } from "@/actions/admin";
import { formatDate } from "@/lib/format";
import { BlogForm, WebinarForm } from "./client";

export const metadata: Metadata = { title: "Gestion des contenus" };

export default async function Page({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const supabase = await createClient();
  const [{ data: posts }, { data: webinars }] = await Promise.all([
    supabase.from("blog_posts").select("id,slug,title,excerpt,content,category,is_published,is_demo,published_at").order("published_at", { ascending: false }),
    supabase.from("webinars").select("id,title,starts_at,is_demo").order("starts_at", { ascending: false }),
  ]);
  const current = posts?.find((p) => p.id === edit);
  return (
    <div className="space-y-5">
      <PageHeader title="Contenus : blog, actualités, webinaires" />
      <Card className="p-5"><h2 className="mb-3 font-bold">{current ? "Modifier l'article" : "Nouvel article"}</h2><BlogForm key={current?.id ?? "new"} post={current} /></Card>
      <ul className="surface divide-y divide-[var(--border)] rounded-2xl border border-base">
        {(posts ?? []).map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1"><Link href={`/blog/${p.slug}`} className="font-semibold hover:underline">{p.title}</Link> {p.is_demo && <DemoBadge />}<p className="text-xs text-muted">{p.category} · {formatDate(p.published_at)}</p></div>
            {p.is_published ? <Badge tone="green">Publié</Badge> : <Badge>Brouillon</Badge>}
            <Link href={`?edit=${p.id}`} className="inline-flex h-8 items-center rounded-lg border border-base px-2.5 text-xs font-semibold">Modifier</Link>
            <ActionButton tone="danger" confirmText="Supprimer l'article ?" action={deleteRow.bind(null, "blog_posts", p.id, "/admin/contenus")}>Supprimer</ActionButton>
          </li>
        ))}
      </ul>
      <Card className="p-5"><h2 className="mb-3 font-bold">Programmer un webinaire</h2><WebinarForm /></Card>
      <ul className="surface divide-y divide-[var(--border)] rounded-2xl border border-base">
        {(webinars ?? []).map((w) => <li key={w.id} className="flex items-center justify-between gap-3 p-3 text-sm"><span>{w.title} {w.is_demo && <DemoBadge />} <span className="text-muted">· {formatDate(w.starts_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></span><ActionButton tone="danger" action={deleteRow.bind(null, "webinars", w.id, "/admin/contenus")}>Supprimer</ActionButton></li>)}
      </ul>
    </div>
  );
}
