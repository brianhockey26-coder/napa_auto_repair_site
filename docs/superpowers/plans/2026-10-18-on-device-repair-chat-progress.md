# Implementation record

Plan: `2026-10-18-on-device-repair-chat-model.md`

- Adapter and controller: implemented; initial missing-module tests failed, then passed. Added regression tests for alternating history and retained vehicle context after review.
- Interface: replaced unreachable legacy quiz renderer with controller-based multilingual chat; preserved literal rendering, phone access, and service entry links.
- Verification: 198 Node tests passed; static build passed; Playwright checks passed for multilingual replies, no pre-consent model requests, mobile width, opt-in, failed download, reset, fresh hazard interruption, literal HTML-like input/output, and no-JavaScript phone access.
- Independent review: fresh reviewer inspected adapter, controller, and UI. Identified adjacent assistant-role history and retained vehicle context; both addressed with regression tests.
- Chat appearance follow-up: added header, welcome state, labeled left/right bubbles, bottom composer, send arrow, reset toolbar, and localized typing feedback. Mobile screenshot inspected; independent follow-up review found no blocking regressions.
- Latest regression suite: 199 tests passed.
- Real model smoke: the first Cache API attempt failed with a browser quota error. Switched the pinned runtime to its supported IndexedDB option and added explicit localized storage-failure fallback; second real model attempt is running. No successful inference claim yet.
- Publication: pending.

Ruling: Use a separate localized `model-copy.js` module rather than enlarge `locales.js`; all three languages remain bundled and no remote translation is introduced.

Ruling: Preserve existing advisor/engine modules but remove the unreachable quiz presentation in `app.js`; the controller renders concrete possible causes and checks directly in chat.

Ruling: Existing service-advisor build tests asserted implementation names from the removed renderer; update those assertions to the new controller and emitted modules, with behavior exercised by browser tests.
