import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadBuilder() {
  return import("../scripts/build.mjs");
}

async function buildFixture(origin) {
  const { buildSite } = await loadBuilder();
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "napa-site-"));
  await buildSite({ origin, outputDir });
  const [html, css, robots, sitemap] = await Promise.all([
    readFile(path.join(outputDir, "index.html"), "utf8"),
    readFile(path.join(outputDir, "styles.css"), "utf8"),
    readFile(path.join(outputDir, "robots.txt"), "utf8"),
    readFile(path.join(outputDir, "sitemap.xml"), "utf8"),
  ]);
  return { outputDir, html, css, robots, sitemap };
}

function parseJsonLd(html) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert.ok(match, "JSON-LD script is present");
  return JSON.parse(match[1]);
}

test("build_requires_valid_https_origin", async () => {
  const { buildSite } = await loadBuilder();
  const outputDir = path.join(os.tmpdir(), "napa-invalid-output");

  for (const origin of ["http://example.test", "not a url", "https://example.test/?q=1", "https://example.test/#frag"]) {
    await assert.rejects(() => buildSite({ origin, outputDir }), /valid HTTPS base URL/i);
  }
});

test("build_preserves_optional_project_path", async () => {
  const { html, robots, sitemap } = await buildFixture("https://example.test/napa-auto-repair-website");

  assert.match(html, /<link rel="canonical" href="https:\/\/example\.test\/napa-auto-repair-website\/">/);
  assert.match(html, /"url": "https:\/\/example\.test\/napa-auto-repair-website\/"/);
  assert.match(robots, /Sitemap: https:\/\/example\.test\/napa-auto-repair-website\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/example\.test\/napa-auto-repair-website\/<\/loc>/);
});

test("build_emits_complete_static_site", async () => {
  const built = await buildFixture("https://example.test");

  for (const filename of ["index.html", "styles.css", "robots.txt", "sitemap.xml"]) {
    assert.equal((await stat(path.join(built.outputDir, filename))).isFile(), true);
  }
  assert.doesNotMatch(built.html, /\{\{SITE_ORIGIN\}\}/);
  assert.ok(built.css.length > 1000);
});

test("robots_allow_search_crawlers", async () => {
  const { robots } = await buildFixture("https://example.test");

  assert.match(robots, /User-agent: Googlebot\nAllow: \//);
  assert.match(robots, /User-agent: OAI-SearchBot\nAllow: \//);
  assert.match(robots, /User-agent: \*\nAllow: \//);
  assert.match(robots, /Sitemap: https:\/\/example\.test\/sitemap\.xml/);
});

test("sitemap_and_canonical_share_origin", async () => {
  const { html, sitemap } = await buildFixture("https://example.test/");

  assert.match(html, /<link rel="canonical" href="https:\/\/example\.test\/">/);
  assert.match(sitemap, /<loc>https:\/\/example\.test\/<\/loc>/);
  assert.equal(parseJsonLd(html).url, "https://example.test/");
});

test("structured_data_matches_visible_facts", async () => {
  const { html } = await buildFixture("https://example.test");
  const data = parseJsonLd(html);

  assert.equal(data["@type"], "AutoRepair");
  assert.equal(data.name, "Napa Auto Repair");
  assert.equal(data.telephone, "+19084166132");
  assert.deepEqual(data.address, {
    "@type": "PostalAddress",
    streetAddress: "1184 F Cozzens Ln",
    addressLocality: "North Brunswick Township",
    addressRegion: "NJ",
    postalCode: "08902",
    addressCountry: "US",
  });
  assert.deepEqual(data.openingHoursSpecification[0].dayOfWeek, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
  assert.equal(data.openingHoursSpecification[0].opens, "08:30");
  assert.equal(data.openingHoursSpecification[0].closes, "18:00");
  assert.equal(JSON.stringify(data).match(/review|aggregateRating|ratingValue|reviewCount/i), null);
  assert.match(html, /Monday–Saturday/);
  assert.match(html, /8:30 AM–6:00 PM/);
  assert.match(html, /<span>Sunday<\/span><strong>Closed<\/strong>/);
});
