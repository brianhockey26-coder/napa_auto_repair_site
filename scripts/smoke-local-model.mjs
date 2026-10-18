// Real GPU/model check. Opt-in: downloads the pinned model into a temporary browser profile.
import http from 'node:http';
import {readFile,mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const {chromium}=await import(process.env.NAPA_PLAYWRIGHT_MODULE||'playwright');
const server=http.createServer(async(req,res)=>{
 try{const file=path.resolve('dist','.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(path.resolve('dist')+path.sep))throw Error();res.setHeader('Content-Type','text/javascript');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(Number(process.env.NAPA_MODEL_PORT)||0,'127.0.0.1',r));
let browser;
try{
 const profile=process.env.NAPA_MODEL_PROFILE||await mkdtemp(path.join(os.tmpdir(),'napa-model-smoke-'));console.log('Temporary persistent profile:',profile);
 browser=await chromium.launchPersistentContext(profile,{headless:true,channel:'chrome',args:['--enable-unsafe-webgpu']});
 const page=await browser.newPage();page.on('console',m=>console.log(m.text()));page.on('requestfailed',r=>console.log('Asset request failed:',r.url().split('?')[0],r.failure()?.errorText));
 await page.goto(`http://127.0.0.1:${server.address().port}/assets/repair-helper/local-model.js`);
 const result=await page.evaluate(async()=>{
  const {createLocalModel}=await import('./local-model.js');
  const {createChatController}=await import('./chat-controller.js');
  const {locales}=await import('./locales.js');
  const model=await createLocalModel({onProgress:value=>console.log('Model progress',Math.round(value*100))});
  try{
   const traced={...model,reply:async context=>{try{return await model.reply(context);}catch(error){console.log('Inference error:',error.message);throw error;}}};
   const controller=createChatController({locale:'en',copy:locales.en,loadModel:async()=>traced});await controller.enableModel();
   await controller.send('My car clicks rapidly and the dashboard dims when I try to start it. What could cause that?');
   const first=controller.snapshot().messages.filter(m=>m.kind==='model').at(-1)?.content;
   await controller.send('It is a 2015 Honda Accord. What should I tell the mechanic?');
   const followup=controller.snapshot().messages.at(-1)?.content;
   if(!first||!followup?.includes('2015 Honda Accord')||!followup.includes('clicks rapidly'))throw Error('Missing recorded summary');return {first,followup};
  }finally{await model.dispose();}
 });
 if(!result?.first)throw Error('No real model response');console.log('REAL MODEL REPLIES:',JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
