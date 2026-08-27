import Link from "next/link";
import { signup } from "./actions";

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
    <section aria-labelledby="signup-heading">
      <div className="container auth-wrap">
        <h1 id="signup-heading">Create Your Free Account</h1>
        <p className="hero-description">
          Sign up to create a business profile, comment on articles, and
          publish your own — free.
        </p>

        {error && <p className="form-error">{error}</p>}

        <form action={signup} className="contact-form">
          <div className="form-field">
            <label htmlFor="fullName">Full Name</label>
            <input id="fullName" name="fullName" type="text" autoComplete="name" required />
          </div>

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
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Sign Up
          </button>
        </form>

        <p className="auth-footer-note">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
}
