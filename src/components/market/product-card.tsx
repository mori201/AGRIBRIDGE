import Link from "next/link";
import Image from "next/image";
import { MapPin, Package } from "lucide-react";
import { DemoBadge, Badge } from "@/components/ui/badge";
import { fcfa } from "@/lib/format";
import { labelOf, REGIONS } from "@/lib/constants";
import type { Product } from "@/lib/types";

export const PRODUCT_SELECT = "id,seller_id,category_id,title,description,price_fcfa,unit,quantity,region,location,images,whatsapp,status,is_demo,created_at,product_categories(name,slug),profiles(id,full_name,avatar_url,region)";

export function ProductCard({ p }: { p: Product }) {
  return (
    <Link href={`/market/${p.id}`} className="group surface flex flex-col overflow-hidden rounded-2xl border border-base transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] surface-2">
        {p.images[0] ? (
          <Image src={p.images[0]} alt={p.title} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-brand-300"><Package className="h-12 w-12" aria-hidden /></div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {p.is_demo && <DemoBadge />}
          {p.status === "sold" && <Badge tone="red">Vendu</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-xs font-semibold text-brand-700 dark:text-leaf-300">{p.product_categories?.name}</p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-bold">{p.title}</h3>
        <p className="mt-1 font-extrabold text-gold-700 dark:text-gold-300">{fcfa(p.price_fcfa)} <span className="text-xs font-medium text-muted">/ {p.unit}</span></p>
        <p className="mt-auto flex items-center gap-1 pt-2 text-xs text-muted"><MapPin className="h-3.5 w-3.5" /> {p.location ? `${p.location}, ` : ""}{labelOf(REGIONS, p.region)}</p>
      </div>
    </Link>
  );
}
