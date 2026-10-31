-- =====================================================================
-- AgriBridge — Durcissement des privilèges d'exécution
-- =====================================================================
alter function public.set_updated_at() set search_path = public;

-- Fonctions déclencheurs : jamais appelables via l'API
do $$ declare f text; begin
  foreach f in array array[
    'audit_trigger()','guard_application()','guard_expert_request()','guard_moderation_flag()','guard_opportunity_status()',
    'guard_product()','on_application_change()','on_expert_request_update()','on_opportunity_change()','on_report()',
    'on_social_event()','protect_org_fields()','protect_profile_fields()','rate_limit_contact()','rate_limit_posts()',
    'rate_limit_reports()','handle_new_user()','set_updated_at()']
  loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;

-- Fonctions réservées aux utilisateurs connectés
do $$ declare f text; begin
  foreach f in array array[
    'admin_list_users(text,text,integer,integer)','admin_stats()','ai_quota_remaining()','candidate_profile(uuid)',
    'claim_certificate(uuid)','create_organization(text,text,text,text,text,text,text)','delete_my_account()','export_my_data()',
    'my_profile()','org_stats(uuid)','partner_set_application_status(uuid,public.application_status,text)',
    'start_conversation(uuid,uuid)','submit_quiz(uuid,integer[])']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- La progression d'un cours n'est consultable que pour soi-même
revoke execute on function public.course_completion(uuid, uuid) from public, anon, authenticated;
create or replace function public.my_course_completion(p_course uuid)
returns table(total_lessons int, done_lessons int, total_quizzes int, passed_quizzes int, best_score int)
language sql stable security definer set search_path = public as $$
  select * from public.course_completion(p_course, auth.uid()) where auth.uid() is not null
$$;
revoke execute on function public.my_course_completion(uuid) from public, anon;
grant execute on function public.my_course_completion(uuid) to authenticated;

-- Les fonctions d'aide aux politiques RLS (is_admin, is_org_member, ...) restent exécutables :
-- elles sont évaluées par les politiques pour tous les rôles et ne renvoient qu'un booléen
-- relatif à l'utilisateur courant.
