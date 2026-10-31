import Link from "@/components/ui/link";
import Image from "next/image";
import { HelpCircle, MessageCircle, Newspaper, Repeat2 } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { POST_CATEGORIES, ROLE_LABELS, labelOf } from "@/lib/constants";
import { relativeTime } from "@/lib/format";
import { LikeButton, PostMenu, ShareButton } from "./post-actions";

export const POST_SELECT = "id,author_id,group_id,kind,category,content,media_url,media_type,shared_post_id,is_hidden,is_demo,created_at, profiles!posts_author_id_fkey(id,full_name,avatar_url,role), groups(name,slug), likes(count), comments(count)";

export type PostRow = {
  id: string; author_id: string; group_id: string | null; kind: string; category: string; content: string; media_url: string | null; media_type: string | null;
  shared_post_id: string | null; is_hidden: boolean; is_demo: boolean; created_at: string;
  profiles: { id: string; full_name: string; avatar_url: string | null; role: string } | null;
  groups: { name: string; slug: string } | null;
  likes: { count: number }[]; comments: { count: number }[];
};

export function PostCard({ post, me, liked, shared, linkToDetail = true }: { post: PostRow; me: string | null; liked: boolean; shared?: PostRow | null; linkToDetail?: boolean }) {
  const a = post.profiles;
  return (
    <article className="surface rounded-2xl border border-base p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <Link href={`/membres/${post.author_id}`}><Avatar name={a?.full_name} src={a?.avatar_url} size={42} /></Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm"><Link href={`/membres/${post.author_id}`} className="font-bold hover:underline">{a?.full_name ?? "Membre"}</Link> <span className="text-muted">· {ROLE_LABELS[a?.role ?? ""] ?? ""}</span></p>
          <p className="text-xs text-muted">{relativeTime(post.created_at)}{post.groups && <> · dans <Link href={`/communaute/groupes/${post.groups.slug}`} className="underline">{post.groups.name}</Link></>}</p>
        </div>
        <PostMenu postId={post.id} mine={me === post.author_id} loggedIn={Boolean(me)} />
      </header>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {post.kind === "question" && <Badge tone="blue"><HelpCircle className="h-3 w-3" /> Question</Badge>}
        {post.kind === "actualite" && <Badge tone="gold"><Newspaper className="h-3 w-3" /> Actualité</Badge>}
        {post.category !== "general" && <Badge tone="leaf">{labelOf(POST_CATEGORIES, post.category)}</Badge>}
        {post.is_demo && <DemoBadge />}
        {post.is_hidden && <Badge tone="red">Masquée par la modération</Badge>}
      </div>
      {post.shared_post_id ? (
        <div className="mt-3">
          <p className="mb-2 flex items-center gap-1.5 text-sm text-muted"><Repeat2 className="h-4 w-4" /> a partagé</p>
          {shared ? (
            <Link href={`/communaute/post/${shared.id}`} className="block rounded-xl border border-base p-3 hover:bg-[var(--surface-2)]">
              <p className="text-sm font-semibold">{shared.profiles?.full_name}</p>
              <p className="mt-1 line-clamp-4 whitespace-pre-line text-sm">{shared.content}</p>
            </Link>
          ) : <p className="rounded-xl border border-dashed border-base p-3 text-sm text-muted">Publication indisponible.</p>}
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-line break-words text-[15px] leading-relaxed">{post.content}</p>
      )}
      {post.media_url && post.media_type === "image" && (
        <div className="relative mt-3 aspect-video overflow-hidden rounded-xl surface-2"><Image src={post.media_url} alt="" fill sizes="(max-width:768px) 100vw, 640px" className="object-cover" /></div>
      )}
      {post.media_url && post.media_type === "video" && <video src={post.media_url} controls preload="none" className="mt-3 w-full rounded-xl" />}
      <footer className="mt-3 flex items-center gap-1 border-t border-base pt-2">
        <LikeButton postId={post.id} liked={liked} count={post.likes?.[0]?.count ?? 0} loggedIn={Boolean(me)} />
        <Link href={`/communaute/post/${post.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted hover:bg-[var(--surface-2)]" aria-label="Commentaires">
          <MessageCircle className="h-4 w-4" /> {post.comments?.[0]?.count ?? 0}
        </Link>
        {!post.shared_post_id && <ShareButton postId={post.id} loggedIn={Boolean(me)} />}
        {linkToDetail && <Link href={`/communaute/post/${post.id}`} className="ml-auto text-xs font-semibold text-brand-700 hover:underline">Voir</Link>}
      </footer>
    </article>
  );
}
