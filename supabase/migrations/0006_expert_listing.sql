-- Demande de référencement d'un expert : la fiche reste inactive jusqu'à validation admin
create or replace function public.request_expert_listing(p_title text, p_specialties text[], p_bio text, p_availability text, p_rate int, p_languages text[])
returns uuid language plpgsql security definer set search_path = public as $$
declare eid uuid; nm text;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  select full_name into nm from public.profiles where id = auth.uid();
  insert into public.experts(profile_id, full_name, title, specialties, bio, availability, rate_fcfa, languages, region, is_active, is_verified)
  values (auth.uid(), nm, left(p_title,120), p_specialties[1:6], left(p_bio,2000), left(p_availability,200), p_rate, p_languages,
          (select region from public.profiles where id = auth.uid()), false, false)
  on conflict (profile_id) do update set title = excluded.title, specialties = excluded.specialties, bio = excluded.bio,
     availability = excluded.availability, rate_fcfa = excluded.rate_fcfa, languages = excluded.languages
  returning id into eid;
  return eid;
end $$;
revoke execute on function public.request_expert_listing(text,text[],text,text,int,text[]) from public, anon;
grant execute on function public.request_expert_listing(text,text[],text,text,int,text[]) to authenticated;

-- Un expert ne peut pas s'auto-vérifier ni s'auto-activer
create or replace function public.guard_expert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_privileged() then
    new.is_verified := old.is_verified;
    new.is_active := old.is_active;
    new.is_demo := old.is_demo;
    new.profile_id := old.profile_id;
  end if;
  return new;
end $$;
create trigger experts_guard before update on public.experts for each row execute function public.guard_expert();
revoke execute on function public.guard_expert() from public, anon, authenticated;
