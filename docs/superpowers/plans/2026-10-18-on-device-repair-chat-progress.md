# Implementation record

Plan: `2026-10-18-on-device-repair-chat-model.md`

- Adapter and controller: implemented; initial missing-module tests failed, then passed. Added regression tests for alternating history and retained vehicle context after review.
- Interface: replaced unreachable legacy quiz renderer with controller-based multilingual chat; preserved literal rendering, phone access, and service entry links.
- Verification: 198 Node tests passed; static build passed; Playwright checks passed for multilingual replies, no pre-consent model requests, mobile width, opt-in, failed download, reset, fresh hazard interruption, literal HTML-like input/output, and no-JavaScript phone access.
- Independent review: fresh reviewer inspected adapter, controller, and UI. Identified adjacent assistant-role history and retained vehicle context; both addressed with regression tests.
- Chat appearance follow-up: added header, welcome state, labeled left/right bubbles, bottom composer, send arrow, reset toolbar, and localized typing feedback. Mobile screenshot inspected; independent follow-up review found no blocking regressions.
- Latest regression suite: 204 tests passed. Final Playwright suite passed.
- Real model smoke: the Cache API attempt failed with a browser quota error and an ephemeral IndexedDB attempt failed reading an artifact. A persistent Chrome profile with IndexedDB successfully downloaded, loaded, and ran the actual model. Reusing the cache succeeded. The final full-controller check produced a relevant battery/connection explanation for rapid clicking and dim dashboard lights, followed by a visit summary retaining the 2015 Honda Accord and symptoms.
- Real-model testing exposed and fixed idle interruption, combined symptom/intent extraction, false leak matching on rapid clicking, false tire-damage matching within Accord, and vehicle acknowledgement overriding summary intent. Each fix has a regression test.
- Final review: initial independent review and appearance follow-up completed. Additional reviewer attempt hit its usage limit; latest targeted fixes were self-reviewed and checked by regression, browser, and real-model runs.
- Publication: commit `2cb1f74c8c0f34d19ad1abd49fb481975f161eb6` deployed successfully in GitHub Actions run `39137934998`. The custom domain serves the new `rh-chat-header`, `rh-composer`, and `rh-welcome` interface plus the opt-in IndexedDB model adapter.

Ruling: Use a separate localized `model-copy.js` module rather than enlarge `locales.js`; all three languages remain bundled and no remote translation is introduced.

Ruling: Preserve existing advisor/engine modules but remove the unreachable quiz presentation in `app.js`; the controller renders concrete possible causes and checks directly in chat.

Ruling: Existing service-advisor build tests asserted implementation names from the removed renderer; update those assertions to the new controller and emitted modules, with behavior exercised by browser tests.

Ruling: Use the supported IndexedDB storage option after real testing exposed Cache API quota limitations. Private/ephemeral storage may still be restricted; retain explicit failure fallback.

Ruling: Produce visit summaries directly from recorded details because the small model's generated summary was vague. Routine explanation generation stays optional and local; this is not a general ChatGPT-equivalent model or a diagnostic guarantee.
