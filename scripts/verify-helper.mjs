import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.NAPA_PLAYWRIGHT_MODULE||'playwright');
const dist=path.resolve('dist');
const server=http.createServer(async(req,res)=>{
 try{
  let pathname=new URL(req.url,'http://localhost').pathname;if(pathname.endsWith('/'))pathname+='index.html';
  const file=path.resolve(dist,`.${pathname}`);if(!file.startsWith(dist+path.sep))throw Error('path');
  res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png'})[path.extname(file)]||'text/plain');
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage();const errors=[],external=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',req=>{if(new URL(req.url()).origin!==origin)external.push(req.url());});
 const reply=async text=>{await page.locator('#rh-reply').fill(text);await page.locator('#rh-reply').press('Enter');};
 for(const [route,prompt,expected]of [['/','My car clicks but will not start',/battery|starting|connections/i],['/es/','La bateria esta muerta',/batería|conexiones/i],['/zh/','刹车时方向盘抖动',/刹车|制动/]]){
  await page.goto(origin+route);await reply(prompt);
  await page.locator('.rh-assistant').waitFor();assert.match(await page.locator('.rh-assistant').textContent(),expected);
  await page.locator('[data-reset-chat]').click();assert.equal(await page.locator('.rh-message').count(),0);
 }
 assert.equal(external.length,0,'no model requests before opt-in');
 await reply('<img src=x onerror=alert(1)>');assert.equal(await page.locator('.rh-user img').count(),0);
 await page.locator('[data-reset-chat]').click();await reply('My brakes have failed and I cannot stop');await page.locator('.rh-safety').waitFor();
 await page.setViewportSize({width:375,height:812});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Replace only the GPU dependency, so the actual interface/controller opt-in path runs.
 const fake=`export async function createLocalModel({onProgress}){onProgress(.5);return {interrupt(){},dispose:async()=>{},reply:async()=>{await new Promise(r=>setTimeout(r,250));return '<b>Local explanation</b>';}}}`;
 await page.route('**/local-model.js',route=>route.fulfill({contentType:'text/javascript',body:fake}));
 await page.goto(origin+'/');await page.locator('.rh-model-panel summary').click();await page.locator('[data-enable-model]').click();
 await page.waitForFunction(()=>document.querySelector('[data-model-status]').textContent.includes('ready'));
 await reply('My car will not start');await page.waitForFunction(()=>document.querySelector('[data-chat-transcript]').textContent.includes('<b>Local explanation</b>'));
 assert.equal(await page.locator('.rh-assistant b').count(),0);
 await page.locator('[data-reset-chat]').click();await reply('My car will not start');await page.locator('[data-reset-chat]').click();
 await page.waitForTimeout(400);assert.equal(await page.locator('.rh-message').count(),0);
 await reply('My car will not start');await reply('I smell gasoline');await page.locator('.rh-safety').waitFor();
 await page.waitForTimeout(400);assert.ok(!(await page.locator('[data-chat-transcript]').textContent()).includes('Local explanation'));
 await page.unroute('**/local-model.js');
 await page.route('**/local-model.js',route=>route.fulfill({contentType:'text/javascript',body:`export async function createLocalModel(){throw Error('download failed');}`}));
 await page.goto(origin+'/');await page.locator('.rh-model-panel summary').click();await page.locator('[data-enable-model]').click();
 await page.waitForFunction(()=>document.querySelector('[data-model-status]').textContent.includes('could not'));
 await reply('My car will not start');await page.locator('.rh-assistant').waitFor();
 assert.deepEqual(errors,[]);
 const noJS=await browser.newContext({javaScriptEnabled:false});const fallback=await noJS.newPage();await fallback.goto(origin+'/');assert.ok(await fallback.locator('a[href="tel:+19084166132"]').count()>0);
 console.log('PASS multilingual chat, no pre-consent network, literal text, mobile, safety, model opt-in, failure, reset, no-JS phone access');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
