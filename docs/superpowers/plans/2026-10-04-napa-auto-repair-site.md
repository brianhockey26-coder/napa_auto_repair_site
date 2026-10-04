# Napa Auto Repair Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publicly deploy a no-sign-in, crawler-accessible one-page website for Napa Auto Repair that explains its services and makes calling or visiting easy.

**Architecture:** Use a small static site generated from source HTML and CSS by a dependency-free Node build script. The build accepts the registered public Site origin, injects canonical and structured-data URLs, and writes a deployable `dist/` directory containing the page, stylesheet, `robots.txt`, and `sitemap.xml`.

**Tech Stack:** Semantic HTML5, modern CSS, Schema.org JSON-LD, Node.js built-in test runner, OpenAI Sites static hosting

**Spec:** `docs/superpowers/specs/2026-10-04-napa-auto-repair-site-design.md`

## Global Constraints

- Business name: Napa Auto Repair.
- Address: 1184 F Cozzens Ln, North Brunswick Township, NJ 08902.
- Phone display: +1 (908) 416-6132; phone URI: `tel:+19084166132`.
- Hours: Monday through Saturday, 8:30 AM–6:00 PM; Sunday closed.
- Present general auto repair services without implying the displayed list is exhaustive.
- Link to the shop's current Google reviews without embedding reviews or claiming a rating or review count.
- The production site must be public without authentication, CAPTCHA, or `noindex`.
- Search and AI discovery are optimized but never described as guaranteed.
- Do not add booking, estimates, chat, accounts, payments, forms, tracking, persistence, or scheduled updates.

## Review Focus

- A visitor on a narrow phone viewport can read the first screen and use Call Now or Get Directions without horizontal scrolling; Task 1 asserts responsive rules and runs viewport QA.
- A keyboard-only visitor can identify focus and reach every navigation and action link; Task 1 asserts semantic anchors and visible focus styling, then performs keyboard QA.
- A text-only crawler can read the name, location, services, hours, phone, and Google-reviews link context without JavaScript; Task 1 tests the generated HTML text.
- A discovery crawler receives a successful public page, crawler permission, a canonical URL, and a matching sitemap URL; Tasks 2 and 3 test generated and deployed artifacts.
- Structured data never contradicts visible business facts or invents rating details; Task 2 parses JSON-LD and compares exact values while asserting rating fields are absent.

---

### Task 1: Build the Responsive Customer-Facing Page

**Files:**
- Create: `src/index.html`
- Create: `src/styles.css`
- Create: `test/page-content.test.mjs`
- Create: `package.json`

**Interfaces:**
- Consumes: Exact business facts and visual direction from the approved specification.
- Produces: `src/index.html` containing the token `{{SITE_ORIGIN}}`; `src/styles.css`; an `npm test` command using `node --test`.

- [ ] **Step 1: Write the failing content and accessibility tests**

Create tests named `renders_exact_business_facts`, `offers_primary_customer_actions`, `uses_semantic_accessible_structure`, `keeps_business_content_static`, and `includes_responsive_and_focus_styles`. Assert the source contains the exact name, address, display phone, `tel:+19084166132`, hours, representative general-repair categories, neutral Google review wording, `main`/`nav`/heading landmarks, skip link, labeled external actions, `:focus-visible`, and a narrow-screen media query. Assert there is no form, login text, embedded review, rating claim, review quotation, aggregate rating, or script-dependent business copy.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`

Expected: FAIL because the page and stylesheet do not exist.

- [ ] **Step 3: Implement the page and visual system**

Create a single-page layout with sticky header, hero, service categories, a neutral “See what customers are saying on Google” trust section linked to the current Google reviews, visit/hours section, and footer. Use the approved deep navy, warm cream, and Napa-red palette; a crisp garage-inspired type hierarchy; responsive two-column-to-single-column layout; reduced-motion support; and embedded data-URI SVG favicon. Keep all important business copy in HTML and use only anchor links for interactions.

- [ ] **Step 4: Run tests and manual viewport/keyboard checks**

Run: `npm test`

Expected: all Task 1 tests PASS.

Serve `src/` locally, inspect at approximately 390px and 1440px widths, tab through all interactive elements, and confirm no horizontal scrolling and visible focus on every link.

- [ ] **Step 5: Commit**

```bash
git add package.json src/index.html src/styles.css test/page-content.test.mjs
git commit -m "feat: build Napa Auto Repair landing page"
```

### Task 2: Generate Crawlable Deployment Artifacts

**Files:**
- Create: `scripts/build.mjs`
- Create: `test/discoverability.test.mjs`
- Create: `.openai/hosting.json`
- Generate: `dist/index.html`
- Generate: `dist/styles.css`
- Generate: `dist/robots.txt`
- Generate: `dist/sitemap.xml`
- Modify: `package.json`

**Interfaces:**
- Consumes: `src/index.html`, `src/styles.css`, and a required CLI argument `--origin https://<registered-public-host>`.
- Produces: `dist/` with every `{{SITE_ORIGIN}}` token replaced by the normalized HTTPS origin; crawler and sitemap files sharing that origin.

- [ ] **Step 1: Write failing build and discoverability tests**

Create tests named `build_requires_valid_https_origin`, `build_emits_complete_static_site`, `robots_allow_search_crawlers`, `sitemap_and_canonical_share_origin`, and `structured_data_matches_visible_facts`. Build into a temporary directory with origin `https://example.test`; assert:

- `dist/index.html`, `styles.css`, `robots.txt`, and `sitemap.xml` exist.
- No `{{SITE_ORIGIN}}` token remains.
- Canonical, sitemap, and JSON-LD URL equal `https://example.test/`.
- `robots.txt` allows `Googlebot` and `OAI-SearchBot` and references `https://example.test/sitemap.xml`.
- JSON-LD parses as `AutoRepair` and contains the exact name, telephone, postal address, Monday–Saturday 08:30–18:00 schedule, and Sunday closure by omission.
- JSON-LD contains no `review`, `aggregateRating`, `ratingValue`, or `reviewCount`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL because `scripts/build.mjs` and deployment artifacts do not exist.

- [ ] **Step 3: Implement the dependency-free build**

Implement `export async function buildSite({ origin, outputDir })` in `scripts/build.mjs` and a CLI accepting `--origin` plus optional `--output`. Normalize to one HTTPS origin with no path or trailing slash; reject non-HTTPS or malformed origins. Replace the token, copy CSS, and generate crawler files. Add `npm run build -- --origin <origin>` and configure `.openai/hosting.json` with `static.directory` set to `dist`.

- [ ] **Step 4: Run tests and inspect the production output**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run build -- --origin https://example.test`

Expected: build exits 0; `rg '{{SITE_ORIGIN}}|noindex|aggregateRating|reviewCount' dist` finds no matches.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/build.mjs test/discoverability.test.mjs .openai/hosting.json
git commit -m "feat: add crawler-friendly static site build"
```

### Task 3: Register, Publish, and Verify Public Access

**Files:**
- Modify: `.openai/hosting.json` with the registered Site `project_id`.
- Generate: `dist/*` using the final registered public origin.

**Interfaces:**
- Consumes: Passing Tasks 1–2, the approved public audience, and the registered Sites project ID and origin.
- Produces: A successful public Sites deployment URL that requires no sign-in.

- [ ] **Step 1: Register the new Site for public deployment**

Follow the Sites registration workflow, choose a public audience, record only the returned `project_id` in `.openai/hosting.json`, and retain the returned credential in session memory rather than in files or command arguments.

- [ ] **Step 2: Build against the final public origin**

Run: `npm run build -- --origin <registered-public-origin>`

Expected: exit 0, with canonical, sitemap, robots, and JSON-LD URLs using the exact registered origin.

- [ ] **Step 3: Run the full pre-publish verification**

Run: `npm test`

Expected: all tests PASS.

Run the static Sites workflow with the build command and archive path required by the hosting skill.

Expected: it returns a verified commit SHA and deployable archive for the registered project.

- [ ] **Step 4: Save and deploy to the public audience**

Save the verified archive as a Site version, deploy that version publicly, and poll the same deployment ID until status is `succeeded` with a URL.

- [ ] **Step 5: Verify the live anonymous and crawler surface**

Using the successful deployment URL, verify the home page, `/robots.txt`, and `/sitemap.xml` return successful responses without redirects to sign-in. Confirm the live HTML has no `noindex`, its canonical and JSON-LD URL match the deployed origin, `robots.txt` allows Googlebot and OAI-SearchBot, and the sitemap contains the same canonical URL.

- [ ] **Step 6: Commit the registered manifest**

```bash
git add .openai/hosting.json
git commit -m "chore: register public Napa Auto Repair site"
```

- [ ] **Step 7: Handoff**

Open the successful Site in Codex when available and return the literal public URL, noting that it is ready to view and share without sign-in. Mention Google Business Profile verification and Search Console sitemap submission only as optional owner-account follow-ups, not as blockers to delivery.
