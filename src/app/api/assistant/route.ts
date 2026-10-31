import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt, callLLM, isAiConfigured, type ChatMsg } from "@/lib/ai";
import { amountRange, formatDate } from "@/lib/format";
import { labelsOf, OPP_REGIONS, SECTORS, labelOf, REGIONS, PROJECT_STAGES, ROLE_LABELS } from "@/lib/constants";
import { rankOpportunities } from "@/lib/matching";

const Body = z.object({
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().uuid().nullable().optional(),
  language: z.enum(["fr", "wo", "en"]).default("fr"),
});

export async function GET() {
  return NextResponse.json({ configured: isAiConfigured });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous pour utiliser l'assistant." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Message invalide (2000 caractères maximum)." }, { status: 400 });
  const { message, language } = parsed.data;
  let conversationId = parsed.data.conversationId ?? null;

  if (!isAiConfigured) {
    return NextResponse.json(
      { error: "L'assistant IA n'est pas encore configuré sur cette instance (variable AI_API_KEY manquante). Vous pouvez contacter un expert humain dans AgriExpert.", notConfigured: true },
      { status: 503 },
    );
  }

  const { data: quota } = await supabase.rpc("ai_quota_remaining");
  if (typeof quota === "number" && quota <= 0) {
    return NextResponse.json({ error: "Limite horaire de messages atteinte. Réessayez dans une heure." }, { status: 429 });
  }

  // Conversation
  if (conversationId) {
    const { data: conv } = await supabase.from("ai_conversations").select("id").eq("id", conversationId).maybeSingle();
    if (!conv) conversationId = null;
  }
  if (!conversationId) {
    const { data: conv, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id, title: message.slice(0, 60), language })
      .select("id")
      .single();
    if (error || !conv) return NextResponse.json({ error: "Impossible de créer la conversation." }, { status: 500 });
    conversationId = conv.id as string;
  }

  const { data: history } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("id", { ascending: false })
    .limit(12);

  // Contexte : profil + données réelles de la plateforme
  const { data: profile } = await supabase.rpc("my_profile");
  const userContext = profile
    ? [
        `Nom : ${profile.full_name || "non renseigné"}`,
        `Type : ${ROLE_LABELS[profile.role] ?? profile.role}`,
        `Région : ${labelOf(REGIONS, profile.region) || "non renseignée"}`,
        `Secteurs : ${labelsOf(SECTORS, profile.sectors).join(", ") || "non renseignés"}`,
        `Stade du projet : ${labelOf(PROJECT_STAGES, profile.project_stage) || "non renseigné"}`,
        `Montant recherché : ${profile.funding_amount ? `${profile.funding_amount} FCFA` : "non renseigné"}`,
        `Projet : ${profile.project_type || "non renseigné"}`,
      ].join("\n")
    : "Inconnu";

  const terms = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3)
    .slice(0, 6);
  const { data: opps } = await supabase
    .from("opportunities")
    .select("id,title,funder_name,summary,amount_min,amount_max,regions,sectors,beneficiary_types,project_stages,deadline,required_documents,is_demo,application_mode,opportunity_categories(name),opportunity_eligibility(label,is_mandatory)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(60);
  const ranked = rankOpportunities(profile ?? {}, (opps ?? []) as never[]);
  const byKeyword = (opps ?? []).filter((o) => terms.some((t) => `${o.title} ${o.summary ?? ""}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(t)));
  const selected = new Map<string, (typeof ranked)[number]["opp"] & { id: string }>();
  for (const o of byKeyword.slice(0, 6)) selected.set(o.id, o as never);
  for (const r of ranked.slice(0, 8)) selected.set((r.opp as { id: string }).id, r.opp as never);

  const oppText = [...selected.values()]
    .slice(0, 10)
    .map((o: Record<string, unknown>) => {
      const m = ranked.find((r) => (r.opp as { id: string }).id === o.id)?.match;
      return `- ${o.is_demo ? "[DÉMO] " : ""}${o.title} — ${o.funder_name} — ${(o.opportunity_categories as { name?: string } | null)?.name ?? ""} — ${amountRange(o.amount_min as number, o.amount_max as number)} — régions : ${labelsOf(OPP_REGIONS, o.regions as string[]).join(", ") || "toutes"} — date limite : ${o.deadline ? formatDate(o.deadline as string) : "non précisée"}${m ? ` — correspondance profil : ${m.score}%` : ""} — lien : /opportunites/${o.id}\n  Documents : ${(o.required_documents as string[]).join("; ") || "non précisés"}\n  Critères : ${((o.opportunity_eligibility as { label: string }[]) ?? []).map((e) => e.label).join("; ") || "voir fiche"}`;
    })
    .join("\n");

  const { data: courses } = await supabase.from("courses").select("slug,title,summary,is_premium,level").eq("is_published", true).limit(20);
  const courseText = (courses ?? []).map((c) => `- ${c.title}${c.is_premium ? " (premium)" : " (gratuite)"} — /academy/${c.slug}`).join("\n");
  const { data: experts } = await supabase.from("experts").select("id,full_name,title,specialties").eq("is_active", true).limit(15);
  const expertText = (experts ?? []).map((e) => `- ${e.full_name}, ${e.title} (${(e.specialties as string[]).join(", ")}) — /expert/${e.id}`).join("\n");

  const platformContext = `OPPORTUNITÉS PUBLIÉES PERTINENTES :\n${oppText || "(aucune)"}\n\nFORMATIONS :\n${courseText || "(aucune)"}\n\nEXPERTS :\n${expertText || "(aucun)"}`;

  const messages: ChatMsg[] = [...((history ?? []) as ChatMsg[]).reverse(), { role: "user", content: message }];

  const { error: insErr } = await supabase.from("ai_messages").insert({ conversation_id: conversationId, user_id: user.id, role: "user", content: message });
  if (insErr) return NextResponse.json({ error: "Impossible d'enregistrer le message." }, { status: 500 });

  let reply: string;
  try {
    reply = await callLLM(buildSystemPrompt(language, platformContext, userContext), messages);
    if (!reply) throw new Error("EMPTY");
  } catch {
    return NextResponse.json({ error: "Le service IA est momentanément indisponible. Réessayez plus tard.", conversationId }, { status: 502 });
  }
  reply = reply.slice(0, 15000);
  await supabase.from("ai_messages").insert({ conversation_id: conversationId, user_id: user.id, role: "assistant", content: reply });
  await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

  return NextResponse.json({ reply, conversationId });
}
