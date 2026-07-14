# Learnio Design System & Frontend Guidelines

Based on `frontend-design` skill + LibreUIUX global standards + Learnio's specific context.

---

## Part 1: Design Direction & Aesthetic

**Product Purpose**: Peripatetic teachers (solo freelancers) managing students across multiple locations, billing, scheduling, and relationships — from admin dashboard to parent-facing microsite.

**Audience**: 
- **Primary (dashboard)**: Self-employed teachers, age 25-60, technically competent (they use scheduling apps), value efficiency and clarity
- **Secondary (microsite)**: Parents/guardians and 16+ students, varying tech comfort, want transparency on schedules and payments

**Tone Commitment**: **Professional + Human**
- Brutally **NOT** corporate (no purple gradients, no generic San Francisco startup aesthetic)
- Clean, readable, direct — respect the teacher's time
- Warm micro-interactions that feel intentional, not scattered
- Accessibility-first: WCAG AA minimum on all interfaces
- Typography-led: distinctive, characterful font choices that signal "this is made for real people"

---

## Part 2: Typography

**Display Font (Headings, Dashboard Cards, Key CTAs)**: 
- **Primary choice**: [Fraunces](https://github.com/undercasetype/Fraunces) (serif, high contrast, distinctive)
  - Why: Warm, human, immediately signals "not a template"
  - Usage: H1, H2, dashboard section headers, CTA buttons (large)
  
**Alternate (if serif feels wrong for dashboard)**: 
- **Poppins** (sans, rounded, friendly) — use for gaming/education vibes
- **Outfit** (geometric, contemporary, clean) — use for modern, minimal aesthetic

**Body Font**: 
- **Inter** (only if unavoidable for existing codebase consistency, but see below)
- **Preferred**: [JetBrains Mono](https://www.jetbrainsmono.com/) for body text (code-adjacent, professional, unique at 16px)
- **Alternative**: [Lora](https://fonts.google.com/specimen/Lora) (serif, refined, readable at any size)

**Monospace (ledger tables, code blocks, lesson notes)**:
- **JetBrains Mono** or **Fira Code** (not Courier)

**Font pairing example**:
```css
/* Display */
--font-display: 'Fraunces', serif;

/* Body */
--font-body: 'Lora', serif;

/* Monospace */
--font-mono: 'JetBrains Mono', monospace;

/* Fallback stack (if web fonts fail) */
--font-sans-fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

---

## Part 3: Color System

### Base Palette (Learnio-specific, not generic)

**Primary Brand Color**: 
- **Teal/Slate blend** (not the blue-from-bootstrap everyone uses)
- Primary: `#0d7377` (deep teal, authoritative)
- Light: `#14b8a6` (accessible cyan, friendly)
- Dark: `#064e61` (slate undertone, professional)

**Why teal?**: 
- Association: trust, clarity, education, growth
- Distinct from SaaS defaults (blue, purple)
- Accessible on both light and dark backgrounds
- Used sparingly as accent, not dominant

### Semantic Colors

| Use | Light Mode | Dark Mode | Notes |
|-----|-----------|-----------|-------|
| **Success** | `#059669` (emerald) | `#10b981` | Lesson delivered, payment confirmed |
| **Warning** | `#d97706` (amber) | `#f59e0b` | Late cancellation, unpaid invoice |
| **Danger** | `#dc2626` (red) | `#ef4444` | No-show, subscription cancelled |
| **Info** | `#0284c7` (sky) | `#0ea5e9` | New feature, requires action |
| **Neutral (text)** | `#1f2937` (gray-800) | `#f3f4f6` (gray-100) | Body copy |
| **Neutral (bg)** | `#f9fafb` (gray-50) | `#111827` (gray-900) | Card backgrounds |

### Learnio-Specific Semantic Use

**Lesson Status**: 
- SCHEDULED = gray (neutral)
- DELIVERED = emerald (success)
- NO_SHOW = red (needs action)
- CANCELLED = amber (warning)
- TRIAL = sky (info)

**Financial State** (parent perspective):
- Positive balance (credit) = `#059669` 
- Zero balance = gray
- Owed = `#dc2626`
- Pending payment = `#d97706`

**Location Type** (small visual tags):
- SCHOOL = teal primary
- STUDENT_HOME = slate
- TEACHER_BASE = green
- HIRED_VENUE = orange
- ONLINE = sky/blue
- OTHER = gray

---

## Part 4: Spacing & Layout

**Base unit: 4px** (consistent with existing Tailwind)

| Scale | Pixels | Use |
|-------|--------|-----|
| xs | 4px | Fine-grained gaps in dense tables |
| sm | 8px | Tight spacing (icon + label, dense lists) |
| md | 16px | Standard padding on cards, button spacing |
| lg | 24px | Section spacing, card-to-card gaps |
| xl | 32px | Major section boundaries |
| 2xl | 48px | Page-level breathing room |
| 3xl | 64px | Hero sections |

---

## Part 5: Border Radius & Depth

**Radius Scale**:
- `rounded-sm`: 2px (buttons, tight UI)
- `rounded-md`: 6px (cards, inputs — **Learnio default**)
- `rounded-lg`: 8px (modals, larger cards)
- `rounded-xl`: 12px (hero sections, featured content)
- `rounded-full`: 9999px (avatars, badges, pills)

**Shadow System** (convey depth, not contrast):
- `shadow-xs`: `.5px 1px 2px rgba(0,0,0,0.04)` — subtle dividers
- `shadow-sm`: `0 1px 2px rgba(0,0,0,0.05)` — inputs, small cards at rest
- `shadow-md`: `0 4px 6px rgba(0,0,0,0.07)` — cards, buttons at rest
- `shadow-lg`: `0 10px 15px rgba(0,0,0,0.1)` — cards on hover, modals
- `shadow-xl`: `0 20px 25px rgba(0,0,0,0.15)` — dropdowns, elevated overlays

---

## Part 6: Motion & Micro-interactions

**Philosophy**: Motion should *delight*, not distract. One orchestrated moment beats scattered twitches.

### Page Load Animation
- Stagger lesson cards in by 50-100ms each (cascade effect)
- Fade in + slight upward slide: `opacity 0 → 1`, `transform translateY(8px) → 0`
- Duration: 400ms, easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` (ease-out-back)

### Button/CTA Hover
- Background color shift: 150ms, easing: ease-out
- Optional: subtle scale 1 → 1.02
- Cursor: pointer

### Modal Open
- Backdrop: fade in 200ms
- Modal itself: fade + scale (0.95 → 1.0) over 300ms

---

## Part 7: Components & Patterns

### Buttons

**Primary (CTAs: "Create lesson", "Confirm", "Save")**:
- Background: `#0d7377` (teal)
- Text: white
- Padding: `12px 20px`
- Border-radius: `rounded-md`
- Hover: darker teal, subtle scale
- Disabled: opacity 0.5, cursor not-allowed

**Secondary (less critical: "Cancel", "More options")**:
- Background: transparent
- Border: 1px solid gray
- Hover: light gray background

**Destructive (delete, cancel lesson)**:
- Background: `#dc2626` (red)
- Text: white
- Confirmation UI on click

### Cards

**Lesson Card** (dashboard):
- Background: white (light) / gray-900 (dark)
- Padding: 24px
- Border-radius: `rounded-md`
- Shadow: `shadow-md`
- Border-left: 4px solid [status color] (visual quick-scan)

**Subscription Card** (detail pages):
- Status badge top-right (ACTIVE, CANCELLED, PENDING_REVIEW)
- Balance figure emphasized (large, teal if positive)

### Tables

- Header: gray-100 background (light mode)
- Rows: alternating white/gray-50
- Borders: minimal (1px gray)
- Money amounts: right-aligned, monospace, color-coded (green/red)

### Forms

- Input padding: `10px 12px`
- Border: 1px solid gray
- Focus: 2px solid teal ring
- Label: bold, gray-700
- Error state: border red, message below in red

---

## Part 8: Responsive Breakpoints

**Mobile-first**: build for 390px, scale up.

| Breakpoint | Width | Use |
|------------|-------|-----|
| sm | 640px | Tablet (iPad mini) |
| md | 768px | Tablet full |
| lg | 1024px | Desktop (1-sidebar) |
| xl | 1280px | Desktop (2-column) |
| 2xl | 1536px | Large monitors |

**Learnio specific**:
- Dashboard sidebar: collapse to icons at < 1024px
- Lesson cards: 1 column at sm, 2 columns at md, 3 at lg
- Ledger table: horizontal scroll at sm, fixed at md+
- Parent microsite: full-width at all sizes

---

## Part 9: Dark Mode

**Strategy**: CSS variables + `prefers-color-scheme` + data-theme override.

**Learnio dark mode**:
- Surfaces: gray-900 (not pure black)
- Text: gray-100 (not pure white)
- Accents: bright teal/emerald (punch through dark better)
- Cards: gray-800 with subtle gray-700 borders
- Teacher preference: toggle in settings, persisted to localStorage

---

## Part 10: Accessibility (WCAG AA minimum)

**Color contrast**:
- Text on background: 4.5:1 ratio minimum
- UI components: 3:1 minimum

**Interactive elements**:
- Keyboard navigation: Tab order logical, visible focus indicator
- Focus ring: 2px solid teal, 2px offset
- Touch target: min 44x44px

**Text**:
- Line-height: 1.5 minimum
- Font size: 16px minimum for body (never smaller than 14px)

**Forms**:
- Every input: associated `<label>`
- Error messages: linked via `aria-describedby`
- Required fields: `required` attribute + visual indicator

**Semantic HTML**:
- `<button>` for buttons, not divs
- `<nav>`, `<main>`, `<section>` for landmarks
- `<table>` for data tables
- Heading hierarchy: h1 → h2 → h3 (no skipping)

---

## Part 11: Implementation Checklist

Before shipping any UI update:

- [ ] Typography: Are headings using Fraunces (or intentional alternative)?
- [ ] Color: Does this respect teal + semantic color scheme?
- [ ] Spacing: Used CSS variables, not magic numbers?
- [ ] Motion: Does this animate with purpose?
- [ ] Accessibility: WCAG AA? Focus rings visible? Contrast 4.5:1?
- [ ] Responsive: Tested on 390px and 1400px?
- [ ] Dark mode: Readable and intentional?
- [ ] Consistency: Does this feel like Learnio, not a template?

---

## Part 12: CSS Variables Quick Reference

```css
/* Colors */
--color-primary: #0d7377;
--color-primary-light: #14b8a6;
--color-primary-dark: #064e61;
--color-success: #059669;
--color-warning: #d97706;
--color-danger: #dc2626;
--color-info: #0284c7;
--color-text-primary: #1f2937;
--color-text-secondary: #6b7280;
--color-bg: #ffffff;
--color-bg-secondary: #f9fafb;
--color-border: #e5e7eb;

/* Typography */
--font-display: 'Fraunces', serif;
--font-body: 'Lora', serif;
--font-mono: 'JetBrains Mono', monospace;

/* Spacing */
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */
--space-3xl: 4rem;     /* 64px */

/* Radius */
--radius-sm: 2px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;

/* Shadows */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);

/* Transitions */
--transition-fast: 150ms ease-out;
--transition-standard: 300ms ease-out;
--transition-slow: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
```
