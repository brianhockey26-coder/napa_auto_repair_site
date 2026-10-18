# Implementation record

Plan: `2026-10-18-on-device-repair-chat-model.md`

- Adapter and controller: implemented; initial missing-module tests failed, then passed. Added regression tests for alternating history and retained vehicle context after review.
- Interface: replaced unreachable legacy quiz renderer with controller-based multilingual chat; preserved literal rendering, phone access, and service entry links.
- Verification: 198 Node tests passed; static build passed; Playwright checks passed for multilingual replies, no pre-consent model requests, mobile width, opt-in, failed download, reset, fresh hazard interruption, literal HTML-like input/output, and no-JavaScript phone access.
- Independent review: fresh reviewer inspected adapter, controller, and UI. Identified adjacent assistant-role history and retained vehicle context; both addressed with regression tests.
- Real model smoke: running separately; result must be recorded before any claim of successful real inference.
- Publication: pending.

Ruling: Use a separate localized `model-copy.js` module rather than enlarge `locales.js`; all three languages remain bundled and no remote translation is introduced.

Ruling: Preserve existing advisor/engine modules but remove the unreachable quiz presentation in `app.js`; the controller renders concrete possible causes and checks directly in chat.

Ruling: Existing service-advisor build tests asserted implementation names from the removed renderer; update those assertions to the new controller and emitted modules, with behavior exercised by browser tests.
