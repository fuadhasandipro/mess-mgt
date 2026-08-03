# PROJECT CONTEXT — Mess Meal & Money Manager

**Attach this file to EVERY chunk prompt you give the AI in Antigravity.**
It never changes. Only the chunk-specific file changes each time.

---

## 1. What this app is

A mobile-first web app for managing a shared "mess" (hostel/boarding house
food system). It replaces the paper sheet where meals, cash deposits, and
bazar (grocery) expenses are tracked by hand, and automatically calculates
each member's monthly cost and due/advance amount.

## 2. Roles

| Role   | Count per mess | Powers |
|--------|-----------------|--------|
| ADMIN  | 1 (can be more, but 1 is enough) | Add/remove members, promote/demote a member to MANAGER, view everything, edit anything, view activity log, manage mess settings |
| MANAGER | 1 at a time, changes every month | Add/edit daily meal entries for all members, add bazar expenses, add cash deposits, view calculations. Cannot add/remove members or promote anyone. |
| MEMBER | many | View own meal history, own deposits, own due/advance, view mess-wide summary (read-only). Cannot edit meals or expenses. |

Only ADMIN can promote a MEMBER to MANAGER or demote a MANAGER back to
MEMBER. Each promotion is tied to a specific month/year (a "manager term"),
so the app keeps history of who managed which month.

## 3. Core data the app tracks (mirrors the paper sheet)

- **Meals**: per member, per day, per meal-slot (breakfast / lunch / dinner).
  Values are usually 0, 1, or 2 (a member can eat a "double" meal), entered
  as numbers, not just checkboxes — matches the sheet exactly.
- **Deposits (cash-in)**: money a member hands to the manager, logged with
  date + amount + who recorded it.
- **Expenses (bazar/cash-out)**: money the manager spends on groceries/
  utilities for the mess, logged with date + amount + category + note.
- **Manager terms**: which user was manager for which month/year.
- **Activity log**: every create/update/delete anywhere in the app —
  who did what, when, to which record.

## 4. Calculation formulas (must be exact)

For a given mess + month:

```
totalMeals   = SUM(breakfast + lunch + dinner) for all members, that month
totalExpense = SUM(all expenses) for that month
mealRate     = totalExpense / totalMeals            // taka per meal

memberMeals  = SUM(breakfast + lunch + dinner) for one member, that month
memberCost   = memberMeals * mealRate
memberPaid   = SUM(deposits) for that member, that month
memberDue    = memberCost - memberPaid
               // positive = member OWES the mess
               // negative = mess OWES the member (advance)
```

All of this must be shown per member and mess-wide, for the currently
selected month, with the ability to look back at past months.

## 5. Tech stack (fixed — do not deviate)

- **Framework**: Next.js 14+, App Router, TypeScript
- **Database**: Neon (serverless Postgres)
- **ORM**: Prisma
- **Auth**: username + password (NOT email), sessions via NextAuth.js
  Credentials Provider, password hashed with bcrypt
- **Styling/UI**: Tailwind CSS + shadcn/ui components
- **Validation**: Zod
- **Mutations**: Next.js Server Actions (avoid building a separate REST API
  unless a chunk explicitly says so)
- **Hosting target**: Vercel (frontend) + Neon (db)
- **Design priority**: mobile screen first (390px width baseline), then
  scale up. Bottom nav bar on mobile, sidebar on desktop.

## 6. Database models (final — Prisma schema, build in Chunk 1)

```prisma
enum Role {
  ADMIN
  MANAGER
  MEMBER
}

model Mess {
  id           String        @id @default(cuid())
  name         String
  createdAt    DateTime      @default(now())
  users        User[]
  meals        Meal[]
  deposits     Deposit[]
  expenses     Expense[]
  managerTerms ManagerTerm[]
  activityLogs ActivityLog[]
}

model User {
  id            String        @id @default(cuid())
  username      String        @unique
  passwordHash  String
  name          String
  phone         String?
  role          Role          @default(MEMBER)
  isActive      Boolean       @default(true)
  messId        String
  mess          Mess          @relation(fields: [messId], references: [id])
  createdAt     DateTime      @default(now())
  meals         Meal[]
  deposits      Deposit[]
  expensesAdded Expense[]     @relation("ExpenseAddedBy")
  managerTerms  ManagerTerm[]
  activityLogs  ActivityLog[]
}

model Meal {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  messId     String
  mess       Mess     @relation(fields: [messId], references: [id])
  date       DateTime @db.Date
  breakfast  Float    @default(0)
  lunch      Float    @default(0)
  dinner     Float    @default(0)
  updatedById String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([userId, date])
}

model Deposit {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  messId    String
  mess      Mess     @relation(fields: [messId], references: [id])
  amount    Float
  date      DateTime @db.Date
  note      String?
  addedById String
  createdAt DateTime @default(now())
}

model Expense {
  id         String   @id @default(cuid())
  messId     String
  mess       Mess     @relation(fields: [messId], references: [id])
  amount     Float
  category   String   // "bazar" | "utility" | "other"
  date       DateTime @db.Date
  note       String?
  addedById  String
  addedBy    User     @relation("ExpenseAddedBy", fields: [addedById], references: [id])
  createdAt  DateTime @default(now())
}

model ManagerTerm {
  id           String   @id @default(cuid())
  messId       String
  mess         Mess     @relation(fields: [messId], references: [id])
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  month        Int      // 1-12
  year         Int
  assignedById String
  assignedAt   DateTime @default(now())

  @@unique([messId, month, year])
}

model ActivityLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  messId    String
  mess      Mess     @relation(fields: [messId], references: [id])
  action    String   // e.g. MEAL_UPDATED, MEMBER_ADDED, MANAGER_PROMOTED
  details   Json?
  createdAt DateTime @default(now())
}
```

## 7. Folder structure convention

```
/app
  /(auth)/login
  /(app)/dashboard
  /(app)/meals
  /(app)/finance
  /(app)/members         (admin only)
  /(app)/manager         (admin only - assign manager)
  /(app)/activity-log    (admin only)
  /(app)/profile
/components
  /ui                    (shadcn components)
  /meals
  /finance
  /members
  /shared
/lib
  db.ts                  (Prisma client singleton)
  auth.ts                (NextAuth config)
  actions/                (server actions, grouped by feature)
  calculations.ts        (all formulas from section 4)
  activity-log.ts         (helper: logActivity())
/prisma
  schema.prisma
```

## 8. Non-negotiable UX rules

- Every screen must work well on a phone (thumb-reachable buttons, no
  horizontal scrolling except the meal grid table itself which is allowed
  to scroll horizontally).
- Numbers entered for meals should use a numeric keypad on mobile
  (`inputMode="decimal"` or a stepper +/- control).
- Every destructive or role-changing action (remove member, promote/demote,
  delete expense) needs a confirmation dialog.
- Every mutation must call the activity-log helper.
- Use loading and empty states everywhere; never show a blank white screen.

## 9. How to use this with the chunk files

Each chunk file (01…10) is a self-contained instruction set for one
feature slice. Give Antigravity **this file + the one chunk file** at a
time, in order. Do not skip ahead — later chunks assume earlier chunks are
already built and working. After each chunk, test the acceptance checklist
at the bottom of that chunk file before moving to the next one.
