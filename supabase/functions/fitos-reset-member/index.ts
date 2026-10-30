import { createClient } from 'npm:@supabase/supabase-js@2.49.10';
const url=Deno.env.get('SUPABASE_URL')||'';
const anon=Deno.env.get('SUPABASE_ANON_KEY')||'';
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const originAllowed=new Set(['https://manuelortizchimal-droid.github.io',...(Deno.env.get('FITOS_ALLOWED_ORIGINS')||'').split(',').map(s=>s.trim()).filter(Boolean)]);
const redirect=Deno.env.get('FITOS_INVITE_REDIRECT_URL')||'https://manuelortizchimal-droid.github.io/FitOS/app/';
const headers=o=>({'content-type':'application/json','access-control-allow-origin':o,'access-control-allow-headers':'authorization, apikey, content-type, x-client-info','access-control-allow-methods':'POST, OPTIONS','vary':'Origin'});
const reply=(body,status,o)=>new Response(JSON.stringify(body),{status,headers:headers(o)});
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 if(!originAllowed.has(origin))return new Response('Origin not allowed',{status:403});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:headers(origin)});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405,origin);
 if(!url||!anon||!service)return reply({error:'Not configured'},503,origin);
 const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/,'');
 if(!token)return reply({error:'Unauthorized'},401,origin);
 try{
  const body=await req.json();
  const gym=String(body.gym_id||''),member=String(body.user_id||'');
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(!uuid.test(gym)||!uuid.test(member))return reply({error:'Invalid user'},400,origin);
  const acting=createClient(url,anon,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await acting.auth.getUser(token);
  if(authError||!user)return reply({error:'Unauthorized'},401,origin);
  const {data:canManage,error:permissionError}=await acting.rpc('fitos_can_manage',{g:gym});
  if(permissionError||canManage!==true)return reply({error:'Forbidden'},403,origin);
  const {data:rows,error:membersError}=await acting.rpc('fitos_list_gym_members',{g:gym});
  if(membersError||!rows?.some(m=>m.user_id===member&&m.member_role==='athlete'))return reply({error:'Deportista no encontrado'},404,origin);
  const target=rows.find(m=>m.user_id===member);
  const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error:sendError}=await client.auth.resetPasswordForEmail(target.email,{redirectTo:redirect});
  if(sendError){if(sendError.status===429)return reply({error:'Límite de correos alcanzado. Intenta más tarde.'},429,origin);return reply({error:'No se pudo enviar el correo.'},503,origin)}
  return reply({ok:true},200,origin);
 }catch(e){console.error('fitos-reset-member error',e instanceof Error?e.name:'unknown');return reply({error:'Solicitud inválida'},400,origin)}
});
