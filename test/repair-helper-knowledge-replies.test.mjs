import test from 'node:test';
import assert from 'node:assert/strict';
import {lookupRepairExplanation} from '../src/assets/repair-helper/knowledge-replies.js';
import {locales} from '../src/assets/repair-helper/locales.js';
for(const [text,id] of [['What is a starter motor?','starter'],['How does the battery work?','battery'],['What is an alternator?','charging'],['Explain brake rotors','rotors'],['What does a catalytic converter do?','catalyst'],['What is a misfire?','misfire'],['How do you check wheel balance?','balance'],['What is wheel alignment?','alignment'],['What is a cabin filter?','cabinFilter'],['¿Qué es el motor de arranque?','starter'],['¿Cómo funciona la batería?','battery'],['什么是启动机？','starter'],['解释刹车盘','rotors']])test(`bundled explanation: ${text}`,()=>{
 const result=lookupRepairExplanation(text,locales.en);assert.equal(result?.ids[0],id);assert.ok(result.content.length>50);
});
test('explanation uses the requested language and the known current cause',()=>{
 assert.match(lookupRepairExplanation('什么是电池？',locales.zh).content,/电池/);
 assert.match(lookupRepairExplanation('¿Qué es una batería?',locales.es).content,/batería/i);
 assert.match(lookupRepairExplanation('What does that mean?',locales.en,[{id:'airLeak'}]).content,/air/i);
});
test('symptom reports and unrelated questions are not answered as definitions',()=>{
 assert.equal(lookupRepairExplanation('My battery is dead',locales.en),null);
 assert.equal(lookupRepairExplanation('What is the weather?',locales.en),null);
});
test('component comparison retrieves both explanations',()=>{
 assert.deepEqual(lookupRepairExplanation('What is the difference between a battery and a starter?',locales.en).ids,['battery','starter']);
});
