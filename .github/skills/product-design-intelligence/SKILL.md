---
name: product-design-intelligence
description: Use when researching, designing, prototyping, implementing, reviewing, or improving product interfaces. Prevent generic AI-generated UI through evidence-led product understanding, reference analysis, strong visual systems, real interactions, accessibility, motion discipline, and rendered-browser QA.
---

# Product Design Intelligence

## Mission

Produce interfaces that feel intentionally designed for this product, its users, and its real operating context. Do not optimize for a polished screenshot at the expense of clarity, usability, accessibility, correctness, or maintainability.

Treat design as a decision process, not a styling pass. Every prominent visual, section, interaction, animation, and content claim must have a purpose. Avoid interchangeable AI-generated layouts: arbitrary gradients, decorative card grids, oversized empty hero copy, meaningless badges, fake metrics, generic illustrations, and repeated sections that do not answer a user need.

## 1. Understand the product before designing

Before proposing a direction:

1. Inspect repository instructions, README, route structure, existing screens, design tokens, components, tests, and relevant issues/PRs.
2. Identify the actual user groups, their goals, their environment, their constraints, and the primary action for the screen or journey.
3. Map the end-to-end journey, including entry points, decision points, success, cancellation, errors, recovery, and edge cases.
4. Separate verified behavior from planned work, assumptions, and open decisions. Record uncertainty instead of inventing details.
5. Identify the source of truth for each displayed value or state: application state, API response, server calculation, permission, or confirmed contract.
6. Preserve existing architecture and patterns unless there is evidence that a change is needed. Do not introduce a new UI framework or dependency for visual novelty.

Do not start by asking an image model for a pretty page. Start with the user, task, content, and constraints.

## 2. Research references with intent

Use references to answer specific design questions, not to copy a whole site.

- **Behance:** case studies, brand systems, typography, and presentation.
- **Dribbble:** visual exploration and component ideas; validate the full UX elsewhere.
- **Awwwards:** ambitious art direction, animation, 3D, and storytelling; use selectively for commercial product UX.
- **Land-book / SiteInspire:** landing-page composition, editorial layouts, and typography.
- **Mobbin:** real product screens and flows such as onboarding, checkout, settings, and confirmation.
- **SaaS Landing Page:** SaaS marketing patterns.
- **Footer and direct site inspection:** inspect complete journeys, not only hero screenshots.

For each useful reference, capture its URL, screen/section, what works, why it works, the user problem it solves, how it could be adapted, and what should not be copied. Organize findings by relevant sections such as navigation, hero, product detail, forms, cards, pricing, reviews, empty states, footer, responsive behavior, and motion.

Use a small set of high-quality, relevant references rather than collecting screenshots indiscriminately. Compare multiple sources, combine compatible principles, and retain the product's own identity. Distinguish visual inspiration from proven interaction patterns.

## 3. Establish a coherent visual system

Define or reuse tokens for color, typography, spacing, radius, borders, elevation, focus, and motion. Use the existing brand and repository conventions as the starting point.

- Create a clear hierarchy: one primary focal point, meaningful section headings, readable supporting copy, and obvious actions.
- Use a restrained palette. Reserve high-saturation colors for intentional emphasis and meaningful states.
- Keep typography consistent. Establish hierarchy through size, weight, line height, and contrast rather than unnecessary font variety.
- Align content to a consistent grid. Use spacing deliberately: related elements belong together; unrelated sections need separation.
- Keep dividers subtle and icons consistent in stroke, fill, scale, and alignment.
- Ensure icons and controls remain legible over varied imagery; use contrast, backing surfaces, or outlines when necessary.
- Use real, relevant imagery with a clear focal point, consistent treatment, appropriate crop, and responsive behavior. Avoid generic stock-like visuals that misrepresent the product.
- Keep labels concise. Avoid redundant labels, repeated badges, decorative metadata, and duplicate explanations.
- Preserve semantic labels for assistive technology even when a visible label is redundant.

Do not apply rules mechanically. For example, a visible “Price” label may be unnecessary beside an obvious currency amount, but accessible naming and context must remain clear.

## 4. Design complete journeys and real states

Design more than the ideal loaded screen. Specify and implement meaningful states for:

- initial, loading, success, empty, partial, error, offline/unavailable, disabled, and permission-denied conditions where applicable;
- validation, inline help, recovery, retry, cancellation, confirmation, and destructive actions;
- long content, missing imagery, unusual data, narrow screens, and keyboard-only use.

Every visible control must do what its label promises. Do not ship dead buttons, fake forms, fake counters, fabricated notifications, placeholder links presented as working actions, or state changes that exist only in a mockup. Use real application state and verified service responses. Explain unavailable or unknown states honestly.

Keep the primary action prominent without making the interface aggressive. Group related controls and make consequences clear. Show important cost, status, and next-step information before the user commits.

## 5. Motion and interactive prototyping

Choose the simplest implementation that achieves the intended quality.

1. **Code-driven motion** for stateful UI and direct interaction: transitions, sliders, progress, drag/swipe, cursor response, charts, parallax, and responsive controls. Prefer CSS, SVG, React state, or the motion library already used by the project.
2. **SVG/vector assets** for scalable illustrations, icons, mascots, and simple decorative objects. Use CSS/SVG animation when movement is simple.
3. **Video** for complex organic or cinematic movement that would be disproportionately difficult to reproduce in code. Optimize file size, duration, loop behavior, playback controls, and fallback.

Motion must clarify cause and effect, provide feedback, and preserve continuity. Tune timing and easing; avoid distracting movement, unwanted deformation, layout jumps, and animation that hides information. Prefer transform and opacity when practical. Respect `prefers-reduced-motion`, test on mobile, and consider performance and battery.

For prototypes, inspect the actual running app and complete flows. Capture screenshots and, when needed, recordings of transitions, scroll behavior, gestures, loading, and state changes. Give implementation work explicit inputs: product requirements, references, screenshots, recordings, brand assets, interaction rules, technical constraints, and what is required versus inspirational. Build structure and core behavior first; add complex polish only after the experience works.

## 6. Frontend implementation discipline

For React/Next.js/TypeScript work:

- Follow the repository's agent instructions, framework version, routing model, lint rules, and component conventions. Read installed framework documentation when repository instructions require it.
- Prefer semantic, reusable components and existing tokens over one-off styling or premature abstraction.
- Separate presentation from domain logic. Keep API calls and data transformations in the established service/client layer.
- Model UI states explicitly and type data at boundaries. Do not invent API fields or bypass typed contracts.
- Make layouts responsive by design, not by shrinking desktop layouts at the end.
- Optimize image sizes, formats, loading, and layout stability. Provide meaningful alt text where imagery conveys information.
- Avoid unnecessary dependencies, global CSS leakage, duplicated state, and abstractions that make simple UI harder to change.
- Keep changes scoped. Do not silently alter business rules, authentication, authorization, persistence, or API contracts to make a screen easier to build.

A prototype is not production-ready merely because it renders. It must be connected to real state where required, handle errors, and meet accessibility and responsive expectations.

## 7. Accessibility and inclusive interaction

Treat accessibility as part of design quality, not a final audit.

- Use semantic HTML and correct heading order.
- Ensure keyboard access, logical tab order, visible focus, and no keyboard traps.
- Provide accessible names and instructions for controls, inputs, icons, and dialogs.
- Maintain sufficient text and non-text contrast.
- Do not use color alone to communicate status.
- Provide clear validation and error messages that are associated with their fields.
- Use comfortable touch targets and avoid hover-only functionality.
- Support zoom, narrow viewports, and reduced motion.
- Ensure dynamic updates are understandable to assistive technology without excessive announcements.

## 8. Rendered-browser quality assurance

Review the actual rendered interface; do not approve based only on source code or a single screenshot.

Test desktop, tablet, and mobile widths, plus realistic content variation. Inspect:

- hierarchy, typography, color, alignment, spacing, image crop, and component consistency;
- navigation, forms, buttons, focus, keyboard behavior, touch targets, and complete journeys;
- loading, empty, error, success, disabled, and permission states;
- sticky elements, overflow, long text, orientation changes, and responsive transitions;
- animation quality, reduced-motion behavior, performance, and layout stability.

Record each defect with the screen/route, viewport, steps to reproduce, expected behavior, actual behavior, and severity. Group fixes into functionality, visual consistency, motion, responsiveness, accessibility, and performance. After each correction batch, rerun relevant checks and regression-test neighboring flows.

Use an evidence-based scorecard: hierarchy, typography, color, alignment/spacing, consistency, usability, accessibility, responsiveness, interaction, motion, and performance. Do not let a high average hide a critical failure such as an inaccessible primary action, misleading state, broken checkout, or unsafe workflow.

## 9. Design review checklist

Before calling work complete, verify:

- [ ] The design solves a defined user problem and reflects the actual product.
- [ ] Claims, data, statuses, and actions are backed by implementation or verified contracts.
- [ ] References informed the design without producing a copied template.
- [ ] Visual hierarchy, typography, color, spacing, and imagery are coherent.
- [ ] All visible controls work and all important states are designed.
- [ ] Responsive behavior is checked at realistic viewport sizes.
- [ ] Keyboard, focus, contrast, semantics, screen-reader names, and reduced motion are considered.
- [ ] Rendered-browser review and relevant regression checks were performed.
- [ ] No fake metrics, dead actions, decorative filler, or unsupported claims remain.
- [ ] Documentation and handoff distinguish implemented, partial, planned, and unverified behavior.

Report what was inspected, what changed, checks actually run, known limitations, and any decisions still needed. Never claim visual QA, accessibility testing, or a command passed if it was not performed.


## 10. Nhlanganiso bakery ecommerce specialization

Design for customers buying cakes, muffins, baked goods, and catering services. The purchase decision is visual and practical: customers need to understand what the item looks like, what they receive, the price, available options, timing, and how fulfillment works.

- Product imagery must be appetizing, truthful, well-lit, and consistent across the catalog. Show the actual product; do not substitute unrelated stock imagery or AI-generated product photos that imply a different item.
- Keep product identity separate from configurable quantity, size, flavor, or weight. A product title should not hard-code a quantity that customers can change.
- Put price and important availability/lead-time information where customers can find it early. Do not invent prices, stock, ratings, delivery windows, allergens, ingredients, or customization options.
- Make variants and quantity choices understandable, including units and resulting totals. Ensure the selected option is obvious and survives cart review.
- Keep cart and checkout focused: clear line items, quantities, server-priced totals, fulfillment choice, validation, payment handoff, and trustworthy confirmation.
- Distinguish pickup, delivery, and catering enquiry journeys. The README currently describes pickup-only UI because no delivery-zones endpoint is available; do not present delivery as selectable until a real supported flow exists.
- Treat payment as authoritative only when the backend confirms it. A browser return page is not proof of payment.
- For catering, explain the enquiry/quote/acceptance journey without implying that quote acceptance takes payment.
- Place reviews and trust signals near the decision they support only when genuine review data exists.
- Use food-specific visual storytelling with restraint: let product photography lead, and avoid overly saturated colors, excessive decorative sprinkles, generic bakery illustrations, or card grids that compete with the products.

Repository-specific implementation context: the README describes Next.js 15 App Router, React 19, TypeScript, a hand-written design system in `src/app/globals.css`, reusable components under `src/components`, and typed API wrappers in `src/lib/services.ts`. Preserve these conventions. Cart totals are server-quoted; do not calculate authoritative prices in the browser.