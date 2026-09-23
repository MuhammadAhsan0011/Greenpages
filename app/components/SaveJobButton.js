"use client";

// This MUST be a Client Component — toggling save state on click and
// showing immediate feedback needs an onClick handler + local state. Calls
// the saveJob/unsaveJob Server Actions directly (same "call a Server
// Action straight from client code" pattern already used by
// RichTextEditor.js's uploadInlineImage), rather than wrapping every click
// in its own <form>.

import { useState, useTransition } from "react";
import { saveJob, unsaveJob } from "../jobs/actions";

export default function SaveJobButton({ jobId, initialSaved, signedIn }) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <a href="/login" className="btn btn-secondary">
        Save Job
      </a>
    );
  }

  function handleClick() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      if (next) {
        await saveJob(jobId);
      } else {
        await unsaveJob(jobId);
      }
    });
  }

  return (
    <button type="button" className="btn btn-secondary" onClick={handleClick} disabled={isPending}>
      {saved ? "★ Saved" : "☆ Save Job"}
    </button>
  );
}
