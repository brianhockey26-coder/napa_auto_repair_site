# Napa Auto Repair: local repair decision helper

Date: 2026-10-04
Status: Approved conversational design; written specification awaiting user review.

## Purpose and approved constraints

Help customers decide which shop service fits their symptoms and how urgently to seek help. The user requested a capable assistant, explicitly required no API, and approved a local decision engine with English, Spanish, and Chinese support. The website remains public on GitHub Pages at https://napaautorepairnj.com/.

The product is named Repair Helper, with equivalent translated names. It is described as a guided symptom assistant powered by a local knowledge base. It must not claim to be a trained language model, a mechanic, or a diagnostic scan. Capability means useful distinctions, relevant questions, consistent urgency decisions, and understandable explanations rather than simulated conversation or inflated confidence.

## Customer experience

Add an inline section after Services, using the existing red, white, and neutral visual design. Add a clear entry link from the Brakes & Tires service details; it opens the helper with that topic selected and scrolls to the section. Other service cards may offer corresponding entry links where the mapping is unambiguous.

The customer can describe a problem in a labeled text field or select symptom chips. Starter topics cover brakes, tires/vibration, steering/suspension, warning lights, overheating, starting/battery, rough running, leaks, unusual smells/smoke, climate control, and routine maintenance. Multiple topics can be selected. Text recognition supports common phrases in all three languages, with manual topic confirmation whenever recognition is uncertain.

The flow has four states: describe/select symptoms; answer targeted questions; view recommendation; edit or restart. Questions offer explicit choices and an I am not sure option. Relevant answers remain visible and editable. Ask at most six questions before a provisional recommendation; explain any important unresolved information. A severe reported symptom can produce immediate guidance without completing the questionnaire.

Results show urgency, the observations supporting it, possible areas to inspect, the matching shop service, and a practical next step. Include a call link to +1 908-416-6132 and a short editable symptom summary that can be copied. Copy failure leaves the summary selectable. Do not imply that calling submits a booking or sends the transcript.

Keep a short adjacent note: This guide cannot diagnose your vehicle or confirm it is safe to drive. A mechanic needs to inspect it. Customers must not be prompted to perform road tests, touch moving parts, open hot coolant systems, or inspect fuel/electrical hazards.

## Reasoning and knowledge scope

Use an explicit, inspectable rule engine with stable symptom IDs, question IDs, answer IDs, urgency levels, and service mappings. Localized text lives separately from decision logic so translations cannot change the recommendation.

The engine must distinguish at least these useful cases:

- Brake squeal versus grinding, changed pedal feel, reduced braking, or vibration only while braking.
- Vibration at speed versus braking, visible tire damage, pressure loss, and recent wheel work or impact.
- Mild pulling versus suddenly difficult steering, severe instability, and suspension clunks.
- A steady versus flashing check-engine light, plus rough running or power loss; warning lights are not interchangeable.
- An oil-change reminder versus an oil-pressure warning with the engine running.
- A battery warning while driving versus a vehicle that will not start, including clicking, slow cranking, and normal cranking without starting.
- Overheating indications versus a climate-control complaint; steam and a hot temperature warning need different guidance than weak A/C.
- Clear water associated with A/C use versus an unknown leak; never identify a fluid conclusively from color alone.
- Fuel smell or smoke versus a nonspecific odor; distinguish active hazards from historical or uncertain descriptions.
- Rough idle, stalling, and loss of power versus routine maintenance questions.
- Heating/A/C issues and maintenance requests without invented repair intervals, prices, or model-specific procedures.

Free text is an aid to structured selection, not unrestricted language understanding. Normalize case and accents where appropriate, support common Chinese variants and common English/Spanish synonyms, and identify multiple matching topics. Handle explicit local negations such as no smoke, no overheating, and their translated equivalents. Contradictions or uncertain timing prompt confirmation. Do not let a keyword such as smoke in no smoke create a confirmed hazard.

Safety screening is available independently of the chosen category so a brake complaint plus overheating is evaluated together. Confirm whether a warning or symptom is happening now, happened earlier, or is uncertain. Reported active severe hazards outrank less urgent symptoms; benign answers never cancel an unrelated hazard. Unknown answers cannot produce reassurance that a vehicle is safe to drive.

Use four customer-facing urgency levels: stop safely and arrange assistance; seek prompt professional advice before further driving; arrange an inspection soon; plan routine service. Wording must describe action, not a safety certification. Active fire or immediate danger should direct customers away from the vehicle and toward emergency assistance. For other severe symptoms, advise stopping when safe and arranging professional help without roadside repair instructions.

Possible causes use cautious wording, identify relevant systems, and connect to the customer's reported observations. Do not show probabilities, certainty scores, guaranteed repairs, prices, or promises that the shop offers towing or emergency service. Unrecognized inputs get an honest clarification path and the call action, not a fabricated result.

## Implementation boundaries

Keep the existing static build and three crawlable HTML routes. Add a small browser entry module, a pure decision module, a knowledge module, and locale content under src/assets/repair-helper/. The build copies these assets. The browser code handles presentation and state; the pure module consumes structured facts and returns questions, urgency, explanations, and service IDs without DOM access.

Load only the helper's static assets from this website; reasoning runs locally without API calls, remote models, third-party scripts, model downloads, or customer authentication. Store conversation state only in page memory; clearing or reloading resets it. Do not send symptoms to analytics or a server. Render user text using textContent rather than HTML interpolation. Limit symptom text to 1,000 characters and use bounded matching rules.

The helper progressively enhances static introductory content. With JavaScript disabled or failed, the page still offers the service list and call action. The shop's existing structured data, sitemap, robots policy, opening hours, Google reviews links, and public routes remain intact. Do not add unsupported business claims to structured data.

## Accessibility and visual behavior

Use labeled fields, native buttons, fieldsets and legends for answer groups, visible focus, and keyboard-operable selection/edit/reset controls. Announce newly shown questions and results without excessive repeated announcements. Preserve focus when updating the page; move focus intentionally when starting or completing a step. Indicate urgency with text and icons as well as color. Support reduced motion, narrow phones, text wrapping, and a minimum 44px interactive target. No hover zoom or decorative typing delays.

All prompts, choices, results, fallback states, and copied summaries are translated. Use the current page language while allowing symptom phrases in any supported language. No untranslated core messages may appear on Spanish or Chinese pages.

## Validation and acceptance

Use a scenario suite for behavior rather than tests that duplicate implementation. Cover at least 30 distinct scenarios across the supported topics, plus language parity checks. Required scenarios include brake grinding with a soft pedal; braking-only vibration; highway vibration; a damaged tire; steady versus flashing check-engine lights; oil reminder versus pressure warning; overheating plus brake noise; a no-start with clicking versus normal cranking; an unknown leak; no smoke versus active smoke; negated symptoms in each language; contradictory input; unrelated text; and all-unknown answers.

Acceptance requires highest-urgency precedence, relevant follow-ups, conservative unknown handling, correct service mapping, no asserted diagnosis or safe-to-drive guarantee, and safe literal rendering of typed markup. Verify resetting and editing answers recompute results without stale hazards. Check keyboard flow, copy fallback, mobile layout, three language routes, and no helper network traffic in a browser. Run the existing website tests and build with the new module assets included.

After approval of this written specification, create the implementation plan using the Superpowers writing-plans workflow. Complete local implementation and verification before release; do not call the feature live until the deployment and public behavior have been checked.

## Reference basis for reviewed guidance

These primary references inform initial rules; they do not establish a diagnosis for every vehicle. Keep detailed model-specific instructions out of the helper and refer customers to their own vehicle manual when appropriate.

- NHTSA TireWise: https://www.nhtsa.gov/vehicle-safety/tires — tire condition, pressure, vibration, and maintenance guidance.
- Ford engine oil warning guidance: https://www.ford.com.au/owners/vehicle-support/indicator-icons/engine-oil-warning-lamp/ — engine-running oil-pressure warnings and stopping safely.
- Ford owner manual engine messages: https://www.fordservicecontent.com/Ford_Content/vdirsnet/OwnerManual/Home/Content?ProcUid=G1592456&Uid=G1592455&buildtype=web&countryCode=USA&div=f&languageCode=en&userMarket=USA&vFilteringEnabled=False&variantid=3592 — overheating warning response. Guidance for other decision branches must be checked against primary vehicle guidance during implementation before being published.
