export const metadata = {
  title: "Cookie Policy",
  description: "What cookies Green Pages uses and how to control them.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  return (
    <article className="legal-article">
      <h2>Cookie Policy</h2>
      <p className="legal-updated">Last updated: August 27, 2026</p>

      <p>
        Cookies are small text files stored on your device by your browser.
        Green Pages uses a small number of cookies, described below.
      </p>

      <h3>1. Essential Cookies</h3>
      <p>
        Used to keep you signed in and to remember your session while you
        browse the site. Without these, features like your account
        dashboard and business profile wouldn&apos;t work.
      </p>

      <h3>2. Analytics Cookies</h3>
      <p>
        We use Google Analytics to understand how visitors use the site —
        which pages are popular, how people find us, and where to improve.
        This data is aggregated and does not identify you personally.
      </p>

      <h3>3. What We Don&apos;t Use</h3>
      <p>
        Green Pages does not use advertising or cross-site tracking cookies,
        and we do not sell any data collected via cookies.
      </p>

      <h3>4. Managing Cookies</h3>
      <p>
        Most browsers let you block or delete cookies in their settings.
        Blocking essential cookies may prevent you from staying signed in or
        using account features. You can also opt out of Google Analytics
        using{" "}
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google&apos;s browser add-on
        </a>
        .
      </p>

      <h3>5. Contact</h3>
      <p>
        Questions about this policy? Email{" "}
        <a href="mailto:kimmak209@gmail.com">kimmak209@gmail.com</a>.
      </p>
    </article>
  );
}
