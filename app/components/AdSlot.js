"use client";

// One placement for the site's OWN banners (affiliate / sponsored / house) -
// completely separate from the Adsterra units, which are left as they are.
// Drop <AdSlot slot="blog-sidebar" /> anywhere; what it can show, on which
// devices, how it rotates and whether it is a static banner or a scrolling row
// is configured in /admin/ads/slots.
//
// It renders NOTHING until it knows there is an ad that fits: no empty box,
// no reserved gap, no broken image. A hidden <span> stays behind only so the
// available width can be measured. A placement that REPLACES existing content
// passes it as `fallback`: that content is what the server renders and what
// stays whenever there is no ad, so crawlers and no-JS visitors always get it.
//
// Client-side on purpose: ad choice, rotation, device and width fitting and
// viewability tracking all depend on the visitor's browser, and it keeps the
// pages themselves static (the ad list comes from /api/ads, cached ~1 minute).

import { useEffect, useRef, useState } from "react";
import { selectAds, selectTickerAds, tickerLayout, deviceBucket, adDisclosureLabel } from "@/lib/ads";

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

function clickHref(ad, slot) {
  return `/ad/click/${ad.id}?s=${encodeURIComponent(slot)}`;
}

function AdItem({ ad, slot, onFail }) {
  const ref = useRef(null);
  useViewableImpression(ref, ad.id, slot);

  return (
    <div className="ad-slot-item" ref={ref}>
      <span className="ad-slot-label">{adDisclosureLabel(ad.adType)}</span>
      <a
        href={clickHref(ad, slot)}
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

// One banner inside the scrolling row. `duplicate` marks the second, repeated
// half of the loop: it is only there to make the loop seamless, so it is hidden
// from screen readers and keyboard focus.
function TickerItem({ item, slot, duplicate, onFail }) {
  const ref = useRef(null);
  useViewableImpression(ref, item.ad.id, slot);

  return (
    <a
      ref={ref}
      href={clickHref(item.ad, slot)}
      target={item.ad.newTab ? "_blank" : undefined}
      rel="sponsored nofollow noopener noreferrer"
      className="ad-ticker-item"
      style={{ width: item.width, height: item.height }}
      tabIndex={duplicate ? -1 : undefined}
      aria-label={duplicate ? undefined : `${item.ad.name} (sponsored)`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size banner */}
      <img
        src={item.ad.image}
        alt={duplicate ? "" : item.ad.name}
        width={item.width}
        height={item.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => onFail(item.ad.id)}
      />
    </a>
  );
}

// A looping row of banners. CSS does the movement (.ad-ticker-track), it
// pauses while the cursor is over it or something inside has focus, and with
// "reduce motion" on it becomes a plain row the visitor scrolls themselves.
function AdTicker({ ads, slot, width, onFail }) {
  const layout = tickerLayout(ads, width);
  if (layout.items.length === 0) return null;

  const half = (isDuplicate) => (
    <div className="ad-ticker-half" aria-hidden={isDuplicate ? "true" : undefined} style={{ gap: layout.gap, paddingRight: layout.gap }}>
      {Array.from({ length: layout.repeats }).flatMap((_, repeat) =>
        layout.items.map((item) => (
          <TickerItem
            key={`${item.ad.id}-${repeat}`}
            item={item}
            slot={slot}
            duplicate={isDuplicate || repeat > 0}
            onFail={onFail}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="ad-ticker-band" data-ad-placement={slot}>
      <div className="container">
        <span className="ad-slot-label">Sponsored</span>
        <div className="ad-ticker" role="region" aria-label="Advertisements">
          <div className="ad-ticker-track" style={{ animationDuration: `${layout.duration}s` }}>
            {half(false)}
            {half(true)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdSlot({ slot, contained = false, className = "", fallback = null }) {
  const anchorRef = useRef(null);
  const [view, setView] = useState({ mode: "static", ads: [], width: 0 });
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

      const slotConfig = config.slots?.[slot];
      const device = deviceBucket(viewport);

      if (slotConfig?.mode === "ticker") {
        setView({ mode: "ticker", ads: selectTickerAds(slotConfig, { device }), width: availableWidth });
        return;
      }

      const picked = selectAds(slotConfig, {
        device,
        availableWidth,
        lastShownId: readLastShown(slot),
      });
      if (picked.length > 0) writeLastShown(slot, picked[0].id);
      setView({ mode: "static", ads: picked, width: availableWidth });
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

  const visible = view.ads.filter((ad) => !failed[ad.id]);
  const onFail = (id) => setFailed((previous) => ({ ...previous, [id]: true }));

  let content = fallback;
  if (visible.length > 0 && view.mode === "ticker") {
    content = <AdTicker ads={visible} slot={slot} width={view.width} onFail={onFail} />;
  } else if (visible.length > 0) {
    content = (
      <div className={`${contained ? "container " : ""}ad-slot-wrap ${className}`.trim()}>
        <aside className="ad-slot" aria-label="Advertisement" data-ad-placement={slot}>
          {visible.map((ad) => (
            <AdItem key={ad.id} ad={ad} slot={slot} onFail={onFail} />
          ))}
        </aside>
      </div>
    );
  }

  return (
    <>
      <span hidden ref={anchorRef} data-ad-slot={slot} />
      {content}
    </>
  );
}
