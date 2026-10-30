"use client";

// One placement for the site's OWN banners (affiliate / sponsored / house) -
// completely separate from the Adsterra units, which are left as they are.
// Drop <AdSlot slot="blog-sidebar" /> anywhere; what it can show, on which
// devices and how it rotates is configured in /admin/ads/slots.
//
// It renders NOTHING until it knows there is an ad that fits: no empty box,
// no reserved gap, no broken image. A hidden <span> stays behind only so the
// available width can be measured.
//
// Client-side on purpose: ad choice, rotation, device and width fitting and
// viewability tracking all depend on the visitor's browser, and it keeps the
// pages themselves static (the ad list comes from /api/ads, cached ~1 minute).

import { useEffect, useRef, useState } from "react";
import { selectAds, deviceBucket, adDisclosureLabel } from "@/lib/ads";

const CONFIG_TTL_MS = 60 * 1000;
let configCache = { at: 0, promise: null };

function loadConfig() {
  if (!configCache.promise || Date.now() - configCache.at > CONFIG_TTL_MS) {
    configCache = {
      at: Date.now(),
      promise: fetch("/api/ads")
        .then((response) => (response.ok ? response.json() : { slots: {} }))
        .catch(() => ({ slots: {} })),
    };
  }
  return configCache.promise;
}

function readLastShown(slot) {
  try {
    return window.localStorage.getItem(`adlast:${slot}`);
  } catch {
    return null;
  }
}

function writeLastShown(slot, id) {
  try {
    window.localStorage.setItem(`adlast:${slot}`, id);
  } catch {
    // Storage unavailable (private window etc.) - rotation just won't dedupe.
  }
}

// An impression counts once the banner has been at least half on screen for a
// full second - not merely because the page loaded - and only once per ad per
// placement per browser session.
function useViewableImpression(ref, adId, slot) {
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return undefined;

    const sentKey = `adimp:${adId}:${slot}`;
    try {
      if (window.sessionStorage.getItem(sentKey)) return undefined;
    } catch {
      // Fall through - worst case it is counted again this session.
    }

    let timer = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (timer) return;
          timer = setTimeout(() => {
            try {
              window.sessionStorage.setItem(sentKey, "1");
            } catch {
              // ignore
            }
            fetch("/api/ads/impression", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: adId, slot }),
              keepalive: true,
            }).catch(() => {});
            observer.disconnect();
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [0, 0.5] }
    );
    observer.observe(element);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [ref, adId, slot]);
}

function AdItem({ ad, slot, onFail }) {
  const ref = useRef(null);
  useViewableImpression(ref, ad.id, slot);

  return (
    <div className="ad-slot-item" ref={ref}>
      <span className="ad-slot-label">{adDisclosureLabel(ad.adType)}</span>
      <a
        href={`/ad/click/${ad.id}?s=${encodeURIComponent(slot)}`}
        target={ad.newTab ? "_blank" : undefined}
        rel="sponsored nofollow noopener noreferrer"
        className="ad-slot-link"
        // Space is reserved from the saved dimensions before the image loads,
        // so a banner arriving never pushes the content around.
        style={{ maxWidth: ad.width, aspectRatio: `${ad.width} / ${ad.height}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size
            banner, deliberately not run through the image optimiser. */}
        <img
          src={ad.image}
          alt={ad.name}
          width={ad.width}
          height={ad.height}
          loading="lazy"
          decoding="async"
          onError={() => onFail(ad.id)}
        />
      </a>
    </div>
  );
}

export default function AdSlot({ slot, contained = false, className = "" }) {
  const anchorRef = useRef(null);
  const [ads, setAds] = useState([]);
  const [failed, setFailed] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function choose() {
      const config = await loadConfig();
      const anchor = anchorRef.current;
      if (cancelled || !anchor) return;

      const viewport = window.innerWidth;
      // A full-width ("contained") placement can use the page container's
      // width; anything else (a sidebar) is limited by the column it sits in.
      const availableWidth = contained
        ? Math.min(viewport - 32, 1168)
        : anchor.parentElement?.clientWidth || viewport;

      const picked = selectAds(config.slots?.[slot], {
        device: deviceBucket(viewport),
        availableWidth,
        lastShownId: readLastShown(slot),
      });
      if (picked.length > 0) writeLastShown(slot, picked[0].id);
      setAds(picked);
    }

    choose();

    // Phone <-> tablet <-> desktop changes (rotation, window resize) can
    // change what fits, so choose again - but not on every pixel.
    let bucket = deviceBucket(window.innerWidth);
    function onResize() {
      const next = deviceBucket(window.innerWidth);
      if (next !== bucket) {
        bucket = next;
        choose();
      }
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [slot, contained]);

  const visible = ads.filter((ad) => !failed[ad.id]);

  return (
    <>
      <span hidden ref={anchorRef} data-ad-slot={slot} />
      {visible.length > 0 && (
        <div className={`${contained ? "container " : ""}ad-slot-wrap ${className}`.trim()}>
          <aside className="ad-slot" aria-label="Advertisement" data-ad-placement={slot}>
            {visible.map((ad) => (
              <AdItem
                key={ad.id}
                ad={ad}
                slot={slot}
                onFail={(id) => setFailed((previous) => ({ ...previous, [id]: true }))}
              />
            ))}
          </aside>
        </div>
      )}
    </>
  );
}
