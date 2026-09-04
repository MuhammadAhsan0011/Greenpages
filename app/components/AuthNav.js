"use client";

// This component MUST be a Client Component because it needs to read the
// current Supabase auth session in the browser (useState + useEffect) and
// react instantly to sign-in/sign-out (onAuthStateChange), and it calls
// supabase.auth.signOut() from an onClick handler. Keeping this as the ONLY
// dynamic piece of the header means Navbar itself stays a Server Component
// and every other page keeps its static rendering.
//
// getUser() re-runs on every pathname change (not just on mount) — this
// matters because email/password login runs as a Server Action, whose
// sign-in happens on a separate, server-side Supabase client instance.
// This component's browser client never hears an onAuthStateChange event
// for that sign-in, and the Server Action's redirect afterward is a soft
// RSC navigation that never remounts this component (it lives in the
// layout) — so a mount-once getUser() call would just keep showing the
// pre-login "Login / Register" state forever. The pathname always does
// change on that redirect (e.g. /login -> /account), so re-running
// getUser() there picks up the now-real cookies correctly.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const PLAN_LABELS = {
  free: "Free",
  verified: "Verified",
  featured: "Premium",
};

export default function AuthNav() {
  const [user, setUser] = useState(undefined);
  const [business, setBusiness] = useState(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase, pathname]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) {
      setBusiness(null);
      return;
    }
    supabase
      .from("businesses")
      .select("id, name, plan, logo_url, requested_plan")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => setBusiness(data ?? null));
  }, [user, supabase]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  if (user === undefined) {
    return null;
  }

  if (user === null) {
    return (
      <li>
        <Link href="/login" className="btn btn-secondary btn-sm">
          Login / Register
        </Link>
      </li>
    );
  }

  const displayName = business?.name || user.email;
  const initial = displayName?.charAt(0)?.toUpperCase() || "?";
  const planLabel = business ? PLAN_LABELS[business.plan] ?? business.plan : null;
  const statusLabel = business?.requested_plan ? "Pending Approval" : "Active";

  return (
    <>
    <li className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-menu-trigger"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        <span className="account-menu-avatar" aria-hidden="true">
          {business?.logo_url ? (
            <Image src={business.logo_url} alt="" width={28} height={28} />
          ) : (
            initial
          )}
        </span>
        <span className="account-menu-trigger-label">
          Welcome, {displayName}
        </span>
        <span className="account-menu-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {menuOpen && (
        <div className="account-menu-panel">
          {business ? (
            <>
              <div className="account-menu-logo">
                {business.logo_url ? (
                  <Image
                    src={business.logo_url}
                    alt={`${business.name} logo`}
                    width={64}
                    height={64}
                  />
                ) : (
                  <span className="account-menu-logo-fallback">{initial}</span>
                )}
              </div>
              <span className="account-menu-business-badge">{business.name}</span>
              <p className="account-menu-detail">
                Status: <strong>{statusLabel}</strong>
              </p>
              <p className="account-menu-detail">
                Plan: <strong>{planLabel} Plan</strong>
              </p>
              <div className="account-menu-actions">
                <Link
                  href={`/businesses/${business.id}`}
                  className="btn btn-secondary btn-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  View Listing
                </Link>
                <Link
                  href="/account"
                  className="btn btn-primary btn-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="account-menu-detail">
                Signed in as <strong>{user.email}</strong>
              </p>
              <div className="account-menu-actions">
                <Link
                  href="/account/business"
                  className="btn btn-primary btn-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Create Business
                </Link>
                <Link
                  href="/account"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  My Account
                </Link>
              </div>
            </>
          )}
          <button type="button" className="account-menu-logout" onClick={handleSignOut}>
            Logout
          </button>
        </div>
      )}
    </li>

    {/* Mobile-only: a plain "My Profile" link instead of the desktop
        dropdown, so the hamburger menu never has to nest a second
        expand/collapse panel inside itself (see globals.css for the
        breakpoint that swaps these). */}
    <li className="account-menu-mobile">
      <Link href="/account">My Profile</Link>
    </li>
    <li className="account-menu-mobile">
      <button type="button" className="nav-signout-btn" onClick={handleSignOut}>
        Log Out
      </button>
    </li>
    </>
  );
}
