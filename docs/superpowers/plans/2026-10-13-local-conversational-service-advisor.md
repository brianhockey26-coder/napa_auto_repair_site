# Local Conversational Service Advisor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a natural, fully local repair-service chat that understands free-text vehicle concerns, provides evidence-aware explanations, and safely prepares customers for a Napa Auto Repair visit.

**Architecture:** A new pure conversation module converts a local state and one customer message into a structured next turn. It delegates symptom facts, urgency, questions, and supported possibilities to the existing deterministic engine; `app.js` becomes a transcript-oriented UI that renders those turns and retains no data beyond the current page session. Locales own every customer-facing message and the advisor module remains the preparation-list authority.

**Tech Stack:** Static ES modules, browser DOM APIs, Node's built-in test runner, Playwright, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-13-local-conversational-service-advisor-design.md`

## Global Constraints

- Keep the feature public, no-sign-in, static, fully local, and free of API keys, model downloads, server calls, analytics, and runtime cost.
- Keep `engine.js` as the risk and emergency authority; conversational code may never lower its urgency or override safety-only routing.
- Render visitor text through `textContent`; accept at most 1,000 characters per customer message and never persist it after reset or page reload.
- Support English `/`, Spanish `/es/`, and Simplified Chinese `/zh/` with no untranslated customer-facing strings.
- Preserve exact business facts, neutral Google review link, crawler metadata, service-card entry links, responsive layout, keyboard behavior, and no-JavaScript phone fallback.
- Frame all causes as possibilities, state that inspection/testing is required, and never estimate price, availability, or a guaranteed repair.

## Review Focus

- A message containing a current severe hazard plus an ordinary question must interrupt the chat immediately with safety-only guidance; tested in Task 1.
- A historical severe symptom must use conditional wording instead of falsely claiming a current emergency; tested in Task 1.
- A correction such as "not the brakes; it only shakes at idle" must replace the stale inference rather than preserve it; tested in Task 1.
- Markup-like customer text must remain literal in the transcript and summary; tested in Task 3.
- A typed Spanish or Chinese cause/urgency question must use local language output and must not issue an external request; tested in Task 4.

---

### Task 1: Pure local conversation turns

**Files:**
- Create: `src/assets/repair-helper/conversation.js`
- Modify: `src/assets/repair-helper/chat.js`
- Test: `test/repair-helper-conversation.test.mjs`

**Interfaces:**
- Consumes: `assess(state)` and `interpret(text)` from `engine.js`, `buildAdvisorBrief(result)` from `advisor.js`, and localized strings supplied by the caller.
- Produces: `createConversationState(locale) -> ConversationState` and `replyToMessage(state, raw, copy) -> ConversationTurn`.
- `ConversationState` has `{text:string, vehicle:string, topics:string[], answers:Record<string,string>, messages:ChatMessage[], corrections:string[]}`. `ConversationTurn` has `{state:ConversationState, kind:'reply'|'question'|'safety'|'clarify'|'summary', messageKeys:string[], result:AssessResult, brief:AdvisorBrief, nextQuestion:string|null}`.

- [ ] **Step 1: Write failing conversation tests**

```js
test('free-text brake symptom yields a supported possibility and one useful question',()=>{
 const turn=replyToMessage(createConversationState('en'),'My steering wheel shakes only when I brake',locales.en);
 assert.equal(turn.kind,'question');
 assert.ok(turn.result.possibilities.some(({id})=>id==='rotors'));
 assert.equal(turn.nextQuestion,'safety');
});
test('current fuel smell interrupts a normal chat with safety-only guidance',()=>{
 const turn=replyToMessage(createConversationState('en'),'Can I drive if I smell gasoline now?',locales.en);
 assert.equal(turn.kind,'safety');assert.equal(turn.brief.mode,'safety');
});
```

Also add the Review Focus historical and correction cases, plus a code question (`P0171`) and an ambiguous-message clarification.

- [ ] **Step 2: Run the conversation tests to verify they fail**

Run: `node --test test/repair-helper-conversation.test.mjs`

Expected: FAIL because `conversation.js` does not exist.

- [ ] **Step 3: Implement local intent and state transitions**

Implement `createConversationState(locale)` and `replyToMessage(state, raw, copy)` in `conversation.js`. Classify a message as symptom/fact, cause question, urgency question, inspection question, code question, summary request, correction, or clarification. Merge only recognized current facts into state, rebuild `result` with `assess`, return safety before any ordinary response, and retain the transcript in `messages`. Add narrowly scoped `matchIntent(raw)` and correction recognition to `chat.js`; ambiguous text returns clarification rather than a guess.

- [ ] **Step 4: Run the conversation tests to verify they pass**

Run: `node --test test/repair-helper-conversation.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the conversation core**

```bash
git add src/assets/repair-helper/conversation.js src/assets/repair-helper/chat.js test/repair-helper-conversation.test.mjs
git commit -m "feat: add local repair conversation engine"
```

### Task 2: Evidence-aware local response content

**Files:**
- Modify: `src/assets/repair-helper/knowledge.js`
- Modify: `src/assets/repair-helper/cause-copy.js`
- Modify: `src/assets/repair-helper/locales.js`
- Test: `test/repair-helper-conversation.test.mjs`

**Interfaces:**
- Consumes: `ConversationTurn.result.possibilities`, `ConversationTurn.result.level`, `ConversationTurn.brief`, and locale key lookups.
- Produces: `locale.conversation` with localized welcome, suggested prompts, intent replies, question framing, uncertainty, code explanation, safety preface, and summary labels; each `possibleProblems` ID has complete localized cause copy.

- [ ] **Step 1: Write failing localization and explanation tests**

```js
test('a diagnostic-code turn explains the system without naming a failed part',()=>{
 const turn=replyToMessage(createConversationState('en'),'My check-engine light has code P0171',locales.en);
 assert.match(renderTurnText(turn,locales.en),/air|fuel|intake/i);
 assert.match(renderTurnText(turn,locales.en),/does not identify.*part/i);
});
test('conversation strings are complete in every supported locale',()=>{
 for(const locale of Object.values(locales))assert.ok(locale.conversation.summaryRequest);
});
```

Add assertions that possible-cause text explains what supports it and what a technician checks, and that Spanish/Chinese code and urgency replies do not fall back to English.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `node --test test/repair-helper-conversation.test.mjs`

Expected: FAIL because `conversation` locale content and code explanation are incomplete.

- [ ] **Step 3: Add concise, evidence-aware localized content**

Populate `locale.conversation` for English, Spanish, and Simplified Chinese. Add system-level explanations for the supported P030x, P0171/P0174, P0420, and P0440–P0457 code groups. Keep responses specific to brake/tire, battery/starting, engine/light, heat/fluid, steering/suspension, climate, and maintenance topics; every response must say that inspection/testing confirms the cause. Do not add rates, appointments, claims of certainty, or translated duplicates.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `node --test test/repair-helper-conversation.test.mjs test/repair-helper-detail.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the response content**

```bash
git add src/assets/repair-helper/knowledge.js src/assets/repair-helper/cause-copy.js src/assets/repair-helper/locales.js test/repair-helper-conversation.test.mjs
git commit -m "feat: expand local repair chat guidance"
```

### Task 3: Transcript-first chat interface

**Files:**
- Modify: `src/assets/repair-helper/app.js`
- Modify: `src/styles.css`
- Modify: `test/repair-helper-build.test.mjs`
- Test: `test/repair-helper-conversation.test.mjs`

**Interfaces:**
- Consumes: `createConversationState(locale)` and `replyToMessage(state, raw, copy)` from `conversation.js`.
- Produces: an accessible chat UI with `[data-chat-transcript]`, `#rh-reply`, suggested-prompt buttons, summary/call controls, and static phone fallback.

- [ ] **Step 1: Write failing UI-contract tests**

```js
test('built pages include the local conversation module and transcript controls',async()=>{
 const output=await buildFixture();
 assert.match(await readFile(`${output}/assets/repair-helper/app.js`,'utf8'),/replyToMessage/);
 assert.match(await readFile(`${output}/styles.css`,'utf8'),/rh-chat-transcript/);
});
```

Add a unit assertion that a literal `<img>` message remains text in a rendered transcript record.

- [ ] **Step 2: Run the UI-contract tests to verify they fail**

Run: `node --test test/repair-helper-build.test.mjs test/repair-helper-conversation.test.mjs`

Expected: FAIL because the current UI has no conversation module or transcript contract.

- [ ] **Step 3: Replace quiz-first rendering with transcript-first rendering**

Refactor `app.js` to initialize `ConversationState`, append visitor and assistant messages from each `ConversationTurn`, render exactly one suggested next question when `nextQuestion` exists, and keep optional prompt buttons for common starts. Enter submits and Shift+Enter adds a line. Keep edit/reset, result, visit-preparation, copy, call, and service-card entry behavior; render emergency turns without routine result groups. Use `aria-live` for newly appended assistant messages and keep `textContent` in the node helper.

Add restrained CSS for `.rh-chat-transcript`, `.rh-message`, `.rh-suggestions`, and a sticky-safe composer without hover-only interaction or horizontal overflow at 375px.

- [ ] **Step 4: Run UI and safety tests to verify they pass**

Run: `node --test test/repair-helper-build.test.mjs test/repair-helper-conversation.test.mjs test/repair-helper-detail.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the chat interface**

```bash
git add src/assets/repair-helper/app.js src/styles.css test/repair-helper-build.test.mjs test/repair-helper-conversation.test.mjs
git commit -m "feat: present repair advisor as a local chat"
```

### Task 4: End-to-end multilingual and production verification

**Files:**
- Modify: `scripts/verify-helper.mjs`
- Modify: `test/localization.test.mjs`
- Modify: `test/page-content.test.mjs`

**Interfaces:**
- Consumes: built `/`, `/es/`, and `/zh/` pages and their local helper assets.
- Produces: browser evidence that the chat handles natural turns, safety interruption, localized output, mobile/keyboard/no-JS behavior, and no external helper requests.

- [ ] **Step 1: Write failing browser-verification assertions for the conversation**

Add a transcript scenario that types a free-text brake concern, asks what may cause it, adds a correction, requests visit preparation, and checks the summary. Add localized typed cause/urgency prompts in Spanish and Chinese, then assert no cross-origin requests. Retain existing explicit emergency, literal-markup, clipboard-denied, mobile, service-card entry, and no-JavaScript fallback checks.

- [ ] **Step 2: Run the browser verifier to verify it fails**

Run: `NAPA_PLAYWRIGHT_MODULE=/Users/brianmiao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs node scripts/verify-helper.mjs`

Expected: FAIL until the transcript-first UI and locale output are present.

- [ ] **Step 3: Update static and browser assertions for the completed conversation**

Update `scripts/verify-helper.mjs`, localization tests, and content tests to use the final semantic selectors and formal localized copy. Preserve checks for exact shop facts, crawler artifacts, no rating claims, and no data collection.

- [ ] **Step 4: Run the complete verification suite**

Run: `node --test && node scripts/build.mjs --origin https://napaautorepairnj.com/ && NAPA_PLAYWRIGHT_MODULE=/Users/brianmiao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs node scripts/verify-helper.mjs`

Expected: all automated tests pass, static build succeeds, and browser output reports every language, emergency, transcript, mobile, keyboard, no-JS, literal-text, clipboard, and no-external-request check as `PASS`.

- [ ] **Step 5: Commit verified browser coverage**

```bash
git add scripts/verify-helper.mjs test/localization.test.mjs test/page-content.test.mjs
git commit -m "test: verify local conversational service advisor"
```

- [ ] **Step 6: Publish and verify the live domain**

Push the completed branch to `main`, wait for the GitHub Pages workflow to conclude successfully, then run the browser verifier against `https://napaautorepairnj.com`. Confirm HTTP 200 for `/`, `/es/`, `/zh/`, and the new conversation asset before reporting release completion.
