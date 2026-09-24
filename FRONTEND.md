# Frontend Guide — Invensis LMS

Companion to `TASTE.md` (rules you must follow) and `../Server/API.md` (endpoint
reference). This file explains **why the frontend behaves the way it does**: the
decisions a new developer would otherwise have to reverse-engineer, and the
flows that span several screens and several people.

Everything here was verified against the code, not written from memory. Where a
statement is a *decision* rather than a fact, it is labelled as such.

---

## 1. Pagination — why two tables do it two different ways

`/admin/users` pages on the **server**. `/admin/trainers` pages in the
**browser**. That is deliberate, not an inconsistency someone forgot to clean up.

### The rule

> **Filtering and pagination must live on the same side.**

Split them and you get a silent correctness bug: the server hands back ten rows,
the browser filters *those ten*, and the user sees "3 results" when the real
answer is 300. Filter dropdowns built from the loaded list have the same
problem — they would only ever offer values that happen to appear on the
current page.

So the question is never "client or server pagination". It is **"where do the
filters live?"** — and pagination follows.

### User Management → server

| | |
|---|---|
| Rows | 82 today, unbounded (every learner ever enrolled) |
| Filters | 3 — search, location, job title. All plain SQL columns. |
| Decision | **Server.** `LIMIT/OFFSET` + a separate `COUNT`. |

```
Browser                          API                         Postgres
  page=9  ──────────────────────▶ /admin/participants ──────▶ LIMIT 10 OFFSET 80
          ◀────────────────────── { participants:[10],  ◀──── + COUNT(*) = 82
             only 10 rows            total:82,                + summary aggregate
             ever cross the          summary:{…},             + DISTINCT options
             wire                    filters:{…} }
```

Three things the server must return for this to work, and each exists because
leaving it out caused a real bug:

- **`total`** — page count. Obvious.
- **`summary`** — Active / Inactive / Total Enrolments across the *whole filtered
  set*. The stat cards used to be derived from the rows on screen, which read
  "Active: 7" out of 500.
- **`filters`** — distinct locations and job titles across **all** participants,
  independent of the current page, so the dropdowns stay complete.

Offset paging also needs a **unique sort key**. `ORDER BY created_at DESC` alone
lets tied rows come back in planner-defined order, so the same person appears on
two pages while another is skipped. Bulk-imported participants share a
`created_at` to the millisecond, so this was a live hazard, not a theoretical
one. The fix is the tie-break: `ORDER BY created_at DESC, id DESC`.

### Trainers → client

| | |
|---|---|
| Rows | 15. Whole table ≈ **3.4 KB**. |
| Filters | **6** — specialization, certification, location, experience band, status, remote-only, plus search |
| Decision | **Client.** One fetch, then `rows.slice()`. |

Those six filters are the reason. They run over:

- `specializations` — **JSONB array**
- `certificates` — **JSONB array of objects**, filtered by `.title`
- `experience` — **free text** (`"2 decades of exp in Portfolio, Program…"`), parsed for a leading integer
- `location` — a **composed** string (`city, country · Remote`)

Moving those into SQL means JSONB containment, `jsonb_array_elements`, a numeric
extract from prose, and rebuilding the composed location — plus a second query
for the distinct filter options. Against 15 rows and 3.4 KB.

```
Browser                                   API
  mount ──────────────────────────────────▶ /admin/trainers?include_inactive=true
        ◀────────────────────────────────── all 15 (~3.4 KB, one time)

  filter ──▶ rows = all.filter(6 predicates)      ── in memory
  page   ──▶ paged = rows.slice((p-1)*10, p*10)   ── in memory
```

### When to switch trainers to server-side

Not at 500 (0.18 MB). The threshold is roughly **1,000–2,000**, where the
per-load transfer stops being free. At 10,000 trainers it would be **3.7 MB on
every page load** — measured, not guessed, at 387 bytes/trainer.

The migration path, when it comes:

1. Push all six filters into SQL (JSONB containment, `jsonb_array_elements`, numeric extract, composed location)
2. Add a `filters` block of distinct options across **all** trainers
3. Add a `summary` aggregate for the stat cards
4. Add `LIMIT/OFFSET` **with a unique tie-break**
5. Index `(is_active, name)` + GIN on the two JSONB columns

**`components/shared/data-pagination.jsx` does not change.** Both tables already
use it, which is the point of it living in `shared/`.

> **Separate, cheaper win:** the API has **no compression middleware** — JSON
> responses are not gzipped. One line of Express config shrinks every payload
> 5–10×, and buys a lot of headroom on the current design.

### The one thing that must not be paginated

`training-management.jsx` calls `fetchTrainers({ token })` to populate the
**assign-trainer dropdown**. That must return **every** trainer. It works today
because the trainers API was never given pagination — if it is, that call needs
an explicit "all" mode.

---

## 2. Certified vs training course — where the distinction comes from

This single distinction drives **which document a learner receives**, so it is
worth understanding end to end.

### The chain

```
CMS (cms.invensislearning.com)
  course.course_type            "certification" | "training_only"
  course.meta.certification_inculded   ← note the CMS's own spelling
        │
        │  GET /api/cms/courses  →  courses.service sync
        ▼
courses table (the catalog)          ← authoritative
  course_type, certification_included
        │
        │  order ingestion: resolveCourseFacts(course.slug)
        ▼
training_ids snapshot                ← fallback if the catalog row is missing
  course_type, certification_included
```

> **Gotcha:** the CMS field is spelled **`certification_inculded`**. The code
> reads that spelling first and falls back to the correct one
> (`cms.service.js`). Do not "fix" it.

**Reads prefer the catalog, falling back to the training's snapshot.** The
catalog is the CMS's current answer; the snapshot is what was true when the
order landed. If the CMS is unreachable at ingestion time the snapshot is null,
and the catalog fills the gap later.

### The rule — `credentialTypeFor()`

```
course_type === "certification"  AND  certification_included === true
        │                                        │
        ▼ yes                                    ▼ no / anything else
  attendance_letter                         certificate
  "Letter of Course Attendance"             "Certificate of Training"
```

**Why:** when the certification is included, the *awarding body* (PMI,
PeopleCert…) examines the learner. Invensis cannot certify an achievement it did
not assess — it can only attest that the person attended. That is a legal
distinction, which is why the advisory text on the letter is not optional.

Three states, not two:

| Course | Pill | Document | Wording shown to the learner |
|---|---|---|---|
| `certification` + included | 🏅 Certification course | **Letter of Course Attendance** | "Your exam is booked with the awarding body — this letter confirms attendance, not the qualification." |
| `certification`, not included | 🏅 Certification course | Certificate of Training | "Exam certification isn't included in this booking." |
| `training_only` | 📖 Training course | Certificate of Training | "Awarded by Invensis Learning once your training is complete." |

`credentialTypeFor()` lives in `Server/src/lib/certificates.js` and is called by
**both** the learner's list and the public verification endpoint. One
implementation means the card, the verification page and the printed PDF cannot
drift apart.

`is_certification` also controls the **PMI logo** (bottom-left) and the
**PDU seal** on the certificate face.

---

## 3. Training status — what sets it, and what does not

### The enum vs reality

`training_status` has seven values. **Only some are reachable.**

| Status | Who sets it |
|---|---|
| `active` | **Order ingestion**, hard-coded. Also the column default. |
| `completed` | Admin — "Complete" |
| `suspended` | Admin — "Suspend" |
| `cancelled` | Admin — cancel |
| `postponed` | Reschedule flow |
| `ongoing` | **Nothing. No code path writes it.** |
| `pending` | **Unreachable** since migration `0031` (default changed to `active`) |

The admin API accepts exactly three: `completed`, `suspended`, `active`.

**Consequence for the UI:** never hardcode a list of status filter tabs. Build
them from the statuses the response actually contains, or you offer filters that
can only ever return nothing. `trainings-list.jsx` does this — `STATUS_ORDER` is
an *ordering*, not a list of tabs.

> `ongoing` is a status with a real meaning ("running right now") that nothing
> assigns. The clean fix is to **derive** it from the dates rather than store
> it — `lib/training-groups.js` already does exactly this for the learner's
> view. Until then, "Due for Update" compensates.

### Lifecycle

```
   CRM order (payment_status = paid)
            │
            ▼
        ┌────────┐   admin: Complete ──▶ gate? ──▶ ┌───────────┐
        │ active │                                  │ completed │ terminal
        └────────┘   admin: Suspend  ─────────────▶ └───────────┘
            │  ▲                                    ┌───────────┐
            │  └──── admin: Reactivate ─────────────│ suspended │
            │                                       └───────────┘
            │        reschedule ──▶ ┌───────────┐
            └──────────────────────▶│ postponed │──▶ back to active on reactivate
                                    └───────────┘
```

**"Due for Update"** is computed on read, not stored, and there is no background
job:

```
due_for_update = end_date has passed  AND  status ∈ {active, ongoing, postponed, pending}
```

It is the admin's work queue: trainings that finished but were never closed.

### Status → what the learner sees

`LEARNER_HIDDEN_TRAINING_STATUSES = ["cancelled", "suspended"]` — those never
appear in a learner's list at all. **`postponed` stays visible** (deliberate:
the learner needs to know their dates moved).

`lib/training-groups.js` then groups what remains:

```
isCompleted(t) ─ enrolment_status = "completed" OR training status = "completed"
                 │ yes → COMPLETED
                 │ no
                 ▼
isOngoing(t)   ─ status = "ongoing"                    → ONGOING
                 status = "postponed"                  → not ongoing (see below)
                 start_date ≤ today ≤ end_date         → ONGOING
                 │ no
                 ▼
                 UPCOMING
```

Two decisions worth knowing:

- **`postponed` is excluded from Ongoing** even if its dates span today. Those
  are the *old* dates until the reschedule lands — a stale range would announce
  a training that isn't happening.
- **A training whose dates passed but which the admin never completed stays under
  Upcoming.** Not Completed: no certificate exists, so filing it there would
  claim something untrue. It corrects itself the moment the admin completes it.

---

## 4. The three manual gates — the part that spans people

This is the most misunderstood flow in the product. **Three humans must act, in
order.** Nothing here is automatic, and each gate exists for a reason.

```
 ┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐
 │ TRAINER  │───1───▶│  ADMIN   │───2───▶│  ADMIN   │───3───▶│ LEARNER  │
 │  marks   │        │ completes│        │ generates│        │ downloads│
 │attendance│        │ training │        │ +releases│        │          │
 └──────────┘        └──────────┘        └──────────┘        └──────────┘
      │                    │                    │                   │
      │                    │                    │                   └─ sees nothing
      │                    │                    │                      until step 3
      │                    │                    └─ generate ≠ release
      │                    └─ BLOCKED (409) if any attendance is not_marked
      └─ LOCKED once the training is completed or cancelled
```

### Gate 1 — the trainer marks attendance

`PUT /api/trainer/sessions/:sessionId/attendance`

Per learner, per session: `not_marked` → `present` | `partial` | `absent`.

**Attendance locks once the admin completes or cancels the training**
(`ATTENDANCE_LOCKED_STATUSES = {completed, cancelled}`). The register is
evidence; it must not change after the training is closed.

> **Known gap:** `PATCH /api/trainer/sessions/:id/topics` is **not** locked by
> the same rule. Day-wise topics can still be edited after completion.

### Gate 2 — the admin completes the training

`PATCH /api/admin/trainings/:id/status  { status: "completed" }`

**The attendance gate:**

```
count(enrolments where attendance_status = 'not_marked'
      and status not in ('cancelled','transferred'))
        │
        ├── 0  ──────────────────────────▶ completed ✓
        │
        └── > 0 ──▶ HTTP 409
                    {
                      code: "attendance_pending",
                      attendance_pending: 7,
                      can_force: true
                    }
                        │
                        └─▶ admin confirms ──▶ re-send with { force: true } ──▶ completed ✓
```

**Why a soft gate and not a hard one:** an unmarked register means we would be
recording completions nobody verified. But a trainer who has left, or a session
that ran offline, must not permanently block a cohort. So it **refuses once,
explains, and lets the admin override knowingly.**

**Frontend contract:** treat `409` + `code: "attendance_pending"` as a
*confirmation prompt*, not an error toast. Show the count, then re-send with
`force: true`.

Completing a training **cascades to its enrolments** — each becomes `completed`,
which is what makes learners certificate-eligible.

### Gate 3 — the admin generates, then releases

Two separate actions, and the distinction is the whole point:

```
POST …/certificates/trainings/:ref/generate
      requires: training.status === "completed"   (else 409)
      creates certificate rows, assigns INVLJA codes
      learner still sees NOTHING
                    │
                    ▼
POST …/certificates/trainings/:ref/release
      sets released_at
      learner can now see and download
```

**Why split:** generation is bulk and mechanical; release is a deliberate
publishing act. It gives the admin a window to correct a spelling, a date or a
PDU count *before* anyone sees the document.

The learner API gates on **`released_at`, not existence**:

- `certificate_issued` — `true` only after release
- `certificate_awaiting_release` — a certificate exists but is withheld
- `certificate_id` — **`null` until released** (the code identifies a valid
  credential, so it is not handed out early)

In the learner UI the certificate preview is rendered **blurred** until
`issued`.

---

## 5. Certificate generation — what is fixed and what the admin controls

### Not editable, by design

| Field | Source | Why locked |
|---|---|---|
| Course name | the training | a certificate must never state something the training doesn't |
| Session dates | `schedules.session_dates` | same |
| Training ID | `training_ids.code` | `TRN-YYYY-NNNN` |
| Course Identifier | `schedules.external_event_code` | the CMS's own event code, **not** random and **not** the schedule id |

### Admin-controlled (all **optional**)

| Field | Validation |
|---|---|
| PDUs | int **8–60** when given. Manually set — 35 hours ≠ 35 PDUs. |
| PDU claim code | ≥3 chars when given |
| Mode of training | `Live virtual class` · `in-person onsite` · `online classroom` · `onsite classroom`. Unset ⇒ derived from delivery mode. |

**`null` clears a value; an absent key leaves it untouched.** That is what lets
an admin remove a claim code without wiping the PDU count.

### Certificate ID

Postgres sequence `certificate_code_seq`, `INVLJA` + 4 digits, starting at
**INVLJA4447**.

### Session dates wording

Consecutive runs collapse, because a four-week course would otherwise list
sixteen ordinals:

```
"which took place on 8th, 9th, 10th, 11th, 15th, 16th, 17th and 18th October 2026,
 via online classroom"
```

---

## 6. QR codes and verification

### Generation

`qrcode` (npm), rendered client-side into a data URL in `useQrDataUrl()`:

```js
QRCode.toDataURL(verifyUrlFor(code), {
  margin: 0, width: 300, errorCorrectionLevel: "M",
  color: { dark: "#16224e", light: "#ffffff" },
})
```

**One QR per certificate ID**, encoding
`https://<host>/verify/<CERTIFICATE_ID>`. It **replaces the signature block** on
both documents.

### Which host

`lib/verify-url.js`, in priority order:

```
1. NEXT_PUBLIC_VERIFY_BASE_URL   ← set per environment; always wins
2. NODE_ENV === "production"     → https://portal.invensislearning.com
   otherwise                     → https://dev-portal.invensislearning.com
```

> **`NODE_ENV` alone cannot tell dev-portal from production** — both are built
> with `next build`, so both are "production". A deployed dev-portal **must**
> set `NEXT_PUBLIC_VERIFY_BASE_URL`, or it prints production URLs onto its
> certificates. It is inlined at **build** time: changing it needs a rebuild,
> not a restart.

### The verification page

`/verify/[code]` is **public** — a holder scanning a printed certificate has no
account. Public at three layers: `middleware.js` `PUBLIC_PATHS`, the `(public)`
layout (no cookie check), and `/api/verify` (no token). Rate-limited 30/min, and
it returns **`200` whether or not the code matches**, so it cannot be used to
enumerate valid IDs.

Scanning lands **directly on the result** — no re-entry of the code. `/verify`
without a code keeps the manual search form.

**Four render states** (`components/public/verify-result.jsx`):

| State | Banner | Shows |
|---|---|---|
| 1 · Certificate, PMI course | navy | PDU seal + PMI accreditation |
| 2 · Certificate, non-PMI | navy | same card, no seal |
| 3 · Letter of Attendance | **amber** | "Attended", **no** Certificate ID, **no** PDU seal, + the required advisory |
| 4 · Not found | red | empty state |

Nothing behind auth is exposed — only what is already printed on the face. No
email, no participant id, nothing about the order that paid for it.

### PDF rendering

`html2canvas-pro` → `jsPDF`. Two things that will bite you:

- It renders `linear-gradient` faithfully but **drops `inset` box-shadows**
- **Feed it PNG, not SVG.** An SVG without intrinsic `width`/`height` makes the
  rasteriser ignore the `viewBox` — the Invensis logo rendered as a **solid navy
  block** (a 16× zoom into the "I" bar). The logo is now a PNG in the documents.

Certificate = **1000×707 landscape**. Letter of Attendance = **707×1000
portrait**. `documentSpec()` is the single place that picks canvas and page size,
so the preview, the capture and jsPDF's orientation cannot disagree.

---

## 7. Onboarding — how accounts come into being

**There is no bulk/CSV import of learners or trainers.** Accounts are created
one of three ways. (CSV exists only as an attendance-report *download*.)

```
A. CRM order        POST /api/orders (HMAC-signed)
                      └─▶ schedule + training + sessions + participants + enrolments
                          learner account   → created, NO password
                          sponsor account   → created, NO password
                          both emailed a setup link

B. Admin adds a learner   POST /api/admin/trainings/:id/participants
                      └─▶ participant + confirmed enrolment (+ account if new)

C. Admin onboards a trainer   POST /api/admin/trainers
                      └─▶ users row, role "trainer", password_hash = NULL
                          unless an explicit password was supplied
                          → setup email
```

### The "no password yet" state

Every system-created account is **active but has no password**. It **cannot log
in** (`401`) until the person follows the setup link and sets one.

- `has_password: false` ⇒ render the **"Setup pending"** badge
- Offer **Resend setup email** on that row
- Combined with **`last_login_at: null`** ("Never"), that is how an admin spots
  an invitation nobody ever acted on

`last_login_at` is stamped on **successful password login only** — not on token
refresh, so it answers "when did they last sign in", not "when was a request
made for them". It **cannot be back-filled**: every account reads "Never" until
its next sign-in after the feature shipped.

---

## 8. Frontend conventions that are easy to get wrong

### Dates — two kinds, never interchangeable

| Kind | Fields | Helper |
|---|---|---|
| **Wall clock** | `start_date`, `end_date`, `start_time`, `end_time`, session times | `formatDate`, `formatTime`, `wallFields` |
| **Instant** | `created_at`, `enrolled_at`, `issued_at`, `last_login_at` | `formatInstantDate`, `formatInstantDateTime` |

**Never call `new Date(value)` on an API value in a component.** A wall-clock
9:00 AM session prints as 2:30 PM in India if you do. A timezone is a **label**
to print (`timezoneLabel`), not a conversion to apply.

The one deliberate exception is `components/trainer/timezone-converter.jsx`,
where a trainer explicitly asks "what is this in *my* zone".

### `Text` and `Box`

Use them instead of raw `h1`–`h5`, `p`, `span`, `div`.

**Two traps:**

1. `Text` only maps `h1–h5, p, span, div`. **`as="a"` silently renders a `<p>`**
   and the `href` does nothing. Use a real `<a>` or `next/link`.
   *(A live instance of this bug: the support address in
   `components/public/verify-result.jsx`.)*
2. Every variant carries **`break-all whitespace-normal`**, which breaks words
   mid-character and cancels `whitespace-nowrap`. In tables, override per cell
   with `truncate`.

### Tables

Use **`table-fixed`** with explicit header widths. Under the default `auto`
layout a single wide cell sets the table's intrinsic width and every other
column is squeezed to its minimum — the trainers table once rendered names one
character per line because of one 200-character specialization chip.

Add a responsive `min-w` so narrow screens scroll instead of cramping, and give
every truncated cell a `title`.

### Tailwind + template literals

Tailwind scans for **complete literal class names**. This works, because the
whole class is a literal in the constant:

```js
const INK_NAVY = "text-[#1b4689]";   //  found by the scanner
className={`font-bold ${INK_NAVY}`}
```

This does **not**:

```js
className={`text-[${color}]`}        //  never generated
```

### Verifying a change

`next build` and esbuild catch **syntax**, not **undefined identifiers** — a
missing import compiles fine and throws in the browser. SSR often hides it too:
a component that renders the offending line only after its fetch resolves will
still return **200** to `curl`.

Error boundaries now exist in all four route groups
(`app/(trainer|learner|admin|sponsor)/error.js`), so a throw shows a contained
card with the error `digest` instead of a blank page.

> The project's `eslint.config.mjs` currently fails with `Plugin "" not found`.
> Fixing it would catch the missing-import class of bug automatically.
