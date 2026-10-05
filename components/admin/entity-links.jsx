"use client";

import Link from "next/link";

/* Shared inline links to admin detail views. Each renders a styled link when an
   id is present, and plain children (no link) when it isn't — so call sites can
   wrap a name/email/code unconditionally. stopPropagation keeps a link inside a
   clickable row from also triggering the row's navigation. */

const LINK = "text-inherit hover:text-violet-700 hover:underline underline-offset-2 decoration-violet-300 transition-colors";

function EntityLink({ href, children, className = "" }) {
  if (!href) return children ?? null;
  return (
    <Link href={href} onClick={(e) => e.stopPropagation()} className={`${LINK} ${className}`}>
      {children}
    </Link>
  );
}

export function ParticipantLink({ id, children, className }) {
  return <EntityLink href={id ? `/admin/users/${id}` : null} className={className}>{children}</EntityLink>;
}

export function TrainerLink({ id, children, className }) {
  return <EntityLink href={id ? `/admin/trainers/${id}` : null} className={className}>{children}</EntityLink>;
}

// `ref` may be a training uuid or its code — the backend resolver accepts either.
export function TrainingLink({ id, children, className }) {
  return <EntityLink href={id ? `/admin/courses/${id}` : null} className={className}>{children}</EntityLink>;
}

export function SponsorLink({ userId, children, className }) {
  return <EntityLink href={userId ? `/admin/sponsors/${userId}` : null} className={className}>{children}</EntityLink>;
}
