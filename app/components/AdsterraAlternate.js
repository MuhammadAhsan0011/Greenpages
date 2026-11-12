"use client";

// Gives one Adsterra unit and the site's OWN ads for the same spot a shared
// box, taking turns: Adsterra first, then an own banner from `slot`, and so on
// every TURN_MS. Adsterra's banners go blank between their own rotations and
// that gap can't be detected from here (it lives in a cross-origin iframe), so
// instead of reacting to it the two simply alternate - the spot is never left
// to Adsterra's blank stretches alone.
//
// Adsterra's scripts are server-rendered inside `children` and have already run
// by the time this hydrates; hiding them with display:none keeps the loaded
// unit in place. With no own ad eligible for `slot`, Adsterra just stays up.
// While the visitor's cursor is over the box, or the tab is in the background,
// it doesn't switch.

import { useEffect, useRef, useState } from "react";
import AdSlot from "./AdSlot";

const TURN_MS = 15 * 1000;

export default function AdsterraAlternate({ slot, className = "", children }) {
  const [hasOwn, setHasOwn] = useState(false);
  const [showOwn, setShowOwn] = useState(false);
  const hoveredRef = useRef(false);

  useEffect(() => {
    if (!hasOwn) {
      setShowOwn(false);
      return undefined;
    }
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && !hoveredRef.current) setShowOwn((value) => !value);
    }, TURN_MS);
    return () => clearInterval(timer);
  }, [hasOwn]);

  const hover = {
    onMouseEnter: () => {
      hoveredRef.current = true;
    },
    onMouseLeave: () => {
      hoveredRef.current = false;
    },
  };

  return (
    <>
      <div className={`${className}${showOwn ? " ad-alt-off" : ""}`.trim()} {...hover}>
        {children}
      </div>
      <div className={`${className}${showOwn ? "" : " ad-alt-off"}`.trim()} {...hover}>
        <AdSlot slot={slot} onResolved={setHasOwn} />
      </div>
    </>
  );
}
