begin;
alter table public.fitos_profiles add column if not exists sex text
 check (sex is null or sex in ('M','F','No binario'));
create or replace function public.fitos_save_my_athlete_profile(full_name text,born date,stature_cm numeric,sex_value text)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if not exists(select 1 from public.fitos_memberships m join public.fitos_gyms g on g.id=m.gym_id
 where m.user_id=auth.uid() and m.role='athlete' and m.enabled and g.status in ('trial','active'))
 then raise exception 'No active athlete membership';end if;
 if full_name is null or length(trim(full_name)) not between 2 and 120 then raise exception 'Invalid display name';end if;
 if born is not null and (born>current_date or born<current_date-interval '120 years') then raise exception 'Invalid birth date';end if;
 if stature_cm is not null and (stature_cm<80 or stature_cm>250) then raise exception 'Invalid stature';end if;
 if sex_value is not null and sex_value not in ('M','F','No binario') then raise exception 'Invalid sex selection';end if;
 insert into public.fitos_profiles(id,display_name,birth_date,height_cm,sex)
 values(auth.uid(),trim(full_name),born,stature_cm,sex_value)
 on conflict(id) do update set display_name=excluded.display_name,birth_date=excluded.birth_date,
 height_cm=excluded.height_cm,sex=excluded.sex,updated_at=now();
end $$;
revoke execute on function public.fitos_save_my_athlete_profile(text,date,numeric,text) from public,anon;
grant execute on function public.fitos_save_my_athlete_profile(text,date,numeric,text) to authenticated;
commit;