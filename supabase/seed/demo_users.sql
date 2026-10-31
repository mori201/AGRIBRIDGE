-- =====================================================================
-- AgriBridge — Comptes de démonstration
-- Usage (psql) :
--   psql "$DATABASE_URL" -v admin_pw='...' -v partner_pw='...' -v user_pw='...' -v expert_pw='...' -f supabase/seed/demo_users.sql
-- Les mots de passe ne sont JAMAIS versionnés. Utilisez des mots de passe forts.
-- =====================================================================
create or replace function pg_temp.mk_user(p_id uuid, p_email text, p_pw text, p_name text, p_role text)
returns void language plpgsql as $$
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values (p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_pw, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_name, 'role', p_role),
    now(), now(), '', '', '', '')
  on conflict (id) do nothing;
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true), 'email', now(), now(), now())
  on conflict do nothing;
end $$;

select pg_temp.mk_user('00000000-0000-4000-a000-000000000001','admin@demo.agribridge.sn', :'admin_pw', 'Administrateur AgriBridge', 'agripreneur');
select pg_temp.mk_user('00000000-0000-4000-a000-000000000002','partenaire@demo.agribridge.sn', :'partner_pw', 'Fatou Ndiaye (démo)', 'institution');
select pg_temp.mk_user('00000000-0000-4000-a000-000000000003','agripreneur@demo.agribridge.sn', :'user_pw', 'Awa Diop (démo)', 'agripreneur');
select pg_temp.mk_user('00000000-0000-4000-a000-000000000004','expert@demo.agribridge.sn', :'expert_pw', 'Dr Moussa Sarr (démo)', 'expert');
-- Profils de figuration (connexion impossible : mot de passe aléatoire non communiqué)
select pg_temp.mk_user('00000000-0000-4000-a000-000000000005','producteur@demo.agribridge.sn', gen_random_uuid()::text, 'Ibrahima Faye (démo)', 'producteur');
select pg_temp.mk_user('00000000-0000-4000-a000-000000000006','gie@demo.agribridge.sn', gen_random_uuid()::text, 'GIE Jappo Niayes (démo)', 'cooperative');

update public.profiles set role = 'admin' where id = '00000000-0000-4000-a000-000000000001';
update public.profiles set is_demo = true where id in (
  '00000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000002','00000000-0000-4000-a000-000000000003',
  '00000000-0000-4000-a000-000000000004','00000000-0000-4000-a000-000000000005','00000000-0000-4000-a000-000000000006');
