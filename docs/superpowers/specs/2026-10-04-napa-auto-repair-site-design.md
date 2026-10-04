# Napa Auto Repair Website Design

## Purpose

Create a public, no-sign-in website that explains Napa Auto Repair's general auto repair services and helps local customers call the shop or get directions.

## Audience and Success Criteria

The primary audience is drivers in and around North Brunswick Township, New Jersey, who need maintenance or vehicle repair. The page succeeds when a visitor can quickly understand what the shop does, see its hours and reputation, and use a phone-friendly link to call or navigate to the shop.

## Business Information

- Name: Napa Auto Repair
- Address: 1184 F Cozzens Ln, North Brunswick Township, NJ 08902
- Phone: +1 (908) 416-6132
- Hours: Monday through Saturday, 9:00 AM–6:00 PM; Sunday closed
- Services: General auto repair services
- Reputation statement supplied by the owner: All Google reviews are five stars

## Experience and Content

The site will be a lightweight, responsive single page with these sections:

1. A compact sticky header with the shop name, section navigation, and a prominent tap-to-call action.
2. A first-screen introduction positioning the shop as a dependable North Brunswick repair destination, with Call Now and Get Directions actions.
3. A services overview covering representative general repair categories: diagnostics, routine maintenance, oil changes, brakes, tires, engine repair, suspension and steering, electrical systems, heating and air conditioning, and other common repair needs. The wording will make clear that customers can call about additional repair needs rather than implying an exhaustive service catalog.
4. A trust section highlighting the owner-provided statement that the shop's Google reviews are all five stars. It will link to the shop's Google listing without inventing customer quotations or a review count.
5. A visit section with the address, hours, Sunday closure, tap-to-call phone number, and Google Maps directions link.
6. A concise footer repeating the essential contact details.

## Visual Direction

The page will feel like a trustworthy neighborhood garage rather than a generic corporate template. It will use deep navy, warm cream, and Napa-red accents, with strong readable typography, restrained automotive motifs, clear section hierarchy, and generous touch targets. The design will remain legible and useful on phones, tablets, and desktop screens.

## Behavior and Data

The site is presentation-only and requires no authentication, forms, database, tracking, uploads, or stored customer data. The primary interactions are section navigation, smooth in-page movement, telephone links, and external Google Maps and Google review links. External links will fail gracefully by leaving all business information readable on the page.

## Accessibility, Search, and AI Discoverability

The implementation will use semantic page landmarks, logical heading order, keyboard-accessible links, visible focus states, sufficient contrast, descriptive link labels, and responsive text sizing. The page title, description, canonical URL, favicon, and local-business-oriented metadata will identify Napa Auto Repair and its North Brunswick location.

The public page and its meaningful assets will be accessible without authentication, CAPTCHA, `noindex`, or crawler-blocking rules. A root `robots.txt` will explicitly allow mainstream search and answer-engine discovery crawlers, including Googlebot and OpenAI's OAI-SearchBot, and will reference a root XML sitemap. The sitemap will contain the final canonical public URL.

The page will include valid JSON-LD using the most specific appropriate Schema.org local-business type, expected to be `AutoRepair`. It will repeat only visible, owner-supplied facts: business name, canonical URL, telephone number, postal address, opening hours, service area, and general repair category. It will not publish an `aggregateRating`, review count, fabricated reviews, geographic coordinates, prices, or other facts that have not been verified.

Visible copy will state the shop name, location, services, hours, and contact information in direct language so text-only crawlers and AI agents can understand the business without executing an interaction. Search and AI discoverability will be optimized, but ranking, indexing, citation, or recommendation by any third-party system cannot be guaranteed.

## Validation and Delivery

Before publication, verify:

- The page loads without blocking errors at mobile and desktop widths.
- Navigation and focus behavior work with a keyboard.
- The phone link uses `tel:+19084166132`.
- Directions and Google review links target the correct business or a precise Google Maps search for the supplied name and address.
- The displayed address and hours match this specification.
- The production site is publicly reachable without a login or sign-in prompt.
- The production page returns a successful response to anonymous requests and contains no `noindex` directive.
- `robots.txt` permits Googlebot and OAI-SearchBot and points to the deployed sitemap.
- The sitemap uses the final public canonical URL.
- The JSON-LD parses successfully and matches the business details visible on the page.
- Search metadata, canonical URL, and structured data do not claim an unverified review count or rating aggregate.

## Out of Scope

Online appointment booking, estimates, live chat, customer accounts, payment, fabricated testimonials, specific review counts, guaranteed search or AI placement, separate service pages, and ongoing scheduled updates are not part of this first version. Search-engine account setup, Google Business Profile verification, and manual sitemap submission are separate owner-operated follow-up steps because they require control of the relevant business accounts.
