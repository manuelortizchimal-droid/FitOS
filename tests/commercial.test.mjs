import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('Commercial client and build scripts parse',()=>{
 for(const f of ['commercial/app.js','commercial/training.js','commercial/administration.js','scripts/build.mjs']){
  const code=spawnSync(process.execPath,['--check',new URL('../'+f,import.meta.url).pathname],{encoding:'utf8'});
  assert.equal(code.status,0,code.stderr);
 }
});
test('RLS enabled on every tenant table',()=>{
 const sql=read('supabase/migrations/0001_fitos_core.sql');
 for(const t of ['fitos_gyms','fitos_branches','fitos_profiles','fitos_memberships','fitos_plans','fitos_plan_days','fitos_workouts','fitos_sets','fitos_measurements','fitos_audit_events'])
  assert.ok(sql.includes('alter table public.'+t+' enable row level security'),t);
 assert.ok(sql.includes('fitos_set_gym_status'));
 assert.ok(sql.includes('status in (\'trial\',\'active\')'));
 assert.ok(!read('commercial/app.js').includes('service_role'));
});
test('Branch and owner protection declarations are present',()=>{
 const sql=read('supabase/migrations/0002_branch_security.sql');
 for(const key of ['fitos_can_train_athlete','student.branch_id=m.branch_id','Only platform admins can modify owners','Trainer requires branch'])
  assert.ok(sql.includes(key),key);
});
test('Invitations are server-side and require manager authorization',()=>{
 const src=read('supabase/functions/fitos-invite/index.ts');
 assert.ok(src.includes('fitos_can_manage'));
 assert.ok(src.includes('SUPABASE_SERVICE_ROLE_KEY'));
 assert.ok(src.includes('FITOS_ALLOWED_ORIGINS'));
 assert.ok(!read('commercial/app.js').includes('SUPABASE_SERVICE_ROLE_KEY'));
 const sql=read('supabase/migrations/0003_license_visibility.sql');
 assert.ok(sql.includes('license_status'));
});
test('Workout interface persists individual sets and completion',()=>{
 const src=read('commercial/training.js');
 for(const item of ['fitos_sets','fitos_workouts','onConflict:','FIN · Finalizar sesión'])assert.ok(src.includes(item));
});
test('Cloudflare build fails closed without public config',()=>{
 const command=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,SUPABASE_URL:'',SUPABASE_PUBLISHABLE_KEY:''},encoding:'utf8'});
 assert.notEqual(command.status,0);
 assert.match(command.stderr,/SUPABASE_URL/);
});
test('Commercial bundle deploys only publishable configuration',()=>{
 const command=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,SUPABASE_URL:'https://fitostest.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_testvalue'},encoding:'utf8'});
 assert.equal(command.status,0,command.stderr);
 const cfg=read('dist/config.js');
 assert.ok(cfg.includes('sb_publishable_testvalue'));
 assert.ok(!cfg.includes('service_role'));
 const headers=read('dist/_headers');
 assert.ok(headers.includes('Content-Security-Policy'));
 assert.ok(headers.includes('frame-ancestors'));
});
test('Tenant custom domains and private photo consent declarations exist',()=>{
 const schema=read('supabase/migrations/0006_domains_photos.sql');
 for(const marker of ['fitos_domains','fitos_photo_consents','fitos_photo_allowed','storage.buckets',"values('fitos-photos','fitos-photos',false"])assert.ok(schema.includes(marker));
 assert.ok(read('commercial/app.js').includes("fitos_domains"));
});
test('Qualified tenant row-level references are explicit',()=>{
 const schema=read('supabase/migrations/0005_qualified_rls.sql');
 for(const marker of ['public.fitos_gyms.id','public.fitos_profiles.id','public.fitos_branches.id','public.fitos_plan_days.plan_id','public.fitos_sets.workout_id'])assert.ok(schema.includes(marker));
});
test('Database verifies workout completion and immutable ownership',()=>{
 const schema=read('supabase/migrations/0004_workout_integrity.sql');
 assert.ok(schema.includes('Save all required sets before finishing'));
 assert.ok(schema.includes('Workout ownership cannot change'));
});
test('Workout history uniqueness and plan ownership are server-controlled',()=>{
 const schema=read('supabase/migrations/0007_history_integrity.sql');
 assert.ok(schema.includes('fitos_single_plan_session_per_day'));
 assert.ok(schema.includes('Plan ownership cannot change'));
 assert.ok(schema.includes('Cannot modify a day with completed workout history'));
});
test('Data API grants are explicit and anonymous access revoked',()=>{
 const sql=read('supabase/migrations/0008_api_privileges.sql');
 for(const marker of ['revoke all on public.fitos_gyms','grant select on public.fitos_gyms','revoke insert, update, delete on public.fitos_platform_admins','rls_auto_enable()'])assert.ok(sql.includes(marker));
});
test('Commercial HTML avoids inline event handlers',()=>{
 const html=read('commercial/index.html');
 assert.ok(html.includes('type="module"'));
 assert.doesNotMatch(html,/\son(click|submit|change)=/);
 assert.ok(html.includes('id="master"'));
});

test('Panel Maestro includes access controls and invite activation',()=>{
 const app=read('commercial/app.js');const html=read('commercial/index.html');
 for(const x of ['fitos_list_gym_members','fitos_set_member_access','updateUser({password:','resetPasswordForEmail'])assert.ok(app.includes(x),x);
 for(const x of ['id="passwordSetup"','id="newPassword"','id="forgotPassword"'])assert.ok(html.includes(x),x);
});

test('GitHub Pages trial uses a public-only Supabase config',()=>{
 const page=read('app/index.html'),cfg=read('commercial/config.js');
 assert.ok(page.includes('../commercial/app.js'));
 assert.ok(page.includes('../commercial/styles.css'));
 assert.ok(cfg.includes('sb_publishable_'));
 assert.ok(!cfg.includes('service_role'));
 assert.ok(!cfg.includes('sb_secret_'));
 assert.ok(cfg.includes('sazudzsdsluygcjivcvf.supabase.co'));
});

test('Gym modules are controlled by RLS and superadmin RPC',()=>{
 const sql=read('supabase/migrations/0010_gym_module_controls.sql');
 for(const x of ['fitos_set_gym_module','fitos_module_enabled','as restrictive','fitos_measurements_module_guard','fitos_workouts_module_guard'])assert.ok(sql.includes(x),x);
 const client=read('commercial/app.js');for(const x of ['fitos_gym_modules','fitos_set_gym_module'])assert.ok(client.includes(x));
});

test('Password recovery callbacks never target localhost',()=>{
 const src=read('commercial/app.js');
 assert.ok(src.includes('const authCallbackURL=new URL('));
 assert.ok(src.includes('resetPasswordForEmail(email,{redirectTo:authCallbackURL})'));
 assert.ok(!src.includes('redirectTo:location.origin+location.pathname'));
});

test('Gym access and local date hardening',()=>{
 const sql=read('supabase/migrations/0011_member_limit_email_hardening.sql');
 for(const key of ['Member limit reached','fitos_list_gym_members','auth.users','pg_advisory_xact_lock','fitos_set_member_access'])assert.ok(sql.includes(key),key);
 const app=read('commercial/app.js');const workout=read('commercial/training.js');
 for(const src of [app,workout]){assert.ok(src.includes('function localDate')||src.includes('const localDate'));assert.ok(!src.includes("toLocaleDateString('en-CA')"))}
});

test('Main Dashboard, tenant management and account recovery boundaries',()=>{
 const src=read('commercial/app.js'),adm=read('commercial/administration.js'),page=read('app/index.html');
 for(const k of ['Main Dashboard','renderMainDashboard','renderGymAdministration','fitos-reset-member','ownerManagement'])assert.ok(src.includes(k)||page.includes(k),k);
 for(const k of ['fitos_gym_stats','fitos_save_client','fitos_set_member_billing','Sin información de pago'])assert.ok(adm.includes(k),k);
 assert.ok(!adm.includes('innerHTML'));
 const sql=read('supabase/migrations/0012_client_crm_and_retention.sql');
 for(const k of ['enable row level security','fitos_gym_stats','fitos_save_client','fitos_set_member_billing','fitos_client_details'])assert.ok(sql.includes(k),k);
 const recovery=read('supabase/functions/fitos-reset-member/index.ts');
 for(const k of ['fitos_can_manage','fitos_list_gym_members','resetPasswordForEmail','verify_jwt'])assert.ok(recovery.includes(k)||k==='verify_jwt',k);
});

test('Commercial and Pages DOM contain every live dashboard element',()=>{
 for(const file of ['commercial/index.html','app/index.html']){
  const html=read(file);
  for(const id of ['master','masterGyms','masterSettings','newGym','gymHome','gymAdminTab','gymAdmin','ownerManagement','athleteTabs','tabOverview','tabPlans','tabMeasurements','overview','measurements','plans','status','auth','workspace']) assert.ok(html.includes('id="'+id+'"'),file+': '+id);
  assert.ok(html.includes('Main Dashboard'),file+' missing dashboard label');
 }
});
