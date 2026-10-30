// FitOS commercial workout workspace. All content is rendered using safe DOM nodes.
const el=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);return x};
const field=(title,type='text',options={})=>{const lab=el('label',title),input=el('input');input.type=type;for(const [k,v] of Object.entries(options))input[k]=v;lab.append(input);return {lab,input}};
const message=(notify,e)=>notify(e?.message||String(e));
const useGym=(table,gym)=>db=>db.from(table).select('*').eq('gym_id',gym.id);
function addForm(parent,form){parent.append(form)}
export async function renderTraining({db,gym,auth,role,root,notify}){
 root.replaceChildren();
 const admin=['owner','admin','trainer','superadmin'].includes(role);
 const plansQuery=await db.from('fitos_plans').select('id,title,athlete_id,starts_on,ends_on,active').eq('gym_id',gym.id).order('created_at',{ascending:false}).limit(100);
 if(plansQuery.error)throw plansQuery.error;
 const plans=plansQuery.data||[];
 const athleteQuery=await db.from('fitos_memberships').select('user_id,branch_id').eq('gym_id',gym.id).eq('role','athlete').eq('enabled',true);
 if(athleteQuery.error)throw athleteQuery.error;
 const athleteIds=(athleteQuery.data||[]).map(x=>x.user_id);
 if(admin||athleteIds.includes(auth.id)){
  const section=el('section');section.append(el('h4','Crear rutina básica'));
  const form=el('form');const title=field('Nombre de la rutina','text',{required:true,maxLength:150});
  const days=field('Entrenamientos por semana (1–7)','number',{min:1,max:7,value:3,required:true});
  const exercise=field('Ejercicio principal por día','text',{required:true,maxLength:120});
  const count=field('Series por ejercicio','number',{min:1,max:10,value:3,required:true});
  const start=field('Inicio del plan','date',{required:true,value:new Date().toLocaleDateString('en-CA')});
  const athlete=el('select');
  if(admin){
   const label=el('label','Deportista');
   for(const id of athleteIds){const o=el('option',id.slice(0,8)+'…');o.value=id;athlete.append(o)}
   label.append(athlete);form.append(label);
  }
  for(const f of [title,days,exercise,count,start])form.append(f.lab);
  const submit=el('button','Guardar rutina');submit.type='submit';form.append(submit);
  if(admin&&!athleteIds.length){submit.disabled=true;form.append(el('p','Primero invita a un deportista a este gimnasio.'))}
  form.onsubmit=async ev=>{
   ev.preventDefault();submit.disabled=true;
   try{
    const target=admin?athlete.value:auth.id;
    if(!target||!athleteIds.includes(target))throw Error('Elige un deportista autorizado.');
    const frequency=Number(days.input.value),sets=Number(count.input.value);
    if(!Number.isInteger(frequency)||frequency<1||frequency>7||!Number.isInteger(sets)||sets<1||sets>10)throw Error('Revisa sesiones y series.');
    const from=start.input.value;const until=new Date(from+'T12:00:00Z');if(Number.isNaN(until.getTime()))throw Error('Fecha incorrecta');
    until.setUTCDate(until.getUTCDate()+27);
    const end=until.toISOString().slice(0,10);
    const created=await db.from('fitos_plans').insert({gym_id:gym.id,athlete_id:target,title:title.input.value.trim(),starts_on:from,ends_on:end,created_by:auth.id}).select('id').single();
    if(created.error)throw created.error;
    const rows=Array.from({length:frequency},(_,i)=>({gym_id:gym.id,plan_id:created.data.id,day_index:i,title:'Día '+(i+1)+' · '+exercise.input.value.trim(),exercises:[{id:crypto.randomUUID(),name:exercise.input.value.trim(),sets,reps:'8–12',rir:2,rest:90}]}));
    const saved=await db.from('fitos_plan_days').insert(rows);
    if(saved.error){const cleanup=await db.from('fitos_plans').update({active:false}).eq('id',created.data.id).eq('gym_id',gym.id);throw Error('Plan creado, pero no se guardaron sus días. Solicita revisión al administrador.')}
    notify('Rutina guardada y disponible.');await renderTraining({db,gym,auth,role,root,notify});
   }catch(e){message(notify,e)}finally{submit.disabled=false}
  };
  section.append(form);root.append(section);
 }
 const title=el('h4','Planes disponibles');root.append(title);
 if(!plans.length){root.append(el('p','Todavía no hay rutinas asignadas.'));return}
 for(const plan of plans){
  const section=el('section');section.className='row';const info=el('div');
  info.append(el('strong',plan.title),el('p',plan.starts_on+' — '+plan.ends_on+(plan.active?'':' · Inactivo')));
  section.append(info);root.append(section);
  if(!plan.active)continue;
  const daysResult=await db.from('fitos_plan_days').select('id,day_index,title,exercises').eq('gym_id',gym.id).eq('plan_id',plan.id).order('day_index');
  if(daysResult.error){message(notify,daysResult.error);continue}
  for(const day of daysResult.data||[]){
   const btn=el('button','Abrir '+day.title);btn.type='button';btn.className='outline';
   btn.onclick=()=>openWorkout({db,gym,auth,plan,day,root,role,notify});
   root.append(btn);
  }
 }
}
async function openWorkout({db,gym,auth,plan,day,root,role,notify}){
 try{
  const now=new Date().toLocaleDateString('en-CA');
  const result=await db.from('fitos_workouts').select('id,status').eq('gym_id',gym.id).eq('athlete_id',plan.athlete_id).eq('plan_day_id',day.id).eq('workout_date',now).limit(1);
  if(result.error)throw result.error;
  let workout=result.data?.[0];
  if(workout?.status==='completed'){notify('Esta sesión ya fue finalizada hoy. Su historial permanece guardado.');return}
  if(workout?.status==='interrupted'){
   const reopened=await db.from('fitos_workouts').update({status:'in_progress'}).eq('id',workout.id).eq('gym_id',gym.id).select('id,status').single();
   if(reopened.error)throw reopened.error;workout=reopened.data;
  }
  if(!workout){
   const created=await db.from('fitos_workouts').insert({gym_id:gym.id,athlete_id:plan.athlete_id,plan_day_id:day.id,workout_date:now,status:'in_progress'}).select('id,status').single();
   if(created.error)throw created.error;workout=created.data;
  }
  root.replaceChildren();root.append(el('h3',day.title));const back=el('button','Volver a rutinas');back.type='button';back.className='outline';back.onclick=()=>renderTraining({db,gym,auth,role,root,notify});root.append(back);
  const rows=el('section');root.append(rows);
  async function paint(){
   rows.replaceChildren();
   const result=await db.from('fitos_sets').select('exercise_key,set_number,weight_kg,reps,rir').eq('gym_id',gym.id).eq('workout_id',workout.id);
   if(result.error)throw result.error;
   const saved=result.data||[];
   const exercises=Array.isArray(day.exercises)?day.exercises:[];
   let required=0;
   for(const [eIndex,ex] of exercises.entries()){
    const id=String(ex.id||eIndex);const sets=Math.min(10,Math.max(1,Number(ex.sets)||1));required+=sets;
    const card=el('section');card.className='panel';card.append(el('h4',ex.name||'Ejercicio'));
    const head=el('p','Serie | Peso (kg) | Reps | RIR');head.className='small';card.append(head);
    for(let n=1;n<=sets;n++){
     const prior=saved.find(x=>x.exercise_key===id&&x.set_number===n);
     const form=el('form');form.className='inline-form';
     const num=el('span','#'+n);
     const weight=field('Peso','number',{min:0,max:2500,step:0.25,required:true,value:prior?.weight_kg??''});
     const reps=field('Reps','number',{min:1,max:200,required:true,value:prior?.reps??''});
     const rir=field('RIR','number',{min:0,max:10,required:true,value:prior?.rir??''});
     const save=el('button',prior?'Editar':'Guardar');save.type='submit';
     form.append(num,weight.lab,reps.lab,rir.lab,save);
     form.onsubmit=async ev=>{ev.preventDefault();save.disabled=true;try{
      const weightValue=Number(weight.input.value),repsValue=Number(reps.input.value),rirValue=Number(rir.input.value);
      if(!weight.input.value||!reps.input.value||!rir.input.value||weightValue<0||weightValue>2500||!Number.isInteger(repsValue)||repsValue<1||repsValue>200||!Number.isInteger(rirValue)||rirValue<0||rirValue>10)throw Error('Revisa los valores.');
      const {error}=await db.from('fitos_sets').upsert({gym_id:gym.id,workout_id:workout.id,exercise_key:id,set_number:n,weight_kg:weightValue,reps:repsValue,rir:rirValue},{onConflict:'workout_id,exercise_key,set_number'});
      if(error)throw error;notify('Serie guardada.');await paint();
     }catch(err){message(notify,err)}finally{save.disabled=false}};
     card.append(form);
    }
    rows.append(card);
   }
   const completed=exercises.reduce((n,ex,i)=>n+saved.filter(x=>x.exercise_key===String(ex.id||i)).length,0);
   const footer=el('p',completed+' de '+required+' series registradas');rows.append(footer);
   const finish=el('button','FIN · Finalizar sesión');finish.type='button';finish.disabled=required===0||completed<required;
   finish.onclick=async()=>{finish.disabled=true;try{const {error}=await db.from('fitos_workouts').update({status:'completed',finished_at:new Date().toISOString()}).eq('id',workout.id).eq('gym_id',gym.id);if(error)throw error;notify('Entrenamiento finalizado.');await renderTraining({db,gym,auth,role,root,notify})}catch(e){message(notify,e);finish.disabled=false}};
   rows.append(finish);
  }
  await paint();
 }catch(e){message(notify,e)}
}
