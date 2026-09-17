"use client";

import * as React from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import Box from "@/components/ui/box";

// ISO 3166-1 alpha-2 → regional-indicator emoji, so the picker gets flags
// without pulling in an icon set.
function flagOf(iso) {
  return iso.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// Built once at module load — the list is static.
const COUNTRY_OPTIONS = getCountries()
  .map((iso) => ({
    value: iso,
    label: `${en[iso] || iso} (+${getCountryCallingCode(iso)})`,
    triggerLabel: `+${getCountryCallingCode(iso)}`,
    prefix: <span className="text-base leading-none">{flagOf(iso)}</span>,
    code: getCountryCallingCode(iso),
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

/** Split a stored E.164 number back into the country + national parts. */
export function splitPhone(e164, fallbackCountry = "IN") {
  if (!e164) return { country: fallbackCountry, national: "" };
  try {
    const parsed = parsePhoneNumber(e164);
    if (parsed?.country) return { country: parsed.country, national: parsed.nationalNumber };
  } catch {
    /* fall through — an unparseable stored value is treated as a bare number */
  }
  // Legacy rows hold free text like "+91 90000 00000" or "9000000000".
  return { country: fallbackCountry, national: e164.replace(/^\+\d{1,3}/, "").replace(/\D/g, "") };
}

/** Recombine into the E.164 form the API stores. */
export function joinPhone(country, national) {
  const digits = (national || "").replace(/\D/g, "");
  if (!digits) return "";
  return `+${getCountryCallingCode(country)}${digits}`;
}

/** True when the pair forms a dialable number for that country. */
export function isPhoneValid(country, national) {
  const e164 = joinPhone(country, national);
  return !!e164 && isValidPhoneNumber(e164);
}

/**
 * Country selector + national number, in the shape the rest of the profile form
 * uses. Value is the E.164 string (`+919000000000`); `onChange` receives the
 * same. Country metadata and validation come from libphonenumber-js (via
 * react-phone-number-input) rather than a hand-kept list of dial codes.
 */
export function PhoneInput({
  value,
  onChange,
  id,
  invalid = false,
  disabled = false,
  className,
}) {
  const initial = React.useMemo(() => splitPhone(value), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [country, setCountry] = React.useState(initial.country);
  const [national, setNational] = React.useState(initial.national);

  // Re-sync when the form hydrates from the API after first paint.
  const lastEmitted = React.useRef(joinPhone(initial.country, initial.national));
  React.useEffect(() => {
    if (value === lastEmitted.current) return;
    const next = splitPhone(value, country);
    setCountry(next.country);
    setNational(next.national);
    lastEmitted.current = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function emit(nextCountry, nextNational) {
    setCountry(nextCountry);
    setNational(nextNational);
    const e164 = joinPhone(nextCountry, nextNational);
    lastEmitted.current = e164;
    onChange(e164);
  }

  return (
    <Box className={cn("flex gap-2", className)}>
      <Combobox
        value={country}
        onChange={(iso) => iso && emit(iso, national)}
        options={COUNTRY_OPTIONS}
        placeholder="Country"
        searchPlaceholder="Search country or code..."
        emptyText="No country found."
        disabled={disabled}
        invalid={invalid}
        className="w-[136px] shrink-0"
      />
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={national}
        disabled={disabled}
        aria-invalid={invalid}
        onChange={(e) => emit(country, e.target.value.replace(/[^\d\s-]/g, ""))}
        placeholder="90000 00000"
        className="h-10 w-full text-sm bg-background border border-slate-300 focus-visible:border-violet-400 focus-visible:ring-violet-400"
      />
    </Box>
  );
}
