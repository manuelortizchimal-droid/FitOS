-- FitOS v0.8 — Data API least privilege and security of auto-RLS helper
-- Requires 0001..0007 applied first in the dedicated FitOS project.
begin;
-- An SQL bootstrap helper created by Supabase's automatic RLS option should not
-- be callable by web API consumers. Preserve the event trigger itself.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
-- Explicit grants because the project is configured not to auto-expose new tables.
-- Grants open the Data API to authenticated users; RLS policies still decide rows.
grant usage on schema public to authenticated;
grant select on public.fitos_gyms, public.fitos_branches,
 public.fitos_memberships, public.fitos_profiles,
 public.fitos_plans, public.fitos_plan_days,
 public.fitos_workouts, public.fitos_sets,
 public.fitos_measurements, public.fitos_domains,
 public.fitos_photo_consents to authenticated;
grant insert on public.fitos_gyms, public.fitos_branches,
 public.fitos_profiles, public.fitos_plans,
 public.fitos_plan_days, public.fitos_workouts,
 public.fitos_sets, public.fitos_measurements,
 public.fitos_domains, public.fitos_photo_consents to authenticated;
grant update on public.fitos_branches,
 public.fitos_profiles, public.fitos_plans,
 public.fitos_plan_days, public.fitos_workouts,
 public.fitos_sets, public.fitos_measurements,
 public.fitos_domains, public.fitos_photo_consents to authenticated;
grant delete on public.fitos_branches,
 public.fitos_plan_days, public.fitos_domains to authenticated;
-- License state must be changed through audited RPC, never direct table UPDATE.
revoke update on public.fitos_gyms from anon, authenticated;
-- Superadmin identities and immutable audit events are intentionally not
-- exposed as direct client write tables.
revoke insert, update, delete on public.fitos_platform_admins,
 public.fitos_audit_events, public.fitos_memberships from anon, authenticated;
revoke all on public.fitos_platform_admins, public.fitos_audit_events from anon;
grant select on public.fitos_platform_admins, public.fitos_audit_events to authenticated;
-- No anonymous table access: account identity is required for every tenant row.
revoke all on public.fitos_gyms, public.fitos_branches,
 public.fitos_memberships, public.fitos_profiles,
 public.fitos_plans, public.fitos_plan_days,
 public.fitos_workouts, public.fitos_sets,
 public.fitos_measurements, public.fitos_domains,
 public.fitos_photo_consents from anon;
commit;
