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
