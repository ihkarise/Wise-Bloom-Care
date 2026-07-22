# 04 — Brand Guidelines

| Field | Value |
|---|---|
| Document | Brand Guidelines |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/03-UX/35-DESIGN_SYSTEM.md`, `docs/03-UX/37-COLOR_SYSTEM.md`, `docs/03-UX/38-TYPOGRAPHY.md` |

---

## 1. Purpose

Defines the brand identity of Wise Bloom Care: name, meaning, personality, voice, and the high-level visual direction. This document governs *feel and expression*; the concrete design tokens (exact hex values, type scale, spacing) are specified downstream in `docs/03-UX`. This document is the source of intent those tokens must serve.

## 2. Scope

Covers verbal identity (name, tagline, tone, voice), personality attributes, and visual direction (mood, colour intent, imagery, logo usage). It does **not** define implementation tokens (see Color System, Typography, Design System) or legal/marketing copy.

## 3. Brand Essence

- **Product name:** Wise Bloom Care
- **Domain:** care.wisehomeopathy.com
- **Essence in one line:** *A calm, wise companion for a family's growing life.*

**Name meaning.** *Wise* — grounded, evidence-led, trustworthy. *Bloom* — growth, flourishing, the unfolding of a new life. *Care* — warmth, attentiveness, safety. Together: intelligent care for a life that is blooming.

## 4. Brand Personality

Wise Bloom Care behaves like a **knowledgeable, warm midwife-friend**: expert but never clinical-cold, reassuring but never dishonest, present but never intrusive.

| Attribute | We are | We are not |
|---|---|---|
| Tone | Calm, warm, reassuring | Alarmist, clinical-cold, saccharine |
| Authority | Evidence-led, credible | Preachy, know-it-all |
| Presence | Gentle, supportive | Naggy, gamified, attention-seeking |
| Aesthetic | Premium, minimal, soft | Cheap, cluttered, "cutesy" baby-app cliché |
| Honesty | Plain-spoken, transparent | Vague, hedging, fear-selling |

## 5. Verbal Identity (Voice & Tone)

### 5.1 Voice principles
- **Speak to a tired parent, kindly.** Short sentences. Plain words. No jargon without a plain-language gloss.
- **Reassure first, then inform.** Lead with what's okay; contextualise before presenting raw numbers.
- **Never alarm without a path.** If we must surface a concern, we always pair it with a clear, calm next step (usually: talk to your clinician).
- **Respect the reader's intelligence.** No baby-talk, no condescension.
- **Own uncertainty.** "We don't have enough information yet" is a valid, trustworthy thing to say.

### 5.2 Content typing in language (critical)
Language must make the three content types unmistakable:
- **Educational** — neutral, explanatory: *"Around week 20, many people feel the first movements."*
- **Clinical recommendation** — attributed, guideline-linked: *"WHO recommends at least 8 antenatal contacts. Discuss your schedule with your clinician."*
- **Emergency warning** — direct, unmistakable, action-first: *"Seek urgent medical care now if you have severe headache with vision changes."*
These three registers must never blur into one another. See `docs/02-Research/28-MEDICAL_DISCLAIMER.md`.

### 5.3 Words we avoid
- Fear-selling adjectives ("dangerous", "scary") unless in a genuine, typed emergency warning.
- Absolute medical claims ("this means you have…").
- Guilt framing ("you should have…").

### 5.4 Tagline (working)
*"One journey. One record. Every bloom."* — working tagline, subject to marketing review (OQ-1).

## 6. Visual Direction

The visuals are specified precisely in `docs/03-UX`; here we set intent.

- **Mood:** premium, calm, medical, warm. Think a serene clinic suite, not a nursery.
- **Colour intent:** soft, natural, low-saturation base (warm neutrals, gentle greens/roses evoking bloom and skin-safe calm), with restrained accent for actions. Emergency states use an unambiguous, reserved alert colour used *only* for genuine warnings. Exact tokens: `docs/03-UX/37-COLOR_SYSTEM.md`.
- **Typography intent:** a humanist, highly legible type system — friendly but serious; generous line-height for calm reading. Exact scale: `docs/03-UX/38-TYPOGRAPHY.md`.
- **Space & density:** generous whitespace; timeline-first, dashboard-first layouts; one primary focus per screen.
- **Imagery:** abstract, inclusive, and calming (soft botanical/bloom motifs, diverse and respectful depictions). Avoid stock-cliché pregnancy imagery and gendered pink/blue defaults.
- **Data visualisation:** charts are calm and clear — current, previous, trend, prediction — never alarmist colouring (see `docs/03-UX/35-DESIGN_SYSTEM.md` and Chart.js usage in modules).
- **Iconography:** soft, rounded, consistent stroke; see `docs/03-UX/39-ICONOGRAPHY.md`.

## 7. Logo & Name Usage (rules)

- Always "Wise Bloom Care" in full on first use; "Wise Bloom" acceptable on subsequent, informal reference within a screen. Never "WBC" in user-facing copy.
- Never alter the wordmark colours to signal state (state is communicated by UI, not by the logo).
- Clear-space and lockup specifications: to be defined with the visual identity asset set (OQ-2).

## 8. Accessibility of Brand

Brand expression never overrides accessibility. Contrast, motion, and colour choices must satisfy `docs/03-UX/40-ACCESSIBILITY.md` (WCAG 2.2 AA). Calm aesthetics must not produce low-contrast, hard-to-read surfaces.

## 9. Business Rules

- BR-1: Emergency warning styling/colour is reserved exclusively for genuine, typed emergency content and may not be used decoratively.
- BR-2: Copy must be typed as educational / clinical / emergency; untyped medical copy fails review.
- BR-3: Default states never assume gender of the child (no pink/blue defaults).

## 10. Acceptance Criteria

- [x] Defines name meaning, personality, and voice with concrete examples.
- [x] Encodes the three-way content typing into verbal identity.
- [x] Sets visual intent and defers precise tokens to `docs/03-UX`.
- [x] Subordinates brand to accessibility.

## 11. Future Expansion

Full visual identity asset kit (logo lockups, illustration library, motion language), localisation of voice for additional languages/markets, and a brand-tone guide for the future clinician portal.

## 12. Dependencies

`docs/03-UX/35-DESIGN_SYSTEM.md`, `37-COLOR_SYSTEM.md`, `38-TYPOGRAPHY.md`, `39-ICONOGRAPHY.md`, `40-ACCESSIBILITY.md`; content typing from `docs/02-Research/28-MEDICAL_DISCLAIMER.md`.

## 13. Open Questions

- OQ-1: Final tagline (marketing review).
- OQ-2: Logo lockup, clear-space, and asset kit — pending visual identity work.
- OQ-3: First localisation language(s) and any voice adaptation.

## 14. Risks

- R-1: "Calm" aesthetic drifting into low-contrast, inaccessible design. Mitigation: accessibility gate (§8).
- R-2: Brand warmth diluting the seriousness of emergency warnings. Mitigation: BR-1 reserved alert styling.
