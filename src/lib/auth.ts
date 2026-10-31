import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Utilisateur courant (vérifié côté serveur Supabase). */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Profil complet de l'utilisateur courant (colonnes privées via RPC sécurisée). */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_profile");
  return (data as Profile | null) ?? null;
});

export async function requireUser(next = "/tableau-de-bord") {
  const user = await getUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  const profile = await getProfile();
  if (!profile) redirect("/connexion");
  if (profile.is_suspended) redirect("/compte-suspendu");
  return { user, profile };
}

export async function requireAdmin() {
  const ctx = await requireUser("/admin");
  if (ctx.profile.role !== "admin") redirect("/tableau-de-bord?erreur=acces");
  return ctx;
}

/** Organisations dont l'utilisateur est membre. */
export async function getMyOrganizations() {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("member_role, organizations(id, name, slug, type, is_verified, description, website, email, phone, logo_url)")
    .eq("user_id", user.id);
  return (data ?? [])
    .filter((m: { organizations: unknown }) => m.organizations)
    .map((m: { member_role: string; organizations: unknown }) => ({ ...(m.organizations as Organization), member_role: m.member_role }));
}

type Organization = { id: string; name: string; slug: string; type: string; is_verified: boolean; description: string | null; website: string | null; email: string | null; phone: string | null; logo_url: string | null };

export async function requirePartner(next = "/partenaire") {
  const ctx = await requireUser(next);
  const orgs = await getMyOrganizations();
  return { ...ctx, orgs };
}
