"use client";

// This component MUST be a Client Component because it needs to read the
// current Supabase auth session in the browser (useState + useEffect) and
// react instantly to sign-in/sign-out (onAuthStateChange), and it calls
// supabase.auth.signOut() from an onClick handler. Keeping this as the ONLY
// dynamic piece of the header means Navbar itself stays a Server Component
// and every other page keeps its static rendering.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthNav() {
  const [user, setUser] = useState(undefined);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (user === undefined) {
    return null;
  }

  if (user === null) {
    return (
      <>
        <li>
          <Link href="/login">Log In</Link>
        </li>
        <li>
          <Link href="/signup">Sign Up</Link>
        </li>
      </>
    );
  }

  return (
    <>
      <li>
        <Link href="/account">My Account</Link>
      </li>
      <li>
        <button type="button" onClick={handleSignOut} className="nav-signout-btn">
          Log Out
        </button>
      </li>
    </>
  );
}
