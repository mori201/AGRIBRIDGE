"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { Select } from "@/components/ui/field";
import { BENEFICIARY_TYPES, OPP_REGIONS, PROJECT_STAGES, SECTORS } from "@/lib/constants";

export function OpportunityFilters({ categories }: { categories: { id: number; name: string }[] }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const update = (key: string, value: string) => {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    start(() => router.replace(`${path}?${p.toString()}`, { scroll: false }));
  };

  // Recherche instantanée (anti-rebond)
  useEffect(() => {
    const t = setTimeout(() => {
      if ((sp.get("q") ?? "") !== q) update("q", q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const active = ["region", "secteur", "type", "beneficiaire", "stade", "montant", "echeance", "statut"].filter((k) => sp.get(k)).length;

  const selects = (
    <>
      <Select aria-label="Région" value={sp.get("region") ?? ""} onChange={(e) => update("region", e.target.value)}>
        <option value="">Toutes les régions</option>
        {OPP_REGIONS.filter((r) => r.value !== "national").map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </Select>
      <Select aria-label="Secteur" value={sp.get("secteur") ?? ""} onChange={(e) => update("secteur", e.target.value)}>
        <option value="">Tous les secteurs</option>
        {SECTORS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </Select>
      <Select aria-label="Type de financement" value={sp.get("type") ?? ""} onChange={(e) => update("type", e.target.value)}>
        <option value="">Tous les types</option>
        {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
      </Select>
      <Select aria-label="Bénéficiaire" value={sp.get("beneficiaire") ?? ""} onChange={(e) => update("beneficiaire", e.target.value)}>
        <option value="">Tous bénéficiaires</option>
        {BENEFICIARY_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </Select>
      <Select aria-label="Maturité du projet" value={sp.get("stade") ?? ""} onChange={(e) => update("stade", e.target.value)}>
        <option value="">Toute maturité</option>
        {PROJECT_STAGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </Select>
      <Select aria-label="Montant" value={sp.get("montant") ?? ""} onChange={(e) => update("montant", e.target.value)}>
        <option value="">Tout montant</option>
        <option value="1000000">Jusqu&apos;à 1 M FCFA</option>
        <option value="5000000">Jusqu&apos;à 5 M FCFA</option>
        <option value="20000000">Jusqu&apos;à 20 M FCFA</option>
        <option value="20000001">Plus de 20 M FCFA</option>
      </Select>
      <Select aria-label="Date limite" value={sp.get("echeance") ?? ""} onChange={(e) => update("echeance", e.target.value)}>
        <option value="">Toute échéance</option>
        <option value="7">Dans 7 jours</option>
        <option value="30">Dans 30 jours</option>
        <option value="90">Dans 3 mois</option>
      </Select>
      <Select aria-label="Statut" value={sp.get("statut") ?? ""} onChange={(e) => update("statut", e.target.value)}>
        <option value="">Ouvertes uniquement</option>
        <option value="toutes">Inclure les clôturées</option>
      </Select>
    </>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher : irrigation, aviculture, microcrédit…"
            aria-label="Rechercher une opportunité"
            className="h-12 w-full rounded-xl border border-base surface pl-10 pr-10 text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          {pending && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />}
        </div>
        <button onClick={() => setOpen((o) => !o)} className="relative flex h-12 items-center gap-2 rounded-xl border border-base surface px-4 text-sm font-semibold lg:hidden" aria-expanded={open}>
          <SlidersHorizontal className="h-4 w-4" /> Filtres
          {active > 0 && <span className="rounded-full bg-brand-700 px-1.5 text-xs text-white">{active}</span>}
        </button>
      </div>
      <div className={`${open ? "grid" : "hidden"} grid-cols-1 gap-2 sm:grid-cols-2 lg:grid lg:grid-cols-4`}>{selects}</div>
      {active > 0 && (
        <button onClick={() => start(() => router.replace(q ? `${path}?q=${encodeURIComponent(q)}` : path))} className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          <X className="h-4 w-4" /> Effacer les filtres
        </button>
      )}
    </div>
  );
}
