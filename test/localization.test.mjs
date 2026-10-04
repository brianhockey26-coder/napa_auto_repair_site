import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildSite } from "../scripts/build.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePaths = {
  en: path.join(projectRoot, "src", "index.html"),
  es: path.join(projectRoot, "src", "es", "index.html"),
  "zh-Hans": path.join(projectRoot, "src", "zh", "index.html"),
};

async function sources() {
  return Object.fromEntries(await Promise.all(Object.entries(sourcePaths).map(async ([language, file]) => [language, await readFile(file, "utf8")])));
}

test("language_routes_are_complete_static_pages", async () => {
  const pages = await sources();

  assert.match(pages.en, /<html lang="en">/);
  assert.match(pages.es, /<html lang="es">/);
  assert.match(pages["zh-Hans"], /<html lang="zh-Hans">/);
  for (const page of Object.values(pages)) {
    assert.match(page, /<main[^>]+id="main-content"/);
    assert.match(page, /<section[^>]+id="services"/);
    assert.match(page, /<section[^>]+id="reviews"/);
    assert.match(page, /<section[^>]+id="visit"/);
    assert.match(page, /<h1[\s>]/);
    assert.doesNotMatch(page, /<script[^>]+src=/i);
  }
  assert.match(pages.es, /Reparaciones confiables/i);
  assert.match(pages.es, /Servicios/);
  assert.match(pages["zh-Hans"], /可靠维修/);
  assert.match(pages["zh-Hans"], /服务项目/);
});

test("language_switcher_links_equivalent_routes", async () => {
  const pages = await sources();

  for (const page of Object.values(pages)) {
    assert.match(page, /<nav class="language-switcher"[^>]+aria-label="[^"]+"/);
    assert.match(page, />EN<\/a>/);
    assert.match(page, />ES<\/a>/);
    assert.match(page, />中文<\/a>/);
    assert.match(page, /aria-current="page"/);
    assert.equal((page.match(/class="brand-logo"/g) ?? []).length, 2);
    assert.equal((page.match(/<span class="brand-name"><span>Napa<\/span> <span>Auto Repair<\/span><\/span>/g) ?? []).length, 2);
  }
  assert.match(pages.en, /href="es\/"[^>]*>ES<\/a>/);
  assert.match(pages.en, /href="zh\/"[^>]*>中文<\/a>/);
  assert.match(pages.es, /href="\.\.\/"[^>]*>EN<\/a>/);
  assert.match(pages["zh-Hans"], /href="\.\.\/es\/"[^>]*>ES<\/a>/);
});

test("language_metadata_is_reciprocal", async () => {
  const pages = await sources();

  const expected = [
    ['hreflang="en"', 'href="{{SITE_ORIGIN}}"'],
    ['hreflang="es"', 'href="{{SITE_ORIGIN}}es/"'],
    ['hreflang="zh-Hans"', 'href="{{SITE_ORIGIN}}zh/"'],
    ['hreflang="x-default"', 'href="{{SITE_ORIGIN}}"'],
  ];
  for (const page of Object.values(pages)) {
    for (const [language, href] of expected) {
      assert.ok(page.includes(language) && page.includes(href));
    }
  }
  assert.match(pages.en, /<link rel="canonical" href="\{\{SITE_ORIGIN\}\}">/);
  assert.match(pages.es, /<link rel="canonical" href="\{\{SITE_ORIGIN\}\}es\/">/);
  assert.match(pages["zh-Hans"], /<link rel="canonical" href="\{\{SITE_ORIGIN\}\}zh\/">/);
});

test("translations_preserve_business_facts_and_actions", async () => {
  const pages = await sources();

  for (const page of Object.values(pages)) {
    for (const fact of ["Napa Auto Repair", "1184 F Cozzens Ln", "North Brunswick Township, NJ 08902", "+1 (908) 416-6132", "8:30", "6:00"]) {
      assert.ok(page.includes(fact), `${fact} is present`);
    }
    assert.match(page, /href="tel:\+19084166132"/);
    assert.match(page, /google\.com\/maps\/dir/);
    assert.match(page, /google\.com\/maps\/search/);
    assert.match(page, /"opens": "08:30"/);
    assert.match(page, /"closes": "18:00"/);
  }
});

test("translations_avoid_rating_claims_and_forms", async () => {
  const pages = await sources();

  for (const page of Object.values(pages)) {
    assert.doesNotMatch(page, /<form[\s>]/i);
    assert.doesNotMatch(page, /aggregateRating|reviewCount|ratingValue/i);
    assert.doesNotMatch(page, /five[- ]star|5[- ]star|★★★★★/i);
    assert.doesNotMatch(page, /五星好评|cinco estrellas/i);
  }
});

test("mobile_header_protects_brand_and_language_controls", async () => {
  const css = await readFile(path.join(projectRoot, "src", "styles.css"), "utf8");

  assert.match(css, /\.brand\s*\{[^}]*flex:\s*0 0 auto/s);
  assert.match(css, /@media\s*\(max-width:\s*35rem\)[\s\S]*\.brand-logo\s*\{[^}]*width:\s*72px/s);
  assert.match(css, /@media\s*\(max-width:\s*35rem\)[\s\S]*\.brand-name\s*\{[^}]*max-width:\s*54px/s);
});

test("build_emits_multilingual_routes_and_sitemap", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "napa-localized-"));
  await buildSite({ origin: "https://example.test/napa-auto-repair-website", outputDir });

  for (const route of ["index.html", "es/index.html", "zh/index.html", "assets/napa-auto-repair-logo.png"]) {
    assert.equal((await stat(path.join(outputDir, route))).isFile(), true);
  }
  const [english, spanish, chinese, sitemap] = await Promise.all([
    readFile(path.join(outputDir, "index.html"), "utf8"),
    readFile(path.join(outputDir, "es", "index.html"), "utf8"),
    readFile(path.join(outputDir, "zh", "index.html"), "utf8"),
    readFile(path.join(outputDir, "sitemap.xml"), "utf8"),
  ]);
  assert.match(english, /href="https:\/\/example\.test\/napa-auto-repair-website\/"/);
  assert.match(spanish, /href="https:\/\/example\.test\/napa-auto-repair-website\/es\/"/);
  assert.match(chinese, /href="https:\/\/example\.test\/napa-auto-repair-website\/zh\/"/);
  for (const url of [
    "https://example.test/napa-auto-repair-website/",
    "https://example.test/napa-auto-repair-website/es/",
    "https://example.test/napa-auto-repair-website/zh/",
  ]) {
    assert.ok(sitemap.includes(`<loc>${url}</loc>`));
  }
  assert.match(sitemap, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  assert.match(sitemap, /hreflang="zh-Hans"/);
  assert.match(sitemap, /hreflang="x-default"/);
});
