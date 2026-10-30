'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');

const files=['index.html','import.html','measure-import.html'];
for(const name of files){
 const html=fs.readFileSync(name,'utf8');
 assert.match(html,/<!doctype html>/i,name+' lacks doctype');
 assert.match(html,/<html lang="es">/,name+' lacks Spanish language');
 const script=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(script,name+' lacks JS');
 new vm.Script(script[1],{filename:name});
 console.log('PASS JS parse:',name);
}

const html=fs.readFileSync('index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const between=(start,end)=>{
 const from=script.indexOf(start);
 const to=script.indexOf(end,from+start.length);
 assert.ok(from>=0&&to>from,'missing function span '+start);
 return script.slice(from,to);
};
const dayOrdinal=Function(between('function dayOrdinal(day)','function streakFor(')+'return dayOrdinal')();
const todayPlanIndex=Function('dayOrdinal',between('function todayPlanIndex(','function athleteHome()')+'return todayPlanIndex')(dayOrdinal);
const dateOf=(start,n)=>{const d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
for(let count=1;count<=7;count++){
 const p={start:'2026-10-26',end:'2026-12-01',sessions:Array.from({length:count},(_,i)=>({title:'Día '+(i+1)}))};
 const scheduled=Array.from({length:7},(_,day)=>todayPlanIndex(p,dateOf(p.start,day)));
 const expected=Array.from({length:7},(_,day)=>Array.from({length:count},(_,i)=>Math.floor(i*7/count)).indexOf(day));
 assert.deepEqual(scheduled,expected,'bad session calendar for '+count+' days');
 assert.equal(scheduled.filter(i=>i>=0).length,count);
 assert.equal(todayPlanIndex(p,'2026-10-25'),-1);
 assert.equal(todayPlanIndex(p,'2026-12-02'),-1);
 assert.equal(todayPlanIndex(p,'2026-11-02'),0);
}
console.log('PASS: weekly session distribution 1..7 days, recurrence, rest and expiry');

const streakFor=Function('db','dayOrdinal','now',
 between('function streakFor(','const CONSTANCY_LEVELS=')+'return streakFor')(
 {completedWorkouts:[{userId:'a',date:'2026-10-28'},{userId:'a',date:'2026-10-29'},{userId:'a',date:'2026-10-30'},{userId:'a',date:'2026-10-30'},{userId:'b',date:'2026-10-20'}]},
 dayOrdinal,()=> '2026-10-30'
);
assert.equal(streakFor('a'),3,'duplicate completion date should count once');
assert.equal(streakFor('b'),0,'other athlete must remain isolated');
console.log('PASS: streak deduplication and user isolation');

const constants=between('const CONSTANCY_LEVELS=','function completionProgress(');
const level=Function(constants+'return constancyLevel')();
for(const [days,expected] of [[0,1],[2,1],[3,2],[6,3],[24,9],[27,10],[200,10]]){
 assert.equal(level(days).level,expected,'level for '+days);
 assert.ok(level(days).progress>=0&&level(days).progress<=100);
}
console.log('PASS: constancy levels 1..10 and cap');

for(const required of ['id="dashboardTodayTab"','id="dashboardWeekTab"','id="dashboardStart"','function trainingHistoryTable()','constancyMarkup(streak)','<dt>RIR (repeticiones en reserva)</dt>'])assert.ok(html.includes(required),required);
assert.ok(!html.includes('¿Qué significa RIR?'),'RIR glossary duplicated');
assert.ok(!html.includes("document.querySelectorAll('[data-save-set]')"),'legacy set event handler');
assert.ok(!html.includes("if($('#timerToggle'))"),'legacy timer event handler');
assert.ok(html.includes("escapeHTML(ex.equipment)"),'exercise equipment not HTML encoded');
assert.ok(html.includes("escapeHTML(s.date)"),'history dates not HTML encoded');
assert.ok(html.includes("FitOS v2.0 · Interfaz auditada"),'version mismatch');
assert.match(html,/\['home','Inicio'\],\['training','Rutina'\],\['measures','Medidas'\],\['profile','Perfil'\]/);
console.log('PASS: navigation, dashboard, glossary, output encoding and dead-handler cleanup');

for(const name of ['import.html','measure-import.html']){
 const source=fs.readFileSync(name,'utf8');
 assert.ok(source.includes('structuredClone(db)'),'rollback missing '+name);
 assert.ok(source.includes('localStorage.setItem(STORE'),'demo persistence missing '+name);
 assert.ok(source.includes('file.size>10*1024*1024'),'file size limit missing '+name);
}
console.log('PASS: import structure and file-size restrictions');
console.log('AUDIT TESTS COMPLETED');
