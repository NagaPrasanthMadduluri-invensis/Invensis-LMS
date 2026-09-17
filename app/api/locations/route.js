import { Country, City } from "country-state-city";

/**
 * GET /api/locations?type=countries
 * GET /api/locations?type=cities&country=IN
 *
 * Server-side lookup for the country / city pickers. `country-state-city`
 * bundles a 7.7 MB city dataset — importing it in a client component would ship
 * all of it to the browser, so it stays here and the client only ever receives
 * the slim list it is about to render (~20 KB of countries, ~60 KB of cities for
 * the largest country).
 *
 * Both datasets are static, so responses are cached indefinitely; the lists only
 * ever change when the package is upgraded.
 */

// Built once per server process — the country list is small and read on nearly
// every profile page load.
let countriesCache = null;

function countries() {
  countriesCache ??= Country.getAllCountries().map((c) => ({
    name: c.name,
    iso: c.isoCode,
    phone_code: c.phonecode?.startsWith("+") ? c.phonecode : `+${c.phonecode}`,
    flag: c.flag,
  }));
  return countriesCache;
}

// Cities are only fetched for the one country a learner picked, so they're
// memoised per ISO code rather than all loaded up front.
const cityCache = new Map();

function citiesOf(iso) {
  if (!cityCache.has(iso)) {
    const list = City.getCitiesOfCountry(iso) || [];
    // The dataset repeats a name once per state (e.g. two "Springfield"s), but
    // the profile stores a bare city name — dedupe so the picker has no
    // indistinguishable duplicate rows.
    cityCache.set(iso, [...new Set(list.map((c) => c.name))].sort((a, b) => a.localeCompare(b)));
  }
  return cityCache.get(iso);
}

const IMMUTABLE = { "Cache-Control": "public, max-age=31536000, immutable" };

export function GET(request) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");

  if (type === "countries") {
    return Response.json({ countries: countries() }, { headers: IMMUTABLE });
  }

  if (type === "cities") {
    const iso = (params.get("country") || "").toUpperCase();
    if (!/^[A-Z]{2}$/.test(iso)) {
      return Response.json({ message: "A 2-letter `country` ISO code is required" }, { status: 400 });
    }
    return Response.json({ country: iso, cities: citiesOf(iso) }, { headers: IMMUTABLE });
  }

  return Response.json({ message: "`type` must be 'countries' or 'cities'" }, { status: 400 });
}
