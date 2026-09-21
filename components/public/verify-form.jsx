"use client";

import { useCallback, useState } from "react";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { VerifiedCertificate, VerifyNotFound } from "@/components/public/verify-result";

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * Public verification form, for someone typing an ID by hand.
 *
 * A scanned QR does NOT come here — /verify/<code> renders the result directly,
 * because the code is already in the URL and re-asking for it is asking the
 * holder to retype what they just scanned.
 */
export function VerifyForm({ initialCode = "" }) {
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verify = useCallback(async (rawCode, rawName) => {
    const q = String(rawCode ?? "").trim();
    if (!q) { setError("Enter the Certificate ID printed on your certificate."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const url = new URL(`${API}/verify/${encodeURIComponent(q)}`);
      if (rawName?.trim()) url.searchParams.set("name", rawName.trim());
      const res = await fetch(url);
      if (!res.ok && res.status !== 200) throw new Error("Verification is unavailable right now.");
      setResult(await res.json());
    } catch (e) {
      setError(e.message || "Verification is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Box className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Box className="text-center">
        <Text as="h1" className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Verify an Invensis Learning Certificate
        </Text>
        <Text as="p" className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
          Confirm the authenticity of a Certificate of Training issued by Invensis Learning.
        </Text>
      </Box>

      <Box className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Box className="flex items-center gap-3">
          <Box className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b2e5c]">
            <ShieldCheck className="h-5 w-5 text-white" />
          </Box>
          <Text as="h2" className="text-base font-bold text-slate-900">Certificate Verification</Text>
        </Box>
        <Text as="p" className="mt-3 text-sm text-slate-600">
          Enter the <Text as="strong" className="font-semibold">Certificate ID</Text> (e.g. INVLJA4447) or the{" "}
          <Text as="strong" className="font-semibold">Training ID</Text> (e.g. TRN-2026-0024) printed on your
          credential. Optionally add the holder&apos;s name for a stricter match.
        </Text>

        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => { e.preventDefault(); verify(code, name); }}
        >
          <Box className="space-y-1.5">
            <Text as="label" htmlFor="cert-id" className="block text-xs font-semibold text-slate-700">
              Certificate ID or Training ID <Text as="span" className="font-normal text-slate-400">(required)</Text>
            </Text>
            <input
              id="cert-id" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. INVLJA4447 or TRN-2026-0024" autoComplete="off" spellCheck={false}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#1553a3] focus:ring-2 focus:ring-[#1553a3]/20"
            />
          </Box>
          <Box className="space-y-1.5">
            <Text as="label" htmlFor="cert-name" className="block text-xs font-semibold text-slate-700">
              Full name on certificate <Text as="span" className="font-normal text-slate-400">(optional)</Text>
            </Text>
            <input
              id="cert-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fernando Basto Jr" autoComplete="off"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#1553a3] focus:ring-2 focus:ring-[#1553a3]/20"
            />
          </Box>
          <Box className="flex flex-wrap items-center gap-2">
            <button
              type="submit" disabled={loading}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0b2e5c] px-5 text-sm font-semibold text-white hover:bg-[#061e3d] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify certificate
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => { setCode(""); setName(""); setResult(null); setError(null); }}
              className="h-11 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
          </Box>
          {error && <Text as="p" className="text-xs text-red-600">{error}</Text>}
        </form>
      </Box>

      {result && (
        <Box className="mt-6">
          {result.found
            ? <VerifiedCertificate certificate={result.certificate} />
            : <VerifyNotFound query={result.query} />}
        </Box>
      )}
    </Box>
  );
}
