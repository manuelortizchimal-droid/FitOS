import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('Commercial client and build scripts parse',()=>{
 for(const f of ['commercial/app.js','commercial/training.js','scripts/build.mjs']){
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
test('Commercial HTML avoids inline event handlers',()=>{
 const html=read('commercial/index.html');
 assert.ok(html.includes('type="module"'));
 assert.doesNotMatch(html,/\son(click|submit|change)=/);
 assert.ok(html.includes('id="master"'));
});
