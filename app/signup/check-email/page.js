import Link from "next/link";

export const metadata = {
  title: "Confirm Your Email",
  robots: { index: false, follow: false },
};

export default function CheckEmailPage() {
  return (
    <section aria-labelledby="check-email-heading">
      <div className="container auth-wrap">
        <h1 id="check-email-heading">Check Your Email</h1>
        <p className="hero-description">
          We&apos;ve sent a confirmation link to the email address you signed
          up with. Click it to activate your account, then{" "}
          <Link href="/login">log in</Link>.
        </p>
      </div>
    </section>
  );
}
