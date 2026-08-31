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

export default function ResetPasswordForm() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Supabase's browser client parses the recovery tokens from the URL on
    // load and exchanges them for a session automatically — this just waits
    // for that to finish before letting the form submit.
    supabase.auth.getSession().then(() => setReady(true));
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
      setError(updateError.message);
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

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      {error && <p className="form-error">{error}</p>}
      {!ready && <p className="editor-hint">Verifying your reset link…</p>}

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

      <button type="submit" className="btn btn-primary" disabled={!ready || status === "submitting"}>
        {status === "submitting" ? "Updating…" : "Update Password"}
      </button>

      <p className="auth-footer-note">
        <Link href="/login">Back to login</Link>
      </p>
    </form>
  );
}
