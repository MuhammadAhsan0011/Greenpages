"use client";

// This MUST be a Client Component — it attaches a DOM click listener.
// The mobile menu open/close state is a pure CSS checkbox trick (see
// .nav-toggle-checkbox in globals.css), which has no way on its own to
// react to a client-side route change. Without this, tapping a link inside
// the open mobile menu navigated but left the menu visibly open until the
// hamburger icon was tapped again. This just unchecks that checkbox
// whenever a nav link is tapped, right before the navigation happens.

import { useEffect } from "react";

export default function NavAutoClose() {
  useEffect(() => {
    const nav = document.querySelector(".main-nav");
    const checkbox = document.getElementById("nav-toggle");
    if (!nav || !checkbox) return undefined;

    function handleClick(event) {
      if (event.target.closest("a")) {
        checkbox.checked = false;
      }
    }

    nav.addEventListener("click", handleClick);
    return () => nav.removeEventListener("click", handleClick);
  }, []);

  return null;
}
