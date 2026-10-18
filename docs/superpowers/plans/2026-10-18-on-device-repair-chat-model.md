# On-device Repair Chat Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional browser-model explanations to the multilingual repair chat, with explicit download consent and authoritative deterministic safety guidance.

**Architecture:** Keep the existing assessment engine and conversation state. Isolate WebLLM loading and inference in an adapter, coordinate asynchronous work in a chat controller, and render model explanations separately from the deterministic response.

**Tech Stack:** Static JavaScript ES modules, WebLLM/WebGPU, Node test runner, Playwright, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-18-on-device-repair-chat-model-design.md`

## Global Constraints

- No account, API key, paid AI service, customer-data collection, or server-side chat endpoint.
- Runtime and model requests begin only after explicit visitor activation; inference stays in the browser.
- Active level-3 safety results bypass model inference and retain existing emergency/assistance guidance.
- English, Spanish, and Simplified Chinese controls, status messages, and examples.
- Static business information, phone actions, and no-JavaScript access remain available.
- Model loading or generation failure preserves the transcript and standard local advisor.

## Review Focus

- Unsupported WebGPU or denied GPU access: explain availability and retain standard chat (Task 1).
- Download or generation failure: release pending state and allow continued chat (Tasks 1–2).
- Hazard arrives while a prior reply generates: render safety immediately and discard stale output (Task 2).
- Reset during generation: prevent the old completion from reappearing (Task 2).
- Empty, oversized, or HTML-like model output: bound output, use literal text, and retain deterministic advice (Tasks 1–3).

### Task 1: Browser-model adapter

**Files:** Create `src/assets/repair-helper/local-model.js`; create `test/repair-helper-local-model.test.mjs`.

**Interfaces:** Export `supportsLocalModel(environment = globalThis) -> boolean`, `selectLocalModel(modelList) -> modelId`, `buildModelMessages({locale, messages, assessment, guidance}) -> Array|null`, and `createLocalModel({onProgress, loadRuntime, environment}) -> Promise<{reply(context): Promise<string>, interrupt(): void, dispose(): Promise<void>}>`. `messages` contains literal `{role, content}` entries; `assessment` is the engine result. `buildModelMessages` returns null for active level-3 assessments.

- [ ] Write failing tests for unavailable GPU, explicit loader invocation, rejected initialization, null prompt on active level 3, bounded conversation history, language instruction, blank completion rejection, and bounded output.
- [ ] Run `node --test test/repair-helper-local-model.test.mjs`; confirm the missing adapter causes failure.
- [ ] Verify current WebLLM official documentation and supported model configuration. Pin the runtime version and one small multilingual model ID; document its expected download requirement. Do not silently select a larger model. Implement the adapter with injected runtime loading for tests and no module-load network requests.
- [ ] Run the adapter tests; require all cases to pass. Commit adapter and tests.

### Task 2: Chat controller and safety precedence

**Files:** Create `src/assets/repair-helper/chat-controller.js`; create `test/repair-helper-chat-controller.test.mjs`; modify `conversation.js` only if needed for literal rendered messages.

**Interfaces:** Export `createChatController({locale, copy, loadModel, onChange}) -> {send(text): Promise<void>, enableModel(): Promise<void>, reset(): void, dispose(): Promise<void>, snapshot(): object}`. Snapshots contain conversation state, literal display messages, model status (`off`, `loading`, `ready`, `unavailable`, `error`), progress, and generation status. `loadModel` uses Task 1's adapter; deterministic replies are localized before entering model context.

- [ ] Write failing tests proving no load before activation, preserved transcript after load failure, deterministic response before generation, zero model calls on active hazards, stale completion discarded after a new hazard or reset, and recovery after generation rejection.
- [ ] Run `node --test test/repair-helper-chat-controller.test.mjs`; confirm expected failure.
- [ ] Implement generation tokens and interruption. Run assessment synchronously before awaiting the model; accept fresh safety input during generation. Preserve authoritative action text outside model output. Reset clears conversation and invalidates pending work while retaining an already loaded model.
- [ ] Run controller and existing conversation tests; commit the controller and tests.

### Task 3: Multilingual chat interface

**Files:** Modify `src/assets/repair-helper/app.js`, `src/assets/repair-helper/locales.js`, `src/styles.css`, and relevant build tests.

**Interfaces:** Consume Task 2 snapshots. Render messages with `textContent`, identify model text as a local AI explanation, and show the controller's localized status. The activate button calls `enableModel()`; the send control calls `send(text)`.

- [ ] Add localized activation disclosure, progress, ready/error/unavailable states, model-explanation label, send/reset labels, and starter examples. Include a clear download-size estimate from the pinned model metadata; do not promise browser caching.
- [ ] Replace the unreachable quiz implementation in `app.js` with the chat interface and controller subscription. Preserve service-card entry links, phone action, Enter/Shift+Enter behavior, composition input, and focus after submission.
- [ ] Style the activation area, chat messages, progress, and safety text for narrow screens. Keep text literal and ensure typing remains available during model generation for fresh safety details.
- [ ] Run adapter, controller, conversation, and build tests. Commit interface changes.

### Task 4: Browser verification and publication

**Files:** Update `scripts/verify-helper.mjs`; update documentation describing local-model privacy and device requirements.

- [ ] Replace obsolete quiz selectors with current chat flows. Verify EN/ES/ZH replies, no external model requests before activation, mocked successful opt-in, failed loading fallback, reset during generation, hazard interruption, keyboard input, literal HTML-like text, mobile width, and no-JavaScript phone access.
- [ ] Run `node --test` and `node scripts/build.mjs` with the bundled Node runtime. Run the browser verifier against the fresh build with the available Playwright module. Record actual failures and repair them before publication.
- [ ] On a WebGPU-capable browser, activate the real pinned model and verify one ordinary repair exchange plus follow-up. If real inference cannot be exercised in the available environment, report that limitation explicitly; mocked UI checks cannot establish model quality or successful model loading.
- [ ] Commit verified changes, push the authorized site update to the GitHub Pages source branch, and inspect the workflow result for that commit. Fetch the public domain and verify the new local-model assets and unchanged business facts before claiming it is live.

## Execution

Use the previously selected native execution method in this session. The plan requires review before implementation under the Superpowers writing-plans workflow. Each task has a separate verification boundary; publication follows the completed build and browser checks.
