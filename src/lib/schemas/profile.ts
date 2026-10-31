import { z } from "zod";
import { EXPERIENCE_LEVELS, LANGUAGES, PROFILE_TYPES, PROJECT_STAGES, REGIONS, SECTORS } from "@/lib/constants";

const vals = (l: { value: string }[]) => l.map((o) => o.value) as [string, ...string[]];
const empty = (v: unknown) => (v === "" || v === undefined ? null : v);

export const ProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Nom requis").max(120),
  role: z.enum(vals(PROFILE_TYPES)),
  region: z.preprocess(empty, z.enum(vals(REGIONS)).nullable()),
  sectors: z.array(z.enum(vals(SECTORS))).max(6, "6 secteurs maximum").default([]),
  experience_level: z.preprocess(empty, z.enum(vals(EXPERIENCE_LEVELS)).nullable()),
  project_type: z.preprocess(empty, z.string().trim().max(200).nullable()),
  funding_need: z.preprocess((v) => (v === "true" || v === true ? true : v === "false" || v === false ? false : null), z.boolean().nullable()),
  funding_amount: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(String(v).replace(/\s/g, ""))), z.number({ message: "Montant invalide" }).int().min(0).max(10_000_000_000).nullable()),
  project_stage: z.preprocess(empty, z.enum(vals(PROJECT_STAGES)).nullable()),
  preferred_language: z.enum(vals(LANGUAGES)).default("fr"),
  phone: z.preprocess(empty, z.string().trim().regex(/^\+?[0-9 ]{8,20}$/, "Numéro invalide").nullable()),
  bio: z.preprocess(empty, z.string().trim().max(1000).nullable()),
});
export type ProfileInput = z.infer<typeof ProfileSchema>;
