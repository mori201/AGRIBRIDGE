"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, fromZod, optStr, optUrl, uuid } from "@/lib/actions-helpers";
import { slugify } from "@/lib/utils";
import { COURSE_CATEGORIES } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

async function admin() {
  const supabase = await createClient();
  const { data: me } = await supabase.rpc("my_profile");
  if (me?.role !== "admin") throw new Error("Accès refusé");
  return supabase;
}
const done = (path: string, message = "Enregistré."): ActionResult => {
  revalidatePath(path);
  return { ok: true, message };
};

// ---------- Utilisateurs ----------
export async function setUserRole(id: string, role: string): Promise<ActionResult> {
  const s = await admin();
  if (!["agripreneur", "producteur", "cooperative", "pme", "institution", "expert", "admin"].includes(role)) return { ok: false, error: "Rôle invalide." };
  const { error } = await s.from("profiles").update({ role }).eq("id", id);
  return error ? dbError(error) : done("/admin/utilisateurs", "Rôle mis à jour.");
}
export async function setUserSuspended(id: string, suspended: boolean): Promise<ActionResult> {
  const s = await admin();
  const { error } = await s.from("profiles").update({ is_suspended: suspended }).eq("id", id);
  return error ? dbError(error) : done("/admin/utilisateurs", suspended ? "Compte suspendu." : "Compte réactivé.");
}

// ---------- Organisations ----------
export async function setOrgVerified(id: string, verified: boolean): Promise<ActionResult> {
  const s = await admin();
  const { error } = await s.from("organizations").update({ is_verified: verified }).eq("id", id);
  return error ? dbError(error) : done("/admin/partenaires");
}
export async function addOrgMemberByEmail(_: unknown, fd: FormData): Promise<ActionResult> {
  const s = await admin();
  const parsed = z.object({ organization_id: uuid, email: z.string().email("E-mail invalide"), member_role: z.enum(["owner", "manager", "member"]) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { data: users } = await s.rpc("admin_list_users", { p_search: parsed.data.email, p_role: null, p_limit: 5, p_offset: 0 });
  const u = (users ?? []).find((x: { email: string }) => x.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!u) return { ok: false, error: "Aucun compte avec cet e-mail." };
  const { error } = await s.from("organization_members").upsert({ organization_id: parsed.data.organization_id, user_id: u.id, member_role: parsed.data.member_role });
  return error ? dbError(error) : done("/admin/partenaires", "Membre ajouté.");
}
export async function setOrgPlan(_: unknown, fd: FormData): Promise<ActionResult> {
  const s = await admin();
  const parsed = z.object({ organization_id: uuid, plan: z.enum(["gratuit", "partenaire", "partenaire_pro"]), ends_at: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  await s.from("subscriptions").update({ status: "cancelled" }).eq("organization_id", parsed.data.organization_id).eq("status", "active");
  const { error } = await s.from("subscriptions").insert({ ...parsed.data, status: "active", notes: "Activé par l'administration (convention)" });
  return error ? dbError(error) : done("/admin/partenaires", "Formule mise à jour.");
}

// ---------- Opportunités ----------
export async function reviewOpportunity(_: unknown, fd: FormData): Promise<ActionResult<{ redirect: string }>> {
  const s = await admin();
  const parsed = z.object({ id: uuid, decision: z.enum(["published", "rejected", "archived", "pending_review"]), review_note: optStr(1000), verified: z.string().optional(), is_premium: z.string().optional() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, decision, review_note, verified, is_premium } = parsed.data;
  if (decision === "rejected" && !review_note) return { ok: false, error: "Indiquez le motif du refus.", fieldErrors: { review_note: ["Motif requis"] } };
  const patch: Record<string, unknown> = { status: decision, review_note: review_note ?? null, is_premium: is_premium === "on" };
  if (verified === "on") patch.verified_at = new Date().toISOString().slice(0, 10);
  const { error } = await s.from("opportunities").update(patch).eq("id", id);
  if (error) return dbError(error);
  // Pas de revalidatePath : la carte disparaîtrait avant la redirection ; la navigation complète recharge la liste.
  return { ok: true, data: { redirect: `/admin/opportunites?statut=pending_review&decision=${decision}` } };
}

const AdminOpp = z.object({
  title: z.string().trim().min(5).max(200),
  funder_name: z.string().trim().min(2).max(200),
  summary: optStr(400),
  description: z.string().trim().min(30).max(20000),
  category_id: z.coerce.number().int().positive(),
  amount_min: z.preprocess((v) => (v === "" ? null : Number(v)), z.number().int().min(0).nullable()),
  amount_max: z.preprocess((v) => (v === "" ? null : Number(v)), z.number().int().min(0).nullable()),
  deadline: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
  application_url: optUrl,
  source_url: z.string().trim().url("La source officielle est obligatoire pour une opportunité réelle"),
  verified_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de vérification requise"),
  regions: z.array(z.string()).min(1),
  sectors: z.array(z.string()),
  beneficiary_types: z.array(z.string()),
  required_documents: z.array(z.string()),
});
export async function adminCreateOpportunity(_: unknown, fd: FormData): Promise<ActionResult> {
  const s = await admin();
  const lines = (k: string) => String(fd.get(k) ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
  const parsed = AdminOpp.safeParse({ ...Object.fromEntries(fd), regions: fd.getAll("regions").map(String), sectors: fd.getAll("sectors").map(String), beneficiary_types: fd.getAll("beneficiary_types").map(String), required_documents: lines("required_documents") });
  if (!parsed.success) return fromZod(parsed.error);
  const { data: me } = await s.auth.getUser();
  const { error } = await s.from("opportunities").insert({ ...parsed.data, application_mode: "external", status: "published", is_demo: false, created_by: me.user?.id });
  return error ? dbError(error) : done("/admin/opportunites", "Opportunité réelle publiée avec sa source et sa date de vérification.");
}

// ---------- Formations ----------
const CourseSchema = z.object({
  id: z.preprocess((v) => (v ? v : undefined), uuid.optional()),
  title: z.string().trim().min(3).max(200),
  summary: optStr(400),
  description: optStr(5000),
  category: z.enum(COURSE_CATEGORIES.map((c) => c.value) as [string, ...string[]]),
  level: z.enum(["debutant", "intermediaire", "avance"]),
  duration_minutes: z.preprocess((v) => (v === "" ? null : Number(v)), z.number().int().min(0).nullable()),
  instructor: optStr(120),
  pass_score: z.coerce.number().int().min(0).max(100),
  is_premium: z.preprocess((v) => v === "on", z.boolean()),
  is_published: z.preprocess((v) => v === "on", z.boolean()),
});
export async function saveCourse(_: unknown, fd: FormData): Promise<ActionResult> {
  const s = await admin();
  const parsed = CourseSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, ...d } = parsed.data;
  const { error } = id ? await s.from("courses").update(d).eq("id", id) : await s.from("courses").insert({ ...d, slug: `${slugify(d.title)}-${Math.random().toString(36).slice(2, 5)}` });
  return error ? dbError(error) : done("/admin/formations", "Formation enregistrée.");
}
export async function addModule(_: unknown, fd: FormData): Promise<ActionResult> {
  const s = await admin();
  const p = z.object({ course_id: uuid, title: z.string().trim().min(2).max(200), position: z.coerce.number().int().default(0) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fromZod(p.error);
  const { error } = await s.from("course_modules").insert(p.data);
  return error ? dbError(error) : done("/admin/formations", "Module ajouté.");
}
export async function addLesson(_: unknown, fd: FormData): Promise<ActionResult> {
  const s = await admin();
  const p = z.object({ module_id: uuid, title: z.string().trim().min(2).max(200), content: z.string().max(50000).optional(), video_url: optUrl, pdf_url: optUrl, duration_minutes: z.preprocess((v) => (v === "" ? null : Number(v)), z.number().int().nullable()), position: z.coerce.number().int().default(0) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fromZod(p.error);
  const { error } = await s.from("lessons").insert(p.data);
  return error ? dbError(error) : done("/admin/formations", "Leçon ajoutée.");
}
export async function addQuizQuestion(_: unknown, fd: FormData): Promise<ActionResult> {
  const s = await admin();
  const p = z.object({ course_id: uuid, question: z.string().trim().min(3).max(500), options: z.string(), correct_index: z.coerce.number().int().min(0) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fromZod(p.error);
  const options = p.data.options.split("\n").map((o) => o.trim()).filter(Boolean);
  if (options.length < 2 || options.length > 6) return { ok: false, error: "Entre 2 et 6 options, une par ligne." };
  if (p.data.correct_index >= options.length) return { ok: false, error: "Numéro de bonne réponse invalide." };
  let { data: quiz } = await s.from("quizzes").select("id").eq("course_id", p.data.course_id).limit(1).maybeSingle();
  if (!quiz) quiz = (await s.from("quizzes").insert({ course_id: p.data.course_id, title: "Quiz final" }).select("id").single()).data;
  if (!quiz) return { ok: false, error: "Création du quiz impossible." };
  const { count } = await s.from("quiz_questions").select("id", { count: "exact", head: true }).eq("quiz_id", quiz.id);
  const { error } = await s.from("quiz_questions").insert({ quiz_id: quiz.id, question: p.data.question, options, correct_index: p.data.correct_index, position: (count ?? 0) + 1 });
  return error ? dbError(error) : done("/admin/formations", "Question ajoutée.");
}
export async function deleteRow(table: "lessons" | "course_modules" | "quiz_questions" | "courses" | "blog_posts" | "webinars" | "groups", id: string, path: string): Promise<ActionResult> {
  const s = await admin();
  const { error } = await s.from(table).delete().eq("id", id);
  return error ? dbError(error) : done(path, "Supprimé.");
}

// ---------- Modération ----------
export async function setProductRemoved(id: string, removed: boolean): Promise<ActionResult> {
  const s = await admin();
  const { error } = await s.from("products").update({ status: removed ? "removed" : "active" }).eq("id", id);
  return error ? dbError(error) : done("/admin/annonces");
}
export async function setPostHidden(id: string, hidden: boolean): Promise<ActionResult> {
  const s = await admin();
  const { error } = await s.from("posts").update({ is_hidden: hidden }).eq("id", id);
  return error ? dbError(error) : done("/admin/communaute");
}
export async function setCommentHidden(id: string, hidden: boolean): Promise<ActionResult> {
  const s = await admin();
  const { error } = await s.from("comments").update({ is_hidden: hidden }).eq("id", id);
  return error ? dbError(error) : done("/admin/communaute");
}
export async function resolveReport(_: unknown, fd: FormData): Promise<ActionResult> {
  const s = await admin();
  const p = z.object({ id: uuid, status: z.enum(["reviewing", "resolved", "dismissed"]), resolution_note: optStr(1000), action: z.string().optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fromZod(p.error);
  const { data: me } = await s.auth.getUser();
  const { data: rep } = await s.from("reports").select("target_type,target_id").eq("id", p.data.id).single();
  if (p.data.action === "take_down" && rep) {
    if (rep.target_type === "post") await s.from("posts").update({ is_hidden: true }).eq("id", rep.target_id);
    if (rep.target_type === "comment") await s.from("comments").update({ is_hidden: true }).eq("id", rep.target_id);
    if (rep.target_type === "product") await s.from("products").update({ status: "removed" }).eq("id", rep.target_id);
    if (rep.target_type === "opportunity") await s.from("opportunities").update({ status: "archived", review_note: "Retirée suite à un signalement" }).eq("id", rep.target_id);
    if (rep.target_type === "profile") await s.from("profiles").update({ is_suspended: true }).eq("id", rep.target_id);
  }
  const { error } = await s.from("reports").update({ status: p.data.status, resolution_note: p.data.resolution_note ?? null, resolved_by: me.user?.id, resolved_at: p.data.status === "reviewing" ? null : new Date().toISOString() }).eq("id", p.data.id);
  return error ? dbError(error) : done("/admin/signalements", "Signalement traité.");
}

// ---------- Experts ----------
export async function setExpertFlags(id: string, patch: { is_active?: boolean; is_verified?: boolean }): Promise<ActionResult> {
  const s = await admin();
  const { error } = await s.from("experts").update(patch).eq("id", id);
  return error ? dbError(error) : done("/admin/experts");
}

// ---------- Contenus ----------
export async function saveBlogPost(_: unknown, fd: FormData): Promise<ActionResult> {
  const s = await admin();
  const p = z.object({ id: z.preprocess((v) => (v ? v : undefined), uuid.optional()), title: z.string().trim().min(3).max(200), excerpt: optStr(400), content: z.string().trim().min(10).max(50000), category: z.string().trim().max(40).default("actualite"), is_published: z.preprocess((v) => v === "on", z.boolean()) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fromZod(p.error);
  const { id, ...d } = p.data;
  const { data: me } = await s.auth.getUser();
  const { error } = id ? await s.from("blog_posts").update(d).eq("id", id) : await s.from("blog_posts").insert({ ...d, slug: `${slugify(d.title)}-${Math.random().toString(36).slice(2, 5)}`, author_id: me.user?.id });
  return error ? dbError(error) : done("/admin/contenus", "Article enregistré.");
}
export async function saveWebinar(_: unknown, fd: FormData): Promise<ActionResult> {
  const s = await admin();
  const p = z.object({ title: z.string().trim().min(3).max(200), description: optStr(1000), starts_at: z.string().min(10), url: optUrl, speaker: optStr(120) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fromZod(p.error);
  const { error } = await s.from("webinars").insert({ ...p.data, starts_at: new Date(p.data.starts_at).toISOString() });
  return error ? dbError(error) : done("/admin/contenus", "Webinaire programmé.");
}
export async function saveCategory(_: unknown, fd: FormData): Promise<ActionResult> {
  const s = await admin();
  const p = z.object({ table: z.enum(["opportunity_categories", "product_categories"]), name: z.string().trim().min(2).max(80) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fromZod(p.error);
  const { error } = await s.from(p.data.table).insert({ name: p.data.name, slug: slugify(p.data.name) });
  return error ? dbError(error) : done("/admin/parametres", "Catégorie ajoutée.");
}

// ---------- Paramètres ----------
export async function saveSettings(_: unknown, fd: FormData): Promise<ActionResult> {
  const s = await admin();
  const p = z.object({ ai_hourly_limit: z.coerce.number().int().min(0).max(1000), announcement: z.string().max(300).optional(), contact_email: z.string().email().optional().or(z.literal("")), maintenance: z.string().optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fromZod(p.error);
  const now = new Date().toISOString();
  const { error } = await s.from("platform_settings").upsert([
    { key: "limits", value: { ai_hourly_limit: p.data.ai_hourly_limit }, updated_at: now },
    { key: "general", value: { announcement: p.data.announcement ?? "", contact_email: p.data.contact_email ?? "", maintenance: p.data.maintenance === "on" }, updated_at: now },
  ]);
  return error ? dbError(error) : done("/admin/parametres", "Paramètres enregistrés.");
}
export async function setContactHandled(id: string): Promise<ActionResult> {
  const s = await admin();
  const { error } = await s.from("contact_messages").update({ handled: true }).eq("id", id);
  return error ? dbError(error) : done("/admin/parametres");
}
