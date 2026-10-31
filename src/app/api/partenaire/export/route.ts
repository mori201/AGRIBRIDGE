import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { APPLICATION_STATUSES, labelOf, labelsOf, PROJECT_STAGES, REGIONS, ROLE_LABELS, SECTORS } from "@/lib/constants";

const esc = (v: unknown) => {
  const s = String(v ?? "").replace(/\r?\n/g, " ");
  // Neutralise l'injection de formules dans les tableurs
  const safe = /^[=+\-@\t]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const { data: mem } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id);
  const orgIds = (mem ?? []).map((m) => m.organization_id);
  if (!orgIds.length) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  let q = supabase.from("applications").select("id,status,submitted_at,user_id,motivation,opportunities!inner(title,organization_id)").eq("shared_with_partner", true).in("opportunities.organization_id", orgIds).limit(5000);
  if (sp.get("opportunite")) q = q.eq("opportunity_id", sp.get("opportunite")!);
  if (sp.get("statut")) q = q.eq("status", sp.get("statut")!);
  const { data: apps, error } = await q;
  if (error) return NextResponse.json({ error: "Export impossible" }, { status: 500 });

  const rows: string[] = [["Candidature", "Opportunité", "Statut", "Soumise le", "Nom", "E-mail", "Téléphone", "Type de profil", "Région", "Secteurs", "Stade du projet", "Montant recherché (FCFA)", "Projet", "Présentation"].map(esc).join(";")];
  for (const a of (apps ?? []) as unknown as { id: string; status: string; submitted_at: string | null; user_id: string; motivation: string | null; opportunities: { title: string } }[]) {
    const { data: c } = await supabase.rpc("candidate_profile", { p: a.user_id });
    const p = c?.[0];
    if (sp.get("region") && p?.region !== sp.get("region")) continue;
    if (sp.get("secteur") && !p?.sectors?.includes(sp.get("secteur")!)) continue;
    if (sp.get("type") && p?.role !== sp.get("type")) continue;
    rows.push([a.id, a.opportunities.title, labelOf(APPLICATION_STATUSES, a.status), a.submitted_at?.slice(0, 10), p?.full_name, p?.email, p?.phone, ROLE_LABELS[p?.role ?? ""], labelOf(REGIONS, p?.region), labelsOf(SECTORS, p?.sectors).join(", "), labelOf(PROJECT_STAGES, p?.project_stage), p?.funding_amount, p?.project_type, a.motivation].map(esc).join(";"));
  }
  return new NextResponse("﻿" + rows.join("\r\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="candidatures-agribridge-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
}
