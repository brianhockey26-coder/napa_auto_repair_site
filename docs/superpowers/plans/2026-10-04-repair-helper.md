# Repair Helper Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline. The user explicitly requested coding and publishing without another design checkpoint.

**Goal:** Add a capable multilingual repair decision helper to the public website, without an API.
**Architecture:** Separate a pure symptom/risk engine, reviewed question knowledge, locale copy, and a browser controller. Enhance static content on all three existing routes and preserve GitHub Pages hosting.
**Tech Stack:** Native JavaScript modules, HTML, CSS, Node test runner.
**Spec:** docs/superpowers/specs/2026-10-04-repair-helper-design.md

## Global Constraints

- English, Spanish, and Chinese; no API, remote model, authentication, or symptom uploads.
- 1,000-character input limit; at most six questions before provisional results.
- Highest urgency wins across symptoms; no diagnosis or safe-driving certification.
- Preserve business facts, static discoverability, and existing customer actions.

## Review Focus

- Negated or historical hazards must not be represented as confirmed current hazards.
- Editing/restarting must remove stale answers and recommendations.
- Spanish/Chinese must provide complete decisions, not only translated headings.
- Typed markup must remain literal text; copy failure must leave a selectable summary.
- Unrecognized input and unknown answers must lead to clarification or professional advice.

### Task 1: Decision engine and knowledge

Files: test/repair-helper.test.mjs; src/assets/repair-helper/engine.js; knowledge.js; locales.js.
Interfaces: interpret(text) returns topics/facts; assess({text,topics,answers}) returns level/reasons/services/questions/unknown. Locale keys are identical in all languages.
- [ ] Add hand-derived scenario tests for urgency, topic recognition, negation, historical hazards, multiple symptoms, and locale parity.
- [ ] Run tests and observe missing engine failure.
- [ ] Implement normalize/interpret/assess and topic questions with separate locale copy.
- [ ] Run scenario suite; expected zero failures.

### Task 2: Accessible browser flow and integration

Files: src/assets/repair-helper/app.js; styles.css; src/index.html; src/es/index.html; src/zh/index.html; scripts/build.mjs; existing static tests.
Interfaces: consume Task 1 exports; mount on #repair-helper; service links select topics.
- [ ] Verify built pages include helper fallback and all local module assets; update obsolete prohibition on all scripts to allow only the local helper module.
- [ ] Implement topic selection, symptom input, six-step question flow, editable answers, results, copy, restart, and service entry links.
- [ ] Run complete site suite and build; expected zero failures and local modules emitted.
- [ ] Browser-check Chinese and English flows, narrow layout, keyboard focus, reset, and literal markup.

### Task 3: Review and release

- [ ] Review full change with a fresh reviewer; resolve important findings with regression tests.
- [ ] Commit only this feature's files, push the verified commit to main as requested, and monitor Pages deployment.
- [ ] Verify the public main domain and all three routes expose the helper and its assets.

## Execution record

Ruling: Proceed inline after writing this plan rather than asking for another approval. The user explicitly instructed expanding capabilities and coding into the main link.
Ruling: Reuse the existing managed isolated worktree; it is clean and based on the deployed commit plus the approved specification.
