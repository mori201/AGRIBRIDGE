import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { ProductForm } from "@/components/market/product-form";

export const metadata: Metadata = { title: "Nouvelle annonce" };

export default async function Page() {
  const { profile } = await requireUser("/tableau-de-bord/annonces/nouvelle");
  const supabase = await createClient();
  const { data: cats } = await supabase.from("product_categories").select("id,name").order("id");
  return (
    <div>
      <PageHeader title="Publier une annonce" description="Votre annonce sera visible immédiatement. Les annonces frauduleuses sont retirées par la modération." />
      <Card className="p-5"><ProductForm categories={cats ?? []} defaultRegion={profile.region} /></Card>
    </div>
  );
}
