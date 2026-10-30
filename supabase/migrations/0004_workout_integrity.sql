-- FitOS hardening v0.4: immutable ownership and validated workout completion.
begin;
create or replace function public.fitos_guard_workout_completion()
returns trigger language plpgsql security definer set search_path=''
as $$
declare day_data jsonb; one_ex jsonb; required integer:=0; saved integer:=0; set_qty integer; exercise_id text;
begin
 if tg_op='UPDATE' then
   if old.gym_id is distinct from new.gym_id or old.athlete_id is distinct from new.athlete_id
      or old.plan_day_id is distinct from new.plan_day_id
   then raise exception 'Workout ownership cannot change'; end if;
   if old.status='completed' then raise exception 'Completed workout is immutable'; end if;
   if old.status='interrupted' and new.status='completed' then raise exception 'Interrupted workout cannot be completed'; end if;
 end if;
 if new.status='completed' and (tg_op='INSERT' or old.status<>'completed') then
  if new.plan_day_id is null then raise exception 'Completed workout needs a valid plan day'; end if;
  select exercises into day_data from public.fitos_plan_days
  where id=new.plan_day_id and gym_id=new.gym_id;
  if day_data is null or jsonb_typeof(day_data)<>'array' or jsonb_array_length(day_data)=0 then
   raise exception 'No exercises assigned'; end if;
  for one_ex in select value from jsonb_array_elements(day_data) loop
   exercise_id=one_ex->>'id';
   if exercise_id is null or length(exercise_id)>120 or length(exercise_id)=0
      or (one_ex->>'sets') is null or not ((one_ex->>'sets') ~ '^[1-9][0-9]?$')
   then raise exception 'Invalid exercise specification'; end if;
   set_qty=(one_ex->>'sets')::integer;
   if set_qty>25 then raise exception 'Too many sets'; end if;
   required=required+set_qty;
   select saved+count(*) into saved from public.fitos_sets
   where workout_id=new.id and gym_id=new.gym_id and exercise_key=exercise_id and set_number<=set_qty;
  end loop;
  if required=0 or saved<>required then raise exception 'Save all required sets before finishing'; end if;
  new.finished_at=coalesce(new.finished_at,now());
 end if;
 return new;
end $$;
drop trigger if exists fitos_workout_completion_before on public.fitos_workouts;
create trigger fitos_workout_completion_before
before insert or update on public.fitos_workouts
for each row execute function public.fitos_guard_workout_completion();
revoke execute on function public.fitos_guard_workout_completion() from public,anon,authenticated;

-- Staff can inspect only assigned branch metadata; managers can access all branches.
drop policy if exists branches_read on public.fitos_branches;
create policy branches_read on public.fitos_branches for select to authenticated using(
 public.fitos_can_manage(gym_id)
 or (public.fitos_is_member(gym_id) and exists(
  select 1 from public.fitos_memberships m where m.gym_id=gym_id
    and m.user_id=(select auth.uid()) and m.enabled and m.branch_id=id
 ))
);

-- Change in branch must retain manager permission for original and resulting gym.
create or replace function public.fitos_guard_branch_scope()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if tg_op='UPDATE' and new.gym_id is distinct from old.gym_id then
  raise exception 'Cannot transfer a branch between gyms';
 end if;
 return new;
end $$;
create trigger fitos_branch_ownership_before before update on public.fitos_branches
for each row execute function public.fitos_guard_branch_scope();
revoke execute on function public.fitos_guard_branch_scope() from public,anon,authenticated;
commit;
