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
import { orderAds, slotShowCount, rotationWindow, selectTickerAds, tickerLayout, deviceBucket, adDisclosureLabel } from "@/lib/ads";

const CONFIG_TTL_MS = 60 * 1000;

// A placement with more eligible ads than boxes moves on to the next ones this
// often while the page stays open.
const ROTATE_EVERY_MS = 15 * 1000;

// Row height of the scrolling-row placement, by device. A banner is scaled down
// to fit (never enlarged past its own size), so a 300x300 square fills this
// height and a 728x90 leaderboard keeps its own 90.
const TICKER_ROW_HEIGHT = { desktop: 180, tablet: 150, mobile: 120 };
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

function AdItem({ ad, slot, onFail, fill = false }) {
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
        style={{ maxWidth: fill ? undefined : ad.width, aspectRatio: `${ad.width} / ${ad.height}` }}
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
function AdTicker({ ads, slot, width, height, onFail }) {
  const layout = tickerLayout(ads, width, { maxHeight: height });
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

// layout="grid" lays the ads out like the site's 3-column card grids (1-3 ads,
// each filling one card-sized cell) instead of stacking them centred.
export default function AdSlot({ slot, contained = false, layout = "stack", className = "", fallback = null }) {
  const anchorRef = useRef(null);
  const [view, setView] = useState({ mode: "static", ads: [], width: 0, device: "desktop", max: 1, rotates: false });
  const [failed, setFailed] = useState({});
  const [tick, setTick] = useState(0);
  const hoveredRef = useRef(false);

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
        setView({ mode: "ticker", ads: selectTickerAds(slotConfig, { device }), width: availableWidth, device });
        return;
      }

      const ordered = orderAds(slotConfig, {
        device,
        availableWidth,
        lastShownId: readLastShown(slot),
      });
      if (ordered.length > 0) writeLastShown(slot, ordered[0].id);
      setTick(0);
      setView({
        mode: "static",
        ads: ordered,
        width: availableWidth,
        device,
        max: slotShowCount(slotConfig, ordered.length),
        rotates: slotConfig?.rotation !== "off",
      });
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

  const pool = view.ads.filter((ad) => !failed[ad.id]);

  // Step to the next ads every ROTATE_EVERY_MS - but only while the tab is in
  // view and the cursor is not over the placement (so a click never lands on a
  // banner that just swapped).
  const canRotate = view.mode === "static" && view.rotates && pool.length > view.max;
  useEffect(() => {
    if (!canRotate) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && !hoveredRef.current) setTick((value) => value + 1);
    }, ROTATE_EVERY_MS);
    return () => clearInterval(timer);
  }, [canRotate]);

  const visible = view.mode === "static" ? rotationWindow(pool, view.max, tick) : pool;
  const onFail = (id) => setFailed((previous) => ({ ...previous, [id]: true }));

  let content = fallback;
  if (visible.length > 0 && view.mode === "ticker") {
    content = <AdTicker ads={visible} slot={slot} width={view.width} height={TICKER_ROW_HEIGHT[view.device]} onFail={onFail} />;
  } else if (visible.length > 0) {
    const grid = layout === "grid";
    content = (
      <div className={`${contained ? "container " : ""}ad-slot-wrap${grid ? " ad-slot-wrap-grid" : ""} ${className}`.trim()}>
        <aside className={grid ? "ad-slot ad-slot-grid grid grid-3" : "ad-slot"} aria-label="Advertisement"
          data-ad-placement={slot}
          onMouseEnter={() => { hoveredRef.current = true; }}
          onMouseLeave={() => { hoveredRef.current = false; }}
        >
          {visible.map((ad) => (
            <AdItem key={ad.id} ad={ad} slot={slot} onFail={onFail} fill={grid} />
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
