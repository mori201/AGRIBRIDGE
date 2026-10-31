import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { POST_SELECT, PostCard, type PostRow } from "@/components/community/post-card";
import { hydrateFeed } from "@/lib/feed";
import { Avatar } from "@/components/ui/misc";
import { relativeTime } from "@/lib/format";
import { CommentForm, DeleteCommentButton } from "./client";
import { ReportButton } from "@/components/report-button";

export const metadata: Metadata = { title: "Publication" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const profile = await getProfile();
  const { data } = await supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  const post = data as unknown as PostRow;
  const { sharedMap, likedSet } = await hydrateFeed([post], profile?.id ?? null);
  const { data: comments } = await supabase.from("comments").select("id,author_id,content,created_at,is_hidden, profiles(id,full_name,avatar_url)").eq("post_id", id).order("created_at");
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/communaute" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> Communauté</Link>
      <PostCard post={post} me={profile?.id ?? null} liked={likedSet.has(post.id)} shared={post.shared_post_id ? sharedMap.get(post.shared_post_id) : null} linkToDetail={false} />
      <section className="mt-4 space-y-3" aria-label="Commentaires">
        <h2 className="font-bold">{post.kind === "question" ? "Réponses" : "Commentaires"} ({comments?.length ?? 0})</h2>
        {(comments as unknown as { id: string; author_id: string; content: string; created_at: string; is_hidden: boolean; profiles: { id: string; full_name: string; avatar_url: string | null } }[] ?? []).map((c) => (
          <div key={c.id} className="surface flex gap-3 rounded-2xl border border-base p-3">
            <Avatar name={c.profiles?.full_name} src={c.profiles?.avatar_url} size={34} />
            <div className="min-w-0 flex-1">
              <p className="text-sm"><Link href={`/membres/${c.author_id}`} className="font-bold hover:underline">{c.profiles?.full_name}</Link> <span className="text-xs text-muted">· {relativeTime(c.created_at)}</span></p>
              <p className="mt-0.5 whitespace-pre-line break-words text-sm">{c.content}</p>
              <div className="mt-1 flex gap-3">
                {profile?.id === c.author_id || profile?.role === "admin" ? <DeleteCommentButton id={c.id} postId={id} /> : profile ? <ReportButton targetType="comment" targetId={c.id} /> : null}
              </div>
            </div>
          </div>
        ))}
        {profile ? <CommentForm postId={id} /> : <p className="text-sm text-muted"><Link href={`/connexion?next=/communaute/post/${id}`} className="font-semibold underline">Connectez-vous</Link> pour répondre.</p>}
      </section>
    </div>
  );
}
