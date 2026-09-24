/*
 * Which page numbers to render in a pagination control.
 *
 * The point of the window is that reaching page 30 from page 2 must not mean
 * walking through the pages in between: the first and last pages are always
 * offered, so any run of pages is at most two clicks plus a jump away, and the
 * request itself is a single OFFSET query regardless of which page is asked
 * for. Nothing is fetched for the pages that are skipped.
 *
 * Returns a flat list of page numbers and the string "ellipsis", ready to map
 * over. An ellipsis is only emitted where it actually hides something — with a
 * single page hidden the number itself is shown instead, because "… 7 …" costs
 * the same width as "6 7 8" but takes a click to discover.
 */

/**
 * @param {number} current   1-based current page
 * @param {number} totalPages
 * @param {{siblings?: number, boundaries?: number}} [opts]
 *   siblings   pages either side of the current one (default 1)
 *   boundaries pages pinned at each end (default 1)
 * @returns {(number|"ellipsis")[]}
 */
export function pageWindow(current, totalPages, opts = {}) {
  const siblings = Math.max(0, opts.siblings ?? 1);
  const boundaries = Math.max(1, opts.boundaries ?? 1);

  const total = Math.max(0, Math.floor(totalPages) || 0);
  if (total === 0) return [];
  const page = Math.min(Math.max(1, Math.floor(current) || 1), total);

  // Widest layout this configuration can produce: both boundary runs, the
  // sibling run, and the two ellipses. Below that, numbering every page is
  // narrower than abbreviating it.
  const maxSlots = boundaries * 2 + siblings * 2 + 3;
  if (total <= maxSlots) return range(1, total);

  const left = Math.max(page - siblings, boundaries + 1);
  const right = Math.min(page + siblings, total - boundaries);

  // A gap of exactly one page is rendered as that page, not as an ellipsis.
  const gapLeft = left - boundaries > 2;
  const gapRight = total - boundaries - right > 1;

  return [
    ...range(1, boundaries),
    ...(gapLeft ? ["ellipsis"] : range(boundaries + 1, left - 1)),
    ...range(left, right),
    ...(gapRight ? ["ellipsis"] : range(right + 1, total - boundaries)),
    ...range(total - boundaries + 1, total),
  ];
}

function range(from, to) {
  return from > to ? [] : Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** Total pages for a result count, never less than 1 so the UI always has a page 1. */
export function pageCount(total, perPage) {
  const t = Number(total) || 0;
  const per = Math.max(1, Number(perPage) || 1);
  return Math.max(1, Math.ceil(t / per));
}

/** "Showing 21–30 of 523" — the range actually on screen. */
export function pageRangeLabel(page, perPage, total) {
  const t = Number(total) || 0;
  if (t === 0) return "No results";
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, t);
  return `Showing ${first.toLocaleString()}–${last.toLocaleString()} of ${t.toLocaleString()}`;
}
