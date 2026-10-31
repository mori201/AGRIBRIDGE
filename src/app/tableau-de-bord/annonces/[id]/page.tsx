import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { ProductForm } from "@/components/market/product-form";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Modifier l'annonce" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: p }, { data: cats }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).eq("seller_id", profile.id).maybeSingle(),
    supabase.from("product_categories").select("id,name").order("id"),
  ]);
  if (!p || p.status === "removed") notFound();
  return (
    <div>
      <PageHeader title="Modifier l'annonce" />
      <Card className="p-5"><ProductForm categories={cats ?? []} product={p as Product} /></Card>
    </div>
  );
}
