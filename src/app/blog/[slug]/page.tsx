import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Markdown } from "@/lib/markdown";
import { formatDate } from "@/lib/format";
import { Notice } from "@/components/ui/misc";

type Props = { params: Promise<{ slug: string }> };
async function load(slug: string) {
  const supabase = await createClient();
  return (await supabase.from("blog_posts").select("*").eq("slug", slug).maybeSingle()).data;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await load((await params).slug);
  return b ? { title: b.title, description: b.excerpt ?? undefined } : { title: "Article introuvable" };
}
export default async function Page({ params }: Props) {
  const b = await load((await params).slug);
  if (!b) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/blog" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> Blog</Link>
      <p className="text-xs font-semibold uppercase text-brand-700">{b.category}</p>
      <h1 className="mt-1 text-3xl font-extrabold">{b.title}</h1>
      <p className="mt-2 text-sm text-muted">{formatDate(b.published_at)}</p>
      {b.is_demo && <Notice tone="demo" className="mt-4">Article de démonstration.</Notice>}
      {b.excerpt && <p className="mt-6 text-lg text-muted">{b.excerpt}</p>}
      <Markdown source={b.content} className="mt-6" />
    </article>
  );
}
