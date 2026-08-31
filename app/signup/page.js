import Link from "next/link";
import { signup } from "./actions";
import AuthIllustration from "../components/AuthIllustration";
import GoogleAuthButton from "../components/GoogleAuthButton";

export const metadata = {
  title: { absolute: "List Your Business Free | Green Pages" },
  description:
    "Create a free Green Pages account and list your business on Pakistan's directory in minutes.",
  alternates: {
    canonical: "/signup",
  },
};

// Server Component — the form posts directly to a Server Action (signup),
// so no client-side JavaScript is needed just to submit it.
export default async function SignUpPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <section aria-labelledby="signup-heading" className="auth-page">
      <div className="container">
        <div className="auth-shell">
          <div className="auth-illustration-panel">
            <AuthIllustration icon="person-plus" />
            <h2>Create an Account</h2>
            <p>Join Green Pages PK and grow your business.</p>
          </div>

          <div className="auth-form-panel">
            <h1 id="signup-heading">Register</h1>
            <p className="hero-description">
              Sign up to create a business profile, comment on articles, and
              publish your own — free.
            </p>

            {error && <p className="form-error">{error}</p>}

            <GoogleAuthButton />
            <div className="auth-divider">or</div>

            <form action={signup} className="contact-form">
              <div className="grid grid-2">
                <div className="form-field">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    minLength={6}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="auth-options-row">
                <label className="auth-remember-me">
                  <input type="checkbox" name="agreeTerms" value="yes" required />
                  I agree to the <Link href="/legal/terms">Terms &amp; Conditions</Link>
                </label>
              </div>

              <button type="submit" className="btn btn-primary">
                Register
              </button>
            </form>

            <p className="auth-footer-note">
              Already have an account? <Link href="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
