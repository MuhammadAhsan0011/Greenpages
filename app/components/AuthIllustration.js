const ICONS = {
  lock: (
    <>
      <rect x="7" y="11" width="10" height="8" rx="1.5" fill="#ffffff" />
      <path
        d="M9 11V8a3 3 0 0 1 6 0v3"
        stroke="#ffffff"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15" r="1.3" fill="var(--color-primary)" />
    </>
  ),
  "person-plus": (
    <>
      <circle cx="10.5" cy="9" r="3" fill="#ffffff" />
      <path
        d="M5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
        stroke="#ffffff"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M18 8v5M15.5 10.5h5"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>
  ),
  mail: (
    <>
      <rect x="6" y="8" width="12" height="9" rx="1.5" fill="#ffffff" />
      <path
        d="M6.5 8.5 12 13l5.5-4.5"
        stroke="var(--color-primary)"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  key: (
    <>
      <circle cx="9" cy="15" r="3" fill="#ffffff" />
      <path
        d="M11 13l7-7M15 9l2 2M17.5 6.5l2 2"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
};

// Server Component — a decorative circular badge with a leaf/gear accent,
// purely visual, reused across the auth pages (login, signup, forgot/reset
// password) so they share one consistent illustration style.
export default function AuthIllustration({ icon = "lock" }) {
  return (
    <div className="auth-illustration">
      <span className="auth-illustration-leaf auth-illustration-leaf-1" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M4 20c8 0 14-6 14-14 -8 0-14 6-14 14Z"
            fill="var(--color-accent)"
          />
        </svg>
      </span>
      <span className="auth-illustration-leaf auth-illustration-leaf-2" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M4 20c8 0 14-6 14-14 -8 0-14 6-14 14Z"
            fill="var(--color-primary-light)"
          />
        </svg>
      </span>
      <span className="auth-illustration-gear" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="var(--color-border)" strokeWidth="1.5" />
          <path
            d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"
            stroke="var(--color-border)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <div className="auth-illustration-badge">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {ICONS[icon] ?? ICONS.lock}
        </svg>
      </div>
    </div>
  );
}
