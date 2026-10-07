"use client";

/* Reusable "render a certificate off-screen → rasterize → download PDF" flow.
   Used by the learner certificates view and the admin certificate list, so both
   produce identical PDFs. Call `requestDownload(cert)` with a printable
   certificate DTO and render `captureNode` somewhere in the tree. */

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import {
  documentSpec, generateCertificatePdf, certificatePdfName,
} from "@/components/shared/certificate-document";

/* ── PDF viewer dialog ──
   Shows a spinner while the PDF is generated, then embeds it in the browser's
   native PDF viewer and offers a direct download. */
function CertificatePdfDialog({ open, pdf, error, title, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[1400px] w-[95vw]">
        <DialogHeader>
          <DialogTitle>Certificate{title ? ` — ${title}` : ""}</DialogTitle>
          <DialogDescription>
            {error
              ? "We couldn't prepare the certificate."
              : pdf
                ? "Preview the certificate below, then download it as a PDF."
                : "Preparing the certificate…"}
          </DialogDescription>
        </DialogHeader>

        <Box className="mt-2">
          {error ? (
            <Box className="flex items-center gap-2 rounded-lg border border-error-border bg-error-subtle px-4 py-3 text-sm text-error">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </Box>
          ) : pdf ? (
            <iframe
              src={pdf.url}
              title="Certificate PDF"
              className="w-full h-[78vh] rounded-lg border border-border bg-surface-hover"
            />
          ) : (
            <Box className="flex h-[78vh] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface-hover text-foreground-muted">
              <Loader2 className="h-7 w-7 animate-spin text-warning" />
              <Text as="p" className="text-sm">Generating the certificate PDF…</Text>
            </Box>
          )}
        </Box>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {pdf && (
            <Button
              render={<a href={pdf.url} download={pdf.name} />}
              className="inline-flex items-center gap-2 bg-warning hover:bg-warning text-warning-foreground border-0"
            >
              <Download className="h-4 w-4 shrink-0" />
              <Text as="span" className="text-sm font-medium text-warning-foreground">Download PDF</Text>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Certificate download flow. Returns:
 *   requestDownload(cert) — start rendering `cert` (a printable certificate DTO)
 *                           into a PDF; opens the viewer dialog.
 *   captureNode           — JSX to render once in the consumer's tree (the PDF
 *                           dialog + the off-screen capture root).
 */
export function useCertificateDownload() {
  // Certificate currently being turned into a PDF (rendered off-screen for capture).
  const [captureCert, setCaptureCert] = useState(null);
  // Generated PDF ready to preview/download: { url, name }.
  const [pdf, setPdf] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const captureRef = useRef(null);

  // Once the off-screen certificate has rendered, rasterize it and build a
  // downloadable PDF blob. The viewer dialog opens immediately (spinner) and
  // swaps to the PDF here.
  useEffect(() => {
    if (!captureCert) return;
    let cancelled = false;
    setPdf(null);
    setPdfError(null);
    (async () => {
      // Let the off-screen canvas paint before we snapshot it.
      await new Promise((r) => requestAnimationFrame(() => r()));
      const node = captureRef.current?.querySelector(".certificate-canvas");
      if (!node) {
        if (!cancelled) setPdfError("Certificate could not be rendered.");
        return;
      }
      try {
        const { width, height } = documentSpec(captureCert);
        const blob = await generateCertificatePdf(node, { width, height });
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPdf({ url, name: certificatePdfName(captureCert) });
      } catch (e) {
        if (!cancelled) setPdfError(e?.message || "Could not generate the certificate PDF.");
      }
    })();
    return () => { cancelled = true; };
  }, [captureCert]);

  // Close the viewer and release the blob URL.
  const closeViewer = useCallback(() => {
    setPdf((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    setPdfError(null);
    setCaptureCert(null);
  }, []);

  const captureNode = (
    <>
      <CertificatePdfDialog
        open={!!captureCert}
        pdf={pdf}
        error={pdfError}
        title={captureCert?.title}
        onClose={closeViewer}
      />
      {/* Off-screen capture root — parked off-canvas (see globals.css) so the
          certificate is laid out for html2canvas but never visible on screen. */}
      <Box ref={captureRef} className="certificate-print-root" aria-hidden="true">
        {captureCert && (() => {
          const { Canvas } = documentSpec(captureCert);
          return <Canvas cert={captureCert} />;
        })()}
      </Box>
    </>
  );

  return { requestDownload: setCaptureCert, captureNode };
}
