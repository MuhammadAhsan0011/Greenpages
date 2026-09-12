"use client";

import { useFormStatus } from "react-dom";

// Disables itself (and swaps to a "pending" label) while its <form> is
// submitting. Plain <button type="submit"> stays clickable the whole
// time a Server Action is running, so an impatient double/triple click
// fires the same action multiple times — this is what was creating
// duplicate articles, reviews, etc. useFormStatus only works from a
// component rendered inside the <form> it tracks, which is why this has
// to be its own Client Component rather than a prop on a plain button.
export default function SubmitButton({ children, pendingLabel, ...props }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
