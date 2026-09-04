"use client";

// This MUST be a Client Component — the Web Share API / clipboard access
// it uses only exist in the browser.

import { useState } from "react";

export default function ShareButton({ title, className = "btn btn-secondary btn-sm" }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — silently no-op rather than error out.
    }
  }

  return (
    <button type="button" className={className} onClick={handleShare}>
      {copied ? "Link Copied!" : "Share"}
    </button>
  );
}
