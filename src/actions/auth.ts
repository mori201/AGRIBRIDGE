"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fromZod } from "@/lib/actions-helpers";
import type { ActionResult } from "@/lib/types";
import { SITE_URL } from "@/lib/constants";

function safeNext(n: unknown, fallback = "/tableau-de-bord") {
  const s = typeof n === "string" ? n : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
}
async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : SITE_URL;
}

const Login = z.object({ email: z.string().trim().email("E-mail invalide"), password: z.string().min(1, "Mot de passe requis") });

export async function signIn(_: unknown, fd: FormData): Promise<ActionResult> {
  const parsed = Login.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (/confirm/i.test(error.message)) return { ok: false, error: "Votre adresse e-mail n'est pas encore confirmée. Consultez votre boîte de réception." };
    if (error.status === 429) return { ok: false, error: "Trop de tentatives. Patientez quelques minutes." };
    return { ok: false, error: "E-mail ou mot de passe incorrect." };
  }
  redirect(safeNext(fd.get("next")));
}

const Register = z
  .object({
    full_name: z.string().trim().min(2, "Nom requis").max(120),
    email: z.string().trim().email("E-mail invalide"),
    password: z.string().min(8, "8 caractères minimum").max(72).regex(/[A-Za-z]/, "Ajoutez au moins une lettre").regex(/[0-9]/, "Ajoutez au moins un chiffre"),
    role: z.enum(["agripreneur", "producteur", "cooperative", "pme", "institution", "expert"]),
    terms: z.literal("on", { message: "Vous devez accepter les conditions" }),
  });

export async function signUp(_: unknown, fd: FormData): Promise<ActionResult> {
  const parsed = Register.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { email, password, full_name, role } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, role }, emailRedirectTo: `${await origin()}/auth/callback?next=/onboarding` },
  });
  if (error) {
    if (/registered|exists/i.test(error.message)) return { ok: false, error: "Un compte existe déjà avec cet e-mail." };
    if (/weak|pwned|leaked/i.test(error.message)) return { ok: false, error: "Mot de passe trop faible ou compromis. Choisissez-en un autre." };
    if (error.status === 429) return { ok: false, error: "Trop d'inscriptions récentes. Réessayez dans quelques minutes." };
    return { ok: false, error: "Inscription impossible pour le moment." };
  }
  if (data.session) redirect("/onboarding");
  return { ok: true, message: `Compte créé ! Un e-mail de confirmation a été envoyé à ${email}. Cliquez sur le lien pour activer votre compte.` };
}

export async function requestPasswordReset(_: unknown, fd: FormData): Promise<ActionResult> {
  const email = z.string().trim().email().safeParse(fd.get("email"));
  if (!email.success) return { ok: false, error: "E-mail invalide.", fieldErrors: { email: ["E-mail invalide"] } };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${await origin()}/auth/callback?next=/reinitialiser` });
  // Réponse identique que le compte existe ou non (anti-énumération)
  return { ok: true, message: "Si un compte existe pour cet e-mail, vous recevrez un lien de réinitialisation." };
}

export async function updatePassword(_: unknown, fd: FormData): Promise<ActionResult> {
  const pw = z.string().min(8, "8 caractères minimum").max(72).regex(/[0-9]/, "Ajoutez un chiffre").safeParse(fd.get("password"));
  if (!pw.success) return { ok: false, error: pw.error.issues[0].message, fieldErrors: { password: [pw.error.issues[0].message] } };
  if (fd.get("password") !== fd.get("confirm")) return { ok: false, error: "Les mots de passe ne correspondent pas.", fieldErrors: { confirm: ["Différent du mot de passe"] } };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) return { ok: false, error: "Lien expiré ou invalide. Recommencez la procédure." };
  return { ok: true, message: "Mot de passe mis à jour." };
}
