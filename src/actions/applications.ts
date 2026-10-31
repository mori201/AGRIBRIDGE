"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, fromZod, optStr, uuid } from "@/lib/actions-helpers";
import type { ActionResult } from "@/lib/types";

const Update = z.object({
  id: uuid,
  status: z.enum(["brouillon", "preparation", "soumis", "en_examen", "accepte", "refuse"]),
  notes: optStr(10000),
  motivation: optStr(10000),
  reminder_at: z.preprocess((v) => (v === "" ? null : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()),
});

export async function updateApplication(_: unknown, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const parsed = Update.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, ...patch } = parsed.data;
  const { error } = await supabase.from("applications").update(patch).eq("id", id);
  if (error) return dbError(error);
  revalidatePath(`/tableau-de-bord/candidatures/${id}`);
  revalidatePath("/tableau-de-bord/candidatures");
  return { ok: true, message: patch.status === "soumis" ? "Candidature marquée comme soumise." : "Candidature enregistrée." };
}

export async function toggleChecklistItem(id: string, item: string, done: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error: e1 } = await supabase.from("applications").select("checklist").eq("id", id).single();
  if (e1 || !data) return dbError(e1);
  const checklist = { ...(data.checklist as Record<string, boolean>), [item.slice(0, 200)]: done };
  const { error } = await supabase.from("applications").update({ checklist }).eq("id", id);
  if (error) return dbError(error);
  revalidatePath(`/tableau-de-bord/candidatures/${id}`);
  return { ok: true };
}

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

export async function uploadApplicationDocument(_: unknown, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };
  const appId = String(fd.get("application_id"));
  if (!uuid.safeParse(appId).success) return { ok: false, error: "Candidature invalide." };
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choisissez un fichier." };
  if (!ALLOWED.includes(file.type)) return { ok: false, error: "Formats acceptés : PDF, image, Word, Excel." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Fichier trop lourd (10 Mo maximum)." };
  const { count } = await supabase.from("application_documents").select("id", { count: "exact", head: true }).eq("application_id", appId);
  if ((count ?? 0) >= 20) return { ok: false, error: "20 documents maximum par candidature." };
  const name = (String(fd.get("name") || "") || file.name).slice(0, 200);
  const safe = file.name.normalize("NFD").replace(/[^a-zA-Z0-9.]+/g, "-").slice(-80);
  const path = `${user.id}/${appId}/${Date.now()}-${safe}`;
  const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type });
  if (upErr) return { ok: false, error: "Échec de l'envoi du fichier." };
  const { error } = await supabase.from("application_documents").insert({ application_id: appId, user_id: user.id, name, storage_path: path, size_bytes: file.size, mime_type: file.type });
  if (error) {
    await supabase.storage.from("documents").remove([path]);
    return dbError(error);
  }
  revalidatePath(`/tableau-de-bord/candidatures/${appId}`);
  return { ok: true, message: "Document ajouté." };
}

export async function deleteApplicationDocument(id: string, appId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase.from("application_documents").select("storage_path").eq("id", id).single();
  if (!data) return { ok: false, error: "Document introuvable." };
  const { error } = await supabase.from("application_documents").delete().eq("id", id);
  if (error) return dbError(error);
  await supabase.storage.from("documents").remove([data.storage_path]);
  revalidatePath(`/tableau-de-bord/candidatures/${appId}`);
  return { ok: true };
}

/** URL temporaire (5 min) — le stockage reste privé. */
export async function getDocumentUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: docs } = await supabase.from("application_documents").select("storage_path").eq("application_id", id);
  const { data: deleted, error } = await supabase.from("applications").delete().eq("id", id).select("id");
  if (error) return dbError(error);
  if (!deleted?.length) return { ok: false, error: "Seules les candidatures en brouillon ou en préparation peuvent être supprimées." };
  if (docs?.length) await supabase.storage.from("documents").remove(docs.map((d) => d.storage_path));
  revalidatePath("/tableau-de-bord/candidatures");
  redirect("/tableau-de-bord/candidatures");
}
