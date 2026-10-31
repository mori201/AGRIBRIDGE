"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, fromZod, optStr, uuid } from "@/lib/actions-helpers";
import type { ActionResult } from "@/lib/types";

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function toggleSaveOpportunity(opportunityId: string, next: string): Promise<ActionResult> {
  const { supabase, user } = await authed();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  if (!uuid.safeParse(opportunityId).success) return { ok: false, error: "Identifiant invalide." };
  const { data: existing } = await supabase.from("saved_opportunities").select("opportunity_id").eq("opportunity_id", opportunityId).eq("user_id", user.id).maybeSingle();
  const { error } = existing
    ? await supabase.from("saved_opportunities").delete().eq("opportunity_id", opportunityId).eq("user_id", user.id)
    : await supabase.from("saved_opportunities").insert({ user_id: user.id, opportunity_id: opportunityId });
  if (error) return dbError(error);
  revalidatePath(next);
  return { ok: true, message: existing ? "Retirée de vos favoris." : "Ajoutée à vos favoris." };
}

export async function startApplication(opportunityId: string): Promise<ActionResult> {
  const { supabase, user } = await authed();
  if (!user) redirect(`/connexion?next=/opportunites/${opportunityId}`);
  if (!uuid.safeParse(opportunityId).success) return { ok: false, error: "Identifiant invalide." };
  const { data: existing } = await supabase.from("applications").select("id").eq("opportunity_id", opportunityId).eq("user_id", user.id).maybeSingle();
  if (existing) redirect(`/tableau-de-bord/candidatures/${existing.id}`);
  const { data, error } = await supabase.from("applications").insert({ user_id: user.id, opportunity_id: opportunityId, status: "brouillon" }).select("id").single();
  if (error || !data) return dbError(error);
  await supabase.from("saved_opportunities").upsert({ user_id: user.id, opportunity_id: opportunityId }, { onConflict: "user_id,opportunity_id", ignoreDuplicates: true });
  redirect(`/tableau-de-bord/candidatures/${data.id}`);
}

const AlertSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(100),
  region: optStr(40),
  sector: optStr(40),
  category_id: z.preprocess((v) => (v ? Number(v) : null), z.number().int().positive().nullable()),
  keyword: optStr(100),
});

export async function createAlert(_: unknown, fd: FormData): Promise<ActionResult> {
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "Connectez-vous pour créer une alerte." };
  const parsed = AlertSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { count } = await supabase.from("opportunity_alerts").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= 10) return { ok: false, error: "Vous pouvez créer au maximum 10 alertes." };
  const { error } = await supabase.from("opportunity_alerts").insert({ ...parsed.data, user_id: user.id });
  if (error) return dbError(error);
  revalidatePath("/tableau-de-bord/opportunites");
  return { ok: true, message: "Alerte créée : vous serez notifié des nouvelles opportunités correspondantes." };
}

export async function deleteAlert(id: string): Promise<ActionResult> {
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "Non connecté." };
  const { error } = await supabase.from("opportunity_alerts").delete().eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/tableau-de-bord/opportunites");
  return { ok: true };
}
