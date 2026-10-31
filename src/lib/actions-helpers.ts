import "server-only";
import { z } from "zod";
import type { ActionResult } from "@/lib/types";

export function fromZod(err: z.ZodError): ActionResult<never> {
  const flat = err.flatten();
  return { ok: false, error: "Veuillez corriger les champs indiqués.", fieldErrors: flat.fieldErrors as Record<string, string[]> };
}

/** Traduit une erreur Postgres/Supabase en message lisible sans divulguer de détails internes. */
export function dbError(e: { message?: string; code?: string } | null | undefined, fallback = "Une erreur est survenue. Réessayez."): ActionResult<never> {
  const msg = e?.message ?? "";
  if (e?.code === "23505") return { ok: false, error: "Cet élément existe déjà." };
  if (e?.code === "42501" || /row-level security|permission denied/i.test(msg)) return { ok: false, error: "Action non autorisée." };
  // Messages métiers levés volontairement par nos fonctions SQL (en français)
  if (e?.code === "P0001" && msg) return { ok: false, error: msg };
  if (process.env.NODE_ENV !== "production") console.error(e);
  return { ok: false, error: fallback };
}

export const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
export const optStr = (max: number) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());
export const optInt = z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(String(v).replace(/\s/g, ""))), z.number().int().nonnegative().nullable().optional());
export const optUrl = z.preprocess(emptyToNull, z.string().trim().url("URL invalide").max(500).refine((u) => /^https?:\/\//.test(u), "URL invalide").nullable().optional());
export const uuid = z.string().uuid();

export function arr(fd: FormData, key: string) {
  return fd.getAll(key).map(String).filter(Boolean);
}
export function obj(fd: FormData) {
  const o: Record<string, FormDataEntryValue> = {};
  fd.forEach((v, k) => {
    if (!(k in o)) o[k] = v;
  });
  return o;
}
