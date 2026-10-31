import "server-only";
import { createClient } from "@/lib/supabase/server";
import { OPP_SELECT } from "@/components/opportunities/opportunity-card";
import { rankOpportunities } from "@/lib/matching";
import type { Opportunity, Profile } from "@/lib/types";

export async function getRecommendations(profile: Profile, limit = 6) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from("opportunities").select(OPP_SELECT).eq("status", "published").or(`deadline.is.null,deadline.gte.${today}`).order("published_at", { ascending: false }).limit(150);
  return rankOpportunities(profile, (data ?? []) as unknown as Opportunity[]).slice(0, limit);
}

export function profileCompletion(p: Profile) {
  const checks: [string, boolean][] = [
    ["Nom", Boolean(p.full_name)],
    ["Région", Boolean(p.region)],
    ["Secteurs", (p.sectors ?? []).length > 0],
    ["Expérience", Boolean(p.experience_level)],
    ["Projet", Boolean(p.project_type)],
    ["Stade du projet", Boolean(p.project_stage)],
    ["Besoin de financement", p.funding_need !== null],
    ["Photo", Boolean(p.avatar_url)],
  ];
  const done = checks.filter(([, v]) => v).length;
  return { percent: Math.round((done / checks.length) * 100), missing: checks.filter(([, v]) => !v).map(([k]) => k) };
}
