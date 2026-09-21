/*
 * Public shell — no sidebar, no auth.
 *
 * Certificate verification is reached by scanning a printed QR, so the visitor
 * has no account and may never have seen the portal. Kept outside the learner
 * and admin route groups so neither shell's auth check can redirect them.
 */
export default function PublicLayout({ children }) {
  return children;
}
