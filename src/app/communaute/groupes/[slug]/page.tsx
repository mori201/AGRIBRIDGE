import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { POST_SELECT, PostCard, type PostRow } from "@/components/community/post-card";
import { Composer } from "@/components/community/composer";
import { hydrateFeed } from "@/lib/feed";
import { EmptyState } from "@/components/ui/misc";
import { DemoBadge } from "@/components/ui/badge";
import { JoinGroupButton } from "./client";
import { POST_CATEGORIES, labelOf } from "@/lib/constants";

export const metadata: Metadata = { title: "Groupe" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const profile = await getProfile();
  const { data: g } = await supabase.from("groups").select("id,slug,name,description,category,is_demo,group_members(count)").eq("slug", slug).maybeSingle();
  if (!g) notFound();
  const [{ data: posts }, member] = await Promise.all([
    supabase.from("posts").select(POST_SELECT).eq("group_id", g.id).order("created_at", { ascending: false }).limit(30),
    profile ? supabase.from("group_members").select("user_id").eq("group_id", g.id).eq("user_id", profile.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const list = (posts ?? []) as unknown as PostRow[];
  const { sharedMap, likedSet } = await hydrateFeed(list, profile?.id ?? null);
  const isMember = Boolean(member.data);
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/communaute" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> Communauté</Link>
      <div className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white">
        <p className="text-sm text-brand-100">{labelOf(POST_CATEGORIES, g.category)}</p>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">{g.name} {g.is_demo && <DemoBadge />}</h1>
        {g.description && <p className="mt-1 text-brand-100">{g.description}</p>}
        <div className="mt-4 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm"><Users className="h-4 w-4" /> {(g.group_members as { count: number }[])?.[0]?.count ?? 0} membres</p>
          {profile && <JoinGroupButton groupId={g.id} slug={g.slug} member={isMember} />}
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {isMember && <Composer groupId={g.id} />}
        {list.length === 0 ? <EmptyState icon={Users} title="Aucune publication dans ce groupe" description={isMember ? "Lancez la discussion !" : "Rejoignez le groupe pour publier."} /> : list.map((p) => <PostCard key={p.id} post={p} me={profile?.id ?? null} liked={likedSet.has(p.id)} shared={p.shared_post_id ? sharedMap.get(p.shared_post_id) : null} />)}
      </div>
    </div>
  );
}
