import test from 'node:test';
import assert from 'node:assert/strict';
import {createChatController} from '../src/assets/repair-helper/chat-controller.js';
import {locales} from '../src/assets/repair-helper/locales.js';
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
test('standard chat never loads model and preserves transcript after failed activation',async()=>{
 let loads=0;const c=createChatController({locale:'en',copy:locales.en,loadModel:async()=>{loads++;throw Error('offline');}});
 await c.send('My car will not start');assert.equal(loads,0);assert.match(c.snapshot().messages.at(-1).content,/fuel|crank|start/i);
 await c.enableModel();assert.equal(c.snapshot().modelStatus,'error');assert.equal(c.snapshot().messages.length,2);
});
test('safety bypasses model and discards a pending routine completion',async()=>{
 const pending=defer();let calls=0;
 const c=createChatController({locale:'en',copy:locales.en,loadModel:async()=>({reply:()=>{calls++;return pending.promise;},interrupt(){}})});
 await c.enableModel();const sending=c.send('My car will not start');
 assert.equal(c.snapshot().messages.length,2);await new Promise(setImmediate);
 await c.send('My brakes have failed and I cannot stop');
 assert.equal(calls,1);assert.equal(c.snapshot().assessment.level,3);
 pending.resolve('stale');await sending;assert.ok(!c.snapshot().messages.some(m=>m.content==='stale'));
});
test('reset discards generation and failed generation permits another message',async()=>{
 const pending=defer();let calls=0;
 const c=createChatController({locale:'en',copy:locales.en,loadModel:async()=>({reply:()=>++calls===1?pending.promise:Promise.reject(Error('GPU lost')),interrupt(){}})});
 await c.enableModel();const sending=c.send('My car will not start');await new Promise(setImmediate);c.reset();pending.resolve('old');await sending;
 assert.equal(c.snapshot().messages.length,0);
 await c.send('My battery is dead');assert.equal(c.snapshot().generating,false);assert.equal(c.snapshot().modelStatus,'error');
 await c.send('it clicks');assert.ok(c.snapshot().messages.length>=4);
});
test('download quota failures explain browser storage while preserving chat',async()=>{
 const c=createChatController({locale:'en',copy:locales.en,loadModel:async()=>{const error=Error('Quota exceeded');error.name='QuotaExceededError';throw error;}});
 await c.enableModel();assert.equal(c.snapshot().modelStatus,'storage');await c.send('My car will not start');assert.equal(c.snapshot().messages.length,2);
});
test('ordinary submission never interrupts an idle model',async()=>{
 let interrupts=0;
 const c=createChatController({locale:'en',copy:locales.en,loadModel:async()=>({interrupt(){interrupts++;},reply:async()=>{if(interrupts)throw Error('interrupted');return 'A battery inspection can help.';}})});
 await c.enableModel();await c.send('My car will not start');assert.equal(interrupts,0);assert.equal(c.snapshot().messages.at(-1).kind,'model');
});
test('visit summary includes recorded vehicle and symptoms rather than asking again',async()=>{
 let calls=0;
 const c=createChatController({locale:'en',copy:locales.en,loadModel:async()=>({interrupt(){},reply:async()=>{calls++;return 'Possible battery issue.';}})});
 await c.enableModel();await c.send('My car clicks rapidly and the dashboard dims when I try to start it. What could cause that?');
 await c.send('It is a 2015 Honda Accord. What should I tell the mechanic?');
 const reply=c.snapshot().messages.at(-1).content;
 assert.match(reply,/2015 Honda Accord/);assert.match(reply,/clicks rapidly/);assert.match(reply,/battery/i);assert.equal(calls,1);
 assert.doesNotMatch(reply,/I can prepare/);
});
test('educational question gives a useful answer without inventing a current failure',async()=>{
 const c=createChatController({locale:'en',copy:locales.en});await c.send('What is a starter motor?');
 assert.match(c.snapshot().messages.at(-1).content,/turns the engine/);
 assert.deepEqual(c.snapshot().conversation.answers,{});assert.deepEqual(c.snapshot().conversation.topics,[]);
});
test('explanations never suppress a current safety hazard',async()=>{
 const c=createChatController({locale:'en',copy:locales.en});await c.send('I smell gasoline now');await c.send('What is a starter motor?');
 assert.equal(c.snapshot().messages.at(-1).kind,'safety');
});
test('next-question reply suggestions use the current language',async()=>{
 const c=createChatController({locale:'zh',copy:locales.zh});await c.send('汽车无法启动');
 assert.ok(c.snapshot().suggestedReplies.some(r=>/咔哒/.test(r.text)));
});
test('misleading generated reply is discarded while useful advisor text remains',async()=>{
 const c=createChatController({locale:'en',copy:locales.en,loadModel:async()=>({interrupt(){},reply:async()=>"It's completely safe to drive."})});
 await c.enableModel();await c.send('My battery is dead');
 assert.equal(c.snapshot().messages.length,2);assert.equal(c.snapshot().modelStatus,'ready');assert.match(c.snapshot().messages.at(-1).content,/battery/i);
});
test('new concern excludes old symptoms from generated context',async()=>{
 let context;const c=createChatController({locale:'en',copy:locales.en,loadModel:async()=>({interrupt(){},reply:async value=>{context=value;return 'An inspection can narrow this down.';}})});
 await c.enableModel();await c.send('My brakes squeal');await c.send('New issue: the AC blows warm');
 assert.ok(!context.messages.some(m=>m.content.includes('brakes squeal')));
});
test('stop generation preserves the conversation and discards late text',async()=>{
 const pending=defer();let interrupted=0;
 const c=createChatController({locale:'en',copy:locales.en,loadModel:async()=>({interrupt(){interrupted++;},reply:()=>pending.promise})});
 await c.enableModel();const sending=c.send('My battery is dead');await new Promise(setImmediate);c.stop();
 assert.equal(c.snapshot().generating,false);assert.equal(c.snapshot().messages.length,2);assert.equal(interrupted,1);
 pending.resolve('Late answer');await sending;assert.equal(c.snapshot().messages.length,2);
});
test('a past symptom cannot open model inference for an independent current hazard',async()=>{
 let calls=0;const c=createChatController({locale:'en',copy:locales.en,loadModel:async()=>({interrupt(){},reply:async()=>{calls++;return 'Routine explanation';}})});
 await c.enableModel();await c.send('Yesterday I saw smoke, but now I smell gasoline');
 assert.equal(c.snapshot().assessment.level,3);assert.equal(calls,0);assert.equal(c.snapshot().messages.at(-1).kind,'safety');
});
test('mixed definition and symptom report retains facts and visit-summary details',async()=>{
 const c=createChatController({locale:'en',copy:locales.en});await c.send('What is a starter? The car clicks and will not start');
 assert.equal(c.snapshot().conversation.answers.start,'click');assert.ok(c.snapshot().conversation.topics.includes('start'));
 await c.send('Prepare my visit summary');assert.match(c.snapshot().messages.at(-1).content,/The car clicks/);
});
test('mixed educational request without punctuation still retains the reported symptom',async()=>{
 const c=createChatController({locale:'en',copy:locales.en});await c.send('What is a starter the car clicks and will not start');
 assert.equal(c.snapshot().conversation.answers.start,'click');
});
