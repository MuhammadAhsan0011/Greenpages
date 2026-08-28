"use client";

// This MUST be a Client Component — it attaches DOM listeners. The mobile
// menu open/close state is a pure CSS checkbox trick (see
// .nav-toggle-checkbox in globals.css), which has no way on its own to
// react to a client-side route change or to lock background scroll. This
// component covers both:
//
// 1. Tapping a link inside the open mobile menu navigated but left the
//    menu visibly open until the hamburger icon was tapped again — so it
//    unchecks the checkbox whenever a nav link is tapped.
// 2. Scrolling while the mobile menu was open also scrolled the page
//    behind it — so it locks body scroll while the checkbox is checked.
//    Programmatically unchecking the box (case 1) doesn't fire a native
//    "change" event, so body scroll is synced explicitly in both places
//    rather than relying on the event alone.

import { useEffect } from "react";

export default function NavAutoClose() {
  useEffect(() => {
    const nav = document.querySelector(".main-nav");
    const checkbox = document.getElementById("nav-toggle");
    if (!nav || !checkbox) return undefined;

    function syncBodyScroll() {
      document.body.style.overflow = checkbox.checked ? "hidden" : "";
    }

    function handleNavClick(event) {
      if (event.target.closest("a")) {
        checkbox.checked = false;
        syncBodyScroll();
      }
    }

    checkbox.addEventListener("change", syncBodyScroll);
    nav.addEventListener("click", handleNavClick);

    return () => {
      checkbox.removeEventListener("change", syncBodyScroll);
      nav.removeEventListener("click", handleNavClick);
      document.body.style.overflow = "";
    };
  }, []);

  return null;
}
