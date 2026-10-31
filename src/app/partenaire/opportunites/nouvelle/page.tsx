import type { Metadata } from "next";
import { requirePartner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { OpportunityForm } from "@/components/opportunities/opportunity-form";

export const metadata: Metadata = { title: "Publier une opportunité" };

export default async function Page() {
  const { orgs } = await requirePartner("/partenaire/opportunites/nouvelle");
  const supabase = await createClient();
  const { data: cats } = await supabase.from("opportunity_categories").select("id,name").order("id");
  return (
    <div>
      <PageHeader title="Publier une opportunité" description="Renseignez des informations précises et vérifiables : elles déterminent la qualité des candidatures reçues." />
      <Card className="p-5"><OpportunityForm orgs={orgs} categories={cats ?? []} /></Card>
    </div>
  );
}
