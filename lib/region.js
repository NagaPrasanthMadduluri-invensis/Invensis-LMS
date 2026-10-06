// Map a schedule's IANA timezone (e.g. "Europe/Brussels", "Asia/Kolkata") to one
// of the four business regions. We only store the timezone, not the country, so
// this resolves region from the zone: continent prefix with the exceptions that
// the country→region lists imply (Middle East + Caucasus count as EMEA even
// though their zones live under Asia/*; Central Asia stays APAC).

const LABELS = {
  apac: "APAC",
  emea: "EMEA",
  americas: "US & Americas",
  oceania: "Australia & Oceania",
};

// Asia/* zones that belong to EMEA (Middle East + Caucasus).
const ASIA_EMEA = new Set([
  "Asia/Dubai", "Asia/Muscat", "Asia/Qatar", "Asia/Bahrain", "Asia/Kuwait",
  "Asia/Riyadh", "Asia/Aden", "Asia/Baghdad", "Asia/Amman", "Asia/Beirut",
  "Asia/Damascus", "Asia/Gaza", "Asia/Hebron", "Asia/Jerusalem", "Asia/Tel_Aviv",
  "Asia/Nicosia", "Asia/Famagusta", "Asia/Istanbul", "Asia/Baku", "Asia/Tbilisi",
  "Asia/Yerevan",
]);

// Explicit zone overrides where the continent prefix is ambiguous.
const OVERRIDES = {
  "Asia/Maldives": "apac",   // Maldives is APAC (prefix would also give APAC)
  "Indian/Maldives": "apac",
  "Atlantic/Bermuda": "americas",
  "Europe/Istanbul": "emea",
};

export function regionKeyForTimezone(tz) {
  if (!tz || typeof tz !== "string") return null;
  if (OVERRIDES[tz]) return OVERRIDES[tz];

  const continent = tz.split("/")[0];
  switch (continent) {
    case "Europe":
    case "Africa":
    case "Atlantic":
      return "emea";
    case "America":
      return "americas";
    case "Australia":
    case "Pacific":
      return "oceania";
    case "Indian":
      return "emea"; // Mauritius/Reunion/Mahe; Maldives handled by OVERRIDES
    case "Asia":
      return ASIA_EMEA.has(tz) ? "emea" : "apac";
    default:
      return null;
  }
}

export function regionForTimezone(tz) {
  const key = regionKeyForTimezone(tz);
  return key ? { key, label: LABELS[key] } : null;
}

export const REGION_OPTIONS = Object.entries(LABELS).map(([key, label]) => ({ key, label }));
