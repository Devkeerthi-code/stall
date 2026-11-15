"use client";

import { useFormStatus } from "react-dom";

type Props = { children: React.ReactNode; pendingText?: string; className?: string; disabled?: boolean };

/** Disabled while its form is submitting, so a double tap never sends twice. */
export function SubmitButton({ children, pendingText = "Saving…", className = "btn", disabled }: Props) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending || disabled} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
