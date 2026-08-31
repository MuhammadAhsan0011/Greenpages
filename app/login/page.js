import Link from "next/link";
import { login } from "./actions";
import AuthIllustration from "../components/AuthIllustration";
import GoogleAuthButton from "../components/GoogleAuthButton";

export const metadata = {
  title: "Log In",
  description: "Log in to your Green Pages account.",
  alternates: {
    canonical: "/login",
  },
};

// Server Component — the form posts directly to a Server Action (login),
// so no client-side JavaScript is needed just to submit it. GoogleAuthButton
// is the one small Client Component island on the page (OAuth has to start
// from the browser).
export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const next = params?.next;

  return (
    <section aria-labelledby="login-heading" className="auth-page">
      <div className="container">
        <div className="auth-shell">
          <div className="auth-illustration-panel">
            <AuthIllustration icon="lock" />
            <h2>Welcome Back!</h2>
            <p>Log in to your account to continue.</p>
          </div>

          <div className="auth-form-panel">
            <h1 id="login-heading">Login</h1>
            <p className="hero-description">Welcome back — log in to your account.</p>

            {error && <p className="form-error">{error}</p>}

            <GoogleAuthButton next={next} />
            <div className="auth-divider">or</div>

            <form action={login} className="contact-form">
              {next && <input type="hidden" name="next" value={next} />}
              <div className="form-field">
                <label htmlFor="email">Email Address</label>
                <input id="email" name="email" type="email" autoComplete="email" required />
              </div>

              <div className="form-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="auth-options-row">
                <label className="auth-remember-me">
                  <input type="checkbox" name="rememberMe" value="yes" defaultChecked />
                  Remember Me
                </label>
                <Link href="/forgot-password">Forgot Password?</Link>
              </div>

              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </form>

            <p className="auth-footer-note">
              Don&apos;t have an account? <Link href="/signup">Register Now</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
