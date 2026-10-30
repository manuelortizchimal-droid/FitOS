import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.10/+esm';
import { FITOS_CONFIG } from './config.js';

const $=id=>document.getElementById(id), show=(id,on)=>$(id).hidden=!on;
const safeText=(node,value)=>{node.textContent=String(value??'')};
let db=null,auth=null,gyms=[],activeGym=null,memberships=[],isMaster=false,view='overview';
function notice(message){safeText($('status'),message)}
function errorMessage(err){return err?.message?.slice(0,240)||'Error de conexión. Intenta de nuevo.'}
const configured=()=>FITOS_CONFIG?.url?.startsWith('https://') && /^sb_publishable_|^eyJ/.test(FITOS_CONFIG.publishableKey||'');
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el}
function button(text,handler,cls='outline'){const b=node('button',text,cls);b.type='button';b.onclick=handler;return b}
function clear(id){$(id).replaceChildren()}
async function request(table,fields='*',filters=[]){let q=db.from(table).select(fields);for(const [name,value] of filters)q=q.eq(name,value);const {data,error}=await q;if(error)throw error;return data||[]}
async function start(){
 if(!configured()){show('configError',true);return}
 db=createClient(FITOS_CONFIG.url,FITOS_CONFIG.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data:{session}}=await db.auth.getSession();auth=session?.user||null;
 db.auth.onAuthStateChange((_event,session)=>{const next=session?.user||null;if(next?.id!==auth?.id){auth=next;queueMicrotask(()=>refresh().catch(e=>notice(errorMessage(e))))}});
 $('login').onsubmit=async ev=>{ev.preventDefault();$('submitLogin').disabled=true;try{const {error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;auth=(await db.auth.getUser()).data.user;await refresh()}catch(e){notice(errorMessage(e))}finally{$('submitLogin').disabled=false}};
 $('logout').onclick=async()=>{const {error}=await db.auth.signOut();if(error)return notice(errorMessage(error));auth=null;activeGym=null;await refresh()};
 $('newGym').onsubmit=createGym;
 $('addMeasure').onsubmit=addMeasurement;
 for(const [tab,name] of [['tabOverview','overview'],['tabMeasurements','measurements'],['tabPlans','plans']])$(tab).onclick=()=>{view=name;paintSections()};
 await refresh();
}
async function refresh(){
 show('auth',!auth);show('workspace',!!auth);show('logout',!!auth);if(!auth)return;
 try{
 const {data:admin,error:adminError}=await db.rpc('fitos_is_platform_admin');
 if(adminError)throw adminError;
 isMaster=admin===true;
 memberships=await request('fitos_memberships','gym_id,role,branch_id,enabled,user_id',[['user_id',auth.id]]);
 gyms=await request('fitos_gyms','id,name,slug,status,member_limit,brand_color');
 if(!isMaster)gyms=gyms.filter(g=>memberships.some(m=>m.gym_id===g.id&&m.enabled));
 if(!activeGym||!gyms.some(g=>g.id===activeGym.id)){activeGym=gyms.find(g=>g.status==='active'||g.status==='trial')||gyms[0]||null}
 else activeGym=gyms.find(g=>g.id===activeGym.id);
 paint();
 }catch(e){notice(errorMessage(e));clear('gymPicker');clear('overview');clear('masterGyms');}
}
function paint(){
 safeText($('identity'),auth.email);
 show('master',isMaster);
 const picker=$('gymPicker');picker.replaceChildren();
 if(isMaster)picker.append(button('Panel Maestro',()=>{activeGym=null;paint()},'outline'));
 for(const g of gyms)picker.append(button(g.name,()=>{activeGym=g;paint();},activeGym?.id===g.id?'':'outline'));
 paintMaster();
 show('gymHome',!!activeGym);
 if(!activeGym){safeText($('greeting'),isMaster?'Administración FitOS':'Sin gimnasio asignado');return}
 safeText($('greeting'),activeGym.name);
 safeText($('gymTitle'),activeGym.name);
 const m=memberships.find(x=>x.gym_id===activeGym.id);
 safeText($('gymRole'),isMaster?'Superadministrador':m?.role||'Usuario');
 const suspended=!['active','trial'].includes(activeGym.status);
 show('licenseNotice',suspended);
 if(suspended)safeText($('licenseNotice'),'Licencia suspendida: no se permite utilizar los datos del gimnasio.');
 paintSections();
}
function paintSections(){
 for(const name of ['overview','measurements','plans'])show(name,view===name);
 if(!activeGym)return;
 if(!['active','trial'].includes(activeGym.status)){for(const name of ['overview','measurementRows','planRows'])clear(name);$('addMeasure').hidden=true;return}
 $('addMeasure').hidden=false;
 if(view==='overview')loadOverview().catch(e=>notice(errorMessage(e)));
 if(view==='measurements')loadMeasurements().catch(e=>notice(errorMessage(e)));
 if(view==='plans')loadPlans().catch(e=>notice(errorMessage(e)));
}
async function loadOverview(){
 const root=$('overview');root.replaceChildren();
 const list=await request('fitos_branches','id,name',[['gym_id',activeGym.id]]);
 root.append(node('h3','Sucursales ('+list.length+')'));
 for(const branch of list){const row=node('div','','row');row.append(node('strong',branch.name));root.append(row)}
 if(!list.length)root.append(node('p','No hay sucursales registradas.'));
 if(isMaster||['owner','admin'].includes(memberships.find(m=>m.gym_id===activeGym.id)?.role)){
 const form=node('form');const input=node('input');input.required=true;input.maxLength=120;input.placeholder='Nombre de nueva sucursal';input.setAttribute('aria-label','Nombre de nueva sucursal');const add=node('button','Agregar sucursal');form.append(input,add);form.onsubmit=async e=>{e.preventDefault();try{const {error}=await db.from('fitos_branches').insert({gym_id:activeGym.id,name:input.value.trim()});if(error)throw error;input.value='';await loadOverview()}catch(err){notice(errorMessage(err))}};root.append(form)}
}
async function loadMeasurements(){
 const root=$('measurementRows');root.replaceChildren();
 const rows=await request('fitos_measurements','measured_on,weight_kg,waist_cm,body_fat_pct,origin,athlete_id',[['gym_id',activeGym.id]]);
 rows.sort((a,b)=>b.measured_on.localeCompare(a.measured_on));
 if(!rows.length)root.append(node('p','Sin mediciones disponibles.'));
 for(const r of rows.slice(0,100)){const row=node('div','','row');row.append(node('span',r.measured_on+' · '+(r.weight_kg??'—')+' kg · '+r.origin));root.append(row)}
 $('measureDate').max=new Date().toLocaleDateString('en-CA');$('measureDate').value=$('measureDate').max;
}
async function addMeasurement(e){
 e.preventDefault();if(!activeGym||!['active','trial'].includes(activeGym.status))return;
 const date=$('measureDate').value,weight=Number($('measureWeight').value);
 if(!date||date>new Date().toLocaleDateString('en-CA')||!Number.isFinite(weight)||weight<20||weight>400)return notice('Revisa la fecha y el peso.');
 try{const {error}=await db.from('fitos_measurements').upsert({gym_id:activeGym.id,athlete_id:auth.id,measured_on:date,weight_kg:weight,origin:'manual'},{onConflict:'gym_id,athlete_id,measured_on'});if(error)throw error;$('measureWeight').value='';notice('Medición guardada.');await loadMeasurements()}catch(err){notice(errorMessage(err))}
}
async function loadPlans(){
 const root=$('planRows');root.replaceChildren();
 const rows=await request('fitos_plans','id,title,starts_on,ends_on,athlete_id,active',[['gym_id',activeGym.id]]);
 if(!rows.length)root.append(node('p','Sin rutinas asignadas.'));
 for(const r of rows){const row=node('div','','row');row.append(node('strong',r.title));row.append(node('span',r.starts_on+' a '+r.ends_on));root.append(row)}
}
function paintMaster(){
 const root=$('masterGyms');root.replaceChildren();if(!isMaster)return;
 for(const g of gyms){const row=node('div','','row');const info=node('div');info.append(node('strong',g.name),node('p',g.slug+' · '+g.status+' · límite '+g.member_limit,'small'));row.append(info);
 const select=node('select');select.setAttribute('aria-label','Estado de '+g.name);
 for(const status of ['trial','active','suspended','cancelled']){const opt=node('option',status);opt.value=status;opt.selected=status===g.status;select.append(opt)}
 select.onchange=async()=>{const value=select.value;if(!confirm('¿Confirmar cambio de licencia de '+g.name+' a '+value+'?')){select.value=g.status;return}try{const {error}=await db.rpc('fitos_set_gym_status',{g:g.id,new_status:value});if(error)throw error;notice('Licencia actualizada.');await refresh()}catch(e){select.value=g.status;notice(errorMessage(e))}};
 row.append(select);root.append(row)}
}
async function createGym(e){
 e.preventDefault();if(!isMaster)return;
 const name=$('gymName').value.trim(),slug=$('gymSlug').value.trim().toLowerCase();
 if(name.length<2||!/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug))return notice('Nombre o identificador inválido.');
 try{const {error}=await db.from('fitos_gyms').insert({name,slug});if(error)throw error;$('newGym').reset();notice('Gimnasio creado; asigna un administrador mediante el flujo seguro de invitaciones.');await refresh()}catch(e){notice(errorMessage(e))}
}
start().catch(e=>notice(errorMessage(e)));
