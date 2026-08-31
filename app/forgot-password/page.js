import Link from "next/link";
import { requestPasswordReset } from "./actions";
import AuthIllustration from "../components/AuthIllustration";

export const metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

// Server Component — the form posts directly to a Server Action
// (requestPasswordReset), so no client-side JavaScript is needed just to
// submit it.
export default async function ForgotPasswordPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const sent = params?.sent;

  return (
    <section aria-labelledby="forgot-password-heading" className="auth-page">
      <div className="container">
        <div className="auth-shell">
          <div className="auth-illustration-panel">
            <AuthIllustration icon="key" />
            <h2>Forgot Your Password?</h2>
            <p>No worries — we&apos;ll email you a reset link.</p>
          </div>

          <div className="auth-form-panel">
            <h1 id="forgot-password-heading">Reset Password</h1>
            <p className="hero-description">
              Enter the email address on your account and we&apos;ll send you
              a link to set a new password.
            </p>

            {error && <p className="form-error">{error}</p>}

            {sent ? (
              <p className="form-success">
                If an account exists for that email, a password reset link
                has been sent. Check your inbox (and spam folder).
              </p>
            ) : (
              <form action={requestPasswordReset} className="contact-form">
                <div className="form-field">
                  <label htmlFor="email">Email Address</label>
                  <input id="email" name="email" type="email" autoComplete="email" required />
                </div>

                <button type="submit" className="btn btn-primary">
                  Send Reset Link
                </button>
              </form>
            )}

            <p className="auth-footer-note">
              Remembered your password? <Link href="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
