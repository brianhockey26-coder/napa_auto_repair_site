import test from 'node:test';
import assert from 'node:assert/strict';
import { assess } from '../src/assets/repair-helper/engine.js';
import { matchReply } from '../src/assets/repair-helper/chat.js';
import { locales } from '../src/assets/repair-helper/locales.js';
import { buildAdvisorBrief } from '../src/assets/repair-helper/advisor.js';

test('braking vibration identifies rotor variation with evidence and an inspection plan',()=>{
 const r=assess({topics:['brakes'],answers:{safety:'none',timing:'now',brakes:'vibrate',vibrationWhen:'braking',vibrationWhere:'steering'}});
 assert.equal(r.possibilities[0].id,'rotors');
 assert.ok(r.possibilities[0].evidence.includes('brakes'));
 for(const locale of Object.values(locales))assert.ok(locale.causes.rotors.check);
});
test('highway vibration identifies wheel balance ahead of brake causes',()=>{
 const r=assess({topics:['tires'],answers:{tires:'speed',vibrationWhen:'speed',onset:'work'}});
 assert.equal(r.possibilities[0].id,'balance');
 assert.ok(!r.possibilities.some(p=>p.id==='rotors'));
});
test('rapid clicks and dim dashboard prioritize weak battery or poor connections',()=>{
 const r=assess({topics:['start'],answers:{start:'click',startingClick:'rapid',electricalClue:'dim'}});
 assert.equal(r.possibilities[0].id,'battery');
});
test('single click with normal lights makes starter circuit a stronger fit',()=>{
 const r=assess({topics:['start'],answers:{start:'click',startingClick:'single',electricalClue:'normal'}});
 assert.equal(r.possibilities[0].id,'starter');
});
test('lean code and idle symptoms prioritize intake or air-metering issue',()=>{
 const r=assess({topics:['engine'],answers:{engine:'idle',engineCode:'lean',roughWhen:'idle'}});
 assert.equal(r.possibilities[0].id,'airLeak');
});
test('overheating mainly at idle points to fan or airflow checks',()=>{
 const r=assess({topics:['heat'],answers:{heat:'hot',heatWhen:'idle'}});
 assert.equal(r.possibilities[0].id,'coolingFan');assert.equal(r.level,3);
});
test('weak airflow points to cabin filter or blower checks',()=>{
 const r=assess({topics:['climate'],answers:{climate:'fan',airflow:'weak'}});
 assert.ok(r.possibilities.some(p=>p.id==='cabinFilter'));
});
test('no known symptoms does not fabricate possible causes',()=>{
 assert.deepEqual(assess({topics:['brakes'],answers:{brakes:'unknown'}}).possibilities,[]);
});
test('branch questions go beyond a single brake choice',()=>{
 const q=assess({topics:['brakes'],answers:{safety:'none',timing:'now',brakes:'vibrate'}}).questions;
 assert.ok(q.includes('vibrationWhen'));assert.ok(q.includes('vibrationWhere'));
});
test('starting quiz changes after choosing normal cranking',()=>{
 const q=assess({topics:['start'],answers:{start:'crank'}}).questions;
 assert.ok(q.includes('engineCode'));assert.ok(!q.includes('startingClick'));
});
test('followup hazard cannot be ignored because it belongs to a detailed question',()=>{
 assert.equal(assess({topics:['leaks'],answers:{leaks:'small',leakType:'fuel'}}).level,3);
});
test('irrelevant followup answers cannot invent a cause',()=>{
 const r=assess({topics:['maintenance'],answers:{maintenance:'oil',startingClick:'rapid',electricalClue:'dim'}});
 assert.ok(!r.possibilities.some(p=>p.id==='battery'));
});
for(const [question,text,want] of [
 ['safety','none of those','none'],['brakes','it shakes only when I brake','vibrate'],
 ['brakes','my pedal feels soft','pedal'],['startingClick','a bunch of rapid clicks','rapid'],
 ['startingClick','solo un clic','single'],['startingClick','连续咔哒声','rapid'],
 ['timing','happened yesterday, not now','past'],['electricalClue','the dash goes dim','dim'],
 ['brakes','不确定','unknown'],['engineCode','P0301','misfire'],['engineCode','P0171','lean'],
 ['safety','I do not smell fuel','none'],['safety','No smoke but I smell gasoline','fuel'],
 ])test(`typed reply ${question}: ${text}`,()=>assert.equal(matchReply(question,text).answer,want));
test('ambiguous reply asks for clarification rather than choosing arbitrarily',()=>{
 assert.equal(matchReply('brakes','there is something wrong').answer,null);
});
test('asking about cause is answered as a chat intent rather than a quiz answer',()=>{
 assert.equal(matchReply('brakes','what might be causing this?').intent,'causes');
});
test('a negated ability to stop is a danger, not a negated hazard',()=>assert.equal(matchReply('safety','no puedo frenar').answer,'control'));
test('a recurring symptom is current despite earlier occurrence',()=>assert.equal(matchReply('timing','It happened yesterday and is happening now').answer,'now'));
test('offered evaporative leak code range is recognized',()=>assert.equal(matchReply('engineCode','P0455').answer,'evap'));
test('fuel leak confirmation does not suggest contradictory fluid types',()=>{
 const r=assess({topics:['leaks'],answers:{leaks:'small',leakType:'fuel',leakWhere:'front'}});
 assert.ok(!r.possibilities.some(p=>['oilLeak','coolantLeak','condensation'].includes(p.id)));
});
test('negated symptom is clarified rather than confirmed',()=>assert.equal(matchReply('brakes','the brakes are not grinding').answer,null));
test('idle-only vibration excludes brake-disc hypothesis',()=>{
 const r=assess({topics:['brakes'],answers:{brakes:'vibrate',vibrationWhen:'idle'}});
 assert.ok(!r.possibilities.some(p=>p.id==='rotors'));
});
for(const text of ['yesterday and today','it happened yesterday but now it is back','昨天有，现在仍然有','It happened yesterday, and happens now'])test(`mixed timing remains current: ${text}`,()=>assert.equal(matchReply('timing',text).answer,'now'));
test('fire recognition precedes driving-question intent',()=>assert.equal(matchReply('safety','I see flames, can I drive?').answer,'fire'));

test('routine maintenance receives a focused visit-preparation brief',()=>{
 const brief=buildAdvisorBrief(assess({topics:['maintenance'],answers:{maintenance:'oil'}}));
 assert.deepEqual(brief,{mode:'prepare',service:'maintenance',checklist:['vehicle','history','schedule'],questions:['interval','findings'],caution:null});
});

test('braking concern prepares useful observations for an inspection',()=>{
 const brief=buildAdvisorBrief(assess({topics:['brakes'],answers:{brakes:'vibrate',vibrationWhen:'braking'}}));
 assert.equal(brief.mode,'prepare');assert.equal(brief.service,'brakes');
 assert.ok(brief.checklist.includes('when'));assert.ok(brief.questions.includes('cause'));
});

test('unresolved concern uses a conservative diagnostic preparation brief',()=>{
 const brief=buildAdvisorBrief(assess({topics:['brakes'],answers:{brakes:'unknown'}}));
 assert.equal(brief.mode,'prepare');assert.equal(brief.service,'diagnostics');
 assert.deepEqual(brief.checklist,['vehicle','timeline','warnings']);
});

test('active emergency contains only emergency guidance',()=>{
 const brief=buildAdvisorBrief(assess({topics:['smell'],answers:{safety:'fire'}}));
 assert.deepEqual(brief,{mode:'safety',service:null,checklist:[],questions:[],caution:'emergency'});
});

test('level-three assistance concern contains no routine preparation',()=>{
 const brief=buildAdvisorBrief(assess({topics:['brakes'],answers:{brakes:'pedal'}}));
 assert.deepEqual(brief,{mode:'safety',service:null,checklist:[],questions:[],caution:'assistance'});
});

test('unsupported service uses the complete diagnostic preparation fallback',()=>{
 const brief=buildAdvisorBrief({level:2,services:['unsupported-service'],unresolved:[]});
 assert.deepEqual(brief,{mode:'prepare',service:'diagnostics',checklist:['vehicle','timeline','warnings'],questions:['findings','nextStep'],caution:'prompt'});
});

test('Spanish advisor labels remain Spanish',()=>{
 assert.equal(locales.es.advisor.questions,'Preguntas para comentar con el taller');
});
