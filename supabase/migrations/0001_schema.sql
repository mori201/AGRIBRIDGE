-- =====================================================================
-- AgriBridge — Schéma principal
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- Types ----------
create type public.user_role as enum (
  'agripreneur','producteur','cooperative','pme','institution','expert','admin'
);
create type public.opportunity_status as enum (
  'draft','pending_review','published','rejected','archived'
);
create type public.application_status as enum (
  'brouillon','preparation','soumis','en_examen','accepte','refuse'
);
create type public.report_status as enum ('open','reviewing','resolved','dismissed');
create type public.report_target as enum ('opportunity','product','post','comment','profile','message');

-- ---------- Helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------- Profils ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  role public.user_role not null default 'agripreneur',
  avatar_url text,
  bio text check (char_length(bio) <= 1000),
  phone text check (char_length(phone) <= 30),
  region text,
  sectors text[] not null default '{}',
  experience_level text check (experience_level in ('debutant','intermediaire','avance','expert')),
  project_type text check (char_length(project_type) <= 200),
  funding_need boolean,
  funding_amount bigint check (funding_amount >= 0),
  project_stage text check (project_stage in ('idee','demarrage','croissance','maturite')),
  preferred_language text not null default 'fr' check (preferred_language in ('fr','wo','en')),
  onboarding_completed boolean not null default false,
  is_suspended boolean not null default false,
  is_demo boolean not null default false,
  notify_email boolean not null default true,
  notify_deadlines boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and not is_suspended)
$$;

-- Contexte privilégié : administrateur connecté, ou exécution serveur (migrations / seed, sans JWT).
-- Les visiteurs anonymes n'ont aucune politique d'écriture, ce cas ne leur ouvre donc rien.
create or replace function public.is_privileged() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is null or public.is_admin()
$$;

-- Création automatique du profil (le rôle admin ne peut JAMAIS venir des métadonnées)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'role','agripreneur');
begin
  if r not in ('agripreneur','producteur','cooperative','pme','institution','expert') then
    r := 'agripreneur';
  end if;
  insert into public.profiles (id, full_name, role)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name',''),120), r::public.user_role);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Empêche l'auto-promotion (rôle, suspension, démo)
create or replace function public.protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_privileged() then
    if new.is_suspended is distinct from old.is_suspended
       or new.is_demo is distinct from old.is_demo then
      raise exception 'Modification non autorisée';
    end if;
    if new.role is distinct from old.role then
      -- un utilisateur peut changer de type de profil, mais jamais vers/depuis admin
      if new.role = 'admin' or old.role = 'admin' then
        raise exception 'Modification de rôle non autorisée';
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------- Organisations ----------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text unique not null check (slug ~ '^[a-z0-9-]{2,80}$'),
  type text not null default 'ong' check (type in ('ong','banque','microfinance','institution','fondation','entreprise','incubateur','etat')),
  description text check (char_length(description) <= 3000),
  website text,
  email text,
  phone text,
  logo_url text,
  country text not null default 'SN',
  is_verified boolean not null default false,
  is_demo boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger organizations_updated before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('owner','manager','member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index on public.organization_members(user_id);

create or replace function public.is_org_member(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members where organization_id = org and user_id = auth.uid())
$$;
create or replace function public.is_org_manager(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members
    where organization_id = org and user_id = auth.uid() and member_role in ('owner','manager'))
$$;

create or replace function public.protect_org_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_privileged() and new.is_verified is distinct from old.is_verified then
    raise exception 'Seul un administrateur peut valider une organisation';
  end if;
  if not public.is_privileged() and new.is_demo is distinct from old.is_demo then
    raise exception 'Modification non autorisée';
  end if;
  return new;
end $$;
create trigger organizations_protect before update on public.organizations
  for each row execute function public.protect_org_fields();

-- Création d'organisation + adhésion owner en une transaction
create or replace function public.create_organization(p_name text, p_slug text, p_type text, p_description text, p_website text, p_email text, p_phone text)
returns uuid language plpgsql security definer set search_path = public as $$
declare oid uuid;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  insert into public.organizations(name, slug, type, description, website, email, phone, created_by)
  values (p_name, p_slug, p_type, p_description, p_website, p_email, p_phone, auth.uid())
  returning id into oid;
  insert into public.organization_members(organization_id, user_id, member_role) values (oid, auth.uid(), 'owner');
  return oid;
end $$;

-- ---------- Abonnements (sans paiement intégré) ----------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('gratuit','partenaire','partenaire_pro','premium_individuel')),
  status text not null default 'active' check (status in ('active','expired','cancelled','pending')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  check (organization_id is not null or user_id is not null)
);

-- ---------- AgriFunding ----------
create table public.opportunity_categories (
  id serial primary key,
  slug text unique not null,
  name text not null,
  icon text
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 200),
  summary text check (char_length(summary) <= 400),
  description text not null check (char_length(description) <= 20000),
  organization_id uuid references public.organizations(id) on delete set null,
  funder_name text not null check (char_length(funder_name) <= 200),
  category_id int not null references public.opportunity_categories(id),
  amount_min bigint check (amount_min >= 0),
  amount_max bigint check (amount_max >= 0),
  currency text not null default 'XOF',
  regions text[] not null default '{}',
  sectors text[] not null default '{}',
  beneficiary_types text[] not null default '{}',
  project_stages text[] not null default '{}',
  required_documents text[] not null default '{}',
  published_at timestamptz,
  deadline date,
  application_url text,
  application_mode text not null default 'external' check (application_mode in ('external','platform')),
  contact_email text,
  contact_phone text,
  source_url text,
  verified_at date,
  is_demo boolean not null default false,
  is_premium boolean not null default false,
  status public.opportunity_status not null default 'draft',
  review_note text,
  created_by uuid references public.profiles(id) on delete set null,
  search tsvector generated always as (
    to_tsvector('french', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(funder_name,'') || ' ' || coalesce(description,''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount_max is null or amount_min is null or amount_max >= amount_min)
);
create trigger opportunities_updated before update on public.opportunities
  for each row execute function public.set_updated_at();
create index opportunities_status_idx on public.opportunities(status, deadline);
create index opportunities_org_idx on public.opportunities(organization_id);
create index opportunities_search_idx on public.opportunities using gin(search);
create index opportunities_regions_idx on public.opportunities using gin(regions);
create index opportunities_sectors_idx on public.opportunities using gin(sectors);

-- Un partenaire non-admin ne peut pas publier directement : passage par la revue
create or replace function public.guard_opportunity_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_privileged() then
    if new.status in ('published','rejected') and (tg_op = 'INSERT' or new.status is distinct from old.status) then
      raise exception 'La publication nécessite une validation par un administrateur';
    end if;
    if tg_op = 'UPDATE' and old.status = 'published' and new.status = 'published' then
      -- modification d'une offre publiée => retour en revue
      new.status := 'pending_review';
    end if;
    if new.is_demo is distinct from coalesce(case when tg_op='UPDATE' then old.is_demo end, false) then
      raise exception 'Modification non autorisée';
    end if;
    new.verified_at := case when tg_op='UPDATE' then old.verified_at else null end;
  end if;
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  return new;
end $$;
create trigger opportunities_guard before insert or update on public.opportunities
  for each row execute function public.guard_opportunity_status();

create table public.opportunity_eligibility (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  label text not null check (char_length(label) <= 300),
  is_mandatory boolean not null default true,
  position int not null default 0
);
create index on public.opportunity_eligibility(opportunity_id);

create table public.saved_opportunities (
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

create table public.opportunity_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) <= 100),
  region text,
  sector text,
  category_id int references public.opportunity_categories(id),
  keyword text check (char_length(keyword) <= 100),
  created_at timestamptz not null default now()
);
create index on public.opportunity_alerts(user_id);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status public.application_status not null default 'brouillon',
  notes text check (char_length(notes) <= 10000),
  motivation text check (char_length(motivation) <= 10000),
  reminder_at date,
  submitted_at timestamptz,
  shared_with_partner boolean not null default false,
  partner_note text check (char_length(partner_note) <= 3000),
  checklist jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);
create trigger applications_updated before update on public.applications
  for each row execute function public.set_updated_at();
create index on public.applications(opportunity_id);

create table public.application_history (
  id bigserial primary key,
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index on public.application_history(application_id);

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) <= 200),
  storage_path text not null,
  size_bytes int check (size_bytes <= 10485760),
  mime_type text,
  created_at timestamptz not null default now()
);
create index on public.application_documents(application_id);

-- ---------- AgriAcademy ----------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  description text,
  category text not null,
  level text not null default 'debutant' check (level in ('debutant','intermediaire','avance')),
  duration_minutes int,
  cover_url text,
  is_premium boolean not null default false,
  is_published boolean not null default false,
  instructor text,
  pass_score int not null default 70 check (pass_score between 0 and 100),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger courses_updated before update on public.courses
  for each row execute function public.set_updated_at();

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position int not null default 0
);
create index on public.course_modules(course_id);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  content text,
  video_url text,
  pdf_url text,
  duration_minutes int,
  position int not null default 0
);
create index on public.lessons(module_id);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid references public.course_modules(id) on delete cascade,
  title text not null
);
create index on public.quizzes(course_id);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null,
  options text[] not null check (array_length(options,1) between 2 and 6),
  correct_index int not null,
  explanation text,
  position int not null default 0
);
create index on public.quiz_questions(quiz_id);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score int not null,
  passed boolean not null,
  answers int[] not null,
  created_at timestamptz not null default now()
);
create index on public.quiz_attempts(user_id, quiz_id);

create table public.course_enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table public.course_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index on public.course_progress(user_id, course_id);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  score int,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.webinars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  url text,
  speaker text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- AgriExpert ----------
create table public.experts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  title text not null,
  specialties text[] not null default '{}',
  bio text,
  region text,
  languages text[] not null default '{fr}',
  availability text,
  rate_fcfa int check (rate_fcfa >= 0),
  is_verified boolean not null default false,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.expert_requests (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 200),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'pending' check (status in ('pending','accepted','declined','completed')),
  response text check (char_length(response) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger expert_requests_updated before update on public.expert_requests
  for each row execute function public.set_updated_at();
create index on public.expert_requests(user_id);
create index on public.expert_requests(expert_id);

create or replace function public.is_expert_owner(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.experts where id = e and profile_id = auth.uid())
$$;

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Nouvelle conversation',
  language text not null default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.ai_conversations(user_id, updated_at desc);
create table public.ai_messages (
  id bigserial primary key,
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) <= 20000),
  created_at timestamptz not null default now()
);
create index on public.ai_messages(conversation_id, id);
create index on public.ai_messages(user_id, created_at);

-- ---------- AgriMarket ----------
create table public.product_categories (
  id serial primary key,
  slug text unique not null,
  name text not null,
  icon text
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  category_id int not null references public.product_categories(id),
  title text not null check (char_length(title) between 3 and 150),
  description text check (char_length(description) <= 5000),
  price_fcfa bigint not null check (price_fcfa >= 0),
  unit text not null default 'kg' check (char_length(unit) <= 30),
  quantity numeric check (quantity >= 0),
  region text not null,
  location text check (char_length(location) <= 150),
  images text[] not null default '{}',
  whatsapp text check (whatsapp ~ '^\+?[0-9 ]{8,20}$'),
  status text not null default 'active' check (status in ('active','sold','hidden','removed')),
  is_demo boolean not null default false,
  search tsvector generated always as (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(description,''))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();
create index on public.products(status, created_at desc);
create index on public.products(category_id);
create index on public.products(seller_id);
create index products_search_idx on public.products using gin(search);

create or replace function public.guard_product() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_privileged() then
    if new.status = 'removed' and old.status is distinct from 'removed' then
      raise exception 'Seule la modération peut retirer une annonce';
    end if;
    if old.status = 'removed' then raise exception 'Annonce retirée par la modération'; end if;
    new.is_demo := old.is_demo;
  end if;
  return new;
end $$;
create trigger products_guard before update on public.products
  for each row execute function public.guard_product();

create table public.product_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------- AgriCommunity ----------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  category text not null,
  created_by uuid references public.profiles(id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  kind text not null default 'post' check (kind in ('post','question','actualite')),
  category text not null default 'general' check (category in ('general','maraichage','elevage','agriculture_durable','financement','entrepreneuriat','innovations')),
  content text not null check (char_length(content) between 1 and 5000),
  media_url text,
  media_type text check (media_type in ('image','video')),
  shared_post_id uuid references public.posts(id) on delete set null,
  is_hidden boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger posts_updated before update on public.posts
  for each row execute function public.set_updated_at();
create index on public.posts(created_at desc);
create index on public.posts(group_id, created_at desc);
create index on public.posts(author_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.comments(post_id, created_at);

create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index on public.likes(post_id);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index on public.follows(following_id);

create or replace function public.guard_moderation_flag() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_privileged() then
    if new.is_hidden is distinct from old.is_hidden then
      raise exception 'Action réservée à la modération';
    end if;
    if tg_table_name = 'posts' then new.is_demo := old.is_demo; end if;
  end if;
  return new;
end $$;
create trigger posts_guard before update on public.posts for each row execute function public.guard_moderation_flag();
create trigger comments_guard before update on public.comments for each row execute function public.guard_moderation_flag();

-- Anti-spam : limite de publications
create or replace function public.rate_limit_posts() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if tg_table_name = 'posts' then
    select count(*) into n from public.posts where author_id = new.author_id and created_at > now() - interval '10 minutes';
    if n >= 10 then raise exception 'Trop de publications. Réessayez dans quelques minutes.'; end if;
  elsif tg_table_name = 'comments' then
    select count(*) into n from public.comments where author_id = new.author_id and created_at > now() - interval '5 minutes';
    if n >= 20 then raise exception 'Trop de commentaires. Réessayez dans quelques minutes.'; end if;
  elsif tg_table_name = 'products' then
    select count(*) into n from public.products where seller_id = new.seller_id and created_at > now() - interval '1 hour';
    if n >= 15 then raise exception 'Trop d''annonces publiées en une heure.'; end if;
  elsif tg_table_name = 'messages' then
    select count(*) into n from public.messages where sender_id = new.sender_id and created_at > now() - interval '1 minute';
    if n >= 20 then raise exception 'Trop de messages envoyés. Patientez une minute.'; end if;
  end if;
  return new;
end $$;
create trigger posts_rate before insert on public.posts for each row execute function public.rate_limit_posts();
create trigger comments_rate before insert on public.comments for each row execute function public.rate_limit_posts();
create trigger products_rate before insert on public.products for each row execute function public.rate_limit_posts();

-- ---------- Messagerie ----------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);
create index on public.conversations(user_a);
create index on public.conversations(user_b);

create table public.messages (
  id bigserial primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.messages(conversation_id, id);
create trigger messages_rate before insert on public.messages for each row execute function public.rate_limit_posts();

create or replace function public.is_conversation_member(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversations where id = c and auth.uid() in (user_a, user_b))
$$;

create or replace function public.start_conversation(other uuid, p_product uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare a uuid; b uuid; cid uuid;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  if other = auth.uid() then raise exception 'Impossible de vous écrire à vous-même'; end if;
  if not exists (select 1 from public.profiles where id = other) then raise exception 'Utilisateur introuvable'; end if;
  a := least(auth.uid(), other); b := greatest(auth.uid(), other);
  insert into public.conversations(user_a, user_b, product_id) values (a, b, p_product)
  on conflict (user_a, user_b) do update set product_id = coalesce(excluded.product_id, public.conversations.product_id)
  returning id into cid;
  return cid;
end $$;

-- ---------- Notifications ----------
create table public.notifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications(user_id, created_at desc);

create or replace function public.notify(p_user uuid, p_type text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications(user_id, type, title, body, link) values (p_user, p_type, p_title, p_body, p_link)
$$;
revoke execute on function public.notify(uuid,text,text,text,text) from public, anon, authenticated;

-- ---------- Signalements ----------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type public.report_target not null,
  target_id text not null,
  reason text not null check (reason in ('spam','arnaque','contenu_abusif','information_fausse','autre')),
  details text check (char_length(details) <= 2000),
  status public.report_status not null default 'open',
  resolution_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index on public.reports(status, created_at desc);

-- ---------- Contenus ----------
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]{2,120}$'),
  title text not null,
  excerpt text,
  content text not null,
  cover_url text,
  category text not null default 'actualite',
  is_published boolean not null default false,
  is_demo boolean not null default false,
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text not null check (char_length(subject) between 2 and 200),
  message text not null check (char_length(message) between 10 and 5000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- Journal d'audit ----------
create table public.audit_logs (
  id bigserial primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_logs(created_at desc);
create index on public.audit_logs(entity, entity_id);
