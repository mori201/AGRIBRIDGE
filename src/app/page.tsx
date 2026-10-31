import Link from "@/components/ui/link";
import { ArrowRight, Bot, Building2, GraduationCap, HandCoins, MessagesSquare, Quote, Search, ShieldCheck, Sparkles, Store, UserPlus, ClipboardCheck, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";
import { DemoBadge } from "@/components/ui/badge";
import { HeroIllustration } from "@/components/home/hero-illustration";
import { OPP_SELECT, OpportunityCard } from "@/components/opportunities/opportunity-card";
import { CourseCard, type CourseLite } from "@/components/academy/course-card";
import { PRODUCT_SELECT, ProductCard } from "@/components/market/product-card";
import { REGIONS, SECTORS, SLOGAN } from "@/lib/constants";
import type { Opportunity, Product } from "@/lib/types";


const PILLARS = [
  { icon: HandCoins, name: "AgriFunding", text: "Subventions, appels à projets, crédits et concours, filtrés selon votre profil.", href: "/opportunites", tone: "from-brand-600 to-brand-800" },
  { icon: GraduationCap, name: "AgriAcademy", text: "Formations en gestion, production et préparation aux financements, avec certificats.", href: "/academy", tone: "from-leaf-500 to-brand-700" },
  { icon: Bot, name: "AgriExpert", text: "Assistant IA en français, wolof et anglais, et réseau d'experts humains.", href: "/expert", tone: "from-brand-500 to-brand-900" },
  { icon: Store, name: "AgriMarket", text: "Achetez et vendez produits, intrants et matériel, en FCFA, via WhatsApp.", href: "/market", tone: "from-gold-500 to-gold-700" },
  { icon: MessagesSquare, name: "AgriCommunity", text: "Le réseau professionnel des agripreneurs : questions, groupes, retours d'expérience.", href: "/communaute", tone: "from-brand-700 to-brand-950" },
];

const STEPS = [
  { icon: UserPlus, title: "Créez votre profil", text: "Région, secteur, stade du projet : 2 minutes suffisent." },
  { icon: Sparkles, title: "Recevez des recommandations", text: "Score de compatibilité, critères remplis et manquants." },
  { icon: ClipboardCheck, title: "Préparez votre dossier", text: "Checklist des pièces, documents, rappels et suivi." },
  { icon: HandCoins, title: "Candidatez et suivez", text: "Sur AgriBridge ou le site officiel, avec historique." },
];

const TESTIMONIALS = [
  { name: "Awa D.", role: "Maraîchère, Thiès", text: "J'ai trouvé en une soirée trois programmes adaptés à mon projet et préparé mon dossier pièce par pièce." },
  { name: "Ibrahima F.", role: "Riziculteur, Saint-Louis", text: "Les formations sur la rentabilité m'ont aidé à présenter des chiffres crédibles à ma caisse de crédit." },
  { name: "Fatou N.", role: "Chargée de programme, ONG", text: "Nous recevons des candidatures mieux préparées, et le suivi des dossiers est beaucoup plus simple." },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ compte?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const profile = await getProfile();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: opps }, { data: courses }, { data: products }, { data: partners }, { data: stats }, { data: settings }] = await Promise.all([
    supabase.from("opportunities").select(OPP_SELECT).eq("status", "published").or(`deadline.is.null,deadline.gte.${today}`).order("published_at", { ascending: false }).limit(6),
    supabase.from("courses").select("id,slug,title,summary,category,level,duration_minutes,is_premium,is_demo,cover_url").eq("is_published", true).limit(4),
    supabase.from("products").select(PRODUCT_SELECT).eq("status", "active").order("created_at", { ascending: false }).limit(4),
    supabase.from("organizations").select("id,name,type,is_demo").eq("is_verified", true).limit(8),
    supabase.rpc("public_stats"),
    supabase.from("platform_settings").select("value").eq("key", "general").maybeSingle(),
  ]);
  const general = (settings?.value ?? {}) as { announcement?: string; maintenance?: boolean };

  return (
    <div>
      {sp.compte === "supprime" && <div className="mx-auto max-w-7xl px-4 pt-4"><Notice tone="success">Votre compte et vos données ont été supprimés.</Notice></div>}
      {(general.announcement || general.maintenance) && (
        <div className="bg-gold-100 px-4 py-2 text-center text-sm font-medium text-gold-700">{general.maintenance ? "Maintenance en cours : certaines fonctionnalités peuvent être indisponibles. " : ""}{general.announcement}</div>
      )}

      {/* 1. Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,var(--color-brand-100),transparent_55%),radial-gradient(ellipse_at_bottom_right,var(--color-gold-100),transparent_50%)] opacity-70 dark:opacity-20" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-12 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pb-20 lg:pt-16">
          <div className="animate-fade-in">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800 dark:bg-brand-900/50 dark:text-brand-100"><ShieldCheck className="h-3.5 w-3.5" /> Plateforme AgriTech sénégalaise</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              De l&apos;idée agricole <span className="text-brand-700 dark:text-leaf-300">au financement</span>, <span className="relative whitespace-nowrap">et à la réussite<svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" aria-hidden><path d="M2 9 C 60 2, 140 2, 198 8" stroke="#c9a13b" strokeWidth="4" fill="none" strokeLinecap="round" /></svg></span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">{SLOGAN} Trouvez les financements adaptés à votre profil, formez-vous, consultez des experts, vendez vos produits et rejoignez la communauté agricole.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="/opportunites" size="lg"><Search className="h-5 w-5" /> Trouver un financement</LinkButton>
              {!profile && <LinkButton href="/inscription" variant="gold" size="lg">Créer mon compte</LinkButton>}
              <LinkButton href="/academy" variant="outline" size="lg">Découvrir les formations</LinkButton>
            </div>
            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4">
              {[["Opportunités", stats?.opportunities], ["Membres", stats?.members], ["Formations", stats?.courses]].map(([l, v]) => (
                <div key={l as string}><dt className="text-xs font-medium text-muted">{l as string}</dt><dd className="text-2xl font-extrabold">{(v as number) ?? 0}</dd></div>
              ))}
            </dl>
          </div>
          <HeroIllustration className="mx-auto w-full max-w-lg drop-shadow-xl" />
        </div>
      </section>

      {/* 2. Recherche */}
      <section className="mx-auto -mt-4 max-w-5xl px-4">
        <form action="/opportunites" className="surface grid gap-2 rounded-2xl border border-base p-3 shadow-lg sm:grid-cols-[1.4fr_1fr_1fr_auto]">
          <label className="sr-only" htmlFor="home-q">Mot-clé</label>
          <input id="home-q" name="q" placeholder="Irrigation, aviculture, microcrédit…" className="h-12 rounded-xl border border-base surface px-4" />
          <select name="region" aria-label="Région" className="h-12 rounded-xl border border-base surface px-3"><option value="">Toutes les régions</option>{REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select>
          <select name="secteur" aria-label="Secteur" className="h-12 rounded-xl border border-base surface px-3"><option value="">Tous les secteurs</option>{SECTORS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select>
          <button className="h-12 rounded-xl bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800">Rechercher</button>
        </form>
      </section>

      {/* 3. Opportunités récentes */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><h2 className="text-2xl font-extrabold sm:text-3xl">Opportunités récentes</h2><p className="mt-1 text-muted">Vérifiées par l&apos;équipe AgriBridge avant publication.</p></div>
          <Link href="/opportunites" className="hidden items-center gap-1 font-semibold text-brand-700 hover:underline sm:inline-flex">Tout voir <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{((opps ?? []) as unknown as Opportunity[]).map((o) => <OpportunityCard key={o.id} opp={o} />)}</div>
        <LinkButton href="/opportunites" variant="secondary" className="mt-6 w-full sm:hidden">Toutes les opportunités</LinkButton>
      </section>

      {/* 4. Cinq piliers */}
      <section className="bg-brand-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl">Un écosystème, cinq piliers</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-brand-100">Un seul compte pour financer, apprendre, être accompagné, vendre et échanger.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PILLARS.map((p) => (
              <Link key={p.name} href={p.href} className="group rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition hover:bg-white/10">
                <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${p.tone}`}><p.icon className="h-6 w-6" /></div>
                <p className="mt-4 font-bold">{p.name}</p>
                <p className="mt-1 text-sm text-brand-100">{p.text}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold-300">Découvrir <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Comment ça marche */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center text-2xl font-extrabold sm:text-3xl">Comment fonctionne AgriBridge ?</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"><s.icon className="h-7 w-7" /></div>
              <span className="absolute left-1/2 top-0 -translate-y-2 translate-x-5 rounded-full bg-gold-500 px-2 text-xs font-bold text-brand-950">{i + 1}</span>
              <p className="mt-4 font-bold">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted">AgriBridge vous aide à identifier et préparer vos candidatures ; la décision d&apos;attribution appartient toujours à l&apos;organisme financeur.</p>
      </section>

      {/* 6. Formations */}
      <section className="surface-2 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-end justify-between"><h2 className="text-2xl font-extrabold sm:text-3xl">Formations populaires</h2><Link href="/academy" className="font-semibold text-brand-700 hover:underline">Catalogue →</Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{((courses ?? []) as CourseLite[]).map((c, i) => <CourseCard key={c.id} c={c} i={i} />)}</div>
        </div>
      </section>

      {/* 7. Produits */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between"><h2 className="text-2xl font-extrabold sm:text-3xl">Produits agricoles à découvrir</h2><Link href="/market" className="font-semibold text-brand-700 hover:underline">AgriMarket →</Link></div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{((products ?? []) as unknown as Product[]).map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      {/* 8. Partenaires */}
      <section className="border-y border-base py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-xl font-bold">Ils publient leurs programmes sur AgriBridge</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {(partners ?? []).map((o) => (
              <div key={o.id} className="surface flex items-center gap-2 rounded-xl border border-base px-4 py-3 text-sm font-semibold"><Building2 className="h-4 w-4 text-brand-600" /> {o.name} {o.is_demo && <DemoBadge />}</div>
            ))}
          </div>
          <LinkButton href="/inscription?profil=institution" variant="outline" className="mt-6"><Megaphone className="h-4 w-4" /> Publier une opportunité</LinkButton>
        </div>
      </section>

      {/* 9. Témoignages (démo) */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex flex-wrap items-center justify-center gap-2"><h2 className="text-2xl font-extrabold sm:text-3xl">Ce qu&apos;ils en disent</h2><DemoBadge label="Témoignages de démonstration" /></div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="surface rounded-2xl border border-base p-6">
              <Quote className="h-6 w-6 text-gold-500" aria-hidden />
              <blockquote className="mt-3 text-[15px] leading-relaxed">{t.text}</blockquote>
              <figcaption className="mt-4 text-sm"><strong>{t.name}</strong> <span className="text-muted">· {t.role}</span></figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted">Témoignages fictifs rédigés pour la démonstration de la plateforme.</p>
      </section>

      {/* 10. Appel à l'inscription */}
      <section className="mx-auto max-w-7xl px-4 pb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-950 px-6 py-12 text-center text-white sm:px-12">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold-500/20 blur-2xl" aria-hidden />
          <h2 className="text-2xl font-extrabold sm:text-4xl">Rejoignez AgriBridge</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">Inscription gratuite. Recherche d&apos;opportunités, formations gratuites et communauté accessibles à tous. Vos données ne sont jamais vendues.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <LinkButton href={profile ? "/tableau-de-bord" : "/inscription"} variant="gold" size="lg">{profile ? "Aller à mon espace" : "Rejoindre AgriBridge"}</LinkButton>
            <LinkButton href="/inscription?profil=institution" size="lg" className="bg-white/10 hover:bg-white/20">Je suis un financeur</LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
