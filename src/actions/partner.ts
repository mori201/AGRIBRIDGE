"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, fromZod, optStr, optUrl, uuid } from "@/lib/actions-helpers";
import { BENEFICIARY_TYPES, OPP_REGIONS, PROJECT_STAGES, SECTORS } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

const vals = (l: { value: string }[]) => l.map((o) => o.value) as [string, ...string[]];
const lines = (v: unknown) => String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

const OppSchema = z
  .object({
    organization_id: uuid,
    title: z.string().trim().min(5, "Titre trop court (5 caractères min.)").max(200),
    summary: optStr(400),
    description: z.string().trim().min(30, "Décrivez l'opportunité (30 caractères min.)").max(20000),
    funder_name: z.string().trim().min(2).max(200),
    category_id: z.coerce.number().int().positive("Type requis"),
    amount_min: z.preprocess((v) => (v === "" || v == null ? null : Number(String(v).replace(/\s/g, ""))), z.number().int().min(0).nullable()),
    amount_max: z.preprocess((v) => (v === "" || v == null ? null : Number(String(v).replace(/\s/g, ""))), z.number().int().min(0).nullable()),
    regions: z.array(z.enum(vals(OPP_REGIONS))).min(1, "Choisissez au moins une zone"),
    sectors: z.array(z.enum(vals(SECTORS))).default([]),
    beneficiary_types: z.array(z.enum(vals(BENEFICIARY_TYPES))).default([]),
    project_stages: z.array(z.enum(vals(PROJECT_STAGES))).default([]),
    required_documents: z.array(z.string().max(200)).max(30),
    eligibility: z.array(z.string().max(300)).max(30),
    deadline: z.preprocess((v) => (v === "" ? null : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
    application_mode: z.enum(["external", "platform"]),
    application_url: optUrl,
    contact_email: z.preprocess((v) => (v === "" ? null : v), z.string().email("E-mail invalide").nullable().optional()),
    contact_phone: optStr(30),
    source_url: optUrl,
    intent: z.enum(["draft", "submit"]),
  })
  .refine((d) => d.amount_min === null || d.amount_max === null || d.amount_max >= d.amount_min, { message: "Le montant maximum doit être supérieur au minimum", path: ["amount_max"] })
  .refine((d) => d.application_mode === "platform" || d.application_url, { message: "Indiquez le lien officiel de candidature", path: ["application_url"] });

export async function saveOpportunity(_: unknown, fd: FormData): Promise<ActionResult<{ redirect: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };
  const raw = {
    ...Object.fromEntries(fd),
    regions: fd.getAll("regions").map(String),
    sectors: fd.getAll("sectors").map(String),
    beneficiary_types: fd.getAll("beneficiary_types").map(String),
    project_stages: fd.getAll("project_stages").map(String),
    required_documents: lines(fd.get("required_documents")),
    eligibility: lines(fd.get("eligibility")),
  };
  const parsed = OppSchema.safeParse(raw);
  if (!parsed.success) return fromZod(parsed.error);
  const { eligibility, intent, ...d } = parsed.data;
  const id = String(fd.get("id") ?? "");
  const today = new Date().toISOString().slice(0, 10);
  if (intent === "submit" && d.deadline && d.deadline < today) return { ok: false, error: "La date limite est déjà passée.", fieldErrors: { deadline: ["Date passée"] } };
  const status = intent === "submit" ? "pending_review" : "draft";
  let oppId = id;
  if (id) {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide." };
    const { data, error } = await supabase.from("opportunities").update({ ...d, status, review_note: null }).eq("id", id).select("id");
    if (error) return dbError(error);
    if (!data?.length) return { ok: false, error: "Opportunité introuvable ou non autorisée." };
  } else {
    const { data, error } = await supabase.from("opportunities").insert({ ...d, status, created_by: user.id }).select("id").single();
    if (error || !data) return dbError(error);
    oppId = data.id;
  }
  await supabase.from("opportunity_eligibility").delete().eq("opportunity_id", oppId);
  if (eligibility.length) {
    const { error } = await supabase.from("opportunity_eligibility").insert(eligibility.map((label, i) => ({ opportunity_id: oppId, label, position: i + 1, is_mandatory: !/\(souhait/i.test(label) })));
    if (error) return dbError(error);
  }
  // Pas de revalidatePath ici : la page cible est dynamique et sera rechargée par la navigation client.
  return { ok: true, data: { redirect: `/partenaire/opportunites?ok=${intent === "submit" ? "soumise" : "brouillon"}` } };
}

export async function archiveOpportunity(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("opportunities").update({ status: "archived" }).eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/partenaire/opportunites");
  return { ok: true };
}

export async function deleteOpportunity(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("opportunities").delete().eq("id", id).select("id");
  if (error) return dbError(error);
  if (!data?.length) return { ok: false, error: "Suppression impossible (une opportunité publiée doit d'abord être archivée)." };
  revalidatePath("/partenaire/opportunites");
  return { ok: true };
}

export async function partnerSetStatus(_: unknown, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const parsed = z.object({ id: uuid, status: z.enum(["soumis", "en_examen", "accepte", "refuse"]), note: optStr(3000) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await supabase.rpc("partner_set_application_status", { p_application: parsed.data.id, p_status: parsed.data.status, p_note: parsed.data.note ?? null });
  if (error) return dbError(error);
  revalidatePath(`/partenaire/candidatures/${parsed.data.id}`);
  revalidatePath("/partenaire/candidatures");
  return { ok: true, message: "Statut mis à jour. Le candidat a été notifié." };
}
