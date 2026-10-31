/**
 * Moteur de correspondance profil ↔ opportunité.
 * Fonction pure, sans dépendance : testée dans tests/matching.test.ts.
 * Le score est indicatif — il ne garantit jamais l'obtention d'un financement.
 */
export interface MatchProfile {
  role?: string | null;
  region?: string | null;
  sectors?: string[] | null;
  project_stage?: string | null;
  funding_amount?: number | null;
}
export interface MatchOpportunity {
  regions: string[];
  sectors: string[];
  beneficiary_types: string[];
  project_stages: string[];
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  required_documents: string[];
  application_mode?: string;
  opportunity_eligibility?: { label: string; is_mandatory: boolean }[];
}

export type CriterionState = "met" | "missing" | "unknown";
export interface Criterion {
  key: string;
  label: string;
  state: CriterionState;
  detail?: string;
}
export interface MatchResult {
  score: number; // 0–100
  level: "forte" | "moyenne" | "faible";
  criteria: Criterion[];
  toVerify: string[];
  documents: string[];
  nextSteps: string[];
  closed: boolean;
}

const ROLE_TO_BENEFICIARY: Record<string, string> = {
  agripreneur: "agripreneur",
  producteur: "producteur",
  cooperative: "cooperative",
  pme: "pme",
};
// Critères qu'on ne peut pas déduire du profil : affichés « à vérifier »
const DECLARATIVE = new Set(["jeunes", "femmes"]);

const WEIGHTS = { region: 25, sector: 30, beneficiary: 20, stage: 15, amount: 10 };

export function computeMatch(p: MatchProfile, o: MatchOpportunity, today = new Date()): MatchResult {
  const criteria: Criterion[] = [];
  let earned = 0;
  let possible = 0;

  const add = (key: keyof typeof WEIGHTS, label: string, state: CriterionState, detail?: string) => {
    criteria.push({ key, label, state, detail });
    if (state === "unknown") return; // ne pénalise pas, mais n'apporte rien
    possible += WEIGHTS[key];
    if (state === "met") earned += WEIGHTS[key];
  };

  // Région
  if (!o.regions.length || o.regions.includes("national")) add("region", "Zone géographique", "met", "Ouverte à tout le Sénégal");
  else if (!p.region) add("region", "Zone géographique", "unknown", "Renseignez votre région dans votre profil");
  else add("region", "Zone géographique", o.regions.includes(p.region) ? "met" : "missing");

  // Secteur
  if (!o.sectors.length) add("sector", "Secteur agricole", "met", "Tous secteurs");
  else if (!p.sectors?.length) add("sector", "Secteur agricole", "unknown", "Indiquez vos secteurs d'activité");
  else add("sector", "Secteur agricole", p.sectors.some((s) => o.sectors.includes(s)) ? "met" : "missing");

  // Type de bénéficiaire
  const structural = o.beneficiary_types.filter((b) => !DECLARATIVE.has(b));
  const declarative = o.beneficiary_types.filter((b) => DECLARATIVE.has(b));
  if (!structural.length) add("beneficiary", "Type de bénéficiaire", "met");
  else {
    const mine = p.role ? ROLE_TO_BENEFICIARY[p.role] : undefined;
    if (!mine) add("beneficiary", "Type de bénéficiaire", "unknown", "Votre type de profil n'est pas concerné directement");
    else add("beneficiary", "Type de bénéficiaire", structural.includes(mine) ? "met" : "missing");
  }

  // Stade du projet
  if (!o.project_stages.length) add("stage", "Maturité du projet", "met");
  else if (!p.project_stage) add("stage", "Maturité du projet", "unknown", "Précisez le stade de votre projet");
  else add("stage", "Maturité du projet", o.project_stages.includes(p.project_stage) ? "met" : "missing");

  // Montant recherché
  if (!o.amount_min && !o.amount_max) add("amount", "Montant recherché", "unknown", "Montant non précisé par l'organisme");
  else if (!p.funding_amount) add("amount", "Montant recherché", "unknown", "Indiquez le montant recherché");
  else {
    const okMin = !o.amount_min || p.funding_amount >= o.amount_min * 0.5;
    const okMax = !o.amount_max || p.funding_amount <= o.amount_max;
    add("amount", "Montant recherché", okMin && okMax ? "met" : "missing");
  }

  const score = possible === 0 ? 0 : Math.round((earned / possible) * 100);
  const hasBlocking = criteria.some((c) => c.state === "missing" && (c.key === "region" || c.key === "beneficiary"));
  const level: MatchResult["level"] = hasBlocking ? "faible" : score >= 75 ? "forte" : score >= 45 ? "moyenne" : "faible";

  const toVerify = [
    ...declarative.map((d) => (d === "jeunes" ? "Condition d'âge (jeunes)" : "Projet porté par une femme")),
    ...(o.opportunity_eligibility ?? []).map((e) => (e.is_mandatory ? e.label : `${e.label} (souhaité)`)),
  ];

  let closed = false;
  if (o.deadline) {
    const end = new Date(`${o.deadline}T23:59:59`);
    closed = end.getTime() < today.getTime();
  }

  const nextSteps: string[] = [];
  if (closed) nextSteps.push("Cette opportunité est clôturée : créez une alerte pour être informé des prochaines éditions.");
  else {
    if (criteria.some((c) => c.state === "unknown")) nextSteps.push("Complétez votre profil pour affiner la correspondance.");
    if (o.required_documents.length) nextSteps.push(`Préparez les ${o.required_documents.length} document(s) requis.`);
    if (toVerify.length) nextSteps.push("Vérifiez les critères d'éligibilité spécifiques auprès de l'organisme.");
    nextSteps.push(
      o.application_mode === "platform"
        ? "Constituez votre dossier et soumettez-le depuis AgriBridge."
        : "Enregistrez l'opportunité, préparez votre dossier puis candidatez sur le site officiel.",
    );
  }

  return { score, level, criteria, toVerify, documents: o.required_documents, nextSteps, closed };
}

export function rankOpportunities<T extends MatchOpportunity>(p: MatchProfile, list: T[], today = new Date()) {
  return list
    .map((o) => ({ opp: o, match: computeMatch(p, o, today) }))
    .filter((r) => !r.match.closed)
    .sort((a, b) => b.match.score - a.match.score);
}
