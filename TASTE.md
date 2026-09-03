# TASTE — Technical Architecture, Standards, and Engineering Rules

> **Every new feature, page, or requirement MUST follow these rules.**
> Read this before writing any code. If a decision contradicts these rules, update this document first — then code.

---

## 1. Application Structure

### 1.1 Single App, Route Groups, Admin Prefix

We use **one Next.js application** with route groups to separate Learner and Admin portals.

```
app/
├── (auth)/          → /login, /register        (no sidebar, no auth required)
├── (learner)/       → /dashboard, /courses ...  (learner sidebar + topnav)
├── (admin)/         → /admin/dashboard ...      (admin sidebar + topnav)
├── layout.js        → Root layout (fonts, CSS, <html>/<body> only)
└── page.js          → Entry redirect
```

**Rules:**
- Learner routes live under `(learner)/` — URLs have NO prefix (e.g., `/dashboard`)
- Admin routes live under `(admin)/` — URLs are prefixed with `/admin` (e.g., `/admin/dashboard`)
- Auth routes live under `(auth)/` — public, no layout shell
- Each route group has its **own `layout.js`** with its own sidebar — never conditionally render sidebars
- The root `layout.js` contains ONLY fonts, global CSS, and `<html>/<body>` — no providers, no sidebar, no auth logic

### 1.2 Never Mix Portals

- Learner code must never import admin components or vice versa
- Shared UI goes in `components/ui/` or `components/shared/`
- Shared data logic goes in `lib/`
- Portal-specific components go in `components/learner/` or `components/admin/`

---

## 2. Rendering Strategy (Hybrid)

### 2.1 The Core Principle

**Static shell + client-side data fetching** for authenticated pages.
**SSG/ISR** for public pages.

This gives the fastest perceived load:
1. Shell loads instantly from CDN (~10ms)
2. Skeleton placeholders show immediately
3. Data fills in via API (~100-200ms)

### 2.2 Rendering Decision Table

Use this table when adding any new page:

| Page Type | Has user-specific data? | Rendering | Example |
|---|---|---|---|
| Public, rarely changes | No | **SSG** | Login, Register |
| Public, changes periodically | No | **ISR (60-300s)** | Course Catalog |
| Authenticated, user-specific | Yes | **SSG shell + client fetch** | Dashboard, My Courses, Progress |
| Authenticated, list/table | Yes | **SSG shell + client fetch** | Payments, Users (admin) |
| Authenticated, detail view | Yes | **SSG shell + client fetch** | Course detail, User detail |
| Admin, analytics/charts | Yes | **SSG shell + client fetch** | Analytics, Reports |

### 2.3 Rules

- **NEVER use full SSR for authenticated pages** — it blocks rendering until all data is fetched
- **NEVER use `"use client"` on page.js files** — keep pages as Server Components that render static shells
- **Client data fetching happens inside small client components** embedded in the page
- **SSG shell means:** the page layout, headings, card containers, and skeleton loaders are rendered at build time; data is fetched on the client after mount
- **ISR pages** must specify `revalidate` — never leave it undefined

### 2.4 Example Pattern

```jsx
// (learner)/dashboard/page.js — Server Component (static shell)
import { DashboardStats } from "@/components/learner/dashboard-stats";
import { ActiveCourses } from "@/components/learner/active-courses";

export default function DashboardPage() {
  return (
    <Box className="space-y-5">
      <Text as="h1">My Dashboard</Text>
      <DashboardStats />    {/* Client Component — fetches /api/stats */}
      <ActiveCourses />     {/* Client Component — fetches /api/courses */}
    </Box>
  );
}
```

```jsx
// components/learner/dashboard-stats.jsx
"use client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/learner/stats").then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return <StatsSkeletonLoader />;
  return <StatsGrid data={stats} />;
}
```

---

## 3. Server vs Client Components

### 3.1 Decision Rule

**Default to Server Component. Only add `"use client"` when you NEED browser APIs or interactivity.**

### 3.2 Classification Table

| Component | Type | Reason |
|---|---|---|
| `app/layout.js` (root) | **Server** | Fonts + CSS only, zero JS |
| `(learner)/layout.js` | **Server** | Renders shell, reads auth cookie |
| `(admin)/layout.js` | **Server** | Renders shell, reads auth cookie |
| `page.js` files | **Server** | Static shell, no interactivity |
| `top-nav.jsx` | **Client** | Sidebar toggle, dropdowns, notifications |
| `learner-sidebar.jsx` | **Client** | Active link state, toggle animation |
| `admin-sidebar.jsx` | **Client** | Active link state, toggle animation |
| `components/ui/*` (shadcn) | **Client** | Interactive by nature |
| Data-fetching widgets | **Client** | useEffect, useState for API calls |
| Static display (Text, Box) | **Server** | No interactivity |
| Forms | **Client** | User input, validation |
| Tables with sorting/filtering | **Client** | Interactive |
| Tables with static data | **Server** | No interactivity |

### 3.3 Rules

- **Push `"use client"` to the smallest leaf component** — never on a page or layout
- **A Server Component can render a Client Component** — but not the reverse
- **Never pass functions as props** from Server to Client Components
- **Data fetching in Server Components** uses `fetch()` or direct DB calls
- **Data fetching in Client Components** uses `useEffect` + `fetch()` or a data library (SWR/React Query)

---

## 4. Authentication & Authorization

### 4.1 Auth Flow

```
Login Page (SSG)
  └── POST /api/auth/login
        ├── Success → Set HTTP-only cookie with token + role
        │   ├── role: "learner" → redirect to /dashboard
        │   └── role: "admin"   → redirect to /admin/dashboard
        └── Failure → Show error on login page
```

### 4.2 Auth Check in Layouts

```jsx
// (learner)/layout.js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LearnerLayout({ children }) {
  const token = (await cookies()).get("token");
  if (!token) redirect("/login");
  // Decode token, verify role === "learner"

  return (
    <SidebarProvider>
      <TopNav />
      <LearnerSidebar />
      <main>{children}</main>
    </SidebarProvider>
  );
}
```

### 4.3 Middleware (Optional, Recommended)

Middleware is **allowed and does NOT break SSG**. It runs at the edge (~1ms) before serving static pages.

```
Request → Middleware (reads cookie, redirects if unauthorized) → Serves page
```

- Use middleware for: auth gating, role-based redirects, path protection
- Middleware does NOT convert SSG pages to SSR — the page is still served from CDN cache
- If you choose not to use middleware, auth checks happen in route group layouts (Section 4.2)

### 4.4 Rules

- **Tokens are stored in HTTP-only cookies** — never localStorage
- **Role is encoded in the token** — no separate API call to check role on every request
- **Auth redirects happen server-side** (in layout or middleware) — never rely on client-side redirects alone for security
- **API routes validate tokens independently** — never trust the client

---

## 5. Component Architecture

### 5.1 Directory Structure

```
components/
├── ui/              # Shadcn components + Text, Box (shared, no business logic)
├── shared/          # Domain components used by BOTH portals
│   ├── stat-card.jsx
│   ├── progress-bar.jsx
│   ├── course-card.jsx
│   └── data-table.jsx
├── learner/         # Learner-specific components (never imported by admin)
│   ├── dashboard-stats.jsx
│   ├── active-courses.jsx
│   └── ...
├── admin/           # Admin-specific components (never imported by learner)
│   ├── user-management.jsx
│   ├── course-editor.jsx
│   └── ...
└── layout/          # Shell components
    ├── top-nav.jsx
    ├── learner-sidebar.jsx
    └── admin-sidebar.jsx
```

### 5.2 Rules

- Use `<Text>` instead of raw `h1`–`h5`, `p`, `span` tags everywhere
- Use `<Box>` instead of raw `div` tags everywhere
- **Every component file = one concern** — don't mix data fetching with presentation
- **No business logic in `components/ui/`** — these are pure design system primitives
- **Shared domain components** go in `components/shared/` — must be portal-agnostic
- **Portal-specific components** go in `components/learner/` or `components/admin/`

---

## 6. Data & API Layer

### 6.1 API Routes

```
app/api/
├── auth/
│   ├── login/route.js
│   └── logout/route.js
├── learner/
│   ├── dashboard/route.js
│   ├── courses/route.js
│   └── progress/route.js
└── admin/
    ├── users/route.js
    ├── courses/route.js
    └── analytics/route.js
```

### 6.2 Rules

- API routes handle auth validation independently — check token in every request
- Return minimal JSON — never return more data than the UI needs
- Use proper HTTP status codes (401, 403, 404, 422)
- API routes are always Server-side — never expose DB credentials or secrets

### 6.3 Dates & Times

**Never call `new Date(value)` on an API value in a component.** Every date, time
and timestamp goes through `lib/datetime.js`.

The API sends two different kinds of value and they are not interchangeable:

| Kind | Fields | Helper | Rendered as |
|---|---|---|---|
| **Wall clock** | `start_date`, `end_date`, `start_time`, `end_time`, session `start_time`/`end_time`, CRM invoice dates | `formatDate`, `formatTime`, `formatDateTime`, `formatDateRange`, `dateValue`, `parseWallClock` | Exactly the digits the API sent |
| **Instant** | `created_at`, `updated_at`, `enrolled_at`, `submitted_at`, `issued_at`, `removed_at`, `generated_at`, `last_synced_at` | `formatInstantDate`, `formatInstantDateTime`, `instantValue`, `parseInstant` | On the viewer's own clock |

**Rules:**
- Wall-clock values are *not* instants. `date` columns arrive as `"2026-09-15"`
  and `time` columns as `"09:00:00"`; session timestamps are the session's own
  wall-clock time deliberately **labelled** `"Z"` by the server
  (``new Date(`${day}T${startTime}Z`)``). `new Date()` re-reads all of these as
  UTC instants and the browser then shifts them into the viewer's zone — a
  9:00 AM session prints as 2:30 PM in India, and the 15th slips to the 14th in
  New York.
- **Never pass a `timeZone` option** when formatting a session time. The stored
  value already *is* the wall clock in the training's timezone; converting it
  shifts it a second time. A timezone is a **label** to print next to the time
  (`timezoneLabel`), not a conversion to apply.
- The one deliberate exception is `components/trainer/timezone-converter.jsx`,
  which re-anchors a session's wall time into a real instant so a trainer can
  ask "what is this in *my* zone" — an explicit, user-driven conversion.
- **Never use `toISOString().slice(0, 10)`** to get a calendar day — it reports
  the UTC day, which is yesterday for anyone west of Greenwich. Use
  `toDateInput()`.
- **Wall-clock values are anchored in UTC and formatted with
  `timeZone: "UTC"`.** Not a timezone choice — a way of pinning the digits.
  UTC has no offset and no DST, so the output is a pure function of the API
  string plus the locale, and neither the browser's zone nor its clock can
  move it. `parseWallClock` does the anchoring; the formatters force the
  `timeZone` last so a caller can't override it.
- **Read the components with `wallFields()`, never `.getDate()`.** The anchor
  is UTC, so a local getter re-introduces exactly the shift we removed. Use
  `wallFields(value)` → `{ year, month, day, hour, minute, second, weekday }`.
- **A bare `time` value carries no date**, so it is anchored on the epoch, not
  on today. Hosting `"02:30:00"` on `new Date()` breaks on a spring-forward
  day — `setHours(2, 30)` lands on 3:30, because 2:30 doesn't exist.
- Because wall-clock output carries no timezone, it is identical on the server
  and the client — no hydration mismatch, and no `suppressHydrationWarning`.
- **CMS pass-through values are printed raw.** Upcoming-cohort times come
  straight from the CMS schedule listing (`start_time`, `end_time`,
  `timezone_code`, `time_slot_label`) and are rendered as the strings they
  arrived as. Don't put them through a `Date` at all.
- **A timezone abbreviation is resolved on the date being labelled**, via
  `timezoneLabel(tz, at)` — "BST" and "GMT" are the same zone in different
  seasons. Without an `at` it returns `""` rather than reading the browser
  clock for today's season.

**"Now" comes from the API, not the browser:**
- Anything measured against the present — a countdown, "is this session live",
  a "this month" bucket — takes its reference from the payload's own
  `generated_at` via `apiNow(generated_at, timezone)`. That reads the server's
  instant in the training's timezone, so it is quoted in the same frame as the
  session's wall clock. A learner with a mis-set laptop clock, or one sitting
  in another country, sees the same countdown as everyone else.
- When the payload carries no `generated_at`, `apiNow` returns `null` and the
  caller **hides** the label. Never fall back to `Date.now()` for training data
  — a wrong countdown is worse than no countdown.
- `new Date()` with no argument is only for the *viewer's* own time of day —
  the "Good morning" greeting, and nothing else.

---

## 7. Performance Rules

### 7.1 Always

- **Use `loading.js`** in every route for instant skeleton UI while page loads
- **Lazy load heavy components** (charts, rich editors, calendars) with `dynamic()`
- **Images use `next/image`** — never raw `<img>` tags
- **Fonts use `next/font`** — never external CDN font links
- **Keep client bundles small** — if a component doesn't need interactivity, keep it as Server Component

### 7.2 Never

- Never fetch data in `layout.js` that could block shell rendering
- Never use `getServerSideProps` pattern thinking — App Router doesn't use it
- Never import an entire library when you need one function (tree-shake)
- Never put `"use client"` on a file just because it imports a client component — only the leaf needs it

---

## 8. Styling Rules

- **Tailwind CSS utility classes only** — no inline `style={}` props
- **Use `cn()` from `lib/utils.js`** for conditional class merging
- **Component variants use `class-variance-authority` (cva)** — same pattern as shadcn
- **Colors use CSS variables** defined in `globals.css` — never hardcode hex values in components
- **Responsive: mobile-first** — use `sm:`, `md:`, `lg:` breakpoints

---

## 9. Checklist for Every New Feature

Before writing code for any new feature, answer these:

- [ ] Which portal does this belong to? `(learner)`, `(admin)`, or `(auth)`?
- [ ] Does the page show user-specific data? If yes → SSG shell + client fetch
- [ ] Does the page need interactivity? If yes → only the interactive parts are Client Components
- [ ] Can any component be shared between portals? If yes → put in `components/shared/`
- [ ] Does this page need a loading state? If yes → add `loading.js`
- [ ] Am I using `<Text>` and `<Box>` instead of raw HTML tags?
- [ ] Am I using Tailwind classes only (no inline styles)?
- [ ] Am I keeping the `"use client"` boundary at the smallest possible leaf?

---

## 10. File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Route pages | `page.js` | `app/(learner)/dashboard/page.js` |
| Route layouts | `layout.js` | `app/(learner)/layout.js` |
| Loading states | `loading.js` | `app/(learner)/dashboard/loading.js` |
| Error states | `error.js` | `app/(learner)/dashboard/error.js` |
| Components | `kebab-case.jsx` | `components/learner/dashboard-stats.jsx` |
| Utilities | `kebab-case.js` | `lib/format-currency.js` |
| Hooks | `use-*.js` | `hooks/use-auth.js` |
| API routes | `route.js` | `app/api/learner/dashboard/route.js` |
