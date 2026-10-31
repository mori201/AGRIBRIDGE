export const SITE_NAME = "AgriBridge";
export const SLOGAN = "L'information pour tous, les opportunités pour chacun.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Opt = { value: string; label: string };

export const REGIONS: Opt[] = [
  { value: "dakar", label: "Dakar" },
  { value: "diourbel", label: "Diourbel" },
  { value: "fatick", label: "Fatick" },
  { value: "kaffrine", label: "Kaffrine" },
  { value: "kaolack", label: "Kaolack" },
  { value: "kedougou", label: "Kédougou" },
  { value: "kolda", label: "Kolda" },
  { value: "louga", label: "Louga" },
  { value: "matam", label: "Matam" },
  { value: "saint-louis", label: "Saint-Louis" },
  { value: "sedhiou", label: "Sédhiou" },
  { value: "tambacounda", label: "Tambacounda" },
  { value: "thies", label: "Thiès" },
  { value: "ziguinchor", label: "Ziguinchor" },
];
export const OPP_REGIONS: Opt[] = [{ value: "national", label: "Tout le Sénégal" }, ...REGIONS];

export const SECTORS: Opt[] = [
  { value: "maraichage", label: "Maraîchage" },
  { value: "cereales", label: "Céréales" },
  { value: "arboriculture", label: "Arboriculture fruitière" },
  { value: "aviculture", label: "Aviculture" },
  { value: "elevage", label: "Élevage" },
  { value: "peche-aquaculture", label: "Pêche & aquaculture" },
  { value: "transformation", label: "Transformation agroalimentaire" },
  { value: "apiculture", label: "Apiculture" },
  { value: "agroforesterie", label: "Agroforesterie" },
  { value: "intrants", label: "Intrants agricoles" },
  { value: "mecanisation", label: "Mécanisation" },
  { value: "irrigation", label: "Irrigation" },
  { value: "commerce-agricole", label: "Commerce agricole" },
  { value: "agritech", label: "AgriTech" },
];

export const PROFILE_TYPES: Opt[] = [
  { value: "agripreneur", label: "Agripreneur / porteur de projet" },
  { value: "producteur", label: "Producteur agricole" },
  { value: "cooperative", label: "Coopérative ou GIE" },
  { value: "pme", label: "PME agricole" },
  { value: "institution", label: "Institution / financeur" },
  { value: "expert", label: "Expert agricole" },
];
export const ROLE_LABELS: Record<string, string> = {
  ...Object.fromEntries(PROFILE_TYPES.map((p) => [p.value, p.label])),
  admin: "Administrateur",
};

export const BENEFICIARY_TYPES: Opt[] = [
  { value: "agripreneur", label: "Agripreneurs / porteurs de projet" },
  { value: "producteur", label: "Producteurs" },
  { value: "cooperative", label: "Coopératives & GIE" },
  { value: "pme", label: "PME agricoles" },
  { value: "jeunes", label: "Jeunes (critère d'âge)" },
  { value: "femmes", label: "Femmes" },
];

export const PROJECT_STAGES: Opt[] = [
  { value: "idee", label: "Idée" },
  { value: "demarrage", label: "Démarrage" },
  { value: "croissance", label: "Croissance" },
  { value: "maturite", label: "Maturité" },
];

export const EXPERIENCE_LEVELS: Opt[] = [
  { value: "debutant", label: "Débutant (moins de 2 ans)" },
  { value: "intermediaire", label: "Intermédiaire (2 à 5 ans)" },
  { value: "avance", label: "Avancé (5 à 10 ans)" },
  { value: "expert", label: "Expert (plus de 10 ans)" },
];

/** Langues de l'assistant — ajouter une entrée suffit pour proposer une nouvelle langue. */
export const LANGUAGES: Opt[] = [
  { value: "fr", label: "Français" },
  { value: "wo", label: "Wolof" },
  { value: "en", label: "English" },
];

export const APPLICATION_STATUSES: (Opt & { tone: string })[] = [
  { value: "brouillon", label: "Brouillon", tone: "gray" },
  { value: "preparation", label: "En préparation", tone: "blue" },
  { value: "soumis", label: "Soumis", tone: "gold" },
  { value: "en_examen", label: "En cours d'examen", tone: "purple" },
  { value: "accepte", label: "Accepté", tone: "green" },
  { value: "refuse", label: "Refusé", tone: "red" },
];

export const OPP_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  pending_review: "En attente de validation",
  published: "Publiée",
  rejected: "Refusée",
  archived: "Archivée",
};

export const COURSE_CATEGORIES: Opt[] = [
  { value: "entrepreneuriat", label: "Entrepreneuriat agricole" },
  { value: "techniques-production", label: "Techniques de production" },
  { value: "gestion-exploitation", label: "Gestion d'exploitation" },
  { value: "gestion-financiere", label: "Gestion financière & rentabilité" },
  { value: "commercialisation", label: "Commercialisation" },
  { value: "education-financiere", label: "Éducation financière" },
  { value: "transformation", label: "Transformation agroalimentaire" },
  { value: "agriculture-durable", label: "Agriculture durable" },
  { value: "preparation-financements", label: "Préparation aux financements" },
];
export const COURSE_LEVELS: Opt[] = [
  { value: "debutant", label: "Débutant" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "avance", label: "Avancé" },
];

export const POST_CATEGORIES: Opt[] = [
  { value: "general", label: "Général" },
  { value: "maraichage", label: "Maraîchage" },
  { value: "elevage", label: "Élevage" },
  { value: "agriculture_durable", label: "Agriculture durable" },
  { value: "financement", label: "Financement" },
  { value: "entrepreneuriat", label: "Entrepreneuriat" },
  { value: "innovations", label: "Innovations" },
];

export const EXPERT_SPECIALTIES: Opt[] = [
  { value: "agronomie", label: "Agronomie" },
  { value: "phytosanitaire", label: "Phytosanitaire" },
  { value: "financement", label: "Financement" },
  { value: "business-plan", label: "Business plan" },
  { value: "gestion", label: "Gestion d'exploitation" },
  { value: "comptabilite", label: "Comptabilité" },
  { value: "elevage", label: "Élevage" },
  { value: "maraichage", label: "Maraîchage" },
  { value: "cereales", label: "Céréales" },
  { value: "agroforesterie", label: "Agroforesterie" },
  { value: "irrigation", label: "Irrigation" },
];

export const REPORT_REASONS: Opt[] = [
  { value: "spam", label: "Spam" },
  { value: "arnaque", label: "Arnaque / fraude" },
  { value: "contenu_abusif", label: "Contenu abusif ou offensant" },
  { value: "information_fausse", label: "Information fausse" },
  { value: "autre", label: "Autre" },
];

export const ORG_TYPES: Opt[] = [
  { value: "ong", label: "ONG" },
  { value: "banque", label: "Banque" },
  { value: "microfinance", label: "Institution de microfinance" },
  { value: "institution", label: "Institution publique / internationale" },
  { value: "fondation", label: "Fondation" },
  { value: "entreprise", label: "Entreprise" },
  { value: "incubateur", label: "Incubateur / accélérateur" },
  { value: "etat", label: "Programme d'État" },
];

export function labelOf(list: Opt[], value?: string | null) {
  if (!value) return "";
  return list.find((o) => o.value === value)?.label ?? value;
}
export function labelsOf(list: Opt[], values?: string[] | null) {
  return (values ?? []).map((v) => labelOf(list, v));
}
