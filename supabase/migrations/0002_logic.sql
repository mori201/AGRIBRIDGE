-- =====================================================================
-- AgriBridge — Logique métier : triggers, RPC, notifications, audit
-- =====================================================================

-- ---------- Audit ----------
create or replace function public.audit(p_action text, p_entity text, p_entity_id text, p_details jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs(actor_id, action, entity, entity_id, details) values (auth.uid(), p_action, p_entity, p_entity_id, p_details)
$$;
revoke execute on function public.audit(text,text,text,jsonb) from public, anon, authenticated;

create or replace function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'opportunities' then
    if tg_op = 'INSERT' then
      perform public.audit('create','opportunity',new.id::text, jsonb_build_object('title',new.title,'status',new.status));
    elsif new.status is distinct from old.status then
      perform public.audit('status_change','opportunity',new.id::text, jsonb_build_object('from',old.status,'to',new.status,'note',new.review_note));
    end if;
  elsif tg_table_name = 'organizations' then
    if tg_op = 'INSERT' then
      perform public.audit('create','organization',new.id::text, jsonb_build_object('name',new.name));
    elsif new.is_verified is distinct from old.is_verified then
      perform public.audit(case when new.is_verified then 'verify' else 'unverify' end,'organization',new.id::text, jsonb_build_object('name',new.name));
    end if;
  elsif tg_table_name = 'profiles' then
    if new.role is distinct from old.role or new.is_suspended is distinct from old.is_suspended then
      perform public.audit('profile_admin_change','profile',new.id::text,
        jsonb_build_object('role_from',old.role,'role_to',new.role,'suspended',new.is_suspended));
    end if;
  elsif tg_table_name = 'reports' then
    if new.status is distinct from old.status then
      perform public.audit('report_'||new.status,'report',new.id::text, jsonb_build_object('target',new.target_type,'target_id',new.target_id));
    end if;
  elsif tg_table_name = 'products' then
    if new.status is distinct from old.status and new.status = 'removed' then
      perform public.audit('moderate_remove','product',new.id::text, jsonb_build_object('title',new.title));
    end if;
  elsif tg_table_name = 'posts' then
    if new.is_hidden is distinct from old.is_hidden then
      perform public.audit(case when new.is_hidden then 'moderate_hide' else 'moderate_unhide' end,'post',new.id::text, null);
    end if;
  end if;
  return new;
end $$;
create trigger audit_opportunities after insert or update on public.opportunities for each row execute function public.audit_trigger();
create trigger audit_organizations after insert or update on public.organizations for each row execute function public.audit_trigger();
create trigger audit_profiles after update on public.profiles for each row execute function public.audit_trigger();
create trigger audit_reports after update on public.reports for each row execute function public.audit_trigger();
create trigger audit_products after update on public.products for each row execute function public.audit_trigger();
create trigger audit_posts after update on public.posts for each row execute function public.audit_trigger();

-- ---------- Opportunités : notifications de revue + alertes ----------
create or replace function public.on_opportunity_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare a record;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status and new.created_by is not null then
    if new.status = 'published' then
      perform public.notify(new.created_by,'opportunity_published','Opportunité publiée',
        'Votre opportunité « '||new.title||' » a été validée et publiée.','/opportunites/'||new.id);
    elsif new.status = 'rejected' then
      perform public.notify(new.created_by,'opportunity_rejected','Opportunité refusée',
        coalesce(new.review_note,'Votre opportunité nécessite des corrections.'),'/partenaire/opportunites/'||new.id);
    end if;
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    -- Alertes personnalisées
    for a in
      select distinct on (al.user_id) al.user_id, al.name from public.opportunity_alerts al
      where (al.region is null or al.region = any(new.regions) or 'national' = any(new.regions))
        and (al.sector is null or al.sector = any(new.sectors))
        and (al.category_id is null or al.category_id = new.category_id)
        and (al.keyword is null or new.search @@ plainto_tsquery('french', al.keyword))
        and al.user_id is distinct from new.created_by
    loop
      perform public.notify(a.user_id,'alert_match','Nouvelle opportunité pour votre alerte « '||a.name||' »',
        new.title,'/opportunites/'||new.id);
    end loop;
  end if;
  return new;
end $$;
create trigger opportunities_after after insert or update on public.opportunities
  for each row execute function public.on_opportunity_change();

-- ---------- Candidatures ----------
-- Règles côté candidat : statut "accepte"/"refuse" uniquement si candidature externe (mise à jour manuelle)
create or replace function public.guard_application() returns trigger
language plpgsql security definer set search_path = public as $$
declare mode text; org uuid;
begin
  select application_mode, organization_id into mode, org from public.opportunities where id = new.opportunity_id;
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.opportunities where id = new.opportunity_id and status = 'published') then
      raise exception 'Opportunité indisponible';
    end if;
    new.partner_note := null;
  end if;
  if auth.uid() = new.user_id and not public.is_privileged() then
    if tg_op = 'UPDATE' then
      new.partner_note := old.partner_note;
      if mode = 'platform' and new.status is distinct from old.status
         and (new.status in ('en_examen','accepte','refuse') or old.status in ('en_examen','accepte','refuse')) then
        raise exception 'Le statut de cette candidature est géré par l''organisme';
      end if;
    end if;
    if mode = 'platform' and new.status = 'soumis' then
      new.shared_with_partner := true;
    end if;
  end if;
  if new.status = 'soumis' and new.submitted_at is null then new.submitted_at := now(); end if;
  return new;
end $$;
create trigger applications_guard before insert or update on public.applications
  for each row execute function public.guard_application();

create or replace function public.on_application_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare t text; m record;
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.application_history(application_id, from_status, to_status, changed_by)
    values (new.id, case when tg_op='UPDATE' then old.status end, new.status, auth.uid());
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status and auth.uid() is distinct from new.user_id then
    select title into t from public.opportunities where id = new.opportunity_id;
    perform public.notify(new.user_id,'application_status','Mise à jour de votre candidature',
      '« '||t||' » : '||new.status::text,'/tableau-de-bord/candidatures/'||new.id);
  end if;
  if new.shared_with_partner and new.status = 'soumis' and (tg_op='INSERT' or old.status is distinct from 'soumis') then
    for m in select om.user_id, o.title from public.opportunities o
      join public.organization_members om on om.organization_id = o.organization_id
      where o.id = new.opportunity_id loop
      perform public.notify(m.user_id,'new_application','Nouvelle candidature reçue', m.title, '/partenaire/candidatures/'||new.id);
    end loop;
  end if;
  return new;
end $$;
create trigger applications_after after insert or update on public.applications
  for each row execute function public.on_application_change();

create or replace function public.can_partner_view_application(app uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.applications a join public.opportunities o on o.id = a.opportunity_id
    where a.id = app and a.shared_with_partner and o.organization_id is not null and public.is_org_member(o.organization_id)
  )
$$;

-- Le partenaire peut faire évoluer le statut (et seulement le statut + note) d'une candidature partagée
create or replace function public.partner_set_application_status(p_application uuid, p_status public.application_status, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.can_partner_view_application(p_application) or public.is_admin()) then
    raise exception 'Accès refusé';
  end if;
  if p_status not in ('en_examen','accepte','refuse','soumis') then raise exception 'Statut invalide'; end if;
  update public.applications set status = p_status, partner_note = left(p_note, 3000) where id = p_application;
  perform public.audit('partner_status','application',p_application::text, jsonb_build_object('status',p_status));
end $$;

-- Profil candidat visible par le partenaire uniquement si une candidature partagée existe
create or replace function public.partner_can_view_profile(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.applications a join public.opportunities o on o.id = a.opportunity_id
    where a.user_id = p and a.shared_with_partner and o.organization_id is not null and public.is_org_member(o.organization_id)
  )
$$;

-- ---------- AgriAcademy : quiz et certificats calculés côté serveur ----------
create or replace function public.get_quiz(p_quiz uuid)
returns table(id uuid, question text, options text[], qpos int)
language sql stable security definer set search_path = public as $$
  select q.id, q.question, q.options, q.position from public.quiz_questions q
  join public.quizzes z on z.id = q.quiz_id join public.courses c on c.id = z.course_id
  where q.quiz_id = p_quiz and (c.is_published or public.is_admin())
  order by q.position, q.id
$$;

create or replace function public.submit_quiz(p_quiz uuid, p_answers int[])
returns table(score int, passed boolean, correct int[])
language plpgsql security definer set search_path = public as $$
declare total int; good int := 0; i int := 0; r record; ps int; cor int[] := '{}'; s int; recent int;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  select count(*) into recent from public.quiz_attempts where user_id = auth.uid() and created_at > now() - interval '1 minute';
  if recent >= 5 then raise exception 'Trop de tentatives, patientez une minute.'; end if;
  select c.pass_score into ps from public.quizzes z join public.courses c on c.id = z.course_id where z.id = p_quiz and c.is_published;
  if ps is null then raise exception 'Quiz introuvable'; end if;
  select count(*) into total from public.quiz_questions where quiz_id = p_quiz;
  if total = 0 then raise exception 'Quiz vide'; end if;
  for r in select correct_index from public.quiz_questions where quiz_id = p_quiz order by position, id loop
    i := i + 1;
    cor := cor || r.correct_index;
    if p_answers[i] = r.correct_index then good := good + 1; end if;
  end loop;
  s := round(good * 100.0 / total);
  insert into public.quiz_attempts(quiz_id, user_id, score, passed, answers) values (p_quiz, auth.uid(), s, s >= ps, p_answers);
  return query select s, s >= ps, cor;
end $$;

create or replace function public.course_completion(p_course uuid, p_user uuid)
returns table(total_lessons int, done_lessons int, total_quizzes int, passed_quizzes int, best_score int)
language sql stable security definer set search_path = public as $$
  select
    (select count(*)::int from public.lessons l join public.course_modules m on m.id = l.module_id where m.course_id = p_course),
    (select count(*)::int from public.course_progress p where p.course_id = p_course and p.user_id = p_user),
    (select count(*)::int from public.quizzes z where z.course_id = p_course),
    (select count(distinct a.quiz_id)::int from public.quiz_attempts a join public.quizzes z on z.id = a.quiz_id
       where z.course_id = p_course and a.user_id = p_user and a.passed),
    (select coalesce(min(best),0)::int from (select max(a.score) best from public.quiz_attempts a join public.quizzes z on z.id = a.quiz_id
       where z.course_id = p_course and a.user_id = p_user group by a.quiz_id) t)
$$;

create or replace function public.claim_certificate(p_course uuid)
returns text language plpgsql security definer set search_path = public as $$
declare c record; code text;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  select * into c from public.course_completion(p_course, auth.uid());
  if c.total_lessons = 0 or c.done_lessons < c.total_lessons then
    raise exception 'Toutes les leçons doivent être terminées';
  end if;
  if c.passed_quizzes < c.total_quizzes then
    raise exception 'Tous les quiz doivent être réussis';
  end if;
  insert into public.certificates(user_id, course_id, score) values (auth.uid(), p_course, nullif(c.best_score,0))
  on conflict (user_id, course_id) do nothing;
  select certificates.code into code from public.certificates where user_id = auth.uid() and course_id = p_course;
  perform public.notify(auth.uid(),'certificate','Certificat obtenu 🎓','Félicitations ! Votre certificat est disponible.','/tableau-de-bord/certificats');
  return code;
end $$;

-- Vérification publique d'un certificat
create or replace function public.verify_certificate(p_code text)
returns table(code text, full_name text, course_title text, issued_at timestamptz, score int)
language sql stable security definer set search_path = public as $$
  select ce.code, p.full_name, c.title, ce.issued_at, ce.score from public.certificates ce
  join public.profiles p on p.id = ce.user_id join public.courses c on c.id = ce.course_id
  where ce.code = upper(p_code)
$$;

-- ---------- Communauté : notifications ----------
create or replace function public.on_social_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid; who text;
begin
  select full_name into who from public.profiles where id = auth.uid();
  if tg_table_name = 'comments' then
    select author_id into owner from public.posts where id = new.post_id;
    if owner is distinct from new.author_id then
      perform public.notify(owner,'comment','Nouveau commentaire', coalesce(who,'Quelqu''un')||' a commenté votre publication.','/communaute/post/'||new.post_id);
    end if;
  elsif tg_table_name = 'likes' then
    select author_id into owner from public.posts where id = new.post_id;
    if owner is distinct from new.user_id then
      perform public.notify(owner,'like','Nouvelle mention J''aime', coalesce(who,'Quelqu''un')||' aime votre publication.','/communaute/post/'||new.post_id);
    end if;
  elsif tg_table_name = 'follows' then
    perform public.notify(new.following_id,'follow','Nouvel abonné', coalesce(who,'Quelqu''un')||' vous suit désormais.','/membres/'||new.follower_id);
  elsif tg_table_name = 'messages' then
    select case when user_a = new.sender_id then user_b else user_a end into owner from public.conversations where id = new.conversation_id;
    update public.conversations set last_message_at = now() where id = new.conversation_id;
    if not exists (select 1 from public.notifications where user_id = owner and type = 'message' and read_at is null and link = '/tableau-de-bord/messages/'||new.conversation_id) then
      perform public.notify(owner,'message','Nouveau message', coalesce(who,'Un membre')||' vous a écrit.','/tableau-de-bord/messages/'||new.conversation_id);
    end if;
  elsif tg_table_name = 'expert_requests' then
    select profile_id into owner from public.experts where id = new.expert_id;
    if owner is not null then
      perform public.notify(owner,'expert_request','Nouvelle demande d''accompagnement', new.subject,'/tableau-de-bord/demandes-expert');
    end if;
  end if;
  return new;
end $$;
create trigger comments_notify after insert on public.comments for each row execute function public.on_social_event();
create trigger likes_notify after insert on public.likes for each row execute function public.on_social_event();
create trigger follows_notify after insert on public.follows for each row execute function public.on_social_event();
create trigger messages_notify after insert on public.messages for each row execute function public.on_social_event();
create trigger expert_requests_notify after insert on public.expert_requests for each row execute function public.on_social_event();

create or replace function public.on_expert_request_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    perform public.notify(new.user_id,'expert_request_update','Réponse de l''expert', 'Votre demande « '||new.subject||' » : '||new.status,'/tableau-de-bord/demandes-expert');
  end if;
  return new;
end $$;
create trigger expert_requests_update_notify after update on public.expert_requests for each row execute function public.on_expert_request_update();

-- Un utilisateur ne modifie que la réponse/le statut s'il est l'expert ; le demandeur ne modifie rien d'autre
create or replace function public.guard_expert_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_privileged() then return new; end if;
  if public.is_expert_owner(old.expert_id) then
    new.subject := old.subject; new.message := old.message; new.user_id := old.user_id; new.expert_id := old.expert_id;
  else
    -- le demandeur peut seulement clôturer sa demande
    if new.status not in ('completed', old.status) then raise exception 'Action non autorisée'; end if;
    new.response := old.response; new.subject := old.subject; new.message := old.message; new.expert_id := old.expert_id;
  end if;
  return new;
end $$;
create trigger expert_requests_guard before update on public.expert_requests for each row execute function public.guard_expert_request();

-- Signalements : auto-masquage après 3 signalements distincts sur un post
create or replace function public.on_report() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int; adm record;
begin
  select count(distinct reporter_id) into n from public.reports where target_type = new.target_type and target_id = new.target_id and status = 'open';
  if new.target_type = 'post' and n >= 3 then
    update public.posts set is_hidden = true where id::text = new.target_id;
  end if;
  for adm in select id from public.profiles where role = 'admin' loop
    perform public.notify(adm.id,'report','Nouveau signalement', new.target_type::text||' — '||new.reason,'/admin/signalements');
  end loop;
  return new;
end $$;
create trigger reports_after after insert on public.reports for each row execute function public.on_report();

create or replace function public.rate_limit_reports() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.reports where reporter_id = new.reporter_id and created_at > now() - interval '1 hour';
  if n >= 20 then raise exception 'Trop de signalements envoyés.'; end if;
  if exists (select 1 from public.reports where reporter_id = new.reporter_id and target_type = new.target_type and target_id = new.target_id) then
    raise exception 'Vous avez déjà signalé ce contenu.';
  end if;
  return new;
end $$;
create trigger reports_rate before insert on public.reports for each row execute function public.rate_limit_reports();

create or replace function public.rate_limit_contact() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.contact_messages where created_at > now() - interval '1 minute';
  if n >= 10 then raise exception 'Service momentanément saturé, réessayez plus tard.'; end if;
  return new;
end $$;
create trigger contact_rate before insert on public.contact_messages for each row execute function public.rate_limit_contact();

-- ---------- Limitation IA ----------
create or replace function public.ai_quota_remaining() returns int
language sql stable security definer set search_path = public as $$
  select greatest(0, coalesce((select (value->>'ai_hourly_limit')::int from public.platform_settings where key='limits'),30)
    - (select count(*)::int from public.ai_messages where user_id = auth.uid() and role = 'user' and created_at > now() - interval '1 hour'))
$$;

-- ---------- Statistiques ----------
create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'users_by_role', (select coalesce(jsonb_object_agg(role, n),'{}') from (select role, count(*) n from public.profiles group by role) t),
    'users_by_region', (select coalesce(jsonb_object_agg(coalesce(region,'non renseignée'), n),'{}') from (select region, count(*) n from public.profiles group by region) t),
    'organizations', (select count(*) from public.organizations),
    'organizations_pending', (select count(*) from public.organizations where not is_verified),
    'opportunities_published', (select count(*) from public.opportunities where status='published'),
    'opportunities_pending', (select count(*) from public.opportunities where status='pending_review'),
    'applications', (select count(*) from public.applications),
    'applications_by_status', (select coalesce(jsonb_object_agg(status, n),'{}') from (select status, count(*) n from public.applications group by status) t),
    'courses', (select count(*) from public.courses where is_published),
    'enrollments', (select count(*) from public.course_enrollments),
    'certificates', (select count(*) from public.certificates),
    'products', (select count(*) from public.products where status='active'),
    'posts', (select count(*) from public.posts),
    'reports_open', (select count(*) from public.reports where status in ('open','reviewing')),
    'signups_30d', (select coalesce(jsonb_agg(jsonb_build_object('day',d,'n',n) order by d),'[]') from (
        select date_trunc('day',created_at)::date d, count(*) n from public.profiles where created_at > now() - interval '30 days' group by 1) t)
  );
end $$;

create or replace function public.org_stats(p_org uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_org_member(p_org) or public.is_admin()) then raise exception 'Accès refusé'; end if;
  return jsonb_build_object(
    'opportunities', (select count(*) from public.opportunities where organization_id = p_org),
    'published', (select count(*) from public.opportunities where organization_id = p_org and status='published'),
    'pending', (select count(*) from public.opportunities where organization_id = p_org and status='pending_review'),
    'saves', (select count(*) from public.saved_opportunities s join public.opportunities o on o.id=s.opportunity_id where o.organization_id = p_org),
    'applications', (select count(*) from public.applications a join public.opportunities o on o.id=a.opportunity_id where o.organization_id = p_org and a.shared_with_partner),
    'by_status', (select coalesce(jsonb_object_agg(status, n),'{}') from (select a.status, count(*) n from public.applications a join public.opportunities o on o.id=a.opportunity_id where o.organization_id = p_org and a.shared_with_partner group by a.status) t),
    'by_region', (select coalesce(jsonb_object_agg(coalesce(region,'non renseignée'), n),'{}') from (select p.region, count(*) n from public.applications a join public.opportunities o on o.id=a.opportunity_id join public.profiles p on p.id=a.user_id where o.organization_id = p_org and a.shared_with_partner group by p.region) t)
  );
end $$;

create or replace function public.public_stats() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'opportunities', (select count(*) from public.opportunities where status='published'),
    'members', (select count(*) from public.profiles),
    'courses', (select count(*) from public.courses where is_published),
    'products', (select count(*) from public.products where status='active'),
    'partners', (select count(*) from public.organizations where is_verified)
  )
$$;

-- ---------- RGPD : export et suppression ----------
create or replace function public.export_my_data() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'Non authentifié'; end if;
  return jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where id = u),
    'email', (select email from auth.users where id = u),
    'saved_opportunities', (select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.saved_opportunities s where user_id = u),
    'alerts', (select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.opportunity_alerts s where user_id = u),
    'applications', (select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.applications s where user_id = u),
    'application_documents', (select coalesce(jsonb_agg(jsonb_build_object('name',name,'created_at',created_at)),'[]') from public.application_documents where user_id = u),
    'course_enrollments', (select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.course_enrollments s where user_id = u),
    'certificates', (select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.certificates s where user_id = u),
    'products', (select coalesce(jsonb_agg(to_jsonb(s) - 'search'),'[]') from public.products s where seller_id = u),
    'posts', (select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.posts s where author_id = u),
    'comments', (select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.comments s where author_id = u),
    'messages_sent', (select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.messages s where sender_id = u),
    'ai_messages', (select coalesce(jsonb_agg(jsonb_build_object('role',role,'content',content,'created_at',created_at)),'[]') from public.ai_messages where user_id = u),
    'expert_requests', (select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.expert_requests s where user_id = u)
  );
end $$;
