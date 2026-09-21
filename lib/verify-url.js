/*
 * Public base URL for certificate verification QR codes.
 *
 * WHY THIS ISN'T JUST `NODE_ENV`
 * ------------------------------
 * A deployed environment is always built with `next build`, which sets
 * NODE_ENV=production. That is true of dev-portal as much as of portal, so
 * NODE_ENV alone cannot tell the two apart — relying on it would print
 * production QR codes onto every certificate issued from dev-portal.
 *
 * So the resolution is:
 *   1. NEXT_PUBLIC_VERIFY_BASE_URL — set per environment; always wins.
 *   2. NODE_ENV fallback — "production" → portal, anything else → dev-portal.
 *
 * Step 2 gives the behaviour asked for on a developer's machine (`next dev`
 * → dev-portal). Step 1 is what a DEPLOYED dev-portal must set, because from
 * NODE_ENV's point of view it is indistinguishable from production.
 *
 * This value is baked into the bundle at build time, not read at runtime:
 * changing it needs a rebuild, not a restart.
 */

const PRODUCTION_BASE = "https://portal.invensislearning.com";
const DEVELOPMENT_BASE = "https://dev-portal.invensislearning.com";

/** Base origin the QR should point at, without a trailing slash. */
export function verifyBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_VERIFY_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? PRODUCTION_BASE : DEVELOPMENT_BASE;
}

/**
 * Full verification URL for a certificate code — what the QR encodes and what
 * the scanner opens.
 *
 *   verifyUrlFor("INVLJA4447")
 *   → "https://portal.invensislearning.com/verify/INVLJA4447"
 */
export function verifyUrlFor(code) {
  return `${verifyBaseUrl()}/verify/${encodeURIComponent(code ?? "")}`;
}

/** Host only, for the caption printed under the QR. */
export function verifyDisplayHost() {
  try {
    return new URL(verifyBaseUrl()).host;
  } catch {
    return verifyBaseUrl().replace(/^https?:\/\//, "");
  }
}
