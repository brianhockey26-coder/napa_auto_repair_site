# Napa Auto Repair Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publicly deploy a no-sign-in, crawler-accessible trilingual website for Napa Auto Repair on GitHub Pages that explains its services and makes calling or visiting easy.

**Architecture:** Use three static HTML sources—English at the root, Spanish under `es/`, and Simplified Chinese under `zh/`—with one shared stylesheet and no runtime translation dependency. A dependency-free Node build accepts the active public base URL, including an optional GitHub project path, injects route-specific canonical and structured-data URLs, and writes a deployable `dist/` directory containing all language routes, the stylesheet, `robots.txt`, and a multilingual `sitemap.xml`. A GitHub Actions workflow tests, builds, and deploys `dist/` to GitHub Pages; when a custom domain is configured, the same workflow rebuilds metadata for that domain.

**Tech Stack:** Semantic HTML5, modern CSS, Schema.org JSON-LD, Node.js built-in test runner, GitHub Actions, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-10-04-napa-auto-repair-site-design.md`

## Global Constraints

- Business name: Napa Auto Repair.
- Address: 1184 F Cozzens Ln, North Brunswick Township, NJ 08902.
- Phone display: +1 (908) 416-6132; phone URI: `tel:+19084166132`.
- Hours: Monday through Saturday, 8:30 AM–6:00 PM; Sunday closed.
- Present general auto repair services without implying the displayed list is exhaustive.
- Link to the shop's current Google reviews without embedding reviews or claiming a rating or review count.
- The production site must be public without authentication, CAPTCHA, or `noindex`.
- Host from a public GitHub repository with GitHub Pages and HTTPS; support both the initial GitHub Pages project URL and a later custom-domain root.
- Provide complete English, Spanish, and Simplified Chinese static routes with a keyboard-accessible EN / ES / 中文 switcher, translated metadata, and reciprocal `hreflang` links.
- Search and AI discovery are optimized but never described as guaranteed.
- Do not add booking, estimates, chat, accounts, payments, forms, tracking, persistence, or scheduled updates.

## Review Focus

- A visitor on a narrow phone viewport can read the first screen and use Call Now or Get Directions without horizontal scrolling; Tasks 1 and 3 assert responsive rules and run viewport QA.
- A keyboard-only visitor can identify focus and reach every navigation and action link; Task 1 asserts semantic anchors and visible focus styling, then performs keyboard QA.
- A text-only crawler can read the name, location, services, hours, phone, and Google-reviews link context without JavaScript in all three languages; Tasks 1 and 3 test the static HTML.
- A discovery crawler receives successful English, Spanish, and Chinese pages, crawler permission, canonical and `hreflang` metadata, and matching sitemap URLs; Tasks 2–4 test generated and deployed artifacts.
- Structured data never contradicts visible business facts or invents rating details; Task 2 parses JSON-LD and compares exact values while asserting rating fields are absent.
- Longer Spanish text and Chinese characters do not break the refined header, language switcher, cards, buttons, or hours layout; Task 3 tests all routes and performs responsive QA.

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

### Task 2: Generate Crawlable GitHub Pages Artifacts

**Files:**
- Create: `scripts/build.mjs`
- Create: `test/discoverability.test.mjs`
- Create: `test/github-pages.test.mjs`
- Create: `.github/workflows/deploy-pages.yml`
- Generate: `dist/index.html`
- Generate: `dist/styles.css`
- Generate: `dist/robots.txt`
- Generate: `dist/sitemap.xml`
- Modify: `package.json`

**Interfaces:**
- Consumes: `src/index.html`, `src/styles.css`, and a required CLI argument `--origin https://<public-host>/<optional-project-path>`.
- Produces: `dist/` with every `{{SITE_ORIGIN}}` token replaced by the normalized HTTPS base URL; crawler and sitemap files sharing that URL, plus a GitHub Pages deployment workflow.

- [ ] **Step 1: Write failing build and discoverability tests**

Create tests named `build_requires_valid_https_origin`, `build_preserves_optional_project_path`, `build_emits_complete_static_site`, `robots_allow_search_crawlers`, `sitemap_and_canonical_share_origin`, `structured_data_matches_visible_facts`, and `workflow_tests_builds_and_deploys_pages`. Build into temporary directories with origins `https://example.test` and `https://example.test/napa-auto-repair-website`; assert:

- `dist/index.html`, `styles.css`, `robots.txt`, and `sitemap.xml` exist.
- No `{{SITE_ORIGIN}}` token remains.
- Canonical, sitemap, and JSON-LD URL equal the supplied normalized base URL with a trailing slash, including the project path when present.
- `robots.txt` allows `Googlebot` and `OAI-SearchBot` and references `https://example.test/sitemap.xml`.
- JSON-LD parses as `AutoRepair` and contains the exact name, telephone, postal address, Monday–Saturday 08:30–18:00 schedule, and Sunday closure by omission.
- JSON-LD contains no `review`, `aggregateRating`, `ratingValue`, or `reviewCount`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL because `scripts/build.mjs` and deployment artifacts do not exist.

- [ ] **Step 3: Implement the dependency-free build**

Implement `export async function buildSite({ origin, outputDir })` in `scripts/build.mjs` and a CLI accepting `--origin` plus optional `--output`. Normalize to one HTTPS base URL with an optional path and trailing slash; reject non-HTTPS, query strings, fragments, or malformed URLs. Replace the token, copy CSS, and generate crawler files. Add `npm run build -- --origin <origin>`. Create a GitHub Actions workflow using the official checkout, setup-node, configure-pages, upload-pages-artifact, and deploy-pages actions; run `npm test`, build with `steps.pages.outputs.base_url`, and deploy `dist/`.

- [ ] **Step 4: Run tests and inspect the production output**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run build -- --origin https://example.test`

Expected: build exits 0; `rg '{{SITE_ORIGIN}}|noindex|aggregateRating|reviewCount' dist` finds no matches.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/build.mjs test/discoverability.test.mjs test/github-pages.test.mjs .github/workflows/deploy-pages.yml
git commit -m "feat: add crawler-friendly GitHub Pages build"
```

### Task 3: Add Static Trilingual Routes and Refine the Interface

**Files:**
- Create: `src/es/index.html`
- Create: `src/zh/index.html`
- Create: `test/localization.test.mjs`
- Modify: `src/index.html`
- Modify: `src/styles.css`
- Modify: `scripts/build.mjs`
- Modify: `test/discoverability.test.mjs`

**Interfaces:**
- Consumes: The English page structure and base-URL token contract from Tasks 1–2.
- Produces: Three complete static language routes with identical business facts and actions, reciprocal `hreflang` metadata, and a build that emits root, `es/`, and `zh/` pages plus a multilingual sitemap.

- [ ] **Step 1: Write failing localization and multilingual-discovery tests**

Create tests named `language_routes_are_complete_static_pages`, `language_switcher_links_equivalent_routes`, `language_metadata_is_reciprocal`, `translations_preserve_business_facts_and_actions`, `translations_avoid_rating_claims_and_forms`, and `build_emits_multilingual_routes_and_sitemap`. Assert each source has the correct `lang`, translated title/description/navigation/hero/services/reviews/visit copy, exact address/phone/hours, static call/directions/review actions, and EN / ES / 中文 links. Build with `https://example.test/napa-auto-repair-website`; assert root, `es/index.html`, and `zh/index.html` exist; each canonical and JSON-LD URL includes the correct route; all reciprocal `hreflang` links use the same base; and the sitemap includes all three URLs.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test`

Expected: localization tests FAIL because Spanish and Chinese pages and multilingual build behavior do not exist.

- [ ] **Step 3: Implement the static translations and refined language control**

Add complete, natural Spanish and Simplified Chinese HTML pages by translating user-facing copy while preserving the business name, address, phone, hours, actions, semantic structure, and structured-data facts. Add reciprocal `hreflang` links and an accessible language navigation labeled in each page's language. Refine the shared header, spacing, button hierarchy, service-card alignment, and phone behavior so the toggle remains clear at 390px and 1440px without hiding the call action.

- [ ] **Step 4: Extend the build and multilingual sitemap**

Update `buildSite({ origin, outputDir })` to process the three HTML sources, replace `{{SITE_ORIGIN}}` consistently, write the two nested route directories, and emit a sitemap containing all canonical URLs with XHTML language alternates for `en`, `es`, `zh-Hans`, and `x-default`.

- [ ] **Step 5: Run automated and responsive verification**

Run: `node --test`

Expected: all tests PASS.

Build for `https://example.test/napa-auto-repair-website`, serve `dist/`, inspect all three pages at approximately 390px and 1440px, exercise each language link with the keyboard, and confirm no horizontal scrolling, missing translations, or console errors.

- [ ] **Step 6: Commit**

```bash
git add src/index.html src/es/index.html src/zh/index.html src/styles.css scripts/build.mjs test/localization.test.mjs test/discoverability.test.mjs
git commit -m "feat: add trilingual static website"
```

### Task 4: Publish with GitHub Pages and Verify Public Access

**Files:**
- Configure: Public GitHub repository `napa-auto-repair-website`.
- Generate: `dist/*` in GitHub Actions using the active Pages base URL.

**Interfaces:**
- Consumes: Passing Tasks 1–3 and an authenticated GitHub account able to create and administer the public repository.
- Produces: A successful public GitHub Pages URL that requires no sign-in and is ready for a later custom-domain configuration.

- [ ] **Step 1: Create the public GitHub repository**

Confirm GitHub CLI authentication, create the public repository `napa-auto-repair-website` under the authenticated account, and add it as the local `origin`. Do not include credentials or secrets in the repository.

- [ ] **Step 2: Push the implementation and enable GitHub Pages**

Push the reviewed implementation as the repository's `main` branch, configure Pages to deploy through GitHub Actions, and dispatch the workflow if the push does not start it automatically.

Expected: the Pages workflow starts against the public repository without requiring visitor authentication.

- [ ] **Step 3: Wait for the Pages workflow**

Use GitHub's workflow status to wait for the exact deployment run triggered by the push.

Expected: the test, build, artifact upload, and Pages deployment jobs all succeed and return the public URL.

- [ ] **Step 4: Verify the live anonymous and crawler surface**

Using the successful deployment base URL, resolve and verify the English page, `es/`, `zh/`, `robots.txt`, and `sitemap.xml` beneath that base URL so the initial project-site path is preserved. Confirm they return successful responses without redirects to sign-in; all live HTML has no `noindex`; canonical, `hreflang`, and JSON-LD URLs match the deployed routes; `robots.txt` allows Googlebot and OAI-SearchBot; and the sitemap contains the same three canonical URLs. The missing origin-root `robots.txt` on an initial project URL is acceptable because absence means crawling is allowed; once a custom domain is mapped, the deployed file becomes the origin-root `robots.txt`.

- [ ] **Step 5: Record the custom-domain handoff**

Document that after purchasing the domain, the owner should verify it in GitHub, add it under repository Settings → Pages before changing DNS, configure the provider's apex and `www` records, enforce HTTPS, and rerun the Pages workflow so canonical, sitemap, and JSON-LD URLs use the custom domain. Do not create a `CNAME` file because the deployment uses a custom GitHub Actions workflow.

- [ ] **Step 6: Handoff**

Open the successful GitHub Pages site in Codex when available and return the literal public URL, noting that it is ready to view and share without sign-in. Mention custom-domain setup, Google Business Profile verification, and Search Console sitemap submission as later owner-account follow-ups, not blockers to the initial GitHub Pages launch.
