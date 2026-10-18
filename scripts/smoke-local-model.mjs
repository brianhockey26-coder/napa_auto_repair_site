// Real GPU/model check. Opt-in: downloads the pinned model into a temporary browser profile.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.NAPA_PLAYWRIGHT_MODULE||'playwright');
const server=http.createServer(async(req,res)=>{
 try{const file=path.resolve('dist','.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(path.resolve('dist')+path.sep))throw Error();res.setHeader('Content-Type','text/javascript');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome',args:['--enable-unsafe-webgpu']});
 const page=await browser.newPage();page.on('console',m=>console.log(m.text()));
 await page.goto(`http://127.0.0.1:${server.address().port}/assets/repair-helper/local-model.js`);
 const result=await page.evaluate(async()=>{
  const {createLocalModel}=await import('./local-model.js');
  const model=await createLocalModel({onProgress:value=>console.log('Model progress',Math.round(value*100))});
  try{return await model.reply({locale:'en',messages:[{role:'user',content:'My car clicks rapidly and the dashboard dims when I try to start it. What could cause that?'}],assessment:{level:1},guidance:'Arrange an inspection soon. Battery, terminals, and starting system checks may be relevant.'});}finally{await model.dispose();}
 });
 if(!result?.trim())throw Error('No real model response');console.log('REAL MODEL REPLY:',result);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
