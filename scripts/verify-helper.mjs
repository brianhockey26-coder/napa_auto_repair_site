import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile,mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.NAPA_PLAYWRIGHT_MODULE || 'playwright');

const dist=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const server=http.createServer(async(req,res)=>{
 try{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.endsWith('/'))pathname+='index.html';
  const file=path.resolve(dist,`.${pathname}`);
  if(!file.startsWith(`${dist}${path.sep}`)){res.writeHead(403);res.end();return;}
  const bytes=await readFile(file);
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
  res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
const artifacts=await mkdtemp(path.join(os.tmpdir(),'napa-helper-browser-'));
let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(new URL(r.url()).origin!==new URL(origin).origin)external.push(r.url());});
 const next=()=>page.locator('[data-helper-mount] button.button-primary').click();
 async function answer(value){await page.locator(`.rh-options input[value="${value}"]`).check();await next();}
 for(const [route,expected] of [['/','Arrange an inspection soon'],['/es/','Programa una revisión pronto'],['/zh/','尽快安排检查']]){
  await page.goto(origin+route);await page.locator('#rh-description').waitFor();
  await page.locator('.rh-topics input[value="brakes"]').check();await next();
  assert.equal(await page.locator('.rh-options').getAttribute('data-question'),'safety');
  await answer('none');await answer('now');await answer('squeal');await answer('always');await answer('gradual');
  await page.locator('.rh-result-title').waitFor();
  assert.equal(await page.locator('.rh-result-title').textContent(),expected);
  assert.match(await page.locator('#rh-summary').inputValue(),/squeal|Chirrido|尖叫/i);
  assert.equal(await page.locator('.rh-advisor').count(),1);
  if(route==='/'){
   assert.match(await page.locator('.rh-advisor').textContent(),/Prepare for your visit/);
   assert.match(await page.locator('#rh-summary').inputValue(),/Service area to discuss/);
  }
  assert.equal(await page.locator('.rh-controls a[href="tel:+19084166132"]').count(),1);
  // Edit and elevate the brake symptom, then reset and ensure answers are cleared.
  await page.locator('.rh-controls-muted button').first().click();
  assert.equal(await page.locator('.rh-options').getAttribute('data-question'),'onset');
  await page.locator('.rh-controls button').first().click();
  assert.equal(await page.locator('.rh-options').getAttribute('data-question'),'brakeTiming');
  await page.locator('.rh-controls button').first().click();
  assert.equal(await page.locator('.rh-options').getAttribute('data-question'),'brakes');
  await answer('pedal');assert.equal(await page.locator('.rh-level-3').count(),1);
  await page.locator('.rh-controls-muted button').last().click();
  assert.equal(await page.locator('#rh-description').inputValue(),'');
  assert.equal(await page.locator('.rh-topics input:checked').count(),0);
  console.log(`PASS ${route}: complete, edit, urgent result, reset`);
 }
 // A real typed conversation, optional shortcut chips, and evidence-backed explanations.
 await page.goto(origin+'/');await page.locator('.rh-topics input[value="brakes"]').check();await next();
 async function reply(text){await page.locator('#rh-reply').fill(text);await page.locator('#rh-reply').press('Enter');}
 await reply('none of those');await reply('it is happening now');await reply('it shakes when I brake');
 await reply('what might be causing this?');assert.match(await page.locator('.rh-chat').textContent(),/disc|brake/i);
 await reply('something feels weird');await page.locator('[data-message]').waitFor();
 assert.equal(await page.locator('.rh-options').getAttribute('data-question'),'vibrationWhen');
 await reply('only when braking');await reply('steering wheel');await reply('gradually');
 await page.locator('.rh-result-title').waitFor();
 assert.match(await page.locator('.rh-cause').first().textContent(),/disc|pads/i);
 assert.match(await page.locator('.rh-cause').first().textContent(),/What a mechanic would check/);
 assert.match(await page.locator('#rh-summary').inputValue(),/it shakes when I brake/);
 await page.setViewportSize({width:375,height:812});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await page.locator('#repair-helper').screenshot({path:path.join(artifacts,'en-mobile-chat-result.png')});
 await page.setViewportSize({width:1280,height:900});
 console.log('PASS typed chat, explanation intent, clarification, detailed quiz, cause evidence');
 await page.goto(origin+'/');await page.locator('.rh-topics input[value="brakes"]').check();await next();await answer('none');
 await reply('I smell gasoline');assert.equal(await page.locator('.rh-level-3').count(),1);
 console.log('PASS new danger in a typed follow-up interrupts the quiz');
 await page.goto(origin+'/');await page.locator('#rh-description').fill('a'.repeat(1000));await page.locator('.rh-topics input[value="brakes"]').check();await next();
 await answer('none');await answer('now');await answer('squeal');await reply('I have a soft brake pedal');
 assert.equal(await page.locator('.rh-level-3').count(),1);
 await page.goto(origin+'/');await page.locator('.rh-topics input[value="smell"]').check();await next();
 await answer('none');await answer('now');await answer('burn');await reply('I see flames, can I drive?');
 assert.equal(await page.locator('.rh-emergency').count(),1);
 assert.equal(await page.locator('.rh-advisor-safety').count(),1);
 assert.equal(await page.locator('.rh-advisor-group').count(),0);
 console.log('PASS long-input hazard and fire after earlier mild answer');
 for(const [route,none,now,soft] of [['/es/','ninguno de esos','ahora','el pedal esta blando'],['/zh/','都没有','现在','踏板很软']]){
  await page.goto(origin+route);await page.locator('.rh-topics input[value="brakes"]').check();await next();
  await reply(none);await reply(now);await reply(soft);
  assert.equal(await page.locator('.rh-level-3').count(),1);
  assert.ok(await page.locator('.rh-cause').count()>0);
 }
 console.log('PASS Spanish and Chinese typed replies and localized explanations');
 for(const text of ['The tire does not have a bulge','Yesterday smoke, today brakes squeal','oil pressure light only with engine off']){
  await page.goto(origin+'/');await page.locator('#rh-description').fill(text);await next();
  assert.equal(await page.locator('.rh-options').getAttribute('data-question'),'safety');
  assert.equal(await page.locator('.rh-result-title').count(),0);
 }
 console.log('PASS reviewed negation, mixed timing, and engine-off cases reach clarification');
 await page.goto(origin+'/');await page.locator('#rh-description').focus();
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'rh-vehicle');
 await page.keyboard.press('Tab');await page.keyboard.press('Space');
 assert.equal(await page.locator('.rh-topics input[value="brakes"]').isChecked(),true);
 console.log('PASS keyboard navigation and symptom selection');
 // Immediate typed hazard, including literal markup, must never create DOM markup.
 await page.goto(origin+'/');
 await page.locator('#rh-description').fill('<img src=x onerror=alert(1)> brakes not working');await next();
 assert.equal(await page.locator('.rh-level-3').count(),1);
 assert.equal(await page.locator('[data-helper-mount] img').count(),0);
 assert.match(await page.locator('#rh-summary').inputValue(),/<img src=x/);
 // Deliberately disable the clipboard to verify its real fallback behavior.
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('denied'))}}));
 await page.locator('.rh-controls button').first().click();
 await page.locator('[data-message]').waitFor();
 assert.equal(await page.evaluate(()=>document.activeElement.id),'rh-summary');
 assert.ok(await page.locator('#rh-summary').evaluate(e=>e.selectionEnd-e.selectionStart>0));
 console.log('PASS literal text and clipboard-denied fallback');
 // Mobile, emergency, empty input, and service entry.
 await page.setViewportSize({width:375,height:812});await page.goto(origin+'/zh/');
 await next();await page.locator('[data-message]').waitFor();
 assert.equal(await page.locator('.rh-options').count(),0);
 await page.locator('.rh-topics input[value="smell"]').check();await next();await answer('fire');
 assert.equal(await page.locator('.rh-emergency').count(),1);
 assert.match(await page.locator('.rh-emergency').textContent(),/911/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await page.locator('#repair-helper').screenshot({path:path.join(artifacts,'zh-mobile-result.png')});
 await page.goto(origin+'/');
 await page.locator('.service-card').nth(2).locator('summary').click();
 await page.locator('[data-helper-topic="brakes"]').click();
 assert.equal(await page.locator('.rh-topics input[value="brakes"]').isChecked(),true);
 await page.locator('#repair-helper').screenshot({path:path.join(artifacts,'en-mobile-start.png')});
 await page.setViewportSize({width:1440,height:1000});await page.goto(origin+'/');
 assert.equal(await page.locator('.service-standards').count(),1);
 assert.match(await page.locator('.service-standards').textContent(),/A practical approach to vehicle service/);
 await page.locator('#repair-helper').screenshot({path:path.join(artifacts,'en-desktop-start.png')});
 // Site remains useful when scripting is disabled.
 const nojs=await browser.newContext({javaScriptEnabled:false});
 const fallback=await nojs.newPage();await fallback.goto(origin+'/zh/');
 assert.equal(await fallback.locator('#repair-helper noscript').isVisible(),true);
 assert.ok(await fallback.locator('#repair-helper a[href="tel:+19084166132"]').count()>0);
 await nojs.close();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS mobile, emergency, service entry, no-JS fallback, no errors/external requests');
 console.log(`Screenshots: ${artifacts}`);
}finally{await browser?.close();server.close();}
