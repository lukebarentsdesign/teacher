# TeachBase Design System & Database Guide

Three companion documents for building TeachBase with intention and performance.

---

## The Three Documents

### 1. [design-system.md](design-system.md)
**What**: Complete visual design language for TeachBase.

**Read this to**: Understand the aesthetic direction, typography choices, color system, spacing, motion, accessibility standards, and component patterns.

**Key commitments**:
- **Tone**: Professional + Human (not corporate, not generic AI slop)
- **Typography**: Fraunces (display) + Lora (body) + JetBrains Mono (data)
- **Colors**: Teal primary (#0d7377), semantic colors for status (green=delivered, red=no-show, amber=warning)
- **Accessibility**: WCAG AA minimum — 4.5:1 contrast, keyboard nav, focus rings visible
- **Dark mode**: Native support via CSS variables, not inverted colors
- **Components**: Buttons, cards, tables, forms, modals — all specified with padding, radius, shadow, interaction states

**Use when**:
- Building a new component or page
- Reviewing UI for design consistency
- Setting up Tailwind configuration
- Implementing dark mode

---

### 2. [supabase-best-practices.md](supabase-best-practices.md)
**What**: Performance, safety, and maintainability guide for TeachBase's PostgreSQL database via Supabase + Prisma.

**Read this to**: Understand multi-tenant query patterns, N+1 problem prevention, ledger optimization, indexing strategy, backup procedures, and monitoring.

**Key decisions already made**:
- **Multi-tenancy boundary**: Every table filtered by `teacherId` in queries (security + performance)
- **Ledger optimization**: Cash balance cached on `Subscription` row, not computed on every read
- **Conflict detection**: Bulk fetches before comparisons, not per-student queries
- **Indexes**: Critical for teacherId filtering across large tables (Lesson, Student, Payer, etc.)
- **Transactions**: All-or-nothing atomic operations for enrollment, timetable confirm, cancellation

**Use when**:
- Writing database queries (check N+1 patterns first)
- Planning bulk operations (migrations, corrections)
- Optimizing a slow endpoint
- Adding new Prisma relations
- Setting up monitoring

---

### 3. [../src/styles/design-tokens.css](../src/styles/design-tokens.css)
**What**: CSS variable implementation of the design system.

**Read this to**: See every color, spacing, typography, shadow, and animation value as a CSS custom property.

**Key structure**:
- Light mode defaults (`:root`)
- Dark mode overrides (`@media (prefers-color-scheme: dark)`)
- Explicit theme overrides (`:root[data-theme="dark"]` / `[data-theme="light"]`)
- Status colors (SCHEDULED, DELIVERED, NO_SHOW, CANCELLED, TRIAL)
- Financial colors (balance positive/negative/pending)
- Location type colors (SCHOOL, STUDENT_HOME, TEACHER_BASE, HIRED_VENUE, ONLINE)

**Use when**:
- Building styles (import this first, use `var(--color-primary)` instead of hardcoding)
- Setting up Tailwind config to use custom colors
- Verifying dark mode behavior
- Understanding the token scale

---

## How They Work Together

```
┌─────────────────────────────────────────────────────────┐
│ design-system.md (The Spec)                             │
│ ├─ "Use Fraunces for headings"                          │
│ ├─ "Teal primary (#0d7377)"                             │
│ ├─ "4px spacing base unit"                              │
│ ├─ "WCAG AA accessibility"                              │
│ └─ Implementation checklist                              │
└─────────────────────────────────────────────────────────┘
           │
           └──────────────────┬─────────────────┐
                              │                 │
                              ▼                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────┐
│ design-tokens.css (CSS Variables)    │  │ Tailwind Config      │
│ ├─ --font-display: 'Fraunces'        │  │ ├─ colors: {...}     │
│ ├─ --color-primary: #0d7377          │  │ ├─ spacing: {...}    │
│ ├─ --space-md: 1rem (16px)           │  │ ├─ fontFamily: {...} │
│ ├─ --radius-md: 6px                  │  │ └─ extend: {...}     │
│ └─ Dark mode overrides               │  │ (maps to tokens)     │
└──────────────────────────────────────┘  └──────────────────────┘
           │                                        │
           └────────────────┬─────────────────────┘
                            │
                            ▼
                    Your Components
                    └─ Use CSS variables
                    └─ Tailwind classes
                    └─ Semantic colors
                    └─ Consistent across light/dark
```

---

## Practical Workflow

### Building a New Component

1. **Check design-system.md** for the pattern (button, card, form, etc.)
   - What padding? What shadow? What hover state?

2. **Use design-tokens.css variables** in your CSS or Tailwind
   ```tsx
   // ✅ RIGHT
   <button className="bg-[var(--color-primary)] text-white shadow-[var(--shadow-md)]">
     Create Lesson
   </button>

   // ❌ WRONG (hardcoded, not in design system)
   <button className="bg-blue-500 shadow-lg">
     Create Lesson
   </button>
   ```

3. **Verify accessibility** (per design-system.md checklist)
   - Contrast 4.5:1? ✓
   - Focus ring visible? ✓
   - Keyboard navigable? ✓

4. **Test dark mode** (should work automatically via CSS variables)

---

### Optimizing a Slow Query

1. **Check supabase-best-practices.md** for the pattern
   - N+1? Use `.include()` at the top level
   - Pagination missing? Add `.take()` / `.skip()`
   - Index exists? Check if SELECT is using Index Scan vs Seq Scan

2. **Verify multi-tenant safety**
   - Is the WHERE clause filtering by `teacherId`?
   - Could this leak a student to the wrong teacher?

3. **Monitor before/after** (check slow logs in Supabase dashboard)

---

### Adding a New Status or Color

1. **Update design-system.md** (Part 3: Color System section)
   - What does this status mean?
   - What color best signals it?

2. **Add CSS variable to design-tokens.css**
   ```css
   --color-status-new-status: #...;
   ```

3. **Update Tailwind config** (if using Tailwind classes)

4. **Use everywhere** (components, utilities, conditionals)
   ```tsx
   <div className="border-l-4" style={{ borderColor: 'var(--color-status-new-status)' }}>
     ...
   </div>
   ```

---

## Quick Reference

### Colors I'll Use Frequently

| Situation | Color Variable | Value (Light) | Value (Dark) |
|-----------|---|---|---|
| Primary action ("Save") | `--color-primary` | `#0d7377` | `#14b8a6` |
| Lesson delivered | `--color-status-delivered` | `#059669` | `#10b981` |
| No-show / overdue | `--color-status-no-show` | `#dc2626` | `#ef4444` |
| Late cancellation | `--color-status-cancelled` | `#d97706` | `#f59e0b` |
| Positive balance | `--color-balance-positive` | `#059669` | `#10b981` |
| Owing money | `--color-balance-negative` | `#dc2626` | `#ef4444` |

### Spacing I'll Use Frequently

| Purpose | Variable | Pixels |
|---------|----------|--------|
| Tight (icon + label) | `--space-sm` | 8px |
| Standard (card padding) | `--space-md` | 16px |
| Comfortable (between cards) | `--space-lg` | 24px |
| Section boundary | `--space-xl` | 32px |

### Fonts

| Context | Font | Variable |
|---------|------|----------|
| Headings, large CTAs | Fraunces | `--font-display` |
| Body text, paragraphs | Lora | `--font-body` |
| Ledger tables, code | JetBrains Mono | `--font-mono` |

---

## Design System Checklist (Before Shipping)

- [ ] **Typography**: Are headings using Fraunces? Is body text readable at 16px?
- [ ] **Color**: Does this respect the teal + semantic color scheme? Does dark mode work?
- [ ] **Spacing**: Am I using CSS variables (not magic numbers)? Is breathing room intentional?
- [ ] **Motion**: Does this animate with purpose? No scattered micro-interactions?
- [ ] **Accessibility**: WCAG AA? Contrast 4.5:1? Focus rings visible? Keyboard nav works?
- [ ] **Responsive**: Tested on 390px (mobile) and 1400px (desktop)?
- [ ] **Consistency**: Does this feel like TeachBase, not a generic template?

---

## Database Performance Checklist (Before Shipping)

- [ ] **Filtering**: Does this query filter by `teacherId` for multi-tenant safety?
- [ ] **N+1**: Am I looping and fetching per iteration, or using `.include()` at the top?
- [ ] **Pagination**: Is `.take()` limiting results? Is `.skip()` applied?
- [ ] **Indexes**: Does this `WHERE` clause have an index? (Check PostgreSQL logs)
- [ ] **Transactions**: Are all-or-nothing operations wrapped in `prisma.$transaction()`?
- [ ] **Ledger**: Am I computing balance at query time, or using cached `cashBalance`?
- [ ] **Backup**: Did I request a backup before bulk operations?

---

## Links to Full Documentation

- **Design System**: [design-system.md](design-system.md)
- **Database Best Practices**: [supabase-best-practices.md](supabase-best-practices.md)
- **Design Tokens (CSS)**: [../src/styles/design-tokens.css](../src/styles/design-tokens.css)
- **Build Order & Status**: [../CLAUDE.md](../CLAUDE.md)
- **Full Roadmap**: [../teachbase-roadmap-v2.md](../teachbase-roadmap-v2.md)

---

## Feedback & Iteration

These documents are **living guides**, not gospel. If you find:
- A color that doesn't feel right in dark mode → update design-tokens.css
- A spacing value that creates awkward gaps → adjust the variable
- A query pattern that's slower than expected → document it in supabase-best-practices.md

The goal is consistency + quality + performance. Update these docs as the product evolves.
