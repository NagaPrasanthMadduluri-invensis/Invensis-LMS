"use client";

/*
 * Dropdown filter used by the admin list views.
 *
 * base-ui's `Select.Value` renders the raw value by default, so a function
 * child resolves the value back to its human label — otherwise a filter set to
 * `virtual` would display "virtual" rather than "Live Virtual".
 *
 * Options may be plain strings or `{ value, label }`; the two forms are mixed
 * across the admin views (specializations are strings, delivery modes are
 * pairs) and normalising here keeps that out of the callers.
 */

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const ALL_FILTER = "__all__";

const valueOf = (o) => (o && typeof o === "object" ? o.value : o);
const labelOf = (o) => (o && typeof o === "object" ? o.label ?? o.value : o);

export function FilterSelect({
  icon: Icon,
  value,
  onChange,
  allLabel,
  options = [],
  width = "w-[184px]",
  className,
}) {
  const labelFor = (v) => {
    if (v == null || v === ALL_FILTER) return allLabel;
    const found = options.find((o) => valueOf(o) === v);
    return found ? labelOf(found) : v;
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "h-11 bg-white border-slate-300/70 rounded-xl text-sm shadow-sm text-slate-700",
          width,
          className
        )}
      >
        {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" />}
        <SelectValue placeholder={allLabel} className="truncate">
          {(v) => labelFor(v)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value={ALL_FILTER}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={valueOf(o)} value={valueOf(o)}>{labelOf(o)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
