begin;
create table public.fitos_gym_modules(
 gym_id uuid not null references public.fitos_gyms(id) on delete cascade,
 module_key text not null check(module_key in ('training','measurements')),
 enabled boolean not null default true,
 updated_at timestamptz not null default now(),
 primary key(gym_id,module_key)
);
alter table public.fitos_gym_modules enable row level security;
create policy module_read on public.fitos_gym_modules for select to authenticated
 using(public.fitos_is_platform_admin() or public.fitos_is_member(gym_id));
grant select on public.fitos_gym_modules to authenticated;
revoke all on public.fitos_gym_modules from anon;
insert into public.fitos_gym_modules(gym_id,module_key)
select id,k from public.fitos_gyms cross join (values('training'),('measurements')) t(k);
create function public.fitos_default_modules()
returns trigger language plpgsql security definer set search_path=''
as $$ begin
 insert into public.fitos_gym_modules(gym_id,module_key) values(new.id,'training'),(new.id,'measurements');
 return new;
end $$;
create trigger fitos_default_modules_after_gym after insert on public.fitos_gyms
 for each row execute function public.fitos_default_modules();
revoke execute on function public.fitos_default_modules() from public,anon,authenticated;
create function public.fitos_module_enabled(g uuid,k text)
returns boolean language sql stable security definer set search_path=''
as $$ select public.fitos_is_platform_admin() or coalesce(
 (select m.enabled from public.fitos_gym_modules m where m.gym_id=g and m.module_key=k),false) $$;
revoke execute on function public.fitos_module_enabled(uuid,text) from public,anon;
grant execute on function public.fitos_module_enabled(uuid,text) to authenticated;
create function public.fitos_set_gym_module(g uuid,k text,allow_access boolean)
returns void language plpgsql security definer set search_path=''
as $$ begin
 if not public.fitos_is_platform_admin() then raise exception 'Forbidden'; end if;
 update public.fitos_gym_modules set enabled=allow_access,updated_at=now()
 where gym_id=g and module_key=k and enabled is distinct from allow_access;
 if found then
  insert into public.fitos_audit_events(actor_id,gym_id,action,detail)
  values(auth.uid(),g,'module_access',jsonb_build_object('module',k,'enabled',allow_access));
 end if;
end $$;
revoke execute on function public.fitos_set_gym_module(uuid,text,boolean) from public,anon;
grant execute on function public.fitos_set_gym_module(uuid,text,boolean) to authenticated;
create policy fitos_measurements_module_guard on public.fitos_measurements as restrictive
 for all to authenticated using(public.fitos_module_enabled(gym_id,'measurements'))
 with check(public.fitos_module_enabled(gym_id,'measurements'));
create policy fitos_plans_module_guard on public.fitos_plans as restrictive
 for all to authenticated using(public.fitos_module_enabled(gym_id,'training'))
 with check(public.fitos_module_enabled(gym_id,'training'));
create policy fitos_days_module_guard on public.fitos_plan_days as restrictive
 for all to authenticated using(public.fitos_module_enabled(gym_id,'training'))
 with check(public.fitos_module_enabled(gym_id,'training'));
create policy fitos_workouts_module_guard on public.fitos_workouts as restrictive
 for all to authenticated using(public.fitos_module_enabled(gym_id,'training'))
 with check(public.fitos_module_enabled(gym_id,'training'));
create policy fitos_sets_module_guard on public.fitos_sets as restrictive
 for all to authenticated using(public.fitos_module_enabled(gym_id,'training'))
 with check(public.fitos_module_enabled(gym_id,'training'));
commit;
