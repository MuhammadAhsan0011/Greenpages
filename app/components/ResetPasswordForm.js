"use client";

// This MUST be a Client Component — the password recovery link from the
// email delivers its one-time tokens in the URL, which only the browser
// Supabase client can read to establish a temporary "recovery" session.
// Submitting a new password (auth.updateUser) then has to happen in that
// same browser session too.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

// A dead recovery link (expired, already used, or clicked twice) redirects
// here with Supabase's own error details in the query string and/or hash —
// pull error_description out of whichever one has it.
function getLinkErrorDescription() {
  if (typeof window === "undefined") return null;
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  const description = hashParams.get("error_description") || queryParams.get("error_description");
  return description ? description.replace(/\+/g, " ") : null;
}

export default function ResetPasswordForm() {
  const [checking, setChecking] = useState(true);
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Supabase's browser client parses the recovery tokens from the URL on
    // load and exchanges them for a session automatically. If that didn't
    // leave us with a session, the link itself was bad — show that clearly
    // now instead of letting the form fail later with a cryptic
    // "Auth session missing!" on submit.
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setLinkError(getLinkErrorDescription() || "This password reset link is invalid or has expired.");
      }
      setChecking(false);
    });
  }, [supabase]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("submitting");
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(
        updateError.message === "Auth session missing!"
          ? "Your reset link has expired. Please request a new one."
          : updateError.message
      );
      setStatus("idle");
      return;
    }

    setStatus("done");
    setTimeout(() => {
      router.push("/account");
      router.refresh();
    }, 1500);
  }

  if (status === "done") {
    return (
      <p className="form-success">
        Your password has been updated. Taking you to your account…
      </p>
    );
  }

  if (checking) {
    return <p className="editor-hint">Verifying your reset link…</p>;
  }

  if (linkError) {
    return (
      <div className="contact-form">
        <p className="form-error">{linkError}</p>
        <p className="hero-description">
          Reset links expire after a while and only work once — request a fresh one below.
        </p>
        <Link href="/forgot-password" className="btn btn-primary">
          Request a New Link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      {error && <p className="form-error">{error}</p>}

      <div className="form-field">
        <label htmlFor="password">New Password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="confirmPassword">Confirm New Password</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={status === "submitting"}>
        {status === "submitting" ? "Updating…" : "Update Password"}
      </button>

      <p className="auth-footer-note">
        <Link href="/login">Back to login</Link>
      </p>
    </form>
  );
}
