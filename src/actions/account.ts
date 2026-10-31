"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dbError } from "@/lib/actions-helpers";
import type { ActionResult } from "@/lib/types";

export async function saveNotificationPrefs(_: unknown, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };
  const { error } = await supabase.from("profiles").update({ notify_email: fd.get("notify_email") === "on", notify_deadlines: fd.get("notify_deadlines") === "on" }).eq("id", user.id);
  if (error) return dbError(error);
  revalidatePath("/tableau-de-bord/parametres");
  return { ok: true, message: "Préférences enregistrées." };
}

export async function exportMyData(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("export_my_data");
  if (error) return null;
  return JSON.stringify(data, null, 2);
}

async function removeFolder(supabase: Awaited<ReturnType<typeof createClient>>, bucket: string, prefix: string) {
  const { data } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (!data?.length) return;
  const files = data.filter((f) => f.id).map((f) => `${prefix}/${f.name}`);
  const dirs = data.filter((f) => !f.id).map((f) => `${prefix}/${f.name}`);
  if (files.length) await supabase.storage.from(bucket).remove(files);
  for (const d of dirs) await removeFolder(supabase, bucket, d);
}

export async function deleteMyAccount(_: unknown, fd: FormData): Promise<ActionResult> {
  if (fd.get("confirm") !== "SUPPRIMER") return { ok: false, error: "Tapez SUPPRIMER pour confirmer." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };
  // Fichiers personnels (documents privés et médias) supprimés avant le compte
  await removeFolder(supabase, "documents", user.id);
  await removeFolder(supabase, "media", user.id);
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return dbError(error);
  await supabase.auth.signOut();
  redirect("/?compte=supprime");
}
