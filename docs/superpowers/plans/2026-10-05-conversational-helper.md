# Conversational repair-helper enhancement

User authorized extending the existing no-API helper and publishing it on the main website. Keep it public, local, multilingual, and honest about its limitations.

Implemented scope:

- Typed replies and optional suggested answers; visible conversation history.
- Bounded answer interpretation with clarification for ambiguous wording, not an unrestricted language model.
- Adaptive detailed questions (maximum 14) covering vibration, starting, codes, cooling, airflow, leaks, wear, smells, and service history.
- Ranked inspection possibilities, plain-language explanations of parts and symptoms, answer evidence, and mechanic checks. No diagnostic certainty or probabilities.
- Current hazards interrupt any typed reply. Additional detail is optional after urgent guidance; emergencies retain priority.
- All copy bundled in English, Spanish, and Chinese; no external requests or paid runtime API.

Verification: Node regression suite plus Chrome browser checks of typed chats, clarification, all language routes, urgent replies, editing, mobile layout, clipboard fallback, literal markup safety, and no-JavaScript fallback. Review findings receive regression tests before release. Deployment must be verified on the public URL.

Mechanical reference sources consulted for inspection hypotheses (not definitive diagnoses):

- https://www.denso-am.eu/news/starter-troubleshooting
- https://www.continental-tires.com/tire-knowledge/balancing-tires/
- https://ngksparkplugs.com/en/products/ignition-parts/ignition-coils
- https://static.nhtsa.gov/odi/tsbs/2022/MC-10207840-0001.pdf
