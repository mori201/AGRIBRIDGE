import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/constants";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ["", "/opportunites", "/academy", "/expert", "/market", "/communaute", "/blog", "/partenaires", "/a-propos", "/faq", "/contact", "/conditions", "/confidentialite"].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7 }));
  if (!isSupabaseConfigured) return statics;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const [{ data: opps }, { data: courses }, { data: posts }] = await Promise.all([
    supabase.from("opportunities").select("id,updated_at").eq("status", "published").limit(1000),
    supabase.from("courses").select("slug,updated_at").eq("is_published", true),
    supabase.from("blog_posts").select("slug,published_at").eq("is_published", true),
  ]);
  return [
    ...statics,
    ...(opps ?? []).map((o) => ({ url: `${SITE_URL}/opportunites/${o.id}`, lastModified: o.updated_at, priority: 0.8 })),
    ...(courses ?? []).map((c) => ({ url: `${SITE_URL}/academy/${c.slug}`, lastModified: c.updated_at })),
    ...(posts ?? []).map((b) => ({ url: `${SITE_URL}/blog/${b.slug}`, lastModified: b.published_at ?? undefined })),
  ];
}
