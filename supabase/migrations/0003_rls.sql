-- =====================================================================
-- AgriBridge — Row Level Security & privilèges
-- =====================================================================

-- Activation RLS sur toutes les tables publiques
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create or replace function public.is_suspended_me() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_suspended from public.profiles where id = auth.uid()), false)
$$;

-- ---------- PROFILES ----------
-- Seules les colonnes publiques sont lisibles directement. Les colonnes privées
-- (téléphone, besoin de financement...) passent par des fonctions contrôlées.
revoke select, insert, update, delete on public.profiles from anon, authenticated;
grant select (id, full_name, avatar_url, role, region, bio, sectors, is_demo, created_at) on public.profiles to anon, authenticated;
grant update (full_name, avatar_url, bio, phone, region, sectors, experience_level, project_type, funding_need,
  funding_amount, project_stage, preferred_language, onboarding_completed, notify_email, notify_deadlines, role, is_suspended)
  on public.profiles to authenticated;

create policy profiles_read on public.profiles for select using (true);
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create or replace function public.my_profile() returns public.profiles
language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid()
$$;

create or replace function public.candidate_profile(p uuid)
returns table(id uuid, full_name text, role public.user_role, region text, sectors text[], bio text, experience_level text,
  project_type text, project_stage text, funding_amount bigint, phone text, email text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select pr.id, pr.full_name, pr.role, pr.region, pr.sectors, pr.bio, pr.experience_level, pr.project_type,
    pr.project_stage, pr.funding_amount, pr.phone, u.email::text, pr.created_at
  from public.profiles pr join auth.users u on u.id = pr.id
  where pr.id = p and (public.partner_can_view_profile(p) or public.is_admin())
$$;

create or replace function public.admin_list_users(p_search text default null, p_role text default null, p_limit int default 50, p_offset int default 0)
returns table(id uuid, full_name text, email text, role public.user_role, region text, is_suspended boolean, is_demo boolean,
  onboarding_completed boolean, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  return query select pr.id, pr.full_name, u.email::text, pr.role, pr.region, pr.is_suspended, pr.is_demo, pr.onboarding_completed,
    pr.created_at, u.last_sign_in_at
  from public.profiles pr join auth.users u on u.id = pr.id
  where (p_search is null or pr.full_name ilike '%'||p_search||'%' or u.email ilike '%'||p_search||'%')
    and (p_role is null or pr.role::text = p_role)
  order by pr.created_at desc limit least(p_limit, 200) offset p_offset;
end $$;

-- ---------- ORGANIZATIONS ----------
create policy org_read on public.organizations for select using (is_verified or public.is_org_member(id) or public.is_admin());
create policy org_update on public.organizations for update to authenticated
  using (public.is_org_manager(id) or public.is_admin()) with check (public.is_org_manager(id) or public.is_admin());
create policy org_delete on public.organizations for delete to authenticated using (public.is_admin());
create policy org_insert_admin on public.organizations for insert to authenticated with check (public.is_admin());

create policy orgm_read on public.organization_members for select to authenticated
  using (user_id = auth.uid() or public.is_org_member(organization_id) or public.is_admin());
create policy orgm_manage on public.organization_members for all to authenticated
  using (public.is_org_manager(organization_id) or public.is_admin())
  with check (public.is_org_manager(organization_id) or public.is_admin());

-- ---------- SUBSCRIPTIONS ----------
create policy subs_read on public.subscriptions for select to authenticated
  using (user_id = auth.uid() or (organization_id is not null and public.is_org_member(organization_id)) or public.is_admin());
create policy subs_admin on public.subscriptions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- OPPORTUNITIES ----------
create policy oppcat_read on public.opportunity_categories for select using (true);
create policy oppcat_admin on public.opportunity_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy opp_read on public.opportunities for select using (
  status = 'published' or created_by = auth.uid()
  or (organization_id is not null and public.is_org_member(organization_id)) or public.is_admin()
);
create policy opp_insert on public.opportunities for insert to authenticated with check (
  public.is_admin() or (created_by = auth.uid() and organization_id is not null and public.is_org_member(organization_id))
);
create policy opp_update on public.opportunities for update to authenticated using (
  public.is_admin() or (organization_id is not null and public.is_org_member(organization_id))
) with check (
  public.is_admin() or (organization_id is not null and public.is_org_member(organization_id))
);
create policy opp_delete on public.opportunities for delete to authenticated using (
  public.is_admin() or (organization_id is not null and public.is_org_manager(organization_id) and status <> 'published')
);

create policy elig_read on public.opportunity_eligibility for select using (
  exists (select 1 from public.opportunities o where o.id = opportunity_id)
);
create policy elig_write on public.opportunity_eligibility for all to authenticated using (
  exists (select 1 from public.opportunities o where o.id = opportunity_id and (public.is_admin() or (o.organization_id is not null and public.is_org_member(o.organization_id))))
) with check (
  exists (select 1 from public.opportunities o where o.id = opportunity_id and (public.is_admin() or (o.organization_id is not null and public.is_org_member(o.organization_id))))
);

create policy saved_own on public.saved_opportunities for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy alerts_own on public.opportunity_alerts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- APPLICATIONS ----------
create policy app_read on public.applications for select to authenticated using (
  user_id = auth.uid() or public.can_partner_view_application(id) or public.is_admin()
);
create policy app_insert on public.applications for insert to authenticated with check (user_id = auth.uid());
create policy app_update on public.applications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy app_delete on public.applications for delete to authenticated using (user_id = auth.uid() and status in ('brouillon','preparation'));

create policy apph_read on public.application_history for select to authenticated using (
  exists (select 1 from public.applications a where a.id = application_id)
);

create policy appd_read on public.application_documents for select to authenticated using (
  user_id = auth.uid() or public.can_partner_view_application(application_id) or public.is_admin()
);
create policy appd_insert on public.application_documents for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
  and storage_path like auth.uid()::text || '/%'
);
create policy appd_delete on public.application_documents for delete to authenticated using (user_id = auth.uid());

-- ---------- ACADEMY ----------
create policy courses_read on public.courses for select using (is_published or public.is_admin());
create policy courses_admin on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy modules_read on public.course_modules for select using (exists (select 1 from public.courses c where c.id = course_id));
create policy modules_admin on public.course_modules for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Contenu des leçons : libre pour les cours gratuits ; premium réservé aux abonnés premium / admin
create or replace function public.has_premium() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (select 1 from public.subscriptions where user_id = auth.uid() and plan = 'premium_individuel'
    and status = 'active' and (ends_at is null or ends_at > now()))
$$;
create policy lessons_read on public.lessons for select using (
  exists (select 1 from public.course_modules m join public.courses c on c.id = m.course_id
    where m.id = module_id and (c.is_published or public.is_admin()) and (not c.is_premium or public.has_premium()))
);
create policy lessons_admin on public.lessons for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy quizzes_read on public.quizzes for select using (exists (select 1 from public.courses c where c.id = course_id));
create policy quizzes_admin on public.quizzes for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Les questions (avec la bonne réponse) ne sont lisibles que par l'admin ; les apprenants passent par get_quiz()
create policy qq_admin on public.quiz_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy qa_read on public.quiz_attempts for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy enroll_own on public.course_enrollments for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy enroll_admin_read on public.course_enrollments for select to authenticated using (public.is_admin());
create policy progress_own_read on public.course_progress for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy progress_own_insert on public.course_progress for insert to authenticated with check (
  user_id = auth.uid() and exists (
    select 1 from public.lessons l join public.course_modules m on m.id = l.module_id
    where l.id = lesson_id and m.course_id = course_progress.course_id)
);
create policy progress_own_delete on public.course_progress for delete to authenticated using (user_id = auth.uid());
create policy cert_read on public.certificates for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy webinars_read on public.webinars for select using (true);
create policy webinars_admin on public.webinars for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- EXPERTS ----------
create policy experts_read on public.experts for select using (is_active or public.is_admin() or profile_id = auth.uid());
create policy experts_admin on public.experts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy experts_self_update on public.experts for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy er_read on public.expert_requests for select to authenticated using (
  user_id = auth.uid() or public.is_expert_owner(expert_id) or public.is_admin()
);
create policy er_insert on public.expert_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy er_update on public.expert_requests for update to authenticated using (
  user_id = auth.uid() or public.is_expert_owner(expert_id) or public.is_admin()
) with check (user_id = auth.uid() or public.is_expert_owner(expert_id) or public.is_admin());

create policy aic_own on public.ai_conversations for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy aim_read on public.ai_messages for select to authenticated using (user_id = auth.uid());
create policy aim_insert on public.ai_messages for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
);

-- ---------- MARKET ----------
create policy pcat_read on public.product_categories for select using (true);
create policy pcat_admin on public.product_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_read on public.products for select using (status in ('active','sold') or seller_id = auth.uid() or public.is_admin());
create policy products_insert on public.products for insert to authenticated with check (
  seller_id = auth.uid() and status in ('active','hidden') and not is_demo
  and not public.is_suspended_me()
);
create policy products_update on public.products for update to authenticated using (seller_id = auth.uid() or public.is_admin())
  with check (seller_id = auth.uid() or public.is_admin());
create policy products_delete on public.products for delete to authenticated using (seller_id = auth.uid() or public.is_admin());
create policy pfav_own on public.product_favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- COMMUNITY ----------
create policy groups_read on public.groups for select using (true);
create policy groups_insert on public.groups for insert to authenticated with check (created_by = auth.uid() and not is_demo);
create policy groups_update on public.groups for update to authenticated using (created_by = auth.uid() or public.is_admin()) with check (created_by = auth.uid() or public.is_admin());
create policy groups_delete on public.groups for delete to authenticated using (public.is_admin());
create policy gm_read on public.group_members for select using (true);
create policy gm_join on public.group_members for insert to authenticated with check (user_id = auth.uid());
create policy gm_leave on public.group_members for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy posts_read on public.posts for select using (not is_hidden or author_id = auth.uid() or public.is_admin());
create policy posts_insert on public.posts for insert to authenticated with check (
  author_id = auth.uid() and not is_hidden and not is_demo
  and (kind <> 'actualite' or public.is_admin())
  and not public.is_suspended_me()
  and (group_id is null or exists (select 1 from public.group_members gm where gm.group_id = posts.group_id and gm.user_id = auth.uid()))
);
create policy posts_update on public.posts for update to authenticated using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());
create policy posts_delete on public.posts for delete to authenticated using (author_id = auth.uid() or public.is_admin());

create policy comments_read on public.comments for select using (
  (not is_hidden or author_id = auth.uid() or public.is_admin()) and exists (select 1 from public.posts p where p.id = post_id)
);
create policy comments_insert on public.comments for insert to authenticated with check (
  author_id = auth.uid() and not is_hidden
  and not public.is_suspended_me()
  and exists (select 1 from public.posts p where p.id = post_id and not p.is_hidden)
);
create policy comments_update on public.comments for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy comments_delete on public.comments for delete to authenticated using (author_id = auth.uid() or public.is_admin());

create policy likes_read on public.likes for select using (true);
create policy likes_own on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy likes_del on public.likes for delete to authenticated using (user_id = auth.uid());
create policy follows_read on public.follows for select using (true);
create policy follows_own on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy follows_del on public.follows for delete to authenticated using (follower_id = auth.uid());

-- ---------- MESSAGING ----------
create policy conv_read on public.conversations for select to authenticated using (auth.uid() in (user_a, user_b) or public.is_admin());
create policy msg_read on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
create policy msg_insert on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and public.is_conversation_member(conversation_id)
  and not public.is_suspended_me()
);
create policy msg_mark_read on public.messages for update to authenticated using (public.is_conversation_member(conversation_id) and sender_id <> auth.uid())
  with check (public.is_conversation_member(conversation_id));
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- ---------- NOTIFICATIONS ----------
create policy notif_own_read on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notif_own_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_own_delete on public.notifications for delete to authenticated using (user_id = auth.uid());
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ---------- REPORTS ----------
create policy reports_insert on public.reports for insert to authenticated with check (reporter_id = auth.uid() and status = 'open');
create policy reports_read on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_admin());
create policy reports_admin on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- CONTENUS ----------
create policy blog_read on public.blog_posts for select using (is_published or public.is_admin());
create policy blog_admin on public.blog_posts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy contact_insert on public.contact_messages for insert with check (not handled);
create policy contact_admin on public.contact_messages for select to authenticated using (public.is_admin());
create policy contact_admin_upd on public.contact_messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy settings_read on public.platform_settings for select using (true);
create policy settings_admin on public.platform_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy audit_admin on public.audit_logs for select to authenticated using (public.is_admin());

-- Les colonnes sensibles des tables de jeux de démonstration ne sont pas écrasables par le client
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- STORAGE ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents','documents', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp',
     'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('media','media', true, 15728640, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'])
on conflict (id) do nothing;

-- documents/<user_id>/... : privé au propriétaire ; lisible par le partenaire si la candidature lui est partagée
create policy "documents owner read" on storage.objects for select to authenticated using (
  bucket_id = 'documents' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.application_documents d where d.storage_path = storage.objects.name
               and (public.can_partner_view_application(d.application_id) or public.is_admin()))
  )
);
create policy "documents owner write" on storage.objects for insert to authenticated with check (
  bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "documents owner delete" on storage.objects for delete to authenticated using (
  bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
);
-- media/<user_id>/... : public en lecture (bucket public), écriture par le propriétaire
create policy "media owner write" on storage.objects for insert to authenticated with check (
  bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "media owner delete" on storage.objects for delete to authenticated using (
  bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
