import Link from "next/link";
import { login } from "./actions";

export const metadata = {
  title: "Log In",
  description: "Log in to your Green Pages account.",
  alternates: {
    canonical: "/login",
  },
};

// Server Component — the form posts directly to a Server Action (login),
// so no client-side JavaScript is needed just to submit it.
export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const next = params?.next;

  return (
    <section aria-labelledby="login-heading">
      <div className="container auth-wrap">
        <h1 id="login-heading">Log In</h1>
        <p className="hero-description">Welcome back — log in to your account.</p>

        {error && <p className="form-error">{error}</p>}

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

          <button type="submit" className="btn btn-primary">
            Log In
          </button>
        </form>

        <p className="auth-footer-note">
          Don&apos;t have an account? <Link href="/signup">Sign up free</Link>
        </p>
      </div>
    </section>
  );
}
