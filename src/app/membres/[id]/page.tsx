import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { POST_SELECT, PostCard, type PostRow } from "@/components/community/post-card";
import { PRODUCT_SELECT, ProductCard } from "@/components/market/product-card";
import { hydrateFeed } from "@/lib/feed";
import { ROLE_LABELS, SECTORS, labelOf, labelsOf, REGIONS } from "@/lib/constants";
import { FollowButton, MessageButton } from "./client";
import { ReportButton } from "@/components/report-button";
import type { Product } from "@/lib/types";
import { MessagesSquare } from "lucide-react";

export const metadata: Metadata = { title: "Profil membre" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const me = await getProfile();
  const { data: p } = await supabase.from("profiles").select("id,full_name,avatar_url,role,region,bio,sectors,is_demo,created_at").eq("id", id).maybeSingle();
  if (!p) notFound();
  const [{ count: followers }, { count: following }, { data: posts }, { data: products }, fol] = await Promise.all([
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", id),
    supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", id),
    supabase.from("posts").select(POST_SELECT).eq("author_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("products").select(PRODUCT_SELECT).eq("seller_id", id).eq("status", "active").limit(8),
    me ? supabase.from("follows").select("following_id").eq("follower_id", me.id).eq("following_id", id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const list = (posts ?? []) as unknown as PostRow[];
  const { sharedMap, likedSet } = await hydrateFeed(list, me?.id ?? null);
  const isMe = me?.id === id;
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="surface flex flex-col gap-4 rounded-3xl border border-base p-6 sm:flex-row sm:items-center">
        <Avatar name={p.full_name} src={p.avatar_url} size={88} />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold">{p.full_name} {p.is_demo && <DemoBadge />}</h1>
          <p className="text-muted">{ROLE_LABELS[p.role]}{p.region && <> · <MapPin className="inline h-3.5 w-3.5" /> {labelOf(REGIONS, p.region)}</>}</p>
          <div className="mt-2 flex flex-wrap gap-1">{labelsOf(SECTORS, p.sectors).map((s) => <Badge key={s} tone="leaf">{s}</Badge>)}</div>
          <p className="mt-2 text-sm"><strong>{followers ?? 0}</strong> abonnés · <strong>{following ?? 0}</strong> abonnements</p>
        </div>
        {me && !isMe && (
          <div className="flex flex-col gap-2">
            <FollowButton id={id} following={Boolean(fol.data)} />
            <MessageButton id={id} />
            <ReportButton targetType="profile" targetId={id} label="Signaler le profil" />
          </div>
        )}
      </div>
      {p.bio && <p className="mt-4 whitespace-pre-line">{p.bio}</p>}
      {(products ?? []).length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Annonces</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{((products ?? []) as unknown as Product[]).map((x) => <ProductCard key={x.id} p={x} />)}</div>
        </section>
      )}
      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-bold">Publications</h2>
        {list.length === 0 ? <EmptyState icon={MessagesSquare} title="Aucune publication" /> : list.map((x) => <PostCard key={x.id} post={x} me={me?.id ?? null} liked={likedSet.has(x.id)} shared={x.shared_post_id ? sharedMap.get(x.shared_post_id) : null} />)}
      </section>
    </div>
  );
}
