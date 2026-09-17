"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// A city list can run to ~20,000 entries (United States), and cmdk renders every
// item it is given. Only ever mount a window of matches — the search box is how
// you reach anything past it.
const MAX_VISIBLE = 100;

/**
 * Searchable single-select. `options` is
 * [{ value, label, prefix?, triggerLabel?, keywords? }]; `prefix` renders ahead
 * of the label (used for country flags), `triggerLabel` is a shorter form shown
 * on the closed trigger when space is tight, and `keywords` adds extra text to
 * match on without showing it — a timezone can then be found by any of its
 * cities, not just the few that fit in the label.
 *
 * Filtering is done here rather than by cmdk (`shouldFilter={false}`) so the
 * rendered list can be capped — cmdk would otherwise score all 20k rows on every
 * keystroke.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No match found.",
  disabled = false,
  loading = false,
  invalid = false,
  className,
  id,
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  // Base UI focuses the popup itself on open; point it at the search box so the
  // list is typeable straight away instead of needing a second click.
  const searchRef = React.useRef(null);

  const selected = React.useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  );

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, MAX_VISIBLE);
    const out = [];
    const seen = new Set();
    const take = (o) => {
      if (seen.has(o.value)) return;
      seen.add(o.value);
      out.push(o);
    };
    // Prefix matches on the visible label first — typing "ind" should surface
    // India before Indonesia, and both before anything that merely contains it.
    for (const o of options) {
      if (o.label.toLowerCase().startsWith(q)) take(o);
      if (out.length >= MAX_VISIBLE) return out;
    }
    for (const o of options) {
      if (o.label.toLowerCase().includes(q)) take(o);
      if (out.length >= MAX_VISIBLE) return out;
    }
    // Then the hidden keywords, so a match you can't see ranks below one you can.
    for (const o of options) {
      if (o.keywords && o.keywords.toLowerCase().includes(q)) take(o);
      if (out.length >= MAX_VISIBLE) return out;
    }
    return out;
  }, [options, query]);

  const hiddenCount = options.length - matches.length;

  function select(next) {
    onChange(next === value ? "" : next);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid}
            disabled={disabled || loading}
            className={cn(
              "h-10 w-full justify-between bg-background px-3 text-sm font-normal border border-slate-300 hover:bg-background",
              "focus-visible:border-violet-400 focus-visible:ring-violet-400",
              "aria-invalid:border-red-500",
              !selected && "text-slate-400",
              className
            )}
          />
        }
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.prefix}
          <span className="truncate">
            {selected ? selected.triggerLabel ?? selected.label : placeholder}
          </span>
        </span>
        {loading ? (
          <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
        ) : (
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        initialFocus={searchRef}
        className="w-(--anchor-width) min-w-56 p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            ref={searchRef}
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {matches.length === 0 && <CommandEmpty>{emptyText}</CommandEmpty>}
            {matches.map((o) => (
              <CommandItem key={o.value} value={o.value} onSelect={() => select(o.value)}>
                {o.prefix}
                <span className="truncate">{o.label}</span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    o.value === value ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
            {hiddenCount > 0 && (
              <p className="px-2 py-1.5 text-[11px] text-slate-400">
                {hiddenCount.toLocaleString()} more — keep typing to narrow it down.
              </p>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
