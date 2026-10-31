"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, fromZod, optStr, uuid } from "@/lib/actions-helpers";
import type { ActionResult } from "@/lib/types";

export async function requestExpert(_: unknown, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous pour contacter un expert." };
  const parsed = z.object({ expert_id: uuid, subject: z.string().trim().min(3, "Objet requis").max(200), message: z.string().trim().min(10, "Décrivez votre besoin (10 caractères min.)").max(5000) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { count } = await supabase.from("expert_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending");
  if ((count ?? 0) >= 5) return { ok: false, error: "Vous avez déjà 5 demandes en attente." };
  const { error } = await supabase.from("expert_requests").insert({ ...parsed.data, user_id: user.id });
  if (error) return dbError(error);
  revalidatePath("/tableau-de-bord/demandes-expert");
  return { ok: true, message: "Demande envoyée. L'expert vous répondra depuis votre espace « Accompagnement »." };
}

export async function respondExpertRequest(_: unknown, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const parsed = z.object({ id: uuid, status: z.enum(["accepted", "declined", "completed"]), response: optStr(5000) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, ...patch } = parsed.data;
  const { data, error } = await supabase.from("expert_requests").update(patch).eq("id", id).select("id");
  if (error) return dbError(error);
  if (!data?.length) return { ok: false, error: "Demande introuvable." };
  revalidatePath("/tableau-de-bord/demandes-expert");
  return { ok: true, message: "Réponse enregistrée." };
}

export async function closeExpertRequest(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("expert_requests").update({ status: "completed" }).eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/tableau-de-bord/demandes-expert");
  return { ok: true };
}
