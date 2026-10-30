// FitOS administrative workspaces. All user-entered values are textContent, never HTML.
const text=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value??'');if(cls)n.className=cls;return n};
const field=(label,value='',type='text')=>{const l=text('label',label),i=text(type==='textarea'?'textarea':'input');if(type!=='textarea')i.type=type;i.value=value||'';l.append(i);return {label:l,input:i}};
const btn=(title,onClick,cls='outline')=>{const b=text('button',title,cls);b.type='button';b.onclick=onClick;return b};
const roleName={owner:'Titular',admin:'Administrador',trainer:'Entrenador',athlete:'Deportista'};
const statusName={active:'Activo',trial:'En prueba',suspended:'Suspendido',cancelled:'Cancelado'};
async function stats(db,g){const {data,error}=await db.rpc('fitos_gym_stats',{g});if(error)throw error;return data}
function metrics(node,values){const grid=text('div',undefined,'metric-grid');for(const [label,value] of values){const card=text('div',undefined,'metric');card.append(text('small',label),text('strong',value));grid.append(card)}node.append(grid)}
function error(e){return e?.message||'No fue posible completar la operación.'}
export async function renderMainDashboard({db,gyms,root,refresh,notify}){
 root.replaceChildren();
 const head=text('div',undefined,'heading');head.append(text('h2','Resumen de operación'),text('span','Gestión de clientes · FitOS','small'));root.append(head);
 const detailRes=await db.from('fitos_client_details').select('gym_id,legal_contact,phone,email,notes');
 if(detailRes.error)throw detailRes.error;
 const details=new Map((detailRes.data||[]).map(x=>[x.gym_id,x]));
 const statPairs=await Promise.all(gyms.map(async g=>[g.id,await stats(db,g.id)]));
 const totals=new Map(statPairs),sum=k=>statPairs.reduce((n,[,s])=>n+Number(s?.[k]||0),0);
 metrics(root,[['Gimnasios',gyms.length],['Licencias activas',gyms.filter(g=>g.status==='active').length],['Usuarios activos',sum('active')],['Usuarios dados de baja',sum('disabled')],['Renovaciones próximas',sum('renewing_30d')],['Vencidos registrados',sum('overdue')]]);
 const note=text('p','Los indicadores de mensualidades usan únicamente fechas y estados registrados por el gimnasio; no verifican cobros bancarios.','small');root.append(note);
 const heading=text('h3','Clientes registrados');root.append(heading);
 const body=text('div',undefined,'client-grid');root.append(body);
 for(const g of gyms){
  const d=details.get(g.id)||{},s=totals.get(g.id)||{};
  const panel=text('section',undefined,'client-card');
  const top=text('div',undefined,'heading');top.append(text('h3',g.name),text('span',statusName[g.status]||g.status,'tag'));panel.append(top);
  panel.append(text('p','Titular: '+(d.legal_contact||'Sin registrar'),'small'));
  panel.append(text('p','Desde: '+(g.created_at?new Date(g.created_at).toLocaleDateString('es-MX'):'Sin fecha'),'small'));
  panel.append(text('p',`Usuarios: ${s.total||0} · Activos: ${s.active||0} · Bajas: ${s.disabled||0}`,'small'));
  const controls=text('div',undefined,'actions');
  controls.append(btn('Ver',()=>viewClient({db,g,d,s,notify}).catch(e=>notify(error(e))),'primary'));
  controls.append(btn('Editar',()=>editClient({db,g,d,root:panel,refresh,notify})));
  panel.append(controls);body.append(panel);
 }
 if(!gyms.length)body.append(text('p','Todavía no hay gimnasios registrados.'));
}
async function viewClient({db,g,d,s,notify}){
 const old=document.getElementById('fitos-client-profile');
 if(old)old.remove();
 const dialog=text('dialog',undefined,'report-dialog client-dialog');dialog.id='fitos-client-profile';
 const head=text('div',undefined,'report-heading');
 head.append(text('h2','Perfil del cliente'),text('span',statusName[g.status]||g.status,'tag'));
 dialog.append(head,text('h3',g.name));
 const details=text('section',undefined,'report-section');
 for(const [label,value] of [['Titular',d.legal_contact],['Teléfono',d.phone],['Correo electrónico',d.email],['Cliente desde',g.created_at?new Date(g.created_at).toLocaleDateString('es-MX'):''],['Identificador',g.slug]]){
  const line=text('p',undefined,'profile-detail');line.append(text('strong',label+': '),text('span',value||'Sin registrar'));details.append(line);
 }
 dialog.append(details,text('h4','Indicadores de gestión'));
 metrics(dialog,[['Usuarios registrados',s.total||0],['Usuarios activos',s.active||0],['Accesos desactivados',s.disabled||0],['Renovaciones en 30 días',s.renewing_30d||0],['Mensualidades vencidas',s.overdue||0],['Sin datos de pago',s.unknown_billing||0]]);
 const notes=text('section',undefined,'report-section');notes.append(text('h4','Notas del cliente'),text('p',d.notes||'Sin notas registradas.'));dialog.append(notes);
 const reportSection=text('section',undefined,'report-section');reportSection.append(text('h4','Reportes'));
 reportSection.append(text('p','Revisa los indicadores de actividad, acceso y renovaciones registrados. Puedes generar un informe imprimible para seguimiento y toma de decisiones.','small'));
 reportSection.append(btn('Ver reporte de gestión',()=>{dialog.close();reportClient({g,d,s,notify})},'primary'));
 dialog.append(reportSection);
 const inviteSection=text('section',undefined,'report-section');
 inviteSection.append(text('h4','Invitar usuario'));
 inviteSection.append(text('p','Introduce el correo electrónico y selecciona el rol y la sucursal. FitOS enviará un enlace de activación personal.','small'));
 const form=text('form',undefined,'invite-form');
 const efield=field('Correo electrónico','','email');efield.input.required=true;efield.input.maxLength=254;efield.input.autocomplete='off';
 const roleLabel=text('label','Rol'),roleSelect=text('select');
 for(const [key,label] of [['athlete','Deportista'],['trainer','Entrenador'],['admin','Administrador'],['owner','Titular del gimnasio']]){const option=text('option',label);option.value=key;roleSelect.append(option)}
 roleLabel.append(roleSelect);
 const branchLabel=text('label','Sucursal'),branchSelect=text('select');
 const noBranch=text('option','Sin sucursal');noBranch.value='';branchSelect.append(noBranch);
 const {data:branches,error:branchError}=await db.from('fitos_branches').select('id,name').eq('gym_id',g.id);
 if(branchError)throw branchError;
 for(const branch of branches||[]){const opt=text('option',branch.name);opt.value=branch.id;branchSelect.append(opt)}
 branchLabel.append(branchSelect);
 const submit=text('button','Enviar invitación');submit.type='submit';
 form.append(efield.label,roleLabel,branchLabel,submit);
 form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;try{
  if(roleSelect.value==='trainer'&&!branchSelect.value)throw Error('Selecciona una sucursal para el entrenador.');
  const {data,error}=await db.functions.invoke('fitos-invite',{body:{gym_id:g.id,email:efield.input.value.trim(),role:roleSelect.value,branch_id:branchSelect.value||null}});
  if(error)throw error;if(!data?.ok)throw Error(data?.error||'No fue posible enviar la invitación.');
  efield.input.value='';notify('Invitación solicitada correctamente. Verifica que el correo se haya entregado.');
 }catch(err){notify(error(err))}finally{submit.disabled=false}};
 inviteSection.append(form);
 dialog.append(inviteSection);
 const actions=text('div',undefined,'actions');actions.append(btn('Cerrar',()=>dialog.close()));dialog.append(actions);
 dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();
}
function editClient({db,g,d,root,refresh,notify}){
 const previous=root.querySelector('.client-edit');if(previous){previous.remove();return}
 const form=text('form',undefined,'client-edit');
 const company=field('Nombre del negocio',g.name),owner=field('Titular',d.legal_contact),phone=field('Teléfono',d.phone,'tel'),email=field('Correo electrónico',d.email,'email'),notes=field('Notas de gestión',d.notes,'textarea');
 for(const f of [company,owner,phone,email,notes])form.append(f.label);
 company.input.required=true;company.input.maxLength=140;
 owner.input.maxLength=140;phone.input.maxLength=40;email.input.maxLength=254;notes.input.maxLength=8000;notes.input.rows=4;
 const save=text('button','Guardar cambios');save.type='submit';form.append(save);
 form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{
  const {error}=await db.rpc('fitos_save_client',{g:g.id,company_name:company.input.value,contact_name:owner.input.value,contact_phone:phone.input.value,contact_email:email.input.value,client_notes:notes.input.value});
  if(error)throw error;notify('Cliente actualizado.');await refresh();
 }catch(err){notify(error(err));save.disabled=false}};
 root.append(form);
}
function reportClient({g,d,s,notify}){
 const existing=document.getElementById('fitos-management-report');
 if(existing)existing.remove();
 const dialog=text('dialog',undefined,'report-dialog');dialog.id='fitos-management-report';
 const head=text('div',undefined,'report-heading');head.append(text('h2','FitOS · Informe de gestión'),text('span',new Date().toLocaleDateString('es-MX'),'small'));
 dialog.append(head,text('h3',g.name),text('p','Titular: '+(d.legal_contact||'No registrado')+' · Licencia: '+(statusName[g.status]||g.status),'small'));
 metrics(dialog,[['Usuarios registrados',s.total||0],['Activos',s.active||0],['Accesos desactivados',s.disabled||0],['Renovaciones en 30 días',s.renewing_30d||0],['Mensualidades vencidas',s.overdue||0],['Sin información de pago',s.unknown_billing||0]]);
 const alerts=text('section',undefined,'report-section');alerts.append(text('h4','Puntos de atención'));
 if(Number(s.overdue||0)>0)alerts.append(text('p','Revisar las mensualidades vencidas registradas con el gimnasio.'));
 if(Number(s.unknown_billing||0)>0)alerts.append(text('p','Completar las fechas y estados de pago faltantes para evaluar retención.'));
 if(Number(s.disabled||0)>0)alerts.append(text('p','Examinar los motivos de desactivación para identificar posibles oportunidades de recuperación.'));
 if(!alerts.querySelector('p'))alerts.append(text('p','Sin alertas detectadas en los registros actuales.'));
 dialog.append(alerts);
 const notes=text('section',undefined,'report-section');notes.append(text('h4','Notas del cliente'),text('p',d.notes||'Sin notas registradas.'));dialog.append(notes);
 dialog.append(text('p','Indicadores obtenidos de registros administrativos; no comprueban pagos bancarios ni permiten deducir automáticamente la tasa real de cancelación.','small'));
 const controls=text('div',undefined,'actions report-actions');
 controls.append(btn('Imprimir / Guardar PDF',()=>window.print(),''));
 controls.append(btn('Cerrar',()=>dialog.close()));
 dialog.append(controls);
 dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();notify('Informe de gestión preparado.');
}
export async function renderGymAdministration({db,g,root,notify,resetAccount}){
 root.replaceChildren();
 const head=text('div',undefined,'heading');head.append(text('h3','Administración del gimnasio'),text('span',g.name,'small'));root.append(head);
 const s=await stats(db,g.id);
 metrics(root,[['Usuarios totales',s.total||0],['Usuarios activos',s.active||0],['Dados de baja',s.disabled||0],['Renuevan en 30 días',s.renewing_30d||0],['Vencidos registrados',s.overdue||0],['Sin datos de pago',s.unknown_billing||0]]);
 root.append(text('p','Las fechas de renovación son registros administrativos, no cargos procesados automáticamente.','small'));
 const result=await db.rpc('fitos_list_gym_members',{g:g.id});if(result.error)throw result.error;
 const billing=await db.from('fitos_member_billing').select('user_id,paid_through,billing_status').eq('gym_id',g.id);if(billing.error)throw billing.error;
 const map=new Map((billing.data||[]).map(x=>[x.user_id,x]));
 root.append(text('h4','Seguimiento de deportistas'));
 for(const m of result.data||[]){
  if(m.member_role!=='athlete')continue;
  const b=map.get(m.user_id)||{};
  const section=text('div',undefined,'member-account');
  section.append(text('strong',m.email||m.user_id));
  section.append(text('p',(m.enabled?'Activo':'Sin acceso')+' · '+(b.billing_status==='paid'?'Pago registrado':b.billing_status==='pending'?'Pendiente':b.billing_status==='cancelled'?'Cancelado':'Sin información de pago'),'small'));
  const form=text('form',undefined,'inline-form');
  const due=field('Pagado hasta',b.paid_through||'','date');
  const label=text('label','Estado de mensualidad'),select=text('select');
  for(const [k,v] of [['unknown','Sin información'],['paid','Pagado'],['pending','Pendiente'],['cancelled','Cancelado']]){const o=text('option',v);o.value=k;o.selected=k===(b.billing_status||'unknown');select.append(o)}
  label.append(select);const save=text('button','Guardar mensualidad');save.type='submit';
  form.append(due.label,label,save);
  form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{const {error}=await db.rpc('fitos_set_member_billing',{g:g.id,member:m.user_id,new_paid_through:due.input.value||null,new_status:select.value});if(error)throw error;notify('Mensualidad actualizada.');}catch(err){notify(error(err))}finally{save.disabled=false}};
  section.append(form);
  section.append(btn('Enviar recuperación de contraseña',()=>resetAccount(m.user_id)));
  root.append(section);
 }
 if(!(result.data||[]).some(m=>m.member_role==='athlete'))root.append(text('p','Aún no hay deportistas registrados.'));
}
