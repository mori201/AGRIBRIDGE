"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, fromZod, optStr, uuid } from "@/lib/actions-helpers";
import { REGIONS } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

const ProductSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(150),
  category_id: z.coerce.number().int().positive("Catégorie requise"),
  description: optStr(5000),
  price_fcfa: z.preprocess((v) => Number(String(v ?? "").replace(/\s/g, "")), z.number({ message: "Prix invalide" }).int().min(0).max(1_000_000_000)),
  unit: z.string().trim().min(1).max(30),
  quantity: z.preprocess((v) => (v === "" || v == null ? null : Number(String(v).replace(",", "."))), z.number().min(0).max(1e9).nullable()),
  region: z.enum(REGIONS.map((r) => r.value) as [string, ...string[]], { message: "Région requise" }),
  location: optStr(150),
  whatsapp: z.preprocess((v) => (v === "" ? null : v), z.string().trim().regex(/^\+?[0-9 ]{8,20}$/, "Numéro WhatsApp invalide").nullable().optional()),
  status: z.enum(["active", "sold", "hidden"]).default("active"),
});

const IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function uploadImages(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, files: File[]) {
  const urls: string[] = [];
  for (const f of files.slice(0, 4)) {
    if (!IMG_TYPES.includes(f.type) || f.size === 0 || f.size > 3 * 1024 * 1024) continue;
    const path = `${userId}/products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${f.type.split("/")[1]}`;
    const { error } = await supabase.storage.from("media").upload(path, f, { contentType: f.type });
    if (!error) urls.push(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

export async function saveProduct(_: unknown, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous pour publier une annonce." };
  const parsed = ProductSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const id = String(fd.get("id") ?? "");
  const files = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const bad = files.find((f) => !IMG_TYPES.includes(f.type) || f.size > 3 * 1024 * 1024);
  if (bad) return { ok: false, error: "Photos : JPG, PNG ou WebP de 3 Mo maximum." };
  const keep = fd.getAll("keep_images").map(String).filter((u) => u.startsWith("https://"));
  const newUrls = await uploadImages(supabase, user.id, files);
  const images = [...keep, ...newUrls].slice(0, 4);

  if (id) {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Annonce invalide." };
    const { data, error } = await supabase.from("products").update({ ...parsed.data, images }).eq("id", id).eq("seller_id", user.id).select("id");
    if (error) return dbError(error);
    if (!data?.length) return { ok: false, error: "Annonce introuvable." };
    revalidatePath(`/market/${id}`);
    revalidatePath("/tableau-de-bord/annonces");
    return { ok: true, message: "Annonce mise à jour." };
  }
  const { data, error } = await supabase.from("products").insert({ ...parsed.data, images, seller_id: user.id }).select("id").single();
  if (error || !data) return dbError(error);
  revalidatePath("/market");
  redirect(`/market/${data.id}?publie=1`);
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").delete().eq("id", id).select("images");
  if (error) return dbError(error);
  const prefix = "/storage/v1/object/public/media/";
  const paths = (data?.[0]?.images ?? []).map((u: string) => u.split(prefix)[1]).filter(Boolean);
  if (paths.length) await supabase.storage.from("media").remove(paths);
  revalidatePath("/tableau-de-bord/annonces");
  revalidatePath("/market");
  return { ok: true };
}

export async function toggleProductFavorite(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?next=/market/${id}`);
  const { data: ex } = await supabase.from("product_favorites").select("product_id").eq("product_id", id).eq("user_id", user.id).maybeSingle();
  const { error } = ex ? await supabase.from("product_favorites").delete().eq("product_id", id).eq("user_id", user.id) : await supabase.from("product_favorites").insert({ product_id: id, user_id: user.id });
  if (error) return dbError(error);
  revalidatePath(`/market/${id}`);
  return { ok: true };
}

export async function contactUser(otherId: string, productId: string | null, firstMessage: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const msg = firstMessage.trim().slice(0, 4000);
  const { data: cid, error } = await supabase.rpc("start_conversation", { other: otherId, p_product: productId });
  if (error) return dbError(error);
  if (msg) {
    const { error: e2 } = await supabase.from("messages").insert({ conversation_id: cid, sender_id: user.id, content: msg });
    if (e2) return dbError(e2);
  }
  redirect(`/tableau-de-bord/messages/${cid}`);
}

export async function sendMessage(_: unknown, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };
  const parsed = z.object({ conversation_id: uuid, content: z.string().trim().min(1, "Message vide").max(4000) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await supabase.from("messages").insert({ ...parsed.data, sender_id: user.id });
  if (error) return dbError(error);
  revalidatePath(`/tableau-de-bord/messages/${parsed.data.conversation_id}`);
  return { ok: true };
}
