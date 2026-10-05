import test from 'node:test';
import assert from 'node:assert/strict';
import { interpret, assess } from '../src/assets/repair-helper/engine.js';
import { locales } from '../src/assets/repair-helper/locales.js';
import { questions } from '../src/assets/repair-helper/knowledge.js';

// Literal outcomes pin distinctions which could cause misleading customer advice.
const scenarios = [
 ['soft brake pedal', ['brakes'], {brakes:'pedal'}, 3, 'brakes'],
 ['lost braking', ['brakes'], {brakes:'failure'}, 3, 'brakes'],
 ['brake grinding', ['brakes'], {brakes:'grind'}, 2, 'brakes'],
 ['brake squeal', ['brakes'], {brakes:'squeal'}, 1, 'brakes'],
 ['braking-only vibration', ['brakes'], {brakes:'vibrate'}, 1, 'brakes'],
 ['flat tire', ['tires'], {tires:'flat'}, 3, 'brakes'],
 ['sidewall bulge', ['tires'], {tires:'damage'}, 3, 'brakes'],
 ['low tire pressure', ['tires'], {tires:'pressure'}, 2, 'brakes'],
 ['highway vibration', ['tires'], {tires:'speed'}, 1, 'brakes'],
 ['uneven tread', ['tires'], {tires:'wear'}, 1, 'brakes'],
 ['sudden loss of steering', ['steering'], {steering:'loss'}, 3, 'suspension'],
 ['mild pulling', ['steering'], {steering:'pull'}, 1, 'suspension'],
 ['suspension clunk', ['steering'], {steering:'clunk'}, 1, 'suspension'],
 ['flashing engine light', ['lights'], {lights:'flash'}, 2, 'diagnostics'],
 ['steady engine light', ['lights'], {lights:'steady'}, 1, 'diagnostics'],
 ['running oil pressure light', ['lights'], {lights:'oil'}, 3, 'engine'],
 ['oil change reminder', ['lights'], {lights:'reminder'}, 0, 'maintenance'],
 ['battery light while driving', ['lights'], {lights:'battery'}, 2, 'electrical'],
 ['ABS warning alone', ['lights'], {lights:'abs'}, 2, 'brakes'],
 ['airbag warning', ['lights'], {lights:'airbag'}, 2, 'diagnostics'],
 ['overheat warning', ['heat'], {heat:'hot'}, 3, 'engine'],
 ['steam under hood', ['heat'], {heat:'steam'}, 3, 'engine'],
 ['coolant loss', ['heat'], {heat:'loss'}, 2, 'engine'],
 ['clicking no start', ['start'], {start:'click'}, 1, 'electrical'],
 ['cranking without starting', ['start'], {start:'crank'}, 1, 'diagnostics'],
 ['slow crank', ['start'], {start:'slow'}, 1, 'electrical'],
 ['rough idle', ['engine'], {engine:'idle'}, 1, 'engine'],
 ['stalling in traffic', ['engine'], {engine:'stall'}, 2, 'diagnostics'],
 ['severe power loss', ['engine'], {engine:'power'}, 2, 'diagnostics'],
 ['unknown leak', ['leaks'], {leaks:'unknown'}, 2, 'diagnostics'],
 ['clear A/C water', ['leaks'], {leaks:'water'}, 0, 'electrical'],
 ['large fluid leak', ['leaks'], {leaks:'large'}, 3, 'engine'],
 ['active fuel smell', ['smell'], {smell:'fuel'}, 3, 'diagnostics'],
 ['active smoke', ['smell'], {smell:'smoke'}, 3, 'diagnostics'],
 ['active fire', ['smell'], {smell:'fire'}, 3, 'diagnostics'],
 ['A/C not cold', ['climate'], {climate:'warm'}, 1, 'electrical'],
 ['defogger ineffective', ['climate'], {climate:'fog'}, 2, 'electrical'],
 ['routine oil change', ['maintenance'], {maintenance:'oil'}, 0, 'maintenance'],
 ['used car check', ['maintenance'], {maintenance:'inspect'}, 0, 'diagnostics'],
 ['belt noise', ['noise'], {noise:'belt'}, 1, 'engine'],
 ['loud engine knock', ['noise'], {noise:'knock'}, 2, 'engine'],
];
for (const [name, topics, answers, level, service] of scenarios) {
 test(name, () => {
  const result=assess({topics,answers:{safety:'none',timing:'now',...answers}});
  assert.equal(result.level,level);
  assert.ok(result.services.includes(service));
  assert.ok(result.reasons.length);
 });
}
test('independent hazard takes precedence over routine symptom',()=>{
 assert.equal(assess({topics:['maintenance','brakes'],answers:{safety:'none',timing:'now',maintenance:'oil',brakes:'failure'}}).level,3);
});
test('historical hazard remains prompt without claiming active danger',()=>{
 const r=assess({topics:['heat'],answers:{safety:'none',timing:'past',heat:'hot'}});
 assert.equal(r.level,2); assert.equal(r.historical,true);
});
test('uncertain symptoms do not become routine reassurance',()=>{
 assert.equal(assess({topics:['brakes'],answers:{safety:'unknown',timing:'unknown',brakes:'unknown'}}).level,2);
});
test('all unknown with benign safety still requests professional clarification',()=>{
 assert.equal(assess({topics:['tires'],answers:{safety:'none',timing:'now',tires:'unknown'}}).level,2);
});
test('empty input returns clarification',()=>{
 assert.equal(assess({}).unknown,true);
 assert.equal(interpret('purple unicorn').topics.length,0);
});
test('multiple symptom recognition',()=>{
 const r=interpret('brakes squeal and engine is overheating');
 assert.ok(r.topics.includes('brakes')); assert.ok(r.topics.includes('heat'));
});
for(const text of ['no smoke','sin humo','没有冒烟','沒有冒煙','no overheating','sin sobrecalentamiento','没有过热']){
 test(`negation: ${text}`,()=>assert.equal(interpret(text).facts.length,0));
}
for(const text of ['brakes not working','frenos no funcionan','刹车失灵']){
 test(`brake failure: ${text}`,()=>assert.equal(assess({text}).level,3));
}
for(const [text,topic] of [['no start','start'],['no arranca','start'],['无法启动','start'],['frenos rechinan','brakes'],['轮胎抖动','tires'],['check engine light','lights']]){
 test(`recognize: ${text}`,()=>assert.ok(interpret(text).topics.includes(topic)));
}
test('negation only affects its clause',()=>{
 assert.equal(assess({text:'no smoke, but brakes not working'}).level,3);
});
test('hazard uncertainty prompts confirmation rather than current-hazard claim',()=>{
 const r=assess({text:'maybe overheating',topics:['heat']});
 assert.equal(r.level,2); assert.ok(r.questions.includes('heat'));
});
test('editing clears stale hazard when current facts no longer contain it',()=>{
 assert.equal(assess({topics:['brakes'],answers:{safety:'none',brakes:'failure'}}).level,3);
 assert.equal(assess({topics:['brakes'],answers:{safety:'none',brakes:'squeal',timing:'now'}}).level,1);
});
test('question budget is bounded even with all topics',()=>{
 const r=assess({topics:['brakes','tires','steering','lights','heat','start','engine','leaks','smell','climate','maintenance','noise']});
 assert.ok(r.questions.length<=14); assert.equal(r.questions[0],'safety');
});
test('supported locales cover every question, option, reason, and service',()=>{
 for(const locale of Object.values(locales)){
  for(const [id,q] of Object.entries(questions)){
   assert.ok(locale.questions[id]?.title,id);
   for(const option of q.options)assert.ok(locale.questions[id].options[option],`${id}/${option}`);
   if(q.topic)assert.ok(locale.topics[q.topic]);
  }
  for(const key of Object.keys(locales.en.reasons))assert.ok(locale.reasons[key],key);
  for(const key of Object.keys(locales.en.ui))assert.ok(locale.ui[key],key);
  for(const key of Object.keys(locales.en.services))assert.ok(locale.services[key],key);
 }
});
test('contradictory mild answer cannot erase a described severe hazard',()=>{
 const r=assess({text:'brakes not working',topics:['brakes'],answers:{safety:'none',timing:'now',brakes:'squeal'}});
 assert.ok(r.level>=2);assert.equal(r.conflict,true);
});
test('active safety hazard is never downgraded by historical main symptom',()=>{
 assert.equal(assess({topics:['heat'],answers:{safety:'fire',timing:'past',heat:'hot'}}).level,3);
});
test('resolved uncertainty uses explicit customer confirmation',()=>{
 const r=assess({text:'maybe overheating',topics:['heat'],answers:{safety:'none',timing:'now',heat:'loss'}});
 assert.equal(r.unresolved.length,0);assert.equal(r.level,2);
});
test('question followups adapt to vibration and starting complaints',()=>{
 assert.ok(assess({topics:['tires'],answers:{safety:'none',timing:'now',tires:'speed'}}).questions.includes('onset'));
 assert.ok(assess({topics:['start'],answers:{safety:'none',timing:'now',start:'click'}}).questions.includes('frequency'));
});
test('unknown timing cannot downgrade a severe symptom',()=>{
 assert.equal(assess({topics:['heat'],answers:{safety:'none',timing:'unknown',heat:'hot'}}).level,3);
});
test('an unexpected answer is treated as unanswered',()=>{
 assert.ok(assess({topics:['brakes'],answers:{safety:'none',brakes:'banana'}}).questions.includes('brakes'));
});
for(const text of ['The tire does not have a bulge','el neumático no tiene bulto','轮胎没有鼓包','brakes are not grinding']){
 test(`embedded negation: ${text}`,()=>assert.equal(interpret(text).facts.length,0));
}
test('historical smoke does not become current because another symptom is current',()=>{
 const r=assess({text:'Yesterday smoke, today brakes squeal'});
 assert.equal(r.level,2);assert.equal(r.historical,true);
});
for(const text of ['oil pressure light only with engine off','luz de presion de aceite solo con motor apagado','发动机关闭时机油压力灯亮']){
 test(`engine-off oil warning needs confirmation: ${text}`,()=>{
  const r=assess({text});assert.notEqual(r.level,3);assert.ok(r.questions.includes('lights'));
 });
}
test('current recurrence outranks earlier occurrence of the same hazard',()=>{
 assert.equal(assess({text:'smoke yesterday, smoke now'}).level,3);
});
test('an explicit current independent hazard survives a past-main-symptom answer',()=>{
 assert.equal(assess({text:'smoke now, brakes squeal yesterday',answers:{safety:'none',timing:'past'}}).level,3);
});
test('oil pressure without operating conditions is asked rather than assumed',()=>{
 const r=assess({text:'oil pressure warning'});assert.equal(r.level,2);assert.ok(r.questions.includes('lights'));
});
test('historical explanation is marked for conditional wording',()=>{
 assert.ok(assess({text:'overheating yesterday'}).pastReasons.includes('heat.hot'));
});
