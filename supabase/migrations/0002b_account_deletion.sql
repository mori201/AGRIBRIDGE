-- Suppression de compte (RGPD)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'Non authentifié'; end if;
  if exists (select 1 from public.profiles where id = u and role = 'admin') then
    raise exception 'Un compte administrateur doit être rétrogradé avant suppression';
  end if;
  insert into public.audit_logs(actor_id, action, entity, entity_id) values (u, 'account_deleted', 'profile', u::text);
  delete from auth.users where id = u;
end $$;
