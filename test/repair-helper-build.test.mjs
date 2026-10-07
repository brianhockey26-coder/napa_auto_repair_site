import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,readFile,stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildSite } from '../scripts/build.mjs';

test('published routes include local helper and usable no-script fallback',async()=>{
 const outputDir=await mkdtemp(path.join(os.tmpdir(),'napa-helper-'));
 await buildSite({origin:'https://napaautorepairnj.com/',outputDir});
 for(const route of ['index.html','es/index.html','zh/index.html']){
  const html=await readFile(path.join(outputDir,route),'utf8');
  assert.match(html,/id="repair-helper"/);
  assert.match(html,/<script type="module" src="(?:\.\.\/)?assets\/repair-helper\/app.js"/);
  assert.match(html,/data-helper-topic="brakes"/);
  assert.match(html,/<noscript>/);
  assert.match(html,/href="tel:\+19084166132"/);
 }
 for(const asset of ['app.js','advisor.js','engine.js','knowledge.js','locales.js']){
  assert.ok((await stat(path.join(outputDir,'assets','repair-helper',asset))).isFile());
 }
});

test('built site includes the service-advisor presentation layer',async()=>{
 const outputDir=await mkdtemp(path.join(os.tmpdir(),'napa-advisor-build-'));
 await buildSite({origin:'https://napaautorepairnj.com/',outputDir});
 const [app,css]=await Promise.all([
  readFile(path.join(outputDir,'assets','repair-helper','app.js'),'utf8'),
  readFile(path.join(outputDir,'styles.css'),'utf8'),
 ]);
 assert.match(app,/buildAdvisorBrief/);
 assert.match(app,/rh-advisor/);
 assert.match(css,/\.rh-advisor\s*\{/);
 assert.match(css,/\.service-standards\s*\{/);
});
