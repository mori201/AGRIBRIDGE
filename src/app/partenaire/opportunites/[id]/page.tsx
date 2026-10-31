import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePartner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Notice, PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { OpportunityForm } from "@/components/opportunities/opportunity-form";
import { OPP_STATUS_LABELS } from "@/lib/constants";
import type { Opportunity } from "@/lib/types";

export const metadata: Metadata = { title: "Modifier l'opportunité" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { orgs } = await requirePartner();
  const supabase = await createClient();
  const [{ data: opp }, { data: cats }] = await Promise.all([
    supabase.from("opportunities").select("*, opportunity_eligibility(id,label,is_mandatory,position)").eq("id", id).in("organization_id", orgs.map((o) => o.id)).maybeSingle(),
    supabase.from("opportunity_categories").select("id,name").order("id"),
  ]);
  if (!opp) notFound();
  return (
    <div>
      <PageHeader title="Modifier l'opportunité" description={`Statut actuel : ${OPP_STATUS_LABELS[opp.status]}`} />
      {opp.status === "rejected" && opp.review_note && <Notice tone="error" title="Motif du refus" className="mb-4">{opp.review_note}</Notice>}
      {opp.status === "published" && <Notice tone="warning" className="mb-4">Cette opportunité est publiée : toute modification la renverra en validation.</Notice>}
      <Card className="p-5"><OpportunityForm orgs={orgs} categories={cats ?? []} opp={opp as Opportunity} /></Card>
    </div>
  );
}
