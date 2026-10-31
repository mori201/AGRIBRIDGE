import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { Heart, Plus, Store } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_SELECT, ProductCard } from "@/components/market/product-card";
import { fcfa, relativeTime } from "@/lib/format";
import { DeleteProductButton } from "./client";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Mes annonces" };
const STATUS: Record<string, [string, string]> = { active: ["Active", "green"], sold: ["Vendu", "gold"], hidden: ["Masquée", "gray"], removed: ["Retirée par la modération", "red"] };

export default async function Page() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const [{ data: mine }, { data: favs }] = await Promise.all([
    supabase.from("products").select("id,title,price_fcfa,unit,status,created_at").eq("seller_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("product_favorites").select(`products(${PRODUCT_SELECT})`).eq("user_id", profile.id),
  ]);
  const favProducts = ((favs ?? []) as unknown as { products: Product | null }[]).map((f) => f.products).filter(Boolean) as Product[];
  return (
    <div className="space-y-8">
      <PageHeader title="Mes annonces" actions={<LinkButton href="/tableau-de-bord/annonces/nouvelle" size="sm"><Plus className="h-4 w-4" /> Nouvelle annonce</LinkButton>} />
      {(mine ?? []).length === 0 ? (
        <EmptyState icon={Store} title="Aucune annonce" description="Vendez vos produits, intrants ou matériel à toute la communauté." action={<LinkButton href="/tableau-de-bord/annonces/nouvelle">Publier ma première annonce</LinkButton>} />
      ) : (
        <ul className="surface divide-y divide-[var(--border)] rounded-2xl border border-base">
          {(mine ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/market/${p.id}`} className="font-bold hover:underline">{p.title}</Link>
                <p className="text-sm text-muted">{fcfa(p.price_fcfa)} / {p.unit} · {relativeTime(p.created_at)}</p>
              </div>
              <Badge tone={STATUS[p.status]?.[1]}>{STATUS[p.status]?.[0]}</Badge>
              {p.status !== "removed" && <LinkButton href={`/tableau-de-bord/annonces/${p.id}`} variant="outline" size="sm">Modifier</LinkButton>}
              <DeleteProductButton id={p.id} />
            </li>
          ))}
        </ul>
      )}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Heart className="h-5 w-5" /> Mes favoris</h2>
        {favProducts.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{favProducts.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <p className="text-sm text-muted">Aucun produit en favori.</p>}
      </section>
    </div>
  );
}
