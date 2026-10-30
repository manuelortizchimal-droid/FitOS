-- Security: cap check and scoped email visibility for gym managers.
begin;
drop function if exists public.fitos_list_gym_members(uuid);
create function public.fitos_list_gym_members(g uuid)
returns table(user_id uuid,member_role public.fitos_role,branch_id uuid,enabled boolean,email text)
language plpgsql stable security definer set search_path=''
as $$
begin
 if not public.fitos_can_manage(g) then raise exception 'Forbidden' using errcode='42501'; end if;
 return query select m.user_id,m.role,m.branch_id,m.enabled,u.email::text
 from public.fitos_memberships m join auth.users u on u.id=m.user_id
 where m.gym_id=g order by u.email;
end $$;
revoke execute on function public.fitos_list_gym_members(uuid) from public,anon;
grant execute on function public.fitos_list_gym_members(uuid) to authenticated;
create or replace function public.fitos_set_member_access(g uuid,member uuid,allow_access boolean)
returns void language plpgsql security definer set search_path=''
as $$
declare target_role public.fitos_role; was_enabled boolean; current_count integer; max_count integer;
begin
 if not public.fitos_can_manage(g) then raise exception 'Forbidden' using errcode='42501'; end if;
 if member=(select auth.uid()) then raise exception 'Cannot change your own access'; end if;
 perform pg_advisory_xact_lock(hashtext(g::text));
 select member_limit into max_count from public.fitos_gyms
 where id=g and status in ('trial','active') for update;
 if max_count is null then raise exception 'Gym license is inactive'; end if;
 select role,enabled into target_role,was_enabled from public.fitos_memberships
 where gym_id=g and user_id=member for update;
 if not found then raise exception 'Member not found'; end if;
 if target_role='owner' and not public.fitos_is_platform_admin() then
   raise exception 'Only platform administrators can manage owners';
 end if;
 if was_enabled is not distinct from allow_access then return; end if;
 if allow_access then
  select count(*) into current_count from public.fitos_memberships where gym_id=g and enabled;
  if current_count>=max_count then raise exception 'Member limit reached'; end if;
 end if;
 update public.fitos_memberships set enabled=allow_access where gym_id=g and user_id=member;
 insert into public.fitos_audit_events(actor_id,gym_id,action,detail)
 values(auth.uid(),g,'membership_access',jsonb_build_object('member',member::text,'enabled',allow_access));
end $$;
revoke execute on function public.fitos_set_member_access(uuid,uuid,boolean) from public,anon;
grant execute on function public.fitos_set_member_access(uuid,uuid,boolean) to authenticated;
commit;
