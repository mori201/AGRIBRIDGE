import type { Metadata } from "next";
import Link from "@/components/ui/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { PRODUCT_SELECT } from "@/components/market/product-card";
import { Avatar, Notice } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { ReportButton } from "@/components/report-button";
import { fcfa, relativeTime } from "@/lib/format";
import { labelOf, REGIONS } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { ContactSeller, FavoriteProduct } from "./client";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ publie?: string }> };

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  return data as unknown as Product | null;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).id);
  return p ? { title: p.title, description: p.description?.slice(0, 160) } : { title: "Annonce introuvable" };
}

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const { publie } = await searchParams;
  const p = await load(id);
  if (!p) notFound();
  const user = await getUser();
  const supabase = await createClient();
  const fav = user ? Boolean((await supabase.from("product_favorites").select("product_id").eq("product_id", id).eq("user_id", user.id).maybeSingle()).data) : false;
  const mine = user?.id === p.seller_id;
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link href="/market" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> AgriMarket</Link>
      {publie && <Notice tone="success" className="mb-4">Votre annonce est en ligne.</Notice>}
      {p.is_demo && <Notice tone="demo" className="mb-4">Annonce de démonstration : ce produit et ce vendeur sont fictifs.</Notice>}
      {p.status === "removed" && <Notice tone="error" className="mb-4">Cette annonce a été retirée par la modération.</Notice>}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl surface-2">
            {p.images[0] ? <Image src={p.images[0]} alt={p.title} fill priority sizes="(max-width:1024px) 100vw, 60vw" className="object-cover" /> : <div className="grid h-full place-items-center text-brand-300"><Package className="h-20 w-20" /></div>}
          </div>
          {p.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {p.images.slice(1).map((src) => <div key={src} className="relative aspect-square overflow-hidden rounded-xl"><Image src={src} alt="" fill sizes="25vw" className="object-cover" /></div>)}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap gap-1.5"><Badge tone="leaf">{p.product_categories?.name}</Badge>{p.is_demo && <DemoBadge />}{p.status === "sold" && <Badge tone="red">Vendu</Badge>}</div>
            <h1 className="mt-2 text-2xl font-extrabold">{p.title}</h1>
            <p className="mt-2 text-3xl font-extrabold text-gold-700 dark:text-gold-300">{fcfa(p.price_fcfa)} <span className="text-base font-medium text-muted">/ {p.unit}</span></p>
            {p.quantity !== null && <p className="mt-1 text-sm">Quantité disponible : <strong>{p.quantity} {p.unit}</strong></p>}
            <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin className="h-4 w-4" /> {p.location ? `${p.location}, ` : ""}{labelOf(REGIONS, p.region)} · publiée {relativeTime(p.created_at)}</p>
          </div>
          {p.description && <p className="whitespace-pre-line text-sm leading-relaxed">{p.description}</p>}
          <Card className="p-4">
            <Link href={`/membres/${p.seller_id}`} className="flex items-center gap-3">
              <Avatar name={p.profiles?.full_name} src={p.profiles?.avatar_url} size={44} />
              <div><p className="font-bold">{p.profiles?.full_name}</p><p className="text-xs text-muted">Vendeur · {labelOf(REGIONS, p.profiles?.region)}</p></div>
            </Link>
            <div className="mt-4">
              {mine ? (
                <LinkButton href={`/tableau-de-bord/annonces/${p.id}`} variant="outline" className="w-full"><Pencil className="h-4 w-4" /> Modifier mon annonce</LinkButton>
              ) : (
                <ContactSeller sellerId={p.seller_id} productId={p.id} title={p.title} whatsapp={p.whatsapp} loggedIn={Boolean(user)} disabled={p.status !== "active"} />
              )}
            </div>
          </Card>
          <div className="flex items-center justify-between">
            {!mine && <FavoriteProduct id={p.id} fav={fav} />}
            {user && !mine && <ReportButton targetType="product" targetId={p.id} label="Signaler l'annonce" />}
          </div>
          <p className="text-xs text-muted">Conseil de sécurité : privilégiez la remise en main propre et ne communiquez jamais vos codes Wave/Orange Money.</p>
        </div>
      </div>
    </div>
  );
}
