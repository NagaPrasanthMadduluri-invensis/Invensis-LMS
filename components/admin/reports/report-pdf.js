/*
 * PDF export for the admin Reports page — zero dependency.
 *
 * We render a self-contained, print-styled HTML document into a hidden iframe
 * and call print() on it. The browser's "Save as PDF" destination produces the
 * downloadable file. No client PDF library is pulled in (per TASTE.md: keep
 * client bundles small), and the layout is fully under our control via inline
 * CSS + an @media print block.
 */

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function money(n, currency = "USD") {
  const num = Number(n ?? 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `${currency} ${num.toLocaleString()}`;
  }
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

const cap = (s = "") => String(s).charAt(0).toUpperCase() + String(s).slice(1);

const MODE_LABEL = {
  virtual: "Virtual",
  in_person: "In-person",
  hybrid: "Hybrid",
  one_to_one: "One-to-one",
};
const BUCKET_LABEL = {
  direct_online: "Direct online",
  corporate: "Corporate",
  one_to_one_coaching: "1:1 coaching",
};

// Human label for the applied period.
function periodLabel(filters) {
  const { from, to } = filters ?? {};
  if (from && to) return `${fmtDate(from)} – ${fmtDate(to)}`;
  if (from) return `${fmtDate(from)} – present`;
  if (to) return `Up to ${fmtDate(to)}`;
  return "All time";
}

// Active non-date filters as a compact string.
function activeFiltersLabel(filters, labels) {
  const parts = [];
  if (filters.delivery_mode) parts.push(`Mode: ${MODE_LABEL[filters.delivery_mode] ?? filters.delivery_mode}`);
  if (filters.bucket) parts.push(`Bucket: ${BUCKET_LABEL[filters.bucket] ?? filters.bucket}`);
  if (filters.status) parts.push(`Status: ${cap(filters.status)}`);
  if (filters.location) parts.push(`Location: ${filters.location}`);
  if (filters.sponsorship) parts.push(`Sponsorship: ${cap(filters.sponsorship)}`);
  if (filters.duration) parts.push(`Duration: ${filters.duration} hrs/day`);
  if (filters.trainer_id && labels?.trainerName) parts.push(`Trainer: ${labels.trainerName}`);
  return parts.length ? parts.join(" · ") : "None";
}

const STYLE = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 32px; font-size: 11px; }
  h1 { font-size: 20px; margin: 0; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #334155; margin: 22px 0 6px; }
  .brand { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #6366f1; padding-bottom: 12px; }
  .brand .sub { color: #64748b; font-size: 12px; margin-top: 2px; }
  .meta { font-size: 11px; color: #64748b; margin-top: 10px; line-height: 1.6; }
  .meta b { color: #334155; }

  /* Every section is a bordered grid table */
  table { width: 100%; border-collapse: collapse; margin-top: 6px; border: 1px solid #cbd5e1; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 9px; text-align: left; vertical-align: top; }
  th { background: #eef2f7; color: #334155; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  .rk { width: 26px; text-align: center; color: #94a3b8; }
  .tot td { border-top: 2px solid #cbd5e1; font-weight: 800; background: #eef2f7 !important; }

  /* Metric / value grid (KPIs, retention, trainer utilization) */
  .kv .k { color: #475569; }
  .kv .v { font-weight: 800; color: #0f172a; }

  .low h2 { color: #b91c1c; }
  .footer { margin-top: 26px; font-size: 10px; color: #94a3b8; text-align: center; }
  .empty { color: #94a3b8; font-style: italic; }
  .narrative { margin-top: 10px; padding: 10px 12px; border-left: 3px solid #6366f1; background: #f5f6ff; font-size: 12px; line-height: 1.55; color: #334155; }
  .delta { font-weight: 700; }
  .up { color: #059669; } .down { color: #dc2626; } .flat { color: #94a3b8; }

  @media print {
    body { padding: 0; }
    @page { margin: 14mm; }
    h2 { page-break-after: avoid; }
    table { page-break-inside: auto; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
  }
`;

function rows(items, cols) {
  if (!items?.length) return `<tr><td colspan="${cols.length}" class="empty">No data for this period.</td></tr>`;
  return items
    .map(
      (it) =>
        `<tr>${cols
          .map((c) => `<td class="${c.num ? "num" : ""}">${esc(c.get(it))}</td>`)
          .join("")}</tr>`
    )
    .join("");
}

function table(items, cols) {
  return `<table><thead><tr>${cols
    .map((c) => `<th class="${c.num ? "num" : ""}">${esc(c.label)}</th>`)
    .join("")}</tr></thead><tbody>${rows(items, cols)}</tbody></table>`;
}

function documentShell(title, bodyHtml) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${STYLE}</style></head><body>${bodyHtml}<div class="footer">Invensis LMS · Confidential · Generated ${esc(
    fmtDate(new Date().toISOString())
  )}</div></body></html>`;
}

// Print an HTML string via a transient hidden iframe.
function printHtml(html) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const trigger = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // Give the print dialog time to grab the document before teardown.
    setTimeout(() => iframe.remove(), 1000);
  };
  // Wait for the iframe document to finish laying out.
  if (doc.readyState === "complete") setTimeout(trigger, 50);
  else iframe.onload = () => setTimeout(trigger, 50);
}

// Colored delta chip for the momentum block.
function deltaHtml(pct) {
  if (pct == null) return `<span class="delta flat">n/a</span>`;
  const up = pct >= 0;
  return `<span class="delta ${up ? "up" : "down"}">${up ? "▲ +" : "▼ "}${pct}%</span>`;
}

// A 2–3 sentence executive narrative auto-derived from the figures.
function narrative(report) {
  const cur = report.currency ?? "USD";
  const s = report.summary ?? {};
  const parts = [
    `Total revenue of ${money(s.revenue_total, cur)} across ${(s.paying_enrolments ?? 0).toLocaleString()} paying enrolments (avg ${money(s.avg_per_enrolment, cur)}).`,
  ];
  if (report.comparison?.delta?.revenue_pct != null) {
    const d = report.comparison.delta.revenue_pct;
    parts.push(`Revenue is ${d >= 0 ? "up" : "down"} ${Math.abs(d)}% versus the previous period.`);
  }
  const top = report.sales_by_location?.find((l) => l.revenue > 0);
  if (top) parts.push(`Strongest market: ${top.location} (${money(top.revenue, cur)}).`);
  const low = report.low_performing_locations?.[0];
  if (low && (!top || low.location !== top.location)) {
    parts.push(`Weakest with sales: ${low.location} (${money(low.revenue, cur)}).`);
  }
  if (report.concentration?.top5_pct != null) {
    parts.push(`Top 5 accounts make up ${report.concentration.top5_pct}% of revenue.`);
  }
  if (report.learner_retention) {
    parts.push(`${report.learner_retention.repeat_rate}% of learners were returning.`);
  }
  return parts.join(" ");
}

// Two-column Metric | Value grid (KPIs, retention, trainer utilization).
function kvTable(pairs) {
  return `<table class="kv"><tbody>${pairs
    .map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="num v">${esc(v)}</td></tr>`)
    .join("")}</tbody></table>`;
}

// Ranked revenue breakdown: # | Name | Revenue | Enrolments | Share | + Total row.
function salesTable(items, nameLabel, nameGet, cur) {
  if (!items?.length) {
    return `<table><tbody><tr><td class="empty">No data for this period.</td></tr></tbody></table>`;
  }
  const total = items.reduce((s, r) => s + (r.revenue ?? 0), 0);
  const totalEnr = items.reduce((s, r) => s + (r.enrolments ?? 0), 0);
  const head = `<tr><th class="rk">#</th><th>${esc(nameLabel)}</th><th class="num">Revenue</th><th class="num">Enrolments</th><th class="num">Share</th></tr>`;
  const body = items
    .map((r, i) => {
      const share = total > 0 ? Math.round(((r.revenue ?? 0) / total) * 1000) / 10 : 0;
      return `<tr><td class="rk">${i + 1}</td><td>${esc(nameGet(r))}</td><td class="num">${esc(money(r.revenue, cur))}</td><td class="num">${esc((r.enrolments ?? 0).toLocaleString())}</td><td class="num">${share}%</td></tr>`;
    })
    .join("");
  const foot = `<tr class="tot"><td></td><td>Total</td><td class="num">${esc(money(total, cur))}</td><td class="num">${esc(totalEnr.toLocaleString())}</td><td class="num">100%</td></tr>`;
  return `<table><thead>${head}</thead><tbody>${body}${foot}</tbody></table>`;
}

// Momentum as a Metric | Current | Previous | Change grid.
function momentumTable(report, cur) {
  const c = report.comparison;
  if (!c) return "";
  const noPrior = (c.previous.revenue_total ?? 0) === 0 && (c.previous.paying_enrolments ?? 0) === 0;
  const s = report.summary ?? {};
  const rows = [
    { l: "Revenue", now: money(s.revenue_total, cur), prev: money(c.previous.revenue_total, cur), p: c.delta.revenue_pct },
    { l: "Paying enrolments", now: (s.paying_enrolments ?? 0).toLocaleString(), prev: (c.previous.paying_enrolments ?? 0).toLocaleString(), p: c.delta.enrolments_pct },
    { l: "Avg / enrolment", now: money(s.avg_per_enrolment, cur), prev: money(c.previous.avg_per_enrolment, cur), p: c.delta.avg_pct },
  ];
  const body = rows
    .map(
      (r) =>
        `<tr><td>${esc(r.l)}</td><td class="num">${esc(r.now)}</td><td class="num">${noPrior ? "—" : esc(r.prev)}</td><td class="num">${noPrior ? '<span class="delta flat">new</span>' : deltaHtml(r.p)}</td></tr>`
    )
    .join("");
  return (
    `<h2>Momentum — vs ${esc(fmtDate(c.previous_period.from))} – ${esc(fmtDate(c.previous_period.to))}${noPrior ? " (no prior-period sales — nothing to compare yet)" : ""}</h2>` +
    `<table><thead><tr><th>Metric</th><th class="num">Current</th><th class="num">Previous</th><th class="num">Change</th></tr></thead><tbody>${body}</tbody></table>`
  );
}

/** Summary sales report → PDF (via print). Leads with an executive summary. */
export function printSalesReport(report, { trainerName } = {}) {
  const cur = report.currency ?? "USD";
  const f = report.filters ?? {};
  const s = report.summary ?? {};

  const head = `
    <div class="brand">
      <div><h1>Sales Report</h1><div class="sub">Revenue &amp; performance snapshot</div></div>
      <div class="meta" style="text-align:right;margin-top:0">
        <div><b>Period:</b> ${esc(periodLabel(f))}</div>
        <div><b>Generated:</b> ${esc(fmtDate(report.generated_at))}</div>
      </div>
    </div>
    <div class="meta"><b>Filters:</b> ${esc(activeFiltersLabel(f, { trainerName }))}</div>
    <h2>Executive summary</h2>
    ${kvTable([
      ["Total revenue", money(s.revenue_total, cur)],
      ["Paying enrolments", (s.paying_enrolments ?? 0).toLocaleString()],
      ["Total enrolments", (s.enrolments_total ?? 0).toLocaleString()],
      ["Avg / enrolment", money(s.avg_per_enrolment, cur)],
      ["Participants", (s.participants ?? 0).toLocaleString()],
      ["Orders", (s.orders ?? 0).toLocaleString()],
    ])}
    <div class="narrative">${esc(narrative(report))}</div>`;

  const t = report.trainers ?? {};
  const body =
    head +
    momentumTable(report, cur) +
    `<h2>Sales by location</h2>` +
    salesTable(report.sales_by_location, "Location", (r) => r.location, cur) +
    `<div class="low"><h2>Low-performing locations (bottom 5)</h2>` +
    salesTable(report.low_performing_locations, "Location", (r) => r.location, cur) +
    `</div>` +
    `<h2>Sales by course</h2>` +
    salesTable(report.sales_by_course, "Course", (r) => r.title, cur) +
    `<h2>Sales by pricing tier</h2>` +
    salesTable(report.sales_by_tier, "Tier", (r) => r.tier, cur) +
    `<h2>Sales by sponsorship</h2>` +
    salesTable(report.sales_by_sponsorship, "Sponsorship", (r) => cap(r.sponsorship), cur) +
    `<h2>Sales by delivery mode</h2>` +
    salesTable(report.sales_by_delivery_mode, "Mode", (r) => MODE_LABEL[r.delivery_mode] ?? r.delivery_mode, cur) +
    `<h2>Sales over time</h2>` +
    salesTable(report.sales_over_time, "Month", (r) => r.month, cur) +
    // ── Customers & trainers ──
    `<h2>Top corporate accounts${report.concentration?.top5_pct != null ? ` — top 5 = ${report.concentration.top5_pct}% of revenue` : ""}</h2>` +
    salesTable(report.top_companies, "Company", (r) => r.company, cur) +
    `<h2>Learner retention</h2>` +
    kvTable([
      ["New learners", (report.learner_retention?.new_learners ?? 0).toLocaleString()],
      ["Returning learners", (report.learner_retention?.returning_learners ?? 0).toLocaleString()],
      ["Repeat rate", `${report.learner_retention?.repeat_rate ?? 0}%`],
    ]) +
    `<h2>Trainer utilization</h2>` +
    kvTable([
      ["Engaged trainers", (t.engaged ?? 0).toLocaleString()],
      ["Trainings", (t.trainings ?? 0).toLocaleString()],
      ["Revenue / trainer", money(t.revenue_per_trainer, cur)],
    ]) +
    `<h2>Top trainers by load</h2>` +
    table(report.top_trainers, [
      { label: "Trainer", get: (r) => r.name },
      { label: "Trainings", num: true, get: (r) => (r.trainings ?? 0).toLocaleString() },
      { label: "Participants", num: true, get: (r) => (r.participants ?? 0).toLocaleString() },
    ]);

  printHtml(documentShell("Sales Report", body));
}
