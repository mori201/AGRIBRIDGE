import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { BadgeCheck, Bot, Languages, MapPin, ShieldAlert, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, EmptyState, Notice, PageHeader } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EXPERT_SPECIALTIES, labelOf, REGIONS } from "@/lib/constants";
import { fcfa } from "@/lib/format";
import { Select } from "@/components/ui/field";

export const metadata: Metadata = { title: "AgriExpert — Assistant IA et experts agricoles", description: "Posez vos questions à l'assistant IA AgriBridge (français, wolof, anglais) et contactez des agronomes et consultants." };

export default async function Page({ searchParams }: { searchParams: Promise<{ specialite?: string; region?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("experts").select("id,full_name,title,specialties,bio,region,languages,availability,rate_fcfa,is_verified,is_demo,profiles!experts_profile_id_fkey(avatar_url)").eq("is_active", true).order("is_verified", { ascending: false });
  if (sp.specialite) q = q.contains("specialties", [sp.specialite]);
  if (sp.region) q = q.eq("region", sp.region);
  const { data: experts } = await q;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="AgriExpert" description="Un assistant IA disponible 24h/24 et un réseau d'experts humains pour vous accompagner." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-950 p-6 text-white">
          <Sparkles className="h-8 w-8 text-gold-300" />
          <h2 className="mt-3 text-xl font-bold">Assistant IA AgriBridge</h2>
          <p className="mt-1 text-sm text-brand-100">Cultures, gestion d&apos;exploitation, business plan, budget, critères de financement… En français, wolof ou anglais. Il s&apos;appuie sur les opportunités réellement publiées sur AgriBridge.</p>
          <LinkButton href="/expert/assistant" variant="gold" className="mt-4"><Bot className="h-4 w-4" /> Discuter avec l&apos;assistant</LinkButton>
        </div>
        <Notice tone="warning" title="Conseils sensibles" className="h-full rounded-3xl p-6">
          <p className="flex gap-2"><ShieldAlert className="h-5 w-5 shrink-0" />L&apos;IA ne remplace pas un professionnel. Pour les traitements phytosanitaires, les maladies animales ou la réglementation, faites toujours valider par un expert agréé ou les services techniques officiels.</p>
        </Notice>
      </div>
      <div className="mb-4 mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-bold">Répertoire d&apos;experts</h2>
        <form className="flex gap-2" action="/expert">
          <Select name="specialite" defaultValue={sp.specialite ?? ""} aria-label="Spécialité"><option value="">Toutes spécialités</option>{EXPERT_SPECIALTIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select>
          <Select name="region" defaultValue={sp.region ?? ""} aria-label="Région"><option value="">Toutes régions</option>{REGIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select>
          <button className="rounded-xl bg-brand-700 px-4 font-semibold text-white">OK</button>
        </form>
      </div>
      {(experts ?? []).length === 0 ? <EmptyState icon={BadgeCheck} title="Aucun expert ne correspond" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(experts ?? []).map((e) => (
            <Link key={e.id} href={`/expert/${e.id}`} className="surface rounded-2xl border border-base p-5 transition hover:border-brand-300 hover:shadow-md">
              <div className="flex items-center gap-3">
                <Avatar name={e.full_name} src={(e.profiles as { avatar_url?: string } | null)?.avatar_url} size={52} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-bold">{e.full_name} {e.is_verified && <BadgeCheck className="h-4 w-4 text-brand-600" aria-label="Expert vérifié" />}</p>
                  <p className="text-sm text-muted">{e.title}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">{e.specialties.slice(0, 3).map((s: string) => <Badge key={s} tone="leaf">{labelOf(EXPERT_SPECIALTIES, s)}</Badge>)}{e.is_demo && <DemoBadge />}</div>
              <div className="mt-3 space-y-1 text-xs text-muted">
                {e.region && <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {labelOf(REGIONS, e.region)}</p>}
                <p className="flex items-center gap-1"><Languages className="h-3.5 w-3.5" /> {e.languages.map((l: string) => ({ fr: "Français", wo: "Wolof", en: "Anglais" })[l] ?? l).join(", ")}</p>
                <p className="font-semibold text-[var(--text)]">{e.rate_fcfa ? `À partir de ${fcfa(e.rate_fcfa)} / séance` : "Tarif sur demande"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <p className="mt-8 text-center text-sm text-muted">Vous êtes agronome, technicien ou consultant ? <Link href="/tableau-de-bord/demandes-expert" className="font-semibold text-brand-700 underline">Rejoignez le réseau AgriExpert</Link></p>
    </div>
  );
}
