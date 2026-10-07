# Professional Site and Repair Advisor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a formal, premium-but-accessible Napa Auto Repair website and a stronger local repair-advisor experience.

**Architecture:** Static HTML keeps durable business content crawler-visible on all three language routes. The deterministic repair engine remains the source of safety and question logic; a small pure advisor module derives visit preparation from its result, and the DOM controller presents it safely. CSS refines existing layout primitives rather than replacing the site framework.

**Tech Stack:** Semantic HTML, CSS, browser ES modules, Node test runner, Playwright/Chrome, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-06-professional-site-and-advisor-design.md`

## Global Constraints

- Keep the site public, static, responsive, accessible, and usable with no sign-in.
- Use no runtime API, backend, tracker, account, or external customer-data request.
- Preserve address, phone, business hours, Sunday closure, Google Maps review/directions links, schema, canonical URLs, and language routes.
- Do not claim ratings, certifications, warranties, prices, availability, or a definitive diagnosis.
- Keep advice safety-first; advisor content must never reduce engine urgency or replace mechanic inspection.
- Customer-facing copy exists in English, Spanish, and Simplified Chinese; use direct, formal, understandable wording.

## Review Focus

- Active hazards with a benign topic must retain emergency/safety instructions and receive no routine-preparation language; test in Task 2.
- Ambiguous or untranslated advisor data must render a conservative generic preparation brief rather than blank or invented detail; test in Task 2.
- Each static language route must retain all visible shop facts and public discovery metadata after editorial updates; test in Task 1.
- Mobile result cards must not overflow at 375px and must preserve a visible call action; test in Task 4.
- Literal markup submitted into chat or copied into the summary must be displayed as text, never DOM; preserve and run the existing browser safety case in Task 4.

---

### Task 1: Formal multilingual site copy and service standards

**Files:**
- Modify: `src/index.html`, `src/es/index.html`, `src/zh/index.html`
- Modify: `test/page-content.test.mjs`, `test/localization.test.mjs`, `test/discoverability.test.mjs`

**Interfaces:**
- Consumes: current static site sections and all existing visible business facts.
- Produces: crawler-visible, professional service/visit/helper language and a `.service-standards` section on every route.

- [ ] **Step 1: Write failing static-page assertions**

Assert every route contains a local-language service-standard heading, a formal helper description, the exact phone/address/hours, and no removed casual hero/helper phrases.

- [ ] **Step 2: Run the targeted static-page tests to verify they fail**

Run: `node --test test/page-content.test.mjs test/localization.test.mjs test/discoverability.test.mjs`
Expected: FAIL because the professional service-standard content is absent.

- [ ] **Step 3: Replace casual copy and add static service standards**

Use one short three-item expectations panel per route: evaluation, findings/next steps, and call-before-arrival. Keep claims procedural and non-promissory.

- [ ] **Step 4: Run targeted static-page tests to verify they pass**

Run: `node --test test/page-content.test.mjs test/localization.test.mjs test/discoverability.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/index.html src/es/index.html src/zh/index.html test/page-content.test.mjs test/localization.test.mjs test/discoverability.test.mjs
git commit -m "feat: refine professional site copy and service standards"
```

### Task 2: Pure visit-preparation advisor layer

**Files:**
- Create: `src/assets/repair-helper/advisor.js`
- Modify: `src/assets/repair-helper/locales.js`
- Modify: `test/repair-helper-detail.test.mjs`

**Interfaces:**
- Consumes: `{level, emergency, topics, services, possibilities, unresolved}` from `assess(state)`.
- Produces: `buildAdvisorBrief(result) -> {service, checklist, questions, caution}` using stable locale-independent IDs.

- [ ] **Step 1: Write failing advisor tests**

Add tests for routine maintenance, braking vibration, unresolved symptom, prompt/safety concern, and active emergency. Assert emergency returns only a safety/assistance caution, and unknown topic returns a generic diagnostic preparation list.

- [ ] **Step 2: Run advisor tests to verify they fail**

Run: `node --test test/repair-helper-detail.test.mjs`
Expected: FAIL because `advisor.js` and `buildAdvisorBrief` do not exist.

- [ ] **Step 3: Implement `buildAdvisorBrief(result)`**

Map stable services/topics to preparation IDs. For level 3/emergency, omit normal checklist/questions and return an assistance-first caution. For other results, emit at most three checklist and three question IDs; use a generic diagnostic brief when facts are unresolved.

- [ ] **Step 4: Add localized advisor copy**

Add `advisor` labels and item maps to `locales.js` through the same English/Spanish/Chinese `pick` pattern used by cause copy.

- [ ] **Step 5: Run advisor tests to verify they pass**

Run: `node --test test/repair-helper-detail.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/assets/repair-helper/advisor.js src/assets/repair-helper/locales.js test/repair-helper-detail.test.mjs
git commit -m "feat: add repair advisor visit preparation"
```

### Task 3: Render the advisor result and refine chat guidance

**Files:**
- Modify: `src/assets/repair-helper/app.js`
- Modify: `src/assets/repair-helper/locales.js`
- Modify: `src/styles.css`
- Modify: `test/repair-helper-build.test.mjs`

**Interfaces:**
- Consumes: `buildAdvisorBrief(assess(state))` and `locales[lang].advisor`.
- Produces: an accessible result section with preparation checklist, questions for the shop, and conservative caution handling.

- [ ] **Step 1: Write failing build/static assertions**

Assert the assistant imports advisor logic, references the preparation heading, and retains no script-required site facts in the static page.

- [ ] **Step 2: Run the targeted helper build test to verify it fails**

Run: `node --test test/repair-helper-build.test.mjs`
Expected: FAIL because advisor rendering is absent.

- [ ] **Step 3: Render advisor content with `textContent`**

Call `buildAdvisorBrief(result)` only in `renderResult`. Render a semantic labelled section after possible causes. Suppress routine preparation when the advisor brief is emergency/safety-first. Include brief IDs in the copyable summary.

- [ ] **Step 4: Refine result and service-standard styling**

Use the existing tokens and compact cards; add clear spacing, ordered checklist styling, and 375px-safe wrapping. Do not add hover-only interactions or auto-zoom effects.

- [ ] **Step 5: Run the targeted helper build test to verify it passes**

Run: `node --test test/repair-helper-build.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/assets/repair-helper/app.js src/assets/repair-helper/locales.js src/styles.css test/repair-helper-build.test.mjs
git commit -m "feat: present tailored service advisor brief"
```

### Task 4: Full regression, browser QA, and release

**Files:**
- Modify: `scripts/verify-helper.mjs`
- Modify: `docs/superpowers/plans/2026-10-06-professional-site-and-advisor.md`

**Interfaces:**
- Consumes: published static output from `scripts/build.mjs` and the completed advisor UI.
- Produces: regression evidence, a published GitHub Pages release, and public-domain verification.

- [ ] **Step 1: Extend browser verification**

Add normal and urgent advisor-brief assertions in English, and verify Spanish/Chinese route rendering, mobile width, call link, literal-markup safety, no external assistant requests, and no-JavaScript fallback.

- [ ] **Step 2: Run the full test suite and build**

Run: `node --test && node scripts/build.mjs --origin https://napaautorepairnj.com/`
Expected: all tests pass and `dist` is generated.

- [ ] **Step 3: Run real-browser verification**

Run: `NAPA_PLAYWRIGHT_MODULE=/Users/brianmiao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs node scripts/verify-helper.mjs`
Expected: English, Spanish, Chinese, mobile, urgency, no-JS, and no-external-request checks pass.

- [ ] **Step 4: Commit and publish the verified release**

```bash
git add scripts/verify-helper.mjs docs/superpowers/plans/2026-10-06-professional-site-and-advisor.md
git commit -m "test: verify professional service advisor release"
git push origin HEAD:refs/heads/main
```

- [ ] **Step 5: Verify deployment and public output**

Confirm the GitHub Pages workflow succeeds for the pushed SHA, then load `https://napaautorepairnj.com/`, `/es/`, and `/zh/` and verify the advisor module and formal service standard are public.
