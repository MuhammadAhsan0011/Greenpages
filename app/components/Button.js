import Link from "next/link";

// Server Component. No interactivity is needed to render a styled link or
// button, so this stays a plain function component with no "use client".
export default function Button({
  href,
  children,
  variant = "primary",
  type = "button",
  ...rest
}) {
  const className = `btn btn-${variant}`;

  if (href) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={className} {...rest}>
      {children}
    </button>
  );
}
