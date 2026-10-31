import "server-only";
import { createClient } from "@/lib/supabase/server";
import { POST_SELECT, type PostRow } from "@/components/community/post-card";

/** Charge les publications partagées et les likes de l'utilisateur pour une liste de posts. */
export async function hydrateFeed(posts: PostRow[], me: string | null) {
  const supabase = await createClient();
  const sharedIds = [...new Set(posts.map((p) => p.shared_post_id).filter(Boolean))] as string[];
  const ids = posts.map((p) => p.id);
  const [{ data: shared }, { data: likes }] = await Promise.all([
    sharedIds.length ? supabase.from("posts").select(POST_SELECT).in("id", sharedIds) : Promise.resolve({ data: [] }),
    me && ids.length ? supabase.from("likes").select("post_id").eq("user_id", me).in("post_id", ids) : Promise.resolve({ data: [] }),
  ]);
  return {
    sharedMap: new Map(((shared ?? []) as unknown as PostRow[]).map((p) => [p.id, p])),
    likedSet: new Set(((likes ?? []) as { post_id: string }[]).map((l) => l.post_id)),
  };
}
