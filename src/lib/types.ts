export type Role = "agripreneur" | "producteur" | "cooperative" | "pme" | "institution" | "expert" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  region: string | null;
  sectors: string[];
  experience_level: string | null;
  project_type: string | null;
  funding_need: boolean | null;
  funding_amount: number | null;
  project_stage: string | null;
  preferred_language: string;
  onboarding_completed: boolean;
  is_suspended: boolean;
  is_demo: boolean;
  notify_email: boolean;
  notify_deadlines: boolean;
  created_at: string;
}

export interface Opportunity {
  id: string;
  title: string;
  summary: string | null;
  description: string;
  organization_id: string | null;
  funder_name: string;
  category_id: number;
  amount_min: number | null;
  amount_max: number | null;
  regions: string[];
  sectors: string[];
  beneficiary_types: string[];
  project_stages: string[];
  required_documents: string[];
  published_at: string | null;
  deadline: string | null;
  application_url: string | null;
  application_mode: "external" | "platform";
  contact_email: string | null;
  contact_phone: string | null;
  source_url: string | null;
  verified_at: string | null;
  is_demo: boolean;
  is_premium: boolean;
  status: string;
  review_note: string | null;
  created_by: string | null;
  created_at: string;
  opportunity_categories?: { name: string; slug: string } | null;
  organizations?: { name: string; slug: string; is_verified: boolean } | null;
  opportunity_eligibility?: { id: string; label: string; is_mandatory: boolean; position: number }[];
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: number;
  title: string;
  description: string | null;
  price_fcfa: number;
  unit: string;
  quantity: number | null;
  region: string;
  location: string | null;
  images: string[];
  whatsapp: string | null;
  status: string;
  is_demo: boolean;
  created_at: string;
  product_categories?: { name: string; slug: string } | null;
  profiles?: { id: string; full_name: string; avatar_url: string | null; region: string | null } | null;
}

export type ActionResult<T = undefined> = { ok: true; message?: string; data?: T } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined>; data?: Record<string, unknown> };
