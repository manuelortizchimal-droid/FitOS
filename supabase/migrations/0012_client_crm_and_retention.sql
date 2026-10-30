begin;
create table public.fitos_client_details(
 gym_id uuid primary key references public.fitos_gyms(id) on delete cascade,
 legal_contact text not null default '' check(length(legal_contact)<=140),
 phone text not null default '' check(length(phone)<=40),
 email text not null default '' check(length(email)<=254),
 notes text not null default '' check(length(notes)<=8000),
 updated_at timestamptz not null default now()
);
alter table public.fitos_client_details enable row level security;
create policy client_details_master_read on public.fitos_client_details for select to authenticated using(public.fitos_is_platform_admin());
grant select on public.fitos_client_details to authenticated;
revoke all on public.fitos_client_details from anon;
create function public.fitos_save_client(g uuid,company_name text,contact_name text,contact_phone text,contact_email text,client_notes text)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if not public.fitos_is_platform_admin() then raise exception 'Forbidden'; end if;
 if length(trim(company_name)) not between 2 and 140 or length(contact_name)>140 or length(contact_phone)>40 or length(contact_email)>254 or length(client_notes)>8000 then raise exception 'Invalid client details'; end if;
 if contact_email<>'' and contact_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email'; end if;
 update public.fitos_gyms set name=trim(company_name),updated_at=now() where id=g;
 if not found then raise exception 'Client not found'; end if;
 insert into public.fitos_client_details(gym_id,legal_contact,phone,email,notes,updated_at)
 values(g,trim(contact_name),trim(contact_phone),trim(contact_email),client_notes,now())
 on conflict(gym_id) do update set legal_contact=excluded.legal_contact,phone=excluded.phone,email=excluded.email,notes=excluded.notes,updated_at=now();
 insert into public.fitos_audit_events(actor_id,gym_id,action,detail) values(auth.uid(),g,'client_profile_changed','{}'::jsonb);
end $$;
revoke execute on function public.fitos_save_client(uuid,text,text,text,text,text) from public,anon;
grant execute on function public.fitos_save_client(uuid,text,text,text,text,text) to authenticated;

create table public.fitos_member_billing(
 gym_id uuid not null,
 user_id uuid not null,
 paid_through date,
 billing_status text not null default 'unknown' check(billing_status in ('unknown','paid','pending','cancelled')),
 updated_at timestamptz not null default now(),
 primary key(gym_id,user_id),
 foreign key(gym_id,user_id) references public.fitos_memberships(gym_id,user_id) on delete cascade
);
alter table public.fitos_member_billing enable row level security;
create policy billing_managers_read on public.fitos_member_billing for select to authenticated using(public.fitos_can_manage(gym_id));
grant select on public.fitos_member_billing to authenticated;
revoke all on public.fitos_member_billing from anon;
create function public.fitos_set_member_billing(g uuid,member uuid,new_paid_through date,new_status text)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if not public.fitos_can_manage(g) then raise exception 'Forbidden'; end if;
 if new_status not in ('unknown','paid','pending','cancelled') then raise exception 'Invalid billing status'; end if;
 if not exists(select 1 from public.fitos_memberships where gym_id=g and user_id=member and role='athlete') then raise exception 'Athlete not found'; end if;
 insert into public.fitos_member_billing(gym_id,user_id,paid_through,billing_status)
 values(g,member,new_paid_through,new_status)
 on conflict(gym_id,user_id) do update set paid_through=excluded.paid_through,billing_status=excluded.billing_status,updated_at=now();
 insert into public.fitos_audit_events(actor_id,gym_id,action,detail) values(auth.uid(),g,'member_billing_changed',jsonb_build_object('member',member,'status',new_status,'paid_through',new_paid_through));
end $$;
revoke execute on function public.fitos_set_member_billing(uuid,uuid,date,text) from public,anon;
grant execute on function public.fitos_set_member_billing(uuid,uuid,date,text) to authenticated;
create function public.fitos_gym_stats(g uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
 if not (public.fitos_is_platform_admin() or public.fitos_can_manage(g)) then raise exception 'Forbidden'; end if;
 select jsonb_build_object(
  'total',count(*),
  'active',count(*) filter(where m.enabled),
  'disabled',count(*) filter(where not m.enabled),
  'athletes',count(*) filter(where m.role='athlete'),
  'renewing_30d',count(*) filter(where m.role='athlete' and m.enabled and b.paid_through>=current_date and b.paid_through<=current_date+30 and b.billing_status='paid'),
  'overdue',count(*) filter(where m.role='athlete' and b.paid_through<current_date and b.billing_status in ('paid','pending')),
  'unknown_billing',count(*) filter(where m.role='athlete' and (b.billing_status is null or b.billing_status='unknown' or b.paid_through is null))
 ) into result from public.fitos_memberships m left join public.fitos_member_billing b on b.gym_id=m.gym_id and b.user_id=m.user_id where m.gym_id=g;
 return result;
end $$;
revoke execute on function public.fitos_gym_stats(uuid) from public,anon;
grant execute on function public.fitos_gym_stats(uuid) to authenticated;
commit;