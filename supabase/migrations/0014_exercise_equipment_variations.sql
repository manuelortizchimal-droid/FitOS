begin;
create table public.fitos_exercise_alternatives (
 id text primary key check(length(id) between 3 and 70),
 muscle_group text not null check(muscle_group in ('chest','back','shoulders','biceps','triceps','quads','hamstrings','glutes','calves','core')),
 equipment text not null check(equipment in ('Máquina','Polea','Mancuernas','Barra','Peso corporal')),
 name text not null check(length(name) between 3 and 120),
 technique text not null default '',
 unique(id,muscle_group)
);
alter table public.fitos_exercise_alternatives enable row level security;
create policy fitos_alternatives_read on public.fitos_exercise_alternatives
 for select to authenticated using(true);
revoke all on public.fitos_exercise_alternatives from anon;
grant select on public.fitos_exercise_alternatives to authenticated;
insert into public.fitos_exercise_alternatives(id,muscle_group,equipment,name,technique) values
('chest-machine-press','chest','Máquina','Press de pecho en máquina','Ajusta el asiento; controla el descenso y no rebotes.'),
('chest-cable-fly','chest','Polea','Aperturas de pecho en poleas','Mantén los codos ligeramente flexionados y el tronco estable.'),
('chest-dumbbell-press','chest','Mancuernas','Press de pecho con mancuernas','Controla el rango cómodo y conserva los antebrazos estables.'),
('chest-pushup','chest','Peso corporal','Flexiones de pecho','Mantén el cuerpo alineado sin hundir la zona lumbar.'),
('back-row-machine','back','Máquina','Remo sentado en máquina','Inicia con la espalda estable y lleva los codos atrás.'),
('back-pulldown','back','Polea','Jalón al pecho en polea','Lleva la barra hacia el pecho sin impulsarte.'),
('back-row-dumbbell','back','Mancuernas','Remo a una mano con mancuerna','Apoya el tronco y evita girar la espalda.'),
('back-pullup','back','Peso corporal','Dominadas asistidas','Mantén control escapular y evita balancearte.'),
('shoulder-press-machine','shoulders','Máquina','Press de hombros en máquina','Ajusta la posición para evitar molestias articulares.'),
('shoulder-lateral-cable','shoulders','Polea','Elevación lateral en polea','Eleva sin encoger los hombros ni usar impulso.'),
('shoulder-lateral-dumbbell','shoulders','Mancuernas','Elevaciones laterales con mancuernas','Controla la bajada y evita el balanceo.'),
('biceps-cable-curl','biceps','Polea','Curl de bíceps en polea','Mantén los codos cerca del torso.'),
('biceps-preacher','biceps','Máquina','Curl predicador en máquina','Evita extender el codo de forma brusca.'),
('biceps-dumbbell-curl','biceps','Mancuernas','Curl alterno con mancuernas','Evita el impulso del torso.'),
('triceps-rope','triceps','Polea','Extensión de tríceps con cuerda','Fija los codos y extiende sin balancearte.'),
('triceps-machine','triceps','Máquina','Extensión de tríceps en máquina','Ajusta el apoyo y controla la vuelta.'),
('triceps-dumbbell','triceps','Mancuernas','Extensión de tríceps con mancuerna','Evita arqueos lumbares al elevar los brazos.'),
('quads-legpress','quads','Máquina','Prensa de piernas','Evita despegar la cadera del respaldo.'),
('quads-extension','quads','Máquina','Extensiones de cuádriceps','Ajusta el rodillo y mueve con control.'),
('quads-goblet','quads','Mancuernas','Sentadilla goblet','Mantén los talones estables y el tronco firme.'),
('quads-smith','quads','Barra','Sentadilla en multipower','Usa un recorrido compatible con tu movilidad.'),
('hamstrings-seated','hamstrings','Máquina','Curl femoral sentado','Mantén la cadera apoyada.'),
('hamstrings-lying','hamstrings','Máquina','Curl femoral acostado','Evita levantar la pelvis.'),
('hamstrings-rdl','hamstrings','Mancuernas','Peso muerto rumano con mancuernas','Articula desde la cadera y evita redondear la espalda.'),
('glutes-hipthrust','glutes','Máquina','Hip thrust en máquina','Evita hiperextender la zona lumbar.'),
('glutes-kickback','glutes','Polea','Patada de glúteo en polea','Mantén la pelvis estable.'),
('glutes-bridge','glutes','Mancuernas','Puente de glúteo con mancuerna','Eleva la pelvis sin arquear la espalda.'),
('glutes-stepup','glutes','Peso corporal','Step-up al banco','Controla la subida y el descenso.'),
('calves-seated','calves','Máquina','Elevación de talones sentado','Controla la fase excéntrica.'),
('calves-standing','calves','Máquina','Elevación de talones de pie','Evita rebotes y extiende el tobillo con control.'),
('calves-dumbbells','calves','Mancuernas','Elevación de talones con mancuernas','Mantén el equilibrio y evita rebotes.'),
('core-cable','core','Polea','Crunch abdominal en polea','Flexiona el tronco sin tirar de los brazos.'),
('core-machine','core','Máquina','Crunch en máquina','Evita movimientos bruscos.'),
('core-deadbug','core','Peso corporal','Dead bug','Mantén el abdomen activo sin arquear la espalda.');
create table public.fitos_workout_variations(
 gym_id uuid not null,
 workout_id uuid not null,
 exercise_key text not null check(length(exercise_key) between 1 and 120),
 alternative_id text not null references public.fitos_exercise_alternatives(id),
 selected_at timestamptz not null default now(),
 primary key(workout_id,exercise_key),
 foreign key(gym_id,workout_id) references public.fitos_workouts(gym_id,id) on delete cascade
);
alter table public.fitos_workout_variations enable row level security;
create policy fitos_variations_read on public.fitos_workout_variations for select to authenticated
 using(exists(select 1 from public.fitos_workouts w where w.id=workout_id and w.gym_id=gym_id
 and public.fitos_can_view_athlete(gym_id,w.athlete_id)));
create policy fitos_variations_insert on public.fitos_workout_variations for insert to authenticated
 with check(exists(select 1 from public.fitos_workouts w where w.id=workout_id and w.gym_id=gym_id
 and w.athlete_id=auth.uid() and w.status='in_progress' and public.fitos_is_member(gym_id)));
create policy fitos_variations_update on public.fitos_workout_variations for update to authenticated
 using(exists(select 1 from public.fitos_workouts w where w.id=workout_id and w.gym_id=gym_id
 and w.athlete_id=auth.uid() and w.status='in_progress' and public.fitos_is_member(gym_id)))
 with check(exists(select 1 from public.fitos_workouts w where w.id=workout_id and w.gym_id=gym_id
 and w.athlete_id=auth.uid() and w.status='in_progress' and public.fitos_is_member(gym_id)));
create policy fitos_variations_training_enabled on public.fitos_workout_variations as restrictive for all to authenticated
 using(public.fitos_module_enabled(gym_id,'training'))
 with check(public.fitos_module_enabled(gym_id,'training'));
grant select,insert,update on public.fitos_workout_variations to authenticated;
revoke all on public.fitos_workout_variations from anon;
create function public.fitos_validate_workout_variation()
returns trigger language plpgsql security definer set search_path=''
as $$
declare plan_exercise jsonb; actual_muscle text; alt_muscle text; state text;
begin
 if tg_op='UPDATE' and (new.gym_id<>old.gym_id or new.workout_id<>old.workout_id or new.exercise_key<>old.exercise_key) then
  raise exception 'Workout variation identity cannot change';
 end if;
 select w.status into state from public.fitos_workouts w where w.id=new.workout_id and w.gym_id=new.gym_id for update;
 if state is distinct from 'in_progress' then raise exception 'Workout is not in progress';end if;
 if exists(select 1 from public.fitos_sets s where s.workout_id=new.workout_id and s.exercise_key=new.exercise_key) then
  raise exception 'Change the exercise before saving any sets';
 end if;
 select ex into plan_exercise from public.fitos_workouts w join public.fitos_plan_days d on d.id=w.plan_day_id
 cross join lateral jsonb_array_elements(d.exercises) ex
 where w.id=new.workout_id and w.gym_id=new.gym_id and ex->>'id'=new.exercise_key limit 1;
 if plan_exercise is null then raise exception 'Exercise is not in the workout plan';end if;
 actual_muscle:=plan_exercise->>'muscle_group';
 if actual_muscle is null then raise exception 'Exercise muscle group is not defined in the plan';end if;
 select a.muscle_group into alt_muscle from public.fitos_exercise_alternatives a where a.id=new.alternative_id;
 if alt_muscle is distinct from actual_muscle then raise exception 'Alternative must target the same muscle group';end if;
 return new;
end $$;
create trigger fitos_variation_validate before insert or update on public.fitos_workout_variations
 for each row execute function public.fitos_validate_workout_variation();
revoke execute on function public.fitos_validate_workout_variation() from public,anon,authenticated;
commit;