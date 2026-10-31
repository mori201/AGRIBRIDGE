"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, fromZod, uuid } from "@/lib/actions-helpers";
import type { ActionResult } from "@/lib/types";
import { POST_CATEGORIES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Filtre anti-arnaque simple : bloque les demandes d'argent/codes typiques
const SCAM = /(code\s*(wave|orange\s*money|om)|envoie[sz]?\s*(moi)?\s*(de\s*l'argent|\d+\s*f)|gagne[rz]?\s*\d+\s*(000|millions?)\s*(f|fcfa)\s*(par|en)\s*(jour|semaine)|bitcoin|crypto\s*invest)/i;

const PostSchema = z.object({
  content: z.string().trim().min(1, "Écrivez quelque chose").max(5000),
  category: z.enum(POST_CATEGORIES.map((c) => c.value) as [string, ...string[]]).default("general"),
  kind: z.enum(["post", "question", "actualite"]).default("post"),
  group_id: z.preprocess((v) => (v ? v : null), uuid.nullable()),
});

export async function createPost(_: unknown, fd: FormData): Promise<ActionResult> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "Connectez-vous pour publier." };
  const parsed = PostSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  if (SCAM.test(parsed.data.content)) return { ok: false, error: "Votre publication contient des éléments assimilables à une arnaque (demande d'argent ou de codes). Elle n'a pas été publiée." };
  const links = (parsed.data.content.match(/https?:\/\//g) ?? []).length;
  if (links > 3) return { ok: false, error: "Trop de liens dans la publication (3 maximum)." };
  let media_url: string | null = null;
  let media_type: "image" | "video" | null = null;
  const file = fd.get("media");
  if (file instanceof File && file.size > 0) {
    const isImg = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type);
    const isVid = ["video/mp4", "video/webm"].includes(file.type);
    if (!isImg && !isVid) return { ok: false, error: "Média accepté : image (JPG, PNG, WebP, GIF) ou vidéo (MP4, WebM)." };
    if (file.size > (isVid ? 15 : 3) * 1024 * 1024) return { ok: false, error: isVid ? "Vidéo trop lourde (15 Mo max.)." : "Image trop lourde (3 Mo max.)." };
    const path = `${user.id}/posts/${Date.now()}.${file.type.split("/")[1]}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
    if (error) return { ok: false, error: "Échec de l'envoi du média." };
    media_url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
    media_type = isImg ? "image" : "video";
  }
  const { error } = await supabase.from("posts").insert({ ...parsed.data, author_id: user.id, media_url, media_type });
  if (error) return dbError(error, "Publication impossible (êtes-vous membre du groupe ?).");
  revalidatePath("/communaute");
  return { ok: true, message: "Publication partagée." };
}

export async function deletePost(id: string): Promise<ActionResult> {
  const { supabase } = await ctx();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/communaute");
  return { ok: true };
}

export async function toggleLike(postId: string): Promise<ActionResult> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "Connectez-vous pour aimer une publication." };
  const { data: ex } = await supabase.from("likes").select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
  const { error } = ex ? await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id) : await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
  if (error) return dbError(error);
  return { ok: true };
}

export async function addComment(_: unknown, fd: FormData): Promise<ActionResult> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "Connectez-vous pour commenter." };
  const parsed = z.object({ post_id: uuid, content: z.string().trim().min(1, "Commentaire vide").max(2000) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  if (SCAM.test(parsed.data.content)) return { ok: false, error: "Commentaire bloqué : contenu assimilable à une arnaque." };
  const { error } = await supabase.from("comments").insert({ ...parsed.data, author_id: user.id });
  if (error) return dbError(error);
  revalidatePath(`/communaute/post/${parsed.data.post_id}`);
  revalidatePath("/communaute");
  return { ok: true };
}

export async function deleteComment(id: string, postId: string): Promise<ActionResult> {
  const { supabase } = await ctx();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return dbError(error);
  revalidatePath(`/communaute/post/${postId}`);
  return { ok: true };
}

export async function sharePost(postId: string): Promise<ActionResult> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "Connectez-vous pour partager." };
  const { data: orig } = await supabase.from("posts").select("category").eq("id", postId).single();
  if (!orig) return { ok: false, error: "Publication introuvable." };
  const { error } = await supabase.from("posts").insert({ author_id: user.id, content: "A partagé une publication", category: orig.category, shared_post_id: postId });
  if (error) return dbError(error);
  revalidatePath("/communaute");
  return { ok: true, message: "Publication partagée sur votre fil." };
}

export async function toggleFollow(targetId: string): Promise<ActionResult> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "Connectez-vous pour suivre un membre." };
  if (targetId === user.id) return { ok: false, error: "Action impossible." };
  const { data: ex } = await supabase.from("follows").select("following_id").eq("follower_id", user.id).eq("following_id", targetId).maybeSingle();
  const { error } = ex ? await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId) : await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
  if (error) return dbError(error);
  revalidatePath(`/membres/${targetId}`);
  return { ok: true };
}

export async function toggleGroup(groupId: string, slug: string): Promise<ActionResult> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "Connectez-vous pour rejoindre un groupe." };
  const { data: ex } = await supabase.from("group_members").select("group_id").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
  const { error } = ex ? await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id) : await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id });
  if (error) return dbError(error);
  revalidatePath(`/communaute/groupes/${slug}`);
  revalidatePath("/communaute");
  return { ok: true };
}

export async function createGroup(_: unknown, fd: FormData): Promise<ActionResult> {
  const { supabase, user } = await ctx();
  if (!user) return { ok: false, error: "Non connecté." };
  const parsed = z.object({ name: z.string().trim().min(3, "Nom trop court").max(80), description: z.string().trim().max(500).optional(), category: z.enum(POST_CATEGORIES.map((c) => c.value) as [string, ...string[]]) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { count } = await supabase.from("groups").select("id", { count: "exact", head: true }).eq("created_by", user.id);
  if ((count ?? 0) >= 3) return { ok: false, error: "Vous pouvez créer 3 groupes au maximum." };
  const slug = `${slugify(parsed.data.name)}-${Math.random().toString(36).slice(2, 5)}`;
  const { data, error } = await supabase.from("groups").insert({ ...parsed.data, slug, created_by: user.id }).select("id").single();
  if (error || !data) return dbError(error);
  await supabase.from("group_members").insert({ group_id: data.id, user_id: user.id });
  revalidatePath("/communaute");
  return { ok: true, message: "Groupe créé." };
}
