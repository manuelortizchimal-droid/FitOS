import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.10/+esm';
import { FITOS_CONFIG } from './config.js';
import { renderTraining } from './training.js';
import { renderMainDashboard,renderGymAdministration } from './administration.js';

const $=id=>document.getElementById(id), show=(id,on)=>$(id).hidden=!on;
const safeText=(node,value)=>{node.textContent=String(value??'')};
let db=null,auth=null,gyms=[],activeGym=null,memberships=[],isMaster=false,view='overview',recoveryMode=false,gymModules=[];
function notice(message){safeText($('status'),message)}
function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function errorMessage(err){return err?.message?.slice(0,240)||'Error de conexión. Intenta de nuevo.'}
const configured=()=>FITOS_CONFIG?.url?.startsWith('https://') && /^sb_publishable_|^eyJ/.test(FITOS_CONFIG.publishableKey||'');
// Keep recovery and invitation callbacks on the published test application, never localhost.
const authCallbackURL=new URL(location.pathname.endsWith('/')?location.pathname:location.pathname+'/',location.origin).href;
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el}
function button(text,handler,cls='outline'){const b=node('button',text,cls);b.type='button';b.onclick=handler;return b}
function clear(id){$(id).replaceChildren()}
async function request(table,fields='*',filters=[]){let q=db.from(table).select(fields);for(const [name,value] of filters)q=q.eq(name,value);const {data,error}=await q;if(error)throw error;return data||[]}
async function start(){
 if(!configured()){show('configError',true);return}
 db=createClient(FITOS_CONFIG.url,FITOS_CONFIG.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data:{session}}=await db.auth.getSession();auth=session?.user||null;
 recoveryMode=location.hash.includes('type=invite')||location.hash.includes('type=recovery');
 if(recoveryMode&&auth){show('passwordSetup',true);show('auth',false);show('workspace',false)}
 db.auth.onAuthStateChange((event,session)=>{const next=session?.user||null;const changed=next?.id!==auth?.id;auth=next;if(event==='PASSWORD_RECOVERY'||(event==='SIGNED_IN'&&location.hash.includes('type=invite'))){recoveryMode=true;show('passwordSetup',true);show('auth',false);show('workspace',false)}else if(changed&&!recoveryMode){queueMicrotask(()=>refresh().catch(e=>notice(errorMessage(e))))}});
 $('setPassword').onsubmit=async ev=>{ev.preventDefault();const input=$('newPassword');if(input.value.length<12)return notice('La contraseña debe tener al menos 12 caracteres.');const {error}=await db.auth.updateUser({password:input.value});if(error)return notice(errorMessage(error));input.value='';recoveryMode=false;show('passwordSetup',false);history.replaceState(null,'',location.pathname);notice('Contraseña establecida.');await refresh()};
 $('forgotPassword').onclick=async()=>{const email=$('email').value.trim();if(!email)return notice('Escribe primero tu correo electrónico.');const b=$('forgotPassword');b.disabled=true;try{const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:authCallbackURL});if(error){const limited=error.status===429||error.code==='over_email_send_rate_limit';notice(limited?'Límite temporal de correos alcanzado. Intenta más tarde; no repitas solicitudes seguidas.':'No se pudo solicitar recuperación. '+errorMessage(error));return}notice('Si la cuenta existe y no hay restricciones de envío, recibirás instrucciones por correo.')}catch(err){notice(errorMessage(err))}finally{b.disabled=false}};
 $('login').onsubmit=async ev=>{ev.preventDefault();$('submitLogin').disabled=true;try{const {error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;auth=(await db.auth.getUser()).data.user;await refresh()}catch(e){notice(errorMessage(e))}finally{$('submitLogin').disabled=false}};
 $('logout').onclick=async()=>{const {error}=await db.auth.signOut();if(error)return notice(errorMessage(error));auth=null;activeGym=null;await refresh()};
 $('newGym').onsubmit=createGym;
 $('addMeasure').onsubmit=addMeasurement;
 for(const [tab,name] of [['tabOverview','overview'],['tabMeasurements','measurements'],['tabPlans','plans']])$(tab).onclick=()=>{view=name;paintSections()};
 await refresh();
}
async function refresh(){
 if(recoveryMode&&auth)return;
 show('auth',!auth);show('workspace',!!auth);show('logout',!!auth);if(!auth)return;
 try{
 const {data:admin,error:adminError}=await db.rpc('fitos_is_platform_admin');
 if(adminError)throw adminError;
 isMaster=admin===true;
 memberships=await request('fitos_memberships','gym_id,role,branch_id,enabled,user_id',[['user_id',auth.id]]);
 gyms=await request('fitos_gyms','id,name,slug,status,member_limit,brand_color,created_at');
 gymModules=await request('fitos_gym_modules','gym_id,module_key,enabled');
 const host=location.hostname.toLowerCase();
 const domains=await request('fitos_domains','gym_id,hostname,verified',[['hostname',host]]);
 if(!isMaster){gyms=gyms.filter(g=>memberships.some(m=>m.gym_id===g.id&&m.enabled));if(domains.length){gyms=gyms.filter(g=>g.id===domains[0].gym_id)}}
 if(!activeGym||!gyms.some(g=>g.id===activeGym.id)){activeGym=isMaster?null:(gyms.find(g=>g.status==='active'||g.status==='trial')||gyms[0]||null)}
 else activeGym=gyms.find(g=>g.id===activeGym.id);
 paint();
 }catch(e){notice(errorMessage(e));clear('gymPicker');clear('overview');clear('masterGyms');}
}
function paint(){
 safeText($('identity'),auth.email);
 show('master',isMaster&&!activeGym);
 const picker=$('gymPicker');picker.replaceChildren();
 if(isMaster)picker.append(button('Main Dashboard',()=>{activeGym=null;paint()},'outline'));
 for(const g of gyms)picker.append(button(g.name,()=>{activeGym=g;paint();},activeGym?.id===g.id?'':'outline'));
 if(isMaster&&!activeGym)picker.querySelector('button')?.setAttribute('aria-current','page');
 if(isMaster&&!activeGym){paintMaster().catch(e=>notice(errorMessage(e)))}
 show('gymHome',!!activeGym);
 if(!activeGym){safeText($('greeting'),isMaster?'Main Dashboard':'Sin gimnasio asignado');return}
 safeText($('greeting'),activeGym.name);
 safeText($('gymTitle'),activeGym.name);
 const m=memberships.find(x=>x.gym_id===activeGym.id);
 safeText($('gymRole'),isMaster?'Gestión de cliente':m?.role==='owner'?'Titular del gimnasio':m?.role==='admin'?'Administrador':m?.role==='trainer'?'Entrenador':'Deportista');
 const suspended=!['active','trial'].includes(activeGym.status);
 show('licenseNotice',suspended);
 if(suspended)safeText($('licenseNotice'),'Licencia suspendida: no se permite utilizar los datos del gimnasio.');
 paintSections();
}
function paintSections(){
 const gymRole=memberships.find(m=>m.gym_id===activeGym?.id)?.role;
 const ownerOnly=!isMaster&&['owner','admin'].includes(gymRole);
 show('gymAdminTab',ownerOnly);
 show('gymAdmin',ownerOnly);
 show('athleteTabs',!ownerOnly);
 if(ownerOnly){renderGymAdministration({db,g:activeGym,root:$('gymAdmin'),notify:notice,resetAccount:async(member)=>{if(!confirm('¿Enviar un correo para restablecer la contraseña de este deportista? Su información permanecerá intacta.'))return;try{const {data,error}=await db.functions.invoke('fitos-reset-member',{body:{gym_id:activeGym.id,user_id:member}});if(error)throw error;if(!data?.ok)throw Error(data?.error||'No se pudo solicitar el correo.');notice('Solicitud enviada. La entrega está sujeta al límite de correos de Supabase.')}catch(e){notice(errorMessage(e))}}}).catch(e=>notice(errorMessage(e)));loadOverview().catch(e=>notice(errorMessage(e)));return}
 const measureEnabled=isMaster||gymModules.find(m=>m.gym_id===activeGym?.id&&m.module_key==='measurements')?.enabled===true;
 const trainEnabled=isMaster||gymModules.find(m=>m.gym_id===activeGym?.id&&m.module_key==='training')?.enabled===true;
 show('tabMeasurements',measureEnabled);show('tabPlans',trainEnabled);
 if((view==='measurements'&&!measureEnabled)||(view==='plans'&&!trainEnabled))view='overview';
 for(const name of ['overview','measurements','plans'])show(name,view===name);
 if(!activeGym)return;
 if(!['active','trial'].includes(activeGym.status)){for(const name of ['overview','measurementRows','planRows'])clear(name);$('addMeasure').hidden=true;return}
 $('addMeasure').hidden=isMaster||gymRole!=='athlete';
 if(view==='overview')loadOverview().catch(e=>notice(errorMessage(e)));
 if(view==='measurements')loadMeasurements().catch(e=>notice(errorMessage(e)));
 if(view==='plans')loadPlans().catch(e=>notice(errorMessage(e)));
}
async function loadOverview(){
 const root=(!isMaster&&['owner','admin'].includes(memberships.find(m=>m.gym_id===activeGym.id)?.role))?$('ownerManagement'):$('overview');root.replaceChildren();
 const list=await request('fitos_branches','id,name',[['gym_id',activeGym.id]]);
 root.append(node('h3','Sucursales ('+list.length+')'));
 for(const branch of list){const row=node('div','','row');row.append(node('strong',branch.name));root.append(row)}
 if(!list.length)root.append(node('p','No hay sucursales registradas.'));
 if(isMaster||['owner','admin'].includes(memberships.find(m=>m.gym_id===activeGym.id)?.role)){
  const panel=node('section','','member-section');panel.append(node('h3','Usuarios y accesos'));
  const {data:members,error:membersError}=await db.rpc('fitos_list_gym_members',{g:activeGym.id});if(membersError)throw membersError;
  if(!members?.length)panel.append(node('p','No hay usuarios asignados.'));
  for(const member of members||[]){
   const r=node('div','','row');const d=node('div');d.append(node('strong',member.email||member.user_id),node('p',member.member_role+' · '+(member.enabled?'Activo':'Desactivado'),'small'));r.append(d);
   if(member.user_id!==auth.id){const action=button(member.enabled?'Desactivar acceso':'Reactivar acceso',async()=>{
    if(!confirm('¿Confirmar el cambio de acceso?'))return;
    action.disabled=true;try{const {error}=await db.rpc('fitos_set_member_access',{g:activeGym.id,member:member.user_id,allow_access:!member.enabled});if(error)throw error;notice('Acceso actualizado.');await loadOverview()}catch(err){action.disabled=false;notice(errorMessage(err))}
   });r.append(action)}panel.append(r);
  }root.append(panel);
 }

 if(isMaster||['owner','admin'].includes(memberships.find(m=>m.gym_id===activeGym.id)?.role)){
 const form=node('form');const input=node('input');input.required=true;input.maxLength=120;input.placeholder='Nombre de nueva sucursal';input.setAttribute('aria-label','Nombre de nueva sucursal');const add=node('button','Agregar sucursal');form.append(input,add);form.onsubmit=async e=>{e.preventDefault();try{const {error}=await db.from('fitos_branches').insert({gym_id:activeGym.id,name:input.value.trim()});if(error)throw error;input.value='';await loadOverview()}catch(err){notice(errorMessage(err))}};root.append(form);
 const invitation=node('form');invitation.append(node('h3','Invitar usuario'));
 const email=node('input');email.type='email';email.required=true;email.maxLength=254;email.placeholder='correo@ejemplo.com';email.setAttribute('aria-label','Correo a invitar');
 const role=node('select');role.setAttribute('aria-label','Rol del invitado');
 for(const option of ['athlete','trainer','admin',...(isMaster?['owner']:[])]){const item=node('option',option);item.value=option;role.append(item)}
 const branch=node('select');branch.setAttribute('aria-label','Sucursal del invitado');const empty=node('option','Sin sucursal');empty.value='';branch.append(empty);
 for(const item of list){const option=node('option',item.name);option.value=item.id;branch.append(option)}
 const send=node('button','Enviar invitación');send.type='submit';
 invitation.append(email,role,branch,send);
 invitation.onsubmit=async e=>{e.preventDefault();send.disabled=true;
 try{if(role.value==='trainer'&&!branch.value)throw Error('El entrenador debe tener sucursal asignada.');
 const {data,error}=await db.functions.invoke('fitos-invite',{body:{gym_id:activeGym.id,email:email.value.trim(),role:role.value,branch_id:branch.value||null}});
 if(error)throw error;
 if(!data?.ok)throw Error(data?.error||'No se pudo enviar la invitación.');
 email.value='';notice('Invitación enviada.');await refresh();
 }catch(err){notice(errorMessage(err))}finally{send.disabled=false}};
 root.append(invitation)}
}
async function loadMeasurements(){
 const root=$('measurementRows');root.replaceChildren();
 const rows=await request('fitos_measurements','measured_on,weight_kg,waist_cm,body_fat_pct,origin,athlete_id',[['gym_id',activeGym.id]]);
 rows.sort((a,b)=>b.measured_on.localeCompare(a.measured_on));
 if(!rows.length)root.append(node('p','Sin mediciones disponibles.'));
 for(const r of rows.slice(0,100)){const row=node('div','','row');row.append(node('span',r.measured_on+' · '+(r.weight_kg??'—')+' kg · '+r.origin));root.append(row)}
 $('measureDate').max=localDate();$('measureDate').value=$('measureDate').max;
}
async function addMeasurement(e){
 e.preventDefault();if(!activeGym||!['active','trial'].includes(activeGym.status))return;
 if(isMaster||memberships.find(m=>m.gym_id===activeGym.id)?.role!=='athlete')return notice('Solo el deportista puede registrar sus propias mediciones.');
 const date=$('measureDate').value,weight=Number($('measureWeight').value);
 if(!date||date>localDate()||!Number.isFinite(weight)||weight<20||weight>400)return notice('Revisa la fecha y el peso.');
 try{const {error}=await db.from('fitos_measurements').upsert({gym_id:activeGym.id,athlete_id:auth.id,measured_on:date,weight_kg:weight,origin:'manual'},{onConflict:'gym_id,athlete_id,measured_on'});if(error)throw error;$('measureWeight').value='';notice('Medición guardada.');await loadMeasurements()}catch(err){notice(errorMessage(err))}
}
async function loadPlans(){
 await renderTraining({db,gym:activeGym,auth,role:isMaster?'superadmin':memberships.find(m=>m.gym_id===activeGym.id)?.role||'athlete',root:$('planRows'),notify:notice});
}
async function paintMaster(){
 const root=$('masterGyms');root.replaceChildren();if(!isMaster)return;
 await renderMainDashboard({db,gyms,root,refresh,notify:notice});
 const settings=$('masterSettings');settings.replaceChildren();
 for(const g of gyms){const row=node('div','','row');const info=node('div');info.append(node('strong',g.name),node('p',g.slug+' · '+g.status+' · límite '+g.member_limit,'small'));row.append(info);
 const select=node('select');select.setAttribute('aria-label','Estado de '+g.name);
 for(const status of ['trial','active','suspended','cancelled']){const opt=node('option',status);opt.value=status;opt.selected=status===g.status;select.append(opt)}
 select.onchange=async()=>{const value=select.value;if(!confirm('¿Confirmar cambio de licencia de '+g.name+' a '+value+'?')){select.value=g.status;return}try{const {error}=await db.rpc('fitos_set_gym_status',{g:g.id,new_status:value});if(error)throw error;notice('Licencia actualizada.');await refresh()}catch(e){select.value=g.status;notice(errorMessage(e))}};
 row.append(select);
 const domainForm=node('form');const domainInput=node('input');domainInput.type='text';domainInput.required=true;domainInput.placeholder='sucursal.fitos.mx';domainInput.maxLength=253;domainInput.setAttribute('aria-label','Dominio para '+g.name);
 const addDomain=node('button','Vincular dominio');addDomain.type='submit';domainForm.append(domainInput,addDomain);
 domainForm.onsubmit=async event=>{event.preventDefault();const hostname=domainInput.value.trim().toLowerCase();
 if(!/^[a-z0-9.-]{4,253}$/.test(hostname)||!hostname.includes('.'))return notice('Dominio inválido.');
 try{const {error}=await db.from('fitos_domains').insert({gym_id:g.id,hostname,verified:false});if(error)throw error;domainInput.value='';notice('Dominio registrado. Configura y verifica DNS/HTTPS en Cloudflare antes de utilizarlo.')}catch(e){notice(errorMessage(e))}};
 const moduleBox=node('div','','module-controls');
 moduleBox.append(node('strong','Módulos activos'));
 for(const [key,label] of [['training','Entrenamiento'],['measurements','Mediciones corporales']]){
  const status=gymModules.find(m=>m.gym_id===g.id&&m.module_key===key);
  const lab=node('label');lab.className='module-toggle';const checkbox=node('input');checkbox.type='checkbox';checkbox.checked=status?.enabled===true;
  checkbox.setAttribute('aria-label',label+' de '+g.name);lab.append(checkbox,node('span',label));
  checkbox.onchange=async()=>{const enabled=checkbox.checked;checkbox.disabled=true;
   try{const {error}=await db.rpc('fitos_set_gym_module',{g:g.id,k:key,allow_access:enabled});if(error)throw error;notice('Módulo actualizado.');await refresh()}
   catch(err){checkbox.checked=!enabled;notice(errorMessage(err))}finally{checkbox.disabled=false}
  };moduleBox.append(lab);
 }
 const domainBox=node('div','','client-settings');domainBox.append(row,moduleBox,domainForm);settings.append(domainBox)}
}
async function createGym(e){
 e.preventDefault();if(!isMaster)return;
 const name=$('gymName').value.trim(),slug=$('gymSlug').value.trim().toLowerCase();
 if(name.length<2||!/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug))return notice('Nombre o identificador inválido.');
 try{const {error}=await db.from('fitos_gyms').insert({name,slug});if(error)throw error;$('newGym').reset();notice('Gimnasio creado; asigna un administrador mediante el flujo seguro de invitaciones.');await refresh()}catch(e){notice(errorMessage(e))}
}
start().catch(e=>notice(errorMessage(e)));
