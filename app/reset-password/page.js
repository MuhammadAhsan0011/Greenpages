import ResetPasswordForm from "../components/ResetPasswordForm";
import AuthIllustration from "../components/AuthIllustration";

export const metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

// Server Component shell (for metadata) around the Client Component that
// does the actual work — see ResetPasswordForm.js for why that part has to
// run in the browser.
export default function ResetPasswordPage() {
  return (
    <section aria-labelledby="reset-password-heading" className="auth-page">
      <div className="container">
        <div className="auth-shell">
          <div className="auth-illustration-panel">
            <AuthIllustration icon="key" />
            <h2>Set a New Password</h2>
            <p>Choose a strong password for your account.</p>
          </div>

          <div className="auth-form-panel">
            <h1 id="reset-password-heading">New Password</h1>
            <p className="hero-description">
              Enter and confirm your new password below.
            </p>

            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </section>
  );
}
