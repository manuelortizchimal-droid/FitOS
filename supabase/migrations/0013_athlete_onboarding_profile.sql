begin;
alter table public.fitos_profiles add column if not exists birth_date date;
alter table public.fitos_profiles add column if not exists height_cm numeric(5,1) check(height_cm between 80 and 250);
alter table public.fitos_profiles add column if not exists updated_at timestamptz not null default now();
create or replace function public.fitos_save_my_athlete_profile(full_name text,born date,stature_cm numeric)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if not exists(select 1 from public.fitos_memberships m join public.fitos_gyms g on g.id=m.gym_id
   where m.user_id=auth.uid() and m.role='athlete' and m.enabled and g.status in ('trial','active')) then
   raise exception 'No active athlete membership';
 end if;
 if length(trim(full_name)) not between 2 and 120 then raise exception 'Invalid display name';end if;
 if born is not null and (born>current_date or born<current_date-interval '120 years') then raise exception 'Invalid birth date'; end if;
 if stature_cm is not null and (stature_cm<80 or stature_cm>250) then raise exception 'Invalid stature';end if;
 insert into public.fitos_profiles(id,display_name,birth_date,height_cm)
 values(auth.uid(),trim(full_name),born,stature_cm)
 on conflict (id) do update set display_name=excluded.display_name,birth_date=excluded.birth_date,height_cm=excluded.height_cm,updated_at=now();
end $$;
revoke all on function public.fitos_save_my_athlete_profile(text,date,numeric) from public,anon;
grant execute on function public.fitos_save_my_athlete_profile(text,date,numeric) to authenticated;
commit;