"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, fromZod, optStr } from "@/lib/actions-helpers";
import type { ActionResult } from "@/lib/types";
import { revalidatePath } from "next/cache";

const ReportSchema = z.object({
  target_type: z.enum(["opportunity", "product", "post", "comment", "profile", "message"]),
  target_id: z.string().min(1).max(64),
  reason: z.enum(["spam", "arnaque", "contenu_abusif", "information_fausse", "autre"]),
  details: optStr(2000),
});

export async function submitReport(_: unknown, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous pour signaler un contenu." };
  const parsed = ReportSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await supabase.from("reports").insert({ ...parsed.data, reporter_id: user.id });
  if (error) return dbError(error);
  return { ok: true, message: "Merci, votre signalement a été transmis à la modération." };
}

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(120),
  email: z.string().trim().email("E-mail invalide").max(200),
  subject: z.string().trim().min(2, "Objet requis").max(200),
  message: z.string().trim().min(10, "Message trop court (10 caractères min.)").max(5000),
  website: z.string().max(0).optional(), // pot de miel anti-robots
});

export async function submitContact(_: unknown, fd: FormData): Promise<ActionResult> {
  const parsed = ContactSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const { website: _hp, ...data } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert(data);
  if (error) return dbError(error);
  return { ok: true, message: "Message envoyé. Notre équipe vous répondra par e-mail." };
}

export async function markNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  if (error) return dbError(error);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markNotificationRead(id: number): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}
