import test from 'node:test';
import assert from 'node:assert/strict';
import {supportsLocalModel,selectLocalModel,buildModelMessages,createLocalModel,MODEL_ID} from '../src/assets/repair-helper/local-model.js';
const environment={navigator:{gpu:{requestAdapter:async()=>({})}}};
test('unsupported devices and absent pinned models fail closed',()=>{
 assert.equal(supportsLocalModel({}),false);
 assert.equal(supportsLocalModel(environment),true);
 assert.throws(()=>selectLocalModel([{model_id:'huge-model'}]));
 assert.equal(selectLocalModel([{model_id:MODEL_ID}]),MODEL_ID);
});
test('active danger never produces a model prompt; routine history is bounded and localized',()=>{
 assert.equal(buildModelMessages({assessment:{level:3}}),null);
 const messages=buildModelMessages({locale:'zh',assessment:{level:1},guidance:'Inspection soon',messages:Array.from({length:40},()=>({role:'user',content:'x'.repeat(2000)}))});
 assert.match(messages[0].content,/Simplified Chinese/);
 assert.match(messages[0].content,/Inspection soon/);
 assert.match(messages[0].content,/Use only the supplied/);
 assert.ok(messages.length<=7);
 assert.ok(messages.slice(1).every(m=>m.content.length<=1000));
});
test('runtime is only loaded on explicit creation, blank output rejected, output bounded',async()=>{
 let calls=0,content='';
 const runtime={prebuiltAppConfig:{model_list:[{model_id:MODEL_ID}]},CreateMLCEngine:async(id,options)=>{assert.equal(options.appConfig.useIndexedDBCache,true);return {chat:{completions:{create:async()=>({choices:[{message:{content}}]})}},interruptGenerate(){},unload:async()=>{}};}};
 assert.equal(calls,0);
 const model=await createLocalModel({environment,loadRuntime:async()=>{calls++;return runtime;}});
 assert.equal(calls,1);
 const context={locale:'en',assessment:{level:1},messages:[{role:'user',content:'car clicks'}]};
 await assert.rejects(model.reply(context),/empty/i);
 content='a'.repeat(9000);assert.equal((await model.reply(context)).length,4000);
 await assert.rejects(model.reply({...context,assessment:{level:3}}));
});
test('denied GPU and runtime initialization failures reject cleanly',async()=>{
 await assert.rejects(createLocalModel({environment:{navigator:{gpu:{requestAdapter:async()=>null}}}}));
 await assert.rejects(createLocalModel({environment,loadRuntime:async()=>{throw Error('download failed');}}),/download failed/);
});
test('conversation context alternates roles and never starts with an orphan assistant',()=>{
 const context=buildModelMessages({assessment:{level:1},messages:[{role:'assistant',content:'orphan'},{role:'user',content:'symptom'},{role:'assistant',content:'advice'},{role:'assistant',content:'explanation'},{role:'user',content:'followup'}]});
 assert.deepEqual(context.slice(1).map(m=>m.role),['user','assistant','user']);
 assert.match(context[2].content,/advice.*explanation/s);
});
test('retained vehicle facts survive short transcript history',()=>{
 const messages=buildModelMessages({assessment:{level:1},vehicle:'2015 Honda Accord',messages:[{role:'user',content:'still clicking'}]});
 assert.match(messages[1].content,/2015 Honda Accord/);
});
