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
