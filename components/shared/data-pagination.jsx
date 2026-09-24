"use client";

/*
 * Pagination control for server-paged tables.
 *
 * Built on the shadcn Pagination primitives. Every control is a direct jump:
 * asking for page 30 while on page 2 issues exactly one request for page 30 —
 * the pages in between are never fetched. First and last are always reachable,
 * and the "Go to" box covers any page the window doesn't show, so no page is
 * more than one action away.
 *
 * The component owns no data. It reports the page it wants via `onPageChange`
 * and renders whatever `page`/`total` it is given, so the fetching component
 * stays the single source of truth.
 */

import { useEffect, useState } from "react";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { cn } from "@/lib/utils";
import { pageCount, pageRangeLabel, pageWindow } from "@/lib/pagination";

/* A page control rendered as an anchor by the shadcn primitive. There is no URL
   to navigate to, so the click is intercepted; `aria-disabled` plus swallowing
   the event is what makes a spent control inert for pointer and keyboard
   alike, since an anchor has no `disabled`. */
function jump(enabled, to, onPageChange) {
  return (e) => {
    e.preventDefault();
    if (enabled) onPageChange(to);
  };
}

const EDGE = "h-8 w-8 p-0 text-slate-500 hover:text-slate-800";

export function DataPagination({
  page,
  perPage,
  total,
  onPageChange,
  siblings = 1,
  className,
}) {
  const totalPages = pageCount(total, perPage);
  const current = Math.min(Math.max(1, page), totalPages);
  const window = pageWindow(current, totalPages, { siblings });

  const hasPrev = current > 1;
  const hasNext = current < totalPages;

  // Local text state so the field can be typed into freely; it is only
  // interpreted on submit.
  const [goto, setGoto] = useState("");
  useEffect(() => { setGoto(""); }, [current]);

  function submitGoto(e) {
    e.preventDefault();
    const n = Number.parseInt(goto, 10);
    if (!Number.isFinite(n)) return;
    onPageChange(Math.min(Math.max(1, n), totalPages));
  }

  return (
    <Box className={cn(
      "flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between",
      className
    )}>
      <Text as="span" className="shrink-0 text-xs text-slate-500">
        {pageRangeLabel(current, perPage, total)}
      </Text>

      <Box className="flex flex-wrap items-center justify-end gap-3">
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            {/* First — the cheap way back from deep in a long list. */}
            <PaginationItem>
              <PaginationLink
                href="#"
                aria-label="Go to first page"
                aria-disabled={!hasPrev}
                onClick={jump(hasPrev, 1, onPageChange)}
                className={cn(EDGE, !hasPrev && "pointer-events-none opacity-40")}
              >
                <ChevronsLeft className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>

            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={!hasPrev}
                onClick={jump(hasPrev, current - 1, onPageChange)}
                className={cn("h-8 text-slate-600", !hasPrev && "pointer-events-none opacity-40")}
              />
            </PaginationItem>

            {window.map((p, i) =>
              p === "ellipsis" ? (
                <PaginationItem key={`gap-${i}`}>
                  <PaginationEllipsis className="text-slate-400" />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === current}
                    aria-label={`Go to page ${p}`}
                    onClick={jump(p !== current, p, onPageChange)}
                    className={cn(
                      "h-8 w-8 p-0 text-xs font-semibold",
                      p === current
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : "text-slate-600"
                    )}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={!hasNext}
                onClick={jump(hasNext, current + 1, onPageChange)}
                className={cn("h-8 text-slate-600", !hasNext && "pointer-events-none opacity-40")}
              />
            </PaginationItem>

            <PaginationItem>
              <PaginationLink
                href="#"
                aria-label="Go to last page"
                aria-disabled={!hasNext}
                onClick={jump(hasNext, totalPages, onPageChange)}
                className={cn(EDGE, !hasNext && "pointer-events-none opacity-40")}
              >
                <ChevronsRight className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {/* Any page the window doesn't show, in one action. Only earns its
            place once the window can actually hide something. */}
        {totalPages > 7 && (
          <form onSubmit={submitGoto} className="flex items-center gap-1.5">
            <Text as="span" className="text-xs text-slate-400">Go to</Text>
            <input
              type="text"
              inputMode="numeric"
              value={goto}
              onChange={(e) => setGoto(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder={String(current)}
              aria-label={`Go to page, 1 to ${totalPages}`}
              className="h-8 w-14 rounded-lg border border-slate-300/70 bg-white px-2 text-center text-xs text-slate-700 focus-visible:border-violet-400 focus-visible:outline-none"
            />
            <Text as="span" className="text-xs text-slate-400">/ {totalPages}</Text>
          </form>
        )}
      </Box>
    </Box>
  );
}
