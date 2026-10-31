"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, fromZod, optStr, optUrl } from "@/lib/actions-helpers";
import { ProfileSchema, type ProfileInput } from "@/lib/schemas/profile";
import type { ActionResult } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { ORG_TYPES } from "@/lib/constants";

export async function saveProfile(input: ProfileInput & { complete?: boolean }): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée, reconnectez-vous." };
  const { data: current } = await supabase.rpc("my_profile");
  const isAdmin = current?.role === "admin";
  const parsed = ProfileSchema.safeParse(isAdmin ? { ...input, role: "agripreneur" } : input);
  if (!parsed.success) return fromZod(parsed.error);
  const patch: Record<string, unknown> = { ...parsed.data };
  if (isAdmin) delete patch.role; // le rôle administrateur ne se modifie pas depuis le profil
  if (input.complete) patch.onboarding_completed = true;
  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return dbError(error);
  revalidatePath("/", "layout");
  return { ok: true, message: "Profil enregistré." };
}

export async function saveProfileForm(_: unknown, fd: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(fd);
  return saveProfile({ ...(raw as Record<string, string>), sectors: fd.getAll("sectors").map(String) } as unknown as ProfileInput);
}

export async function uploadAvatar(_: unknown, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };
  const file = fd.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choisissez une image." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { ok: false, error: "Format accepté : JPG, PNG ou WebP." };
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: "Image trop lourde (2 Mo maximum)." };
  const ext = file.type.split("/")[1];
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { ok: false, error: "Échec de l'envoi de l'image." };
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  const { error } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
  if (error) return dbError(error);
  revalidatePath("/", "layout");
  return { ok: true, message: "Photo mise à jour." };
}

const OrgSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(160),
  type: z.enum(ORG_TYPES.map((o) => o.value) as [string, ...string[]]),
  description: optStr(3000),
  website: optUrl,
  email: z.preprocess((v) => (v === "" ? null : v), z.string().email("E-mail invalide").nullable().optional()),
  phone: optStr(30),
});

export async function createOrganization(_: unknown, fd: FormData): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };
  const parsed = OrgSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  const slug = `${slugify(d.name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await supabase.rpc("create_organization", {
    p_name: d.name, p_slug: slug, p_type: d.type, p_description: d.description ?? null, p_website: d.website ?? null, p_email: d.email ?? null, p_phone: d.phone ?? null,
  });
  if (error) return dbError(error);
  revalidatePath("/partenaire");
  return { ok: true, message: "Organisation créée. Elle sera visible publiquement après validation par l'équipe AgriBridge.", data: { id: data as string } };
}

export async function updateOrganization(_: unknown, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const id = String(fd.get("id") ?? "");
  const parsed = OrgSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await supabase.from("organizations").update(parsed.data).eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/partenaire/organisation");
  return { ok: true, message: "Organisation mise à jour." };
}

const ExpertListing = z.object({
  title: z.string().trim().min(3, "Titre requis").max(120),
  specialties: z.array(z.string().max(40)).min(1, "Choisissez au moins une spécialité").max(6),
  bio: z.string().trim().min(20, "Présentez-vous en quelques lignes (20 caractères min.)").max(2000),
  availability: optStr(200),
  rate_fcfa: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).max(10_000_000).nullable()),
  languages: z.array(z.enum(["fr", "wo", "en"])).min(1).default(["fr"]),
});

export async function requestExpertListing(_: unknown, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const parsed = ExpertListing.safeParse({ ...Object.fromEntries(fd), specialties: fd.getAll("specialties").map(String), languages: fd.getAll("languages").map(String) });
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await supabase.rpc("request_expert_listing", {
    p_title: parsed.data.title, p_specialties: parsed.data.specialties, p_bio: parsed.data.bio, p_availability: parsed.data.availability ?? null, p_rate: parsed.data.rate_fcfa, p_languages: parsed.data.languages,
  });
  if (error) return dbError(error);
  revalidatePath("/tableau-de-bord/demandes-expert");
  return { ok: true, message: "Fiche expert envoyée. Elle sera publiée après vérification par l'équipe AgriBridge." };
}
