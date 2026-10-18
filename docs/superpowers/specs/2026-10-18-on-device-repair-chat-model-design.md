# On-device repair chat model design

## Purpose

Offer visitors an optional, more natural repair-information chat while keeping Napa Auto Repair's public site anonymous, multilingual, and safe. The feature must not require an account, API key, paid AI service, customer-data collection, or a server-side chat endpoint.

## Scope and success criteria

The English, Spanish, and Simplified Chinese repair helper will retain its deterministic symptom assessment as the source of truth for severity, emergency guidance, and shop-contact prompts. On capable devices, a visitor may explicitly enable a small language model that runs in the browser to provide clearer conversational explanations of ordinary repair concerns.

Success means a visitor can keep using the existing no-download local advisor, or choose local-model chat and receive a clear loading state, routine conversational explanations, and the same safety routing. A visitor's message must never be sent to an AI provider or a Napa Auto Repair server.

## Architecture

`conversation.js`, `chat.js`, and `engine.js` continue to recognize facts and calculate urgency before any model request. A new `local-model.js` module owns browser capability checks, a user-initiated dynamic import of WebLLM, model selection from WebLLM's supported configuration, model progress, and completion calls.

`app.js` remains the interface coordinator. It renders a clearly optional Local AI mode control and passes only the current conversation plus the deterministic assessment to the local-model adapter. It always presents deterministic safety advice first. The optional model output is an additional explanation for routine conversations only.

The chosen browser runtime and model files are fetched only after an explicit click. WebLLM stores the downloaded model in the browser cache where available; inference happens through WebGPU in the visitor's browser. No API credential, analytics call, or server relay is introduced.

## Safety and response boundaries

The deterministic engine is authoritative. When it returns an active level-3 safety condition, the interface will not invoke the model. It will show the existing emergency or assistance guidance and offer the phone action.

For non-emergency cases, the model receives a constrained system instruction: explain likely systems in plain language, distinguish possibilities from diagnoses, ask one useful follow-up when needed, avoid repair pricing or appointment promises, and repeat the deterministic urgency direction. The model cannot change the displayed severity, suppress a phone action, or make a safety claim inconsistent with the deterministic result.

## User experience

The chat begins in the existing fully bundled local-advisor mode. The Local AI mode describes its tradeoff before activation: it downloads a model once, needs a modern WebGPU-capable device, and keeps inference on the device. It shows checking, download progress, ready, and unavailable/error states in the selected site language. If loading fails, the visitor stays in the standard chat with no lost transcript.

The chat UI will present localized starter examples, typed-message history, deterministic advice, and—when enabled—an identified `Local AI explanation` message. It will never imply that the reply is a definitive diagnosis or an inspection.

## Accessibility, privacy, and delivery

Controls use semantic buttons, live status text, keyboard submission, focus preservation, and readable failure states. The static no-JavaScript phone and business-information paths remain unchanged. Site content, business structured data, crawl controls, and translations remain static and publicly accessible.

This design intentionally adds an opt-in external download path for the runtime and model. That is the only network use tied to the feature; it is necessary to obtain the local model and is not a cloud inference API. Visitors who do not opt in make no model-related request.

## Testing and verification

Unit tests will cover capability detection, supported-model choice, prompt construction, explicit opt-in gating, model failure fallback, localized status copy, and the invariant that level-3 active safety results skip the model. Existing conversation tests will continue to cover symptom recognition and emergency routing.

Before publishing, the site build and focused/full tests will run, then the GitHub Pages workflow and public domain will be checked at the deployed commit. Browser checks will exercise the standard local advisor without making a model request and will mock the adapter for the opt-in model UI.

## Non-goals

This change does not create a general-purpose ChatGPT equivalent, train a model, guarantee an exact diagnosis, store chat histories, embed reviews, add paid services, or require a login. Devices without WebGPU keep the existing deterministic assistant.
