import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const htmlPath = new URL("../src/index.html", import.meta.url);
const cssPath = new URL("../src/styles.css", import.meta.url);

async function source() {
  const [html, css] = await Promise.all([
    readFile(htmlPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);
  return { html, css };
}

test("renders_exact_business_facts", async () => {
  const { html } = await source();

  for (const fact of [
    "Napa Auto Repair",
    "1184 F Cozzens Ln",
    "North Brunswick Township, NJ 08902",
    "+1 (908) 416-6132",
    "Monday–Saturday",
    "8:30 AM–6:00 PM",
    "Sunday",
    "Closed",
  ]) {
    assert.match(html, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("offers_primary_customer_actions", async () => {
  const { html } = await source();

  assert.match(html, /href="tel:\+19084166132"[^>]*>[^<]*(Call|908)/i);
  assert.match(html, /href="https:\/\/www\.google\.com\/maps\/dir\/\?api=1&amp;destination=[^"]+"/i);
  assert.match(html, /href="https:\/\/www\.google\.com\/maps\/search\/\?api=1&amp;query=[^"]+"/i);
  assert.match(html, /See what customers are saying on Google/i);
});

test("uses_semantic_accessible_structure", async () => {
  const { html, css } = await source();

  assert.match(html, /<a[^>]+class="skip-link"[^>]+href="#main-content"/i);
  assert.match(html, /<nav[^>]+aria-label="Primary"/i);
  assert.match(html, /<main[^>]+id="main-content"/i);
  assert.match(html, /<h1[\s>]/i);
  assert.match(html, /aria-label="Call Napa Auto Repair/i);
  assert.match(html, /aria-label="Get directions to Napa Auto Repair/i);
  assert.match(css, /:focus-visible/);
});

test("uses_the_shop_logo_in_header_and_footer", async () => {
  const { html, css } = await source();

  assert.equal((html.match(/<img class="brand-logo" src="assets\/napa-auto-repair-logo\.png" alt="">/g) ?? []).length, 2);
  assert.equal((html.match(/<span class="brand-name"><span>Napa<\/span> <span>Auto Repair<\/span><\/span>/g) ?? []).length, 2);
  assert.match(css, /\.brand-logo\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.brand-name\s*\{[^}]*color:\s*var\(--cream\)/s);
});

test("keeps_business_content_static", async () => {
  const { html } = await source();

  for (const service of [
    "Diagnostics",
    "Oil &amp; Maintenance",
    "Brakes &amp; Tires",
    "Engine Repair",
    "Suspension &amp; Steering",
    "Electrical &amp; Climate",
  ]) {
    assert.match(html, new RegExp(service));
  }

  assert.doesNotMatch(html, /<form[\s>]/i);
  assert.doesNotMatch(html, /sign[ -]?in|log[ -]?in/i);
  assert.doesNotMatch(html, /aggregateRating|reviewCount|ratingValue/i);
  assert.doesNotMatch(html, /five[- ]star|5[- ]star|★★★★★/i);
  assert.doesNotMatch(html, /class="review-stars"/i);
  assert.doesNotMatch(html, /<blockquote[\s>]|class="review-card"/i);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
});

test("service_cards_expand_to_reveal_a_call_action_without_hover_motion", async () => {
  const { html, css } = await source();

  assert.equal((html.match(/<details class="service-card">/g) ?? []).length, 6);
  assert.equal((html.match(/<summary>/g) ?? []).length, 6);
  assert.equal((html.match(/<h3 class="service-title">/g) ?? []).length, 6);
  assert.equal((html.match(/class="service-detail"/g) ?? []).length, 6);
  assert.equal((html.match(/class="service-cta" href="tel:\+19084166132"/g) ?? []).length, 6);
  assert.doesNotMatch(html, /service-card featured/);
  assert.match(css, /\.service-card\[open\]\s*\{/);
  assert.match(css, /\.service-card summary\s*\{[^}]*padding-inline-end:/s);
  assert.match(css, /\.service-card summary\s*\{[^}]*padding-bottom:/s);
  assert.doesNotMatch(css, /\.service-card:hover\s*\{[^}]*transform:/s);
});

test("buttons_use_restrained_nonzoom_interactions", async () => {
  const { css } = await source();

  assert.match(css, /\.button\s*\{[^}]*border-radius:/s);
  assert.match(css, /\.button\s*\{[^}]*box-shadow:/s);
  assert.doesNotMatch(css, /\.button[^,{]*:hover\s*\{[^}]*transform:\s*scale/s);
});

test("includes_responsive_and_focus_styles", async () => {
  const { html, css } = await source();

  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/i);
  assert.match(css, /@media\s*\(max-width:\s*48rem\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});
