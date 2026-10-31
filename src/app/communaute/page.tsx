import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { MessagesSquare, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { POST_SELECT, PostCard, type PostRow } from "@/components/community/post-card";
import { Composer } from "@/components/community/composer";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { POST_CATEGORIES } from "@/lib/constants";
import { hydrateFeed } from "@/lib/feed";
import { CreateGroupForm } from "./client";

export const metadata: Metadata = { title: "AgriCommunity — Réseau agricole", description: "Échangez avec les agripreneurs, producteurs et experts du Sénégal : questions, retours d'expérience, groupes thématiques." };

export default async function Page({ searchParams }: { searchParams: Promise<{ fil?: string; categorie?: string; page?: string }> }) {
  const sp = await searchParams;
  const profile = await getProfile();
  const supabase = await createClient();
  const page = Math.max(1, Number(sp.page) || 1);
  let q = supabase.from("posts").select(POST_SELECT).order("created_at", { ascending: false }).range((page - 1) * 20, page * 20 - 1);
  if (sp.categorie) q = q.eq("category", sp.categorie);
  if (sp.fil === "questions") q = q.eq("kind", "question");
  if (sp.fil === "actualites") q = q.eq("kind", "actualite");
  if (sp.fil === "abonnements" && profile) {
    const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", profile.id);
    const ids = (f ?? []).map((x) => x.following_id);
    q = q.in("author_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }
  const [{ data }, { data: groups }] = await Promise.all([q, supabase.from("groups").select("id,slug,name,category,group_members(count)").order("created_at").limit(12)]);
  const posts = (data ?? []) as unknown as PostRow[];
  const { sharedMap, likedSet } = await hydrateFeed(posts, profile?.id ?? null);
  const tab = (v: string | undefined, l: string) => <Link key={l} href={v ? `/communaute?fil=${v}` : "/communaute"} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${sp.fil === v ? "bg-brand-700 text-white" : "border border-base"}`}>{l}</Link>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader title="AgriCommunity" description="Le réseau professionnel des acteurs agricoles : partagez, questionnez, apprenez ensemble." />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          {profile ? <Composer isAdmin={profile.role === "admin"} /> : (
            <div className="surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base p-4"><p className="text-sm">Rejoignez la communauté pour publier, commenter et suivre des membres.</p><LinkButton href="/inscription" size="sm">Rejoindre</LinkButton></div>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1">{tab(undefined, "Fil d'actualité")}{profile && tab("abonnements", "Abonnements")}{tab("questions", "Questions & réponses")}{tab("actualites", "Actualités agricoles")}</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {POST_CATEGORIES.filter((c) => c.value !== "general").map((c) => <Link key={c.value} href={`/communaute?${new URLSearchParams({ ...(sp.fil ? { fil: sp.fil } : {}), ...(sp.categorie === c.value ? {} : { categorie: c.value }) })}`} className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${sp.categorie === c.value ? "bg-leaf-100 text-brand-800 ring-1 ring-brand-300" : "text-muted hover:bg-[var(--surface-2)]"}`}>#{c.label}</Link>)}
          </div>
          {posts.length === 0 ? <EmptyState icon={MessagesSquare} title="Rien pour le moment" description={sp.fil === "abonnements" ? "Suivez des membres pour voir leurs publications ici." : "Soyez le premier à publier !"} /> : posts.map((p) => <PostCard key={p.id} post={p} me={profile?.id ?? null} liked={likedSet.has(p.id)} shared={p.shared_post_id ? sharedMap.get(p.shared_post_id) : null} />)}
          <div className="flex justify-center gap-2">
            {page > 1 && <LinkButton variant="outline" size="sm" href={`/communaute?${new URLSearchParams({ ...sp, page: String(page - 1) } as Record<string, string>)}`}>Plus récents</LinkButton>}
            {posts.length === 20 && <LinkButton variant="outline" size="sm" href={`/communaute?${new URLSearchParams({ ...sp, page: String(page + 1) } as Record<string, string>)}`}>Plus anciens</LinkButton>}
          </div>
        </div>
        <aside className="space-y-4">
          <div className="surface rounded-2xl border border-base p-4">
            <p className="mb-3 flex items-center gap-2 font-bold"><Users className="h-4 w-4" /> Groupes agricoles</p>
            <ul className="space-y-1">
              {(groups ?? []).map((g) => (
                <li key={g.id}><Link href={`/communaute/groupes/${g.slug}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--surface-2)]"><span className="font-medium">{g.name}</span><span className="text-xs text-muted">{(g.group_members as { count: number }[])?.[0]?.count ?? 0} membres</span></Link></li>
              ))}
            </ul>
            {profile && <CreateGroupForm />}
          </div>
          <div className="rounded-2xl bg-gold-50 p-4 text-sm text-gold-700 dark:bg-gold-700/20 dark:text-gold-100">
            <p className="font-bold">Charte de la communauté</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4"><li>Respect et bienveillance</li><li>Pas de publicité abusive ni de spam</li><li>Jamais de demande d&apos;argent ou de codes</li><li>Signalez tout contenu suspect</li></ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
