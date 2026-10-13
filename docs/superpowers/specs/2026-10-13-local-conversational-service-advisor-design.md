# Local conversational service advisor

## Goal

Replace the repair helper's question-by-question feel with a focused, natural repair conversation. The assistant must help a driver describe a concern, understand possible causes in plain language, decide on a safe next step, and prepare for a shop visit. It remains a public, no-sign-in, fully local feature: no API key, server request, account, model download, or runtime cost.

The result is a capable automotive service conversation, not a general-purpose chatbot and not a diagnostic tool. It must state uncertainty honestly and preserve the existing urgent-symptom safeguards.

## Experience

The helper opens as a compact chat with a short purpose statement and a few optional starting prompts. A visitor can immediately type a normal message such as "my brakes shake only when I stop" or "what does P0171 mean?". The assistant responds in short, direct messages, retains the details already provided, and asks one useful follow-up at a time only when it materially changes the guidance.

The conversation supports these intents in English, Spanish, and Simplified Chinese:

- describe a symptom, warning light, maintenance need, or diagnostic code;
- ask what may be causing it, whether driving is reasonable, or what a shop would inspect;
- add timing, speed, sound, temperature, maintenance history, vehicle, or warning-light details;
- request a concise visit summary, checklist, or questions to ask the shop;
- correct an earlier answer or start again.

The assistant uses plain language first, with a brief explanation of technical terms when that helps. It does not pad replies with greetings, generic reassurance, or invented details.

## Local conversation architecture

The site continues to serve only static JavaScript. A pure `conversation.js` module receives the current local conversation state plus a visitor message and returns a structured turn:

- recognized facts and topics;
- the answer or clarification to render;
- the next highest-value question, if needed;
- a possible-cause explanation supported by known evidence;
- a recommended action level and visit-preparation brief.

`engine.js` remains the authority for risk, evidence, services, and safety conditions. The conversation module may ask for missing facts but never reduces an engine risk level or reclassifies an emergency. `chat.js` continues to recognize short replies, while the conversation module adds intent matching for questions such as cause, urgency, service check, code explanation, and visit preparation.

`app.js` owns the chat transcript, draft message, conversation state, explicit corrections, reset, keyboard handling, and accessible live announcements. It renders all text using DOM nodes and `textContent`; visitor text is never interpreted as HTML. Existing local advisor brief generation remains the source for preparation lists.

## Knowledge and responses

The bundled knowledge base expands the existing symptom coverage with concise, evidence-aware explanations for brakes and tires, battery and starting, engine and warning lights, overheating and fluids, steering and suspension, climate control, and routine maintenance. Each response distinguishes:

- **what the symptom can indicate** — one to three plausible categories, tied to supplied evidence;
- **what makes it urgent** — only when a current hazard is present;
- **what a technician will normally check** — inspection or testing, not a promised repair;
- **what to note before the visit** — timing, warning lights, vehicle details, recent work, and changes in the symptom.

Diagnostic code responses identify the system or condition a code commonly relates to, say that the code alone does not identify the failed part, and request only relevant follow-up observations. The assistant cannot estimate prices, guarantee a repair, invent appointment availability, or provide instructions that conflict with safety routing.

## Safety and privacy

Every entered message is processed locally in the browser and is discarded on page reload or reset. The conversation makes no network requests. A current fire, fuel smell/leak, smoke, loss of braking, loss of steering, severe overheating, or comparable high-risk condition immediately interrupts normal conversation with the existing emergency or assistance guidance. Historical concerns use conditional wording and do not receive an active-danger claim without current confirmation.

Routine and uncertain concerns receive a clear "possible cause, not a diagnosis" statement and an appropriate inspection recommendation. The chat must never tell a visitor that a dangerous vehicle is safe to drive.

## Presentation and accessibility

The interface looks like a professional service conversation: readable left-aligned response bubbles, restrained action buttons, visible transcript history, helpful suggested prompts, and a single multiline composer. It works on mobile, supports keyboard submission with Enter and a newline with Shift+Enter, uses named controls and live status, respects reduced-motion preferences, and retains a no-JavaScript phone-contact fallback.

Existing service-card entry links continue to preload the relevant topic. The regular website's exact business facts, three languages, public discoverability artifacts, and neutral Google review link remain unchanged.

## Verification

- Pure unit tests cover conversation turns for free-text symptom descriptions, cause and urgency questions, diagnostic codes, corrections, ambiguous messages, visit summaries, Spanish and Chinese messages, historical symptoms, and emergency interruptions.
- Existing engine tests continue to cover negation, conflicting facts, severity, bounded questions, literal input, and risk precedence.
- Browser checks cover a natural multi-turn transcript, typing rather than selecting options, suggested prompts, mobile behavior, keyboard handling, English/Spanish/Chinese routes, emergency interruption, visit summary, clipboard fallback, no external runtime requests, and no-JavaScript fallback.
- The complete test suite, static build, GitHub Pages workflow, and the public domain are verified before release.
