# Supabase/PostgreSQL Best Practices for TeachBase

TeachBase-specific guidance for performance, safety, and maintainability on Supabase + PostgreSQL + Prisma.

---

## Part 1: Connection & Configuration

**Current Setup**:
- `DATABASE_URL` points to Supabase's **direct connection** (port 5432, not the pooled connection)
- This is correct for **migrations** (Prisma uses the direct connection)
- For **runtime queries**, the pooled connection (`*.pooler.supabase.co:6543`) would reduce overhead

**Decision**: Keep direct connection for now. Once real load appears (10+ concurrent teachers), switch to pooled for queries.

**Connection pooling** (when to add):
```env
# Direct (for migrations only)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# Pooled (for app queries, use a separate env var)
DATABASE_URL_POOLED="postgresql://postgres:[PASSWORD]@[REF].pooler.supabase.co:6543/postgres"
```

Prisma 7 + adapter-pg handles both transparently — configure in `prisma.config.ts`:
```ts
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL_POOLED") // Use pooled at runtime
}
```

---

## Part 2: Schema Design Decisions (Already Made)

**Multi-tenancy boundary**: `teacherId` on every table (except shared reference data like `TeachingLocation`, `LessonType`, `Subject`, `Course`, `InstructorCertification`, `DocumentRecord`, `TermCalendar`).

Every list/detail query filters by `session.user.id`:
```prisma
// ✅ CORRECT
const lessons = await prisma.lesson.findMany({
  where: {
    subscription: { teacherId: session.user.id }
  }
})

// ❌ WRONG (leaks data to other teachers)
const lessons = await prisma.lesson.findMany()
```

**Indexes** (critical for multi-tenant safety + performance):
```sql
-- Every table with teacherId must be indexed for fast filtering
CREATE INDEX idx_lesson_teacher ON lesson(teacherId);
CREATE INDEX idx_student_teacher ON student(teacherId);
CREATE INDEX idx_subscription_teacher ON subscription(teacherId);
-- ... (add for Student, Payer, Lesson, Subscription, etc.)

-- Composite indexes for common queries
CREATE INDEX idx_lesson_subscription_teacher 
  ON lesson(subscriptionId, teacherId);

CREATE INDEX idx_ledger_subscription_teacher 
  ON ledger_entry(subscriptionId, teacherId);
```

Check current state:
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'lesson';
```

**NOT NULL constraints**: Every `teacherId` field should be `NOT NULL` (prevents accidental NULL filtering). Already in schema — verify:
```prisma
model Lesson {
  teacherId String @db.Uuid
  subscription Subscription @relation(fields: [subscriptionId], references: [id])
  // ✓ teacherId is required, not optional
}
```

---

## Part 3: Avoiding Common Performance Pitfalls

### N+1 Query Problem

**Problem**: Fetching a list of subscriptions, then looping to fetch payers for each one.

```typescript
// ❌ SLOW (N+1 queries)
const subs = await prisma.subscription.findMany({
  where: { teacherId }
});
for (const sub of subs) {
  sub.payer = await prisma.payer.findUnique({
    where: { id: sub.payerId }
  });
}

// ✅ FAST (1 query with join)
const subs = await prisma.subscription.findMany({
  where: { teacherId },
  include: { payer: true }  // <-- Joins Payer at DB level
});
```

**Rule**: If you're looping and fetching per iteration, use `.include()` or `.select()` at the top level instead.

### Too Many Includes

**Problem**: Including unrelated relations pulls unnecessary data.

```typescript
// ❌ Too heavy (also fetches 50 LessonNotes per Lesson)
const lessons = await prisma.lesson.findMany({
  where: { subscriptionId },
  include: {
    subscription: true,
    student: true,
    notes: true,  // Could be 50 rows per lesson
    addOnBookings: true,
    sessionPlan: true
  }
});

// ✅ Selective (only what's needed)
const lessons = await prisma.lesson.findMany({
  where: { subscriptionId },
  select: {
    id: true,
    scheduledAt: true,
    isTrial: true,
    subscription: { select: { annualFee: true } },
    // Skip notes, addOns, sessionPlan unless specifically needed
  }
});
```

### Pagination Missing

**Problem**: Fetching `Lesson.findMany()` without `.take()` / `.skip()` pulls the entire table on first load.

```typescript
// ❌ Unbounded (teacher with 500 lessons = 500 rows at once)
const lessons = await prisma.lesson.findMany({
  where: { subscriptionId }
});

// ✅ Paginated (20 per page, skip as needed)
const page = req.query.page || 0;
const lessons = await prisma.lesson.findMany({
  where: { subscriptionId },
  take: 20,
  skip: page * 20,
  orderBy: { scheduledAt: 'desc' }
});
```

**For calendar views** (FullCalendar): fetch only the visible month/week range.
```typescript
const start = new Date(req.query.start);
const end = new Date(req.query.end);

const lessons = await prisma.lesson.findMany({
  where: {
    subscriptionId,
    scheduledAt: {
      gte: start,
      lte: end
    }
  }
});
```

---

## Part 4: Ledger Performance (Critical Hot Path)

`LedgerEntry` is a high-volume table: every lesson delivery, payment, correction posts a row. Queries here can be slow if not careful.

### Avoid Summing at Query Time

**Problem**:
```typescript
// ❌ SLOW: Sums 200 rows every time balance is requested
const balance = await prisma.ledgerEntry.aggregate({
  where: { subscriptionId },
  _sum: { amount: true }
});
```

**Better**: Cache the balance on the `Subscription` row itself.

```prisma
model Subscription {
  cashBalance Decimal @db.Decimal(10, 2) @default(0.00)
  // Updated whenever a ledger entry is posted
}
```

Then ledger queries only compute when actually posting an entry:
```typescript
// In postLessonDelivered, postPayment, etc.
async function postLedgerEntry(subscriptionId, entry) {
  await prisma.ledgerEntry.create({ data: entry });
  
  // Recompute balance only once, cache it
  const balance = await calculateCashBalance(subscriptionId);
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { cashBalance: balance }
  });
}
```

### Index on Subscription + Reason (Fast Filtering)

```sql
CREATE INDEX idx_ledger_subscription_reason 
  ON ledger_entry(subscriptionId, reason);
```

Used for queries like "all PAYMENT entries for this subscription":
```typescript
const payments = await prisma.ledgerEntry.findMany({
  where: {
    subscriptionId,
    reason: 'PAYMENT'
  }
});
```

### Make-up Credits & Cash Balance Separation

`LedgerEntry` has both cash (DEBIT/CREDIT) and make-up (MAKE_UP_CREDIT_ISSUED/REDEEMED) entries. **Never sum them together** — keep separate:

```typescript
function calculateCashBalance(subscriptionId) {
  return prisma.ledgerEntry.aggregate({
    where: {
      subscriptionId,
      reason: { in: CASH_BALANCE_REASONS }  // Excludes MAKE_UP_*
    },
    _sum: { amount: true }
  });
}

function calculateMakeUpCreditsOwed(subscriptionId) {
  return prisma.ledgerEntry.aggregate({
    where: {
      subscriptionId,
      reason: { 
        in: ['MAKE_UP_CREDIT_ISSUED', 'MAKE_UP_CREDIT_REDEEMED']
      }
    },
    _sum: { amount: true }
  });
}
```

---

## Part 5: Subscription & Lesson Conflict Detection

**Hot path during timetable generation**: checking for double-bookings.

### Current Implementation

`splitConflicts` in `src/lib/timetable.ts` compares exact `scheduledAt` timestamps:

```typescript
// Simplified: find overlapping lessons for same teacher
const conflicts = lessons.filter((a, i) =>
  lessons.some((b, j) => 
    i !== j && 
    a.teacherId === b.teacherId &&
    a.scheduledAt === b.scheduledAt  // Exact timestamp match
  )
);
```

### Optimize for Bulk Generation

When generating for 10+ students at once, don't query the DB 10 times. Fetch all existing lessons once:

```typescript
// ❌ SLOW: 10 teachers × 50 queries each during generation
async function previewTimetable(location) {
  for (const sub of subscriptions) {
    const existing = await prisma.lesson.findMany({
      where: { subscriptionId: sub.id }
    });
    // ... check conflicts ...
  }
}

// ✅ FAST: Fetch all at once
async function previewTimetable(location) {
  const allLessons = await prisma.lesson.findMany({
    where: {
      subscription: {
        teacherId: location.teacher.id,
        locationId: location.id
      }
    }
  });
  
  for (const sub of subscriptions) {
    const subLessons = allLessons.filter(l => l.subscriptionId === sub.id);
    // ... check conflicts ...
  }
}
```

---

## Part 6: Full-Text Search (Global Search)

`src/app/api/search/route.ts` searches across Payer/Student/School/LessonType/Course.

**Current**: Simple LIKE queries.

```typescript
// ❌ SLOW on large data
const payers = await prisma.payer.findMany({
  where: {
    name: { contains: query, mode: 'insensitive' }
  },
  take: 10
});
```

**Optimize with PostgreSQL Full-Text Search** (when dataset grows):

```sql
-- Add tsvector column for indexed full-text search
ALTER TABLE payer ADD COLUMN search_vector tsvector;

-- Trigger to keep it updated
CREATE TRIGGER update_payer_search BEFORE INSERT OR UPDATE ON payer
FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger(search_vector, 'pg_catalog.english', name, email);

-- Index for fast queries
CREATE INDEX idx_payer_search ON payer USING gin(search_vector);
```

Then query efficiently:
```typescript
const payers = await prisma.$queryRaw`
  SELECT * FROM payer 
  WHERE search_vector @@ plainto_tsquery('english', ${query})
  AND "teacherId" = ${teacherId}
  LIMIT 10
`;
```

**For now**: LIKE is fine while dataset is small. Add full-text search when search becomes slow.

---

## Part 7: Backup & Disaster Recovery

TeachBase holds sensitive data: student records, payment history, payer contacts.

**Supabase automated backups**:
- Daily backups included in Pro plan
- Accessible via Supabase dashboard → Backups
- 7-day retention minimum

**Before any major migration** (e.g., large schema change, bulk data correction):
1. Request a manual backup via Supabase UI
2. Keep the backup URL noted
3. Test changes on a clone of the DB first if possible

**Never delete without backup**:
- Schema migrations: always test locally first
- Ledger corrections: append new entries, never delete
- Student records: soft-delete (add `archivedAt`) rather than hard delete

---

## Part 8: Monitoring & Query Performance

### Enable Query Logs (Supabase Dashboard)

Settings → Logs → Postgres Logs

Look for:
- Queries taking >1s (slow logs)
- Sequential scans on large tables (missing indexes)
- N+1 patterns (same query repeated in a request)

### Use `EXPLAIN ANALYZE`

When a query feels slow, run it with EXPLAIN to see the plan:

```sql
EXPLAIN ANALYZE
SELECT * FROM lesson 
WHERE "teacherId" = '...' 
  AND "scheduledAt" BETWEEN '...' AND '...'
ORDER BY "scheduledAt" DESC;
```

If it says "Seq Scan" instead of "Index Scan", add an index.

### Prisma Logging (Dev Only)

In `prisma.config.ts`:
```ts
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
  // Enable in dev to see every query
  // log: ["query"]
}
```

Then queries print to stdout during `next dev`. Disable in production.

---

## Part 9: Data Integrity & Constraints

### Foreign Key Enforcement

Already in schema — verify:

```prisma
model Lesson {
  subscriptionId String
  subscription Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  // ON DELETE CASCADE: deleting a Subscription auto-deletes its Lessons
}
```

**Careful with cascades**: If a Subscription is deleted, all its Lessons, LessonNotes, and LedgerEntries cascade. This is intentional (clean slate) but test before shipping.

### Unique Constraints (Prevent Duplicates)

Examples that are already in schema:

```prisma
model StudentPayerLink {
  studentId String
  payerId String
  
  @@unique([studentId, payerId])  // Can't link same payer twice to same student
}

model Payer {
  teacherId String
  phone String?
  email String?
  
  @@unique([teacherId, phone])  // Same teacher can't have two payers with same phone
}
```

Add more if you discover duplicates are possible:
```prisma
model Student {
  teacherId String
  igCardId String?
  
  @@unique([teacherId, igCardId])  // Each teacher's IG Card ID is unique
}
```

---

## Part 10: Transaction Safety (Atomic Operations)

Critical operations (enrollment, timetable confirm, cancellation) must be all-or-nothing.

Prisma handles transactions natively:

```typescript
// ✅ SAFE: All succeed or all fail
await prisma.$transaction(async (tx) => {
  // Create subscription
  const sub = await tx.subscription.create({ data: {...} });
  
  // Create lessons (all at once)
  const lessons = await tx.lesson.createMany({
    data: lessonsToCreate
  });
  
  // Post initial ledger entry
  await tx.ledgerEntry.create({
    data: { subscriptionId: sub.id, ... }
  });
  
  // If any step fails, everything rolls back
});
```

**Without transaction**:
```typescript
// ❌ UNSAFE: Subscription created but lessons fail = orphaned record
const sub = await prisma.subscription.create({...});
const lessons = await prisma.lesson.createMany({...}); // <-- Could fail
```

Use transactions for:
- New student enrollment (Payer + Student + Subscription + initial LessonType link)
- Timetable confirm (Subscription update + multiple Lesson creates)
- Cancellation + notification + ledger posting
- Course purchase + LedgerEntry

---

## Part 11: Checklists

### Before Shipping a Migration

- [ ] Tested locally against a copy of real schema
- [ ] No data loss (use `ALTER TABLE ... ADD` not `DROP` when possible)
- [ ] Indexes added for any new queries
- [ ] Constraints in place (NOT NULL, unique, FK)
- [ ] Backward compatibility (if deploying while old version still runs)

### Before Bulk Operations (Ledger Corrections, Course Refunds, etc.)

- [ ] Requested Supabase backup
- [ ] Tested query on a small dataset first
- [ ] Wrapped in transaction
- [ ] Verified with `SELECT ... COUNT` before/after

### Before Deploying Code with New Queries

- [ ] Ran locally with Prisma logging on
- [ ] Confirmed no N+1 patterns
- [ ] Confirmed `.take()` limits pagination
- [ ] Verified `.include()` / `.select()` not pulling unnecessary data
- [ ] Checked indexes exist for `WHERE` clauses

---

## Part 12: Quick Reference

```typescript
// Fetch with filters + pagination
const items = await prisma.item.findMany({
  where: {
    teacherId,
    status: 'ACTIVE'
  },
  select: { id: true, name: true }, // Only what's needed
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: 0
});

// Count without fetching
const count = await prisma.item.count({ where: { teacherId } });

// Single item, with relations
const item = await prisma.item.findUnique({
  where: { id },
  include: { student: true }
});

// Bulk create (faster than loop)
await prisma.item.createMany({
  data: [{ ... }, { ... }]
});

// Update with condition
await prisma.item.updateMany({
  where: { status: 'CANCELLED' },
  data: { cancelledAt: new Date() }
});

// Atomic transaction
await prisma.$transaction(async (tx) => {
  // Multiple operations here, all-or-nothing
});
```

---

## Part 13: Monitoring Checklist (Monthly)

- [ ] Check slow logs in Supabase dashboard
- [ ] Review storage usage (any unexpected growth?)
- [ ] Verify backups are running
- [ ] Check for orphaned records (e.g., Lessons with no Subscription)
- [ ] Review cache hit rates (if implementing caching later)
