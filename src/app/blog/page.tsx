import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { DemoBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Blog et actualités agricoles" };

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select("slug,title,excerpt,category,published_at,is_demo").eq("is_published", true).order("published_at", { ascending: false });
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader title="Blog et actualités" description="Conseils, actualités du secteur et nouveautés de la plateforme." />
      {(data ?? []).length === 0 ? <EmptyState icon={Newspaper} title="Aucun article pour le moment" /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((b) => (
            <Link key={b.slug} href={`/blog/${b.slug}`} className="surface rounded-2xl border border-base p-5 transition hover:border-brand-300 hover:shadow-md">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-brand-700">{b.category} {b.is_demo && <DemoBadge />}</p>
              <h2 className="mt-1 text-lg font-bold">{b.title}</h2>
              {b.excerpt && <p className="mt-1 text-sm text-muted">{b.excerpt}</p>}
              <p className="mt-3 text-xs text-muted">{formatDate(b.published_at)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
