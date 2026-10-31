import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, CalendarClock, Languages, MapPin, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Avatar, Notice } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { EXPERT_SPECIALTIES, labelOf, REGIONS } from "@/lib/constants";
import { fcfa } from "@/lib/format";
import { ExpertRequestForm } from "./client";

export const metadata: Metadata = { title: "Expert agricole" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: e } = await supabase.from("experts").select("*, profiles(avatar_url)").eq("id", id).maybeSingle();
  if (!e) notFound();
  const user = await getUser();
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link href="/expert" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> AgriExpert</Link>
      {e.is_demo && <Notice tone="demo" className="mb-4">Profil d&apos;expert fictif, utilisé pour la démonstration.</Notice>}
      {!e.is_active && <Notice tone="warning" className="mb-4">Fiche en attente de validation par l&apos;équipe AgriBridge.</Notice>}
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div>
          <div className="flex items-center gap-4">
            <Avatar name={e.full_name} src={e.profiles?.avatar_url} size={80} />
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-extrabold">{e.full_name} {e.is_verified && <BadgeCheck className="h-6 w-6 text-brand-600" aria-label="Vérifié" />}</h1>
              <p className="text-muted">{e.title}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">{e.specialties.map((s: string) => <Badge key={s} tone="leaf">{labelOf(EXPERT_SPECIALTIES, s)}</Badge>)}{e.is_demo && <DemoBadge />}</div>
          {e.bio && <p className="mt-5 whitespace-pre-line leading-relaxed">{e.bio}</p>}
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {[[MapPin, "Région", labelOf(REGIONS, e.region) || "—"], [Languages, "Langues", e.languages.map((l: string) => ({ fr: "Français", wo: "Wolof", en: "Anglais" })[l] ?? l).join(", ")], [CalendarClock, "Disponibilités", e.availability ?? "Sur demande"], [Wallet, "Tarif indicatif", e.rate_fcfa ? `${fcfa(e.rate_fcfa)} / séance` : "Sur demande"]].map(([Icon, l, v]) => {
              const I = Icon as typeof MapPin;
              return <div key={l as string} className="surface flex gap-3 rounded-xl border border-base p-3"><I className="h-5 w-5 text-brand-600" /><div><dt className="text-xs text-muted">{l as string}</dt><dd className="text-sm font-semibold">{v as string}</dd></div></div>;
            })}
          </dl>
        </div>
        <Card className="h-fit p-5">
          <p className="font-bold">Demander un accompagnement</p>
          <p className="mb-4 mt-1 text-xs text-muted">Les tarifs et modalités sont convenus directement avec l&apos;expert. Aucun paiement n&apos;est effectué sur AgriBridge.</p>
          {user ? (user.id === e.profile_id ? <p className="text-sm text-muted">C&apos;est votre fiche expert.</p> : e.is_active ? <ExpertRequestForm expertId={e.id} /> : <p className="text-sm text-muted">Fiche non active.</p>) : <LinkButton href={`/connexion?next=/expert/${e.id}`} className="w-full">Se connecter pour écrire</LinkButton>}
        </Card>
      </div>
    </div>
  );
}
