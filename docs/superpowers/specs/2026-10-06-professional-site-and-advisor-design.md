# Professional site and repair-advisor upgrade

## Goal

Make Napa Auto Repair feel like an established, premium local repair business without luxury-shop clichés or unverifiable claims. Keep the site public, fast, multilingual, and usable without sign-in. Improve the local repair assistant into a structured service-advisor experience without using an external AI API.

## Audience and tone

Drivers in and around North Brunswick who need maintenance, a repair, or help deciding what to do after noticing a vehicle symptom. The voice is direct, calm, formal, and understandable. It avoids hype, guarantees, false urgency, slang, and vague marketing phrases.

## Site structure and presentation

- Replace casual hero, services, helper, reviews, and visit copy on English, Spanish, and Chinese pages with concise professional language.
- Preserve business facts exactly: address, phone, Monday-Saturday 8:30 AM-6:00 PM, Sunday closed, and the Google Maps review link.
- Add a compact service-standard panel that sets expectations without asserting credentials, warranties, prices, or review counts: explain the shop evaluates the concern, discusses findings and next steps, and customers can call before arriving.
- Improve visual hierarchy through a restrained navy, warm-paper, and red accent system: clearer section rhythm, more compact service cards, refined badges, and a more deliberate call-to-action hierarchy. Preserve responsive/mobile behavior and reduced-motion support.
- Keep the existing logo and Google review link. Do not introduce a false live review feed or rating claim.

## Repair Advisor

- Keep all advice deterministic and bundled locally; no account, network call, API key, or customer data transmission.
- Rename the interface in copy to a Service Advisor where appropriate. Clearly identify it as symptom guidance, not a diagnosis.
- Preserve existing severe-symptom routing and safety-first behavior.
- Add an advisor brief to the result: recommended service area, questions to bring to the shop, and a short preparation checklist. It is tailored from the user's selected topics, urgency level, and possible causes.
- Show plain-language cause cards only when the collected evidence supports them. Continue to state that testing is needed before replacing parts.
- Make chat prompts more deliberate: invite useful information (when it happens, warning lights, changes after maintenance) and ask for clarification rather than guessing from vague answers.
- Add structured high-value contexts: recent service, weather/temperature dependence, vehicle behavior at idle vs. speed, and dashboard codes where relevant; all remain optional and visibly limited to what the visitor entered.
- Keep the current 14-question maximum, accessible keyboard navigation, raw-text safety, and copyable phone summary.

## Data flow and boundaries

`app.js` manages the interactive state and only renders through `textContent`. `chat.js` maps narrowly understood natural-language replies to stable answer IDs; ambiguous replies request clarification. `engine.js` determines urgency, questions, and relevant evidence. A new pure advisor layer turns that result into practical, non-diagnostic visit preparation content. `locales.js` owns all customer-facing English, Spanish, and Simplified Chinese text.

The advisor layer must never lower urgency, override a severe safety condition, invent a repair, or claim pricing/availability. Unknown information remains unknown.

## Verification

- Unit coverage for advisor briefs across routine maintenance, prompt inspection, active hazards, and untranslated/missing data.
- Existing safety, negation, historical symptom, contradictory answer, long-input, and no-external-request tests continue to pass.
- Static-page tests assert all three language pages retain exact shop facts, public crawler metadata, the formal service standard, and no sign-in/form collection.
- Browser checks cover English, Spanish, Chinese, mobile layout, typed chat replies, an urgent path, a normal advisor brief, literal markup safety, clipboard fallback, and no-JavaScript fallback.
- Build and GitHub Pages deployment are checked against the actual public domain before completion.
