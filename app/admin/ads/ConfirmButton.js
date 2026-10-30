"use client";

import { useFormStatus } from "react-dom";

// A submit button that asks "are you sure?" first - for destructive admin
// actions inside a Server Action form.
export default function ConfirmButton({ message, className, pendingLabel, children }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
