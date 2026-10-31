import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { PackageSearch, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, ProductCard } from "@/components/market/product-card";
import { EmptyState, Notice, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { REGIONS } from "@/lib/constants";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "AgriMarket — Marketplace agricole", description: "Achetez et vendez céréales, fruits et légumes, semences, engrais, matériel et produits d'élevage au Sénégal." };

const PAGE = 24;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: cats } = await supabase.from("product_categories").select("id,slug,name").order("id");
  const page = Math.max(1, Number(sp.page) || 1);
  let q = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" }).in("status", ["active", "sold"]);
  const cat = cats?.find((c) => c.slug === sp.categorie);
  if (cat) q = q.eq("category_id", cat.id);
  if (sp.region) q = q.eq("region", sp.region);
  if (sp.q) q = q.textSearch("search", sp.q.slice(0, 100), { type: "websearch", config: "french" });
  if (sp.prixmax && /^\d+$/.test(sp.prixmax)) q = q.lte("price_fcfa", Number(sp.prixmax));
  q = sp.tri === "prix" ? q.order("price_fcfa") : q.order("status").order("created_at", { ascending: false });
  const { data, count } = await q.range((page - 1) * PAGE, page * PAGE - 1);
  const products = (data ?? []) as unknown as Product[];
  const pages = Math.ceil((count ?? 0) / PAGE);
  const href = (patch: Record<string, string | undefined>) => `/market?${new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][])}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="AgriMarket" description="Mettez-vous en relation directe avec producteurs et acheteurs. Prix en FCFA." actions={<LinkButton href="/tableau-de-bord/annonces/nouvelle"><Plus className="h-4 w-4" /> Publier une annonce</LinkButton>} />
      <form action="/market" className="grid gap-2 sm:grid-cols-[1fr_180px_160px_auto]">
        {sp.categorie && <input type="hidden" name="categorie" value={sp.categorie} />}
        <input type="search" name="q" defaultValue={sp.q} placeholder="Rechercher : oignons, motopompe, semences…" aria-label="Rechercher un produit" className="h-12 rounded-xl border border-base surface px-4 text-[15px]" />
        <Select name="region" defaultValue={sp.region ?? ""} aria-label="Région" className="h-12"><option value="">Toutes régions</option>{REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select>
        <Select name="prixmax" defaultValue={sp.prixmax ?? ""} aria-label="Prix maximum" className="h-12"><option value="">Tout prix</option><option value="1000">≤ 1 000 FCFA</option><option value="10000">≤ 10 000 FCFA</option><option value="100000">≤ 100 000 FCFA</option><option value="1000000">≤ 1 000 000 FCFA</option></Select>
        <button className="h-12 rounded-xl bg-brand-700 px-5 font-semibold text-white">Filtrer</button>
      </form>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <Link href={href({ categorie: undefined, page: undefined })} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${!sp.categorie ? "bg-brand-700 text-white" : "border border-base"}`}>Tout</Link>
        {(cats ?? []).map((c) => <Link key={c.id} href={href({ categorie: c.slug, page: undefined })} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${sp.categorie === c.slug ? "bg-brand-700 text-white" : "border border-base"}`}>{c.name}</Link>)}
      </div>
      <Notice tone="info" className="mt-3">Les transactions se font directement entre membres. Le paiement en ligne (Wave, Orange Money) n&apos;est pas encore disponible : ne versez jamais d&apos;argent avant d&apos;avoir vérifié le produit et le vendeur.</Notice>
      <p className="mt-4 text-sm text-muted">{count ?? 0} annonce(s) · <Link href={href({ tri: sp.tri === "prix" ? undefined : "prix" })} className="font-semibold underline">{sp.tri === "prix" ? "Trier par date" : "Trier par prix"}</Link></p>
      {products.length === 0 ? (
        <EmptyState className="mt-4" icon={PackageSearch} title="Aucune annonce trouvée" description="Essayez une autre recherche ou publiez la vôtre." action={<LinkButton href="/tableau-de-bord/annonces/nouvelle" variant="secondary">Publier une annonce</LinkButton>} />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
      {pages > 1 && (
        <nav className="mt-8 flex justify-center gap-2" aria-label="Pagination">
          {page > 1 && <LinkButton href={href({ page: String(page - 1) })} variant="outline" size="sm">Précédent</LinkButton>}
          <span className="px-3 py-2 text-sm text-muted">Page {page} / {pages}</span>
          {page < pages && <LinkButton href={href({ page: String(page + 1) })} variant="outline" size="sm">Suivant</LinkButton>}
        </nav>
      )}
    </div>
  );
}
