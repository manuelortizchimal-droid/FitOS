-- FitOS: custom domains and consent-controlled private athlete photos.
begin;
create table public.fitos_domains(
 id uuid primary key default gen_random_uuid(),
 gym_id uuid not null references public.fitos_gyms(id) on delete cascade,
 hostname text not null unique check(length(hostname) between 4 and 253 and hostname=lower(hostname) and hostname ~ '^[a-z0-9.-]+$'),
 verified boolean not null default false,
 created_at timestamptz not null default now()
);
create index fitos_domains_gym_idx on public.fitos_domains(gym_id);
alter table public.fitos_domains enable row level security;
create policy domain_read on public.fitos_domains for select to authenticated
 using(public.fitos_is_platform_admin() or public.fitos_is_member(gym_id));
create policy domain_manage on public.fitos_domains for all to authenticated
 using(public.fitos_is_platform_admin()) with check(public.fitos_is_platform_admin());
-- verified is only a metadata flag; real DNS/HTTPS validation remains at Cloudflare.
create table public.fitos_photo_consents(
 gym_id uuid not null references public.fitos_gyms(id) on delete cascade,
 athlete_id uuid not null references auth.users(id) on delete cascade,
 granted_at timestamptz not null default now(),
 revoked_at timestamptz,
 primary key(gym_id,athlete_id)
);
alter table public.fitos_photo_consents enable row level security;
create policy consent_read on public.fitos_photo_consents for select to authenticated
 using(public.fitos_can_view_athlete(gym_id,athlete_id));
create policy consent_insert on public.fitos_photo_consents for insert to authenticated
 with check(athlete_id=(select auth.uid()) and public.fitos_is_member(gym_id)
 and public.fitos_valid_athlete(gym_id,athlete_id));
create policy consent_update on public.fitos_photo_consents for update to authenticated
 using(athlete_id=(select auth.uid()) and public.fitos_is_member(gym_id))
 with check(athlete_id=(select auth.uid()) and public.fitos_is_member(gym_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('fitos-photos','fitos-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
-- Photo object path: gym_id/athlete_id/photo-uuid.ext
create or replace function public.fitos_photo_allowed(path text,require_owner boolean default false)
returns boolean language plpgsql stable security definer set search_path=''
as $$
declare parts text[]; gym uuid; athlete uuid;
begin
 parts=string_to_array(path,'/');
 if cardinality(parts)<>3 then return false; end if;
 if parts[1] !~ '^[0-9a-f-]{36}$' or parts[2] !~ '^[0-9a-f-]{36}$'
    or parts[3] !~ '^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$' then return false; end if;
 gym=parts[1]::uuid;athlete=parts[2]::uuid;
 if not public.fitos_can_view_athlete(gym,athlete) then return false; end if;
 if require_owner and athlete is distinct from auth.uid() then return false; end if;
 return exists(select 1 from public.fitos_photo_consents c
    where c.gym_id=gym and c.athlete_id=athlete and c.revoked_at is null);
exception when others then return false;
end $$;
revoke execute on function public.fitos_photo_allowed(text,boolean) from public,anon;
grant execute on function public.fitos_photo_allowed(text,boolean) to authenticated;
create policy fitos_photos_read on storage.objects for select to authenticated
 using(bucket_id='fitos-photos' and public.fitos_photo_allowed(name,false));
create policy fitos_photos_upload on storage.objects for insert to authenticated
 with check(bucket_id='fitos-photos' and public.fitos_photo_allowed(name,true));
create policy fitos_photos_delete on storage.objects for delete to authenticated
 using(bucket_id='fitos-photos' and public.fitos_photo_allowed(name,true));
commit;
