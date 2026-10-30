// FitOS: server-side invitation endpoint. Deploy with Supabase Functions, JWT verification required.
import { createClient } from 'npm:@supabase/supabase-js@2.49.10';
const url=Deno.env.get('SUPABASE_URL')||'';
const anon=Deno.env.get('SUPABASE_ANON_KEY')||'';
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
// The public GitHub Pages testing origin is allowed explicitly; production origins remain secret-configured.
const trialOrigin='https://manuelortizchimal-droid.github.io';
const allowed=new Set([trialOrigin,...(Deno.env.get('FITOS_ALLOWED_ORIGINS')||'').split(',').map(s=>s.trim()).filter(Boolean)]);
const redirect=Deno.env.get('FITOS_INVITE_REDIRECT_URL')||'https://manuelortizchimal-droid.github.io/FitOS/app/';
const json=(body,status,origin)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','vary':'Origin','access-control-allow-origin':origin,'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'authorization, apikey, content-type, x-client-info'}});
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 if(!allowed.has(origin))return new Response('Origin not permitted',{status:403});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'vary':'Origin','access-control-allow-origin':origin,'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'authorization, apikey, content-type, x-client-info'}});
 if(req.method!=='POST')return json({error:'Method not allowed'},405,origin);
 if(!url||!anon||!service||!redirect)return json({error:'Server not configured'},503,origin);
 const header=req.headers.get('authorization')||'';
 if(!/^Bearer\s+\S+$/.test(header))return json({error:'Unauthorized'},401,origin);
 try{
  const body=await req.json();
  const email=String(body.email||'').trim().toLowerCase();
  const gym_id=String(body.gym_id||'');
  const branch_id=body.branch_id===null||body.branch_id===undefined?null:String(body.branch_id);
  const role=String(body.role||'athlete');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254
    ||!/^[0-9a-f-]{36}$/i.test(gym_id)||(branch_id!==null&&!/^[0-9a-f-]{36}$/i.test(branch_id))
    ||!['owner','admin','trainer','athlete'].includes(role))
    return json({error:'Invalid invitation'},400,origin);
  const acting=createClient(url,anon,{global:{headers:{Authorization:header}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await acting.auth.getUser(header.slice(7).trim());
  if(authError||!user)return json({error:'Unauthorized'},401,origin);
  const {data:authorized,error:roleError}=await acting.rpc('fitos_can_manage',{g:gym_id});
  if(roleError||authorized!==true)return json({error:'Forbidden'},403,origin);
  if(role==='owner'){
   const {data:master}=await acting.rpc('fitos_is_platform_admin');
   if(master!==true)return json({error:'Forbidden'},403,origin);
  }
  // Reject invalid requests before sending a non-transactional Auth email.
  const {data:gym,error:gymError}=await acting.from('fitos_gyms').select('status,member_limit').eq('id',gym_id).single();
  if(gymError||!gym||!['active','trial'].includes(gym.status))return json({error:'Gym is not accepting invitations'},409,origin);
  if(role==='trainer'&&!branch_id)return json({error:'Trainer requires branch'},400,origin);
  if(branch_id){
   const {data:foundBranch,error:branchError}=await acting.from('fitos_branches').select('id').eq('id',branch_id).eq('gym_id',gym_id).maybeSingle();
   if(branchError||!foundBranch)return json({error:'Invalid gym branch'},400,origin);
  }
  const {count,error:seatError}=await acting.from('fitos_memberships').select('id',{head:true,count:'exact'}).eq('gym_id',gym_id).eq('enabled',true);
  if(seatError||count===null)return json({error:'Unable to verify seat capacity'},503,origin);
  if(count>=gym.member_limit)return json({error:'Gym member limit reached'},409,origin);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:invited,error:inviteError}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:redirect});
  if(inviteError||!invited.user){console.error('FitOS invitation failed',inviteError?.code);return json({error:'Invitation could not be created'},409,origin)}
  const {error:memberError}=await acting.rpc('fitos_attach_member',{g:gym_id,member:invited.user.id,desired_role:role,branch:branch_id});
  if(memberError){console.error('FitOS membership attachment failed',memberError.code);return json({error:'Invitation created, but membership needs administrator review'},409,origin)}
  return json({ok:true},200,origin);
 }catch(err){console.error('FitOS invitation request failed',err instanceof Error?err.name:'unknown');return json({error:'Request failed'},400,origin)}
});
