# Green Pages – Digital Marketing Agency

A production-ready, SEO-optimized digital marketing agency website built with **Next.js 15 (App Router)**, **React 19**, and plain **JavaScript** — no TypeScript, no unnecessary third-party libraries.

## Folder Structure

```
app/
├── components/
│   ├── Navbar.js          # Server Component, CSS-only mobile menu
│   ├── Footer.js          # Server Component
│   ├── Button.js          # Server Component, reusable link/button
│   ├── ServiceCard.js     # Server Component
│   └── ContactForm.js     # Client Component ("use client")
│
├── data/
│   └── services.js        # Shared content/data source for all services
│
├── about/
│   └── page.js             # /about
│
├── contact/
│   └── page.js             # /contact
│
├── services/
│   ├── page.js              # /services
│   └── [slug]/
│       └── page.js          # /services/seo, /services/web-development, /services/content-marketing
│
├── globals.css
├── layout.js                # Root layout + global metadata + JSON-LD
├── page.js                  # / (Home)
├── robots.js                 # app/robots.js -> /robots.txt
└── sitemap.js                 # app/sitemap.js -> /sitemap.xml

public/
└── images/
    ├── hero-illustration.svg
    ├── about-illustration.svg
    └── og-image.svg

package.json
next.config.js
jsconfig.json
.eslintrc.json
README.md
```

## Setup & Run

Requires **Node.js 18.18+** (Node 20 LTS recommended) and npm.

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev
# -> open http://localhost:3000

# 3. Production build
npm run build
npm run start

# 4. Lint
npm run lint
```

> This code was written and reviewed manually; I was not able to execute `npm install`/`npm run dev` in this sandbox because Node.js/npm isn't installed here. Please run the commands above locally to verify — if anything doesn't compile, paste me the error and I'll fix it immediately.

## Before deploying: replace the placeholder domain

`https://example.com` is used as a placeholder production domain in three files. Search and replace it with your real domain:

- [app/layout.js](app/layout.js) — `metadataBase`, Open Graph `url`, JSON-LD `url`/`logo`
- [app/sitemap.js](app/sitemap.js) — `siteUrl`
- [app/robots.js](app/robots.js) — `siteUrl`

Also swap `public/images/og-image.svg` for a real 1200×630 PNG/JPG before launch — SVG is used here as a lightweight, dependency-free placeholder, but Facebook/LinkedIn's crawlers render raster Open Graph images more reliably than SVG.

---

## Architecture Explanation

### 1. React inside Next.js
Next.js is a framework built on top of React. Every `page.js` and component here is a React function component (JSX in, UI out) — the same mental model as any React app. What Next.js adds is the **App Router**: a file-system-based router (`app/about/page.js` → `/about`), a rendering pipeline that runs components on the server by default, and built-in conventions for metadata, static generation, and routing that plain React doesn't have.

### 2. Server Components vs. Client Components
In the App Router, **every component is a Server Component by default**. Server Components render to HTML on the server (or at build time) and ship **zero JavaScript** to the browser for that component. That's why [Navbar.js](app/components/Navbar.js), [Footer.js](app/components/Footer.js), [Button.js](app/components/Button.js), [ServiceCard.js](app/components/ServiceCard.js), and every `page.js` in this project have no `"use client"` directive — they're pure server-rendered markup.

[ContactForm.js](app/components/ContactForm.js) is the **one exception**. It's marked `"use client"` because it needs `useState` (to hold form field values and a "submitted" flag) and an `onSubmit` event handler — both only exist in the browser. The comment at the top of that file explains this explicitly, as required. Everything else on the `/contact` page (headings, contact info, layout) stays a Server Component; only the form itself is a small, isolated client "island."

This is the core Next.js performance pattern: keep the client-side JavaScript bundle as small as possible by pushing "use client" as far down the component tree as it will go, rather than marking whole pages as client components.

### 3. `useState`
`useState` is React's hook for local component state. In [ContactForm.js](app/components/ContactForm.js), it's used twice:
- `formData` — an object holding `name`, `email`, `message`, updated on every keystroke via `onChange`.
- `submitted` — a boolean flipped to `true` in `handleSubmit`, which conditionally renders a success message instead of the form.

Because this state only matters inside the user's browser session and drives interactive UI, it has to live in a Client Component — Server Components render once on the server and can't hold interactive state.

### 4. `generateMetadata()`
Static pages export a plain `metadata` object (see [app/about/page.js](app/about/page.js)). But `/services/[slug]` needs **different** title/description/canonical per service (SEO, Web Development, Content Marketing), and that data isn't known until you know which `slug` was requested. [app/services/\[slug\]/page.js](app/services/[slug]/page.js) exports an async `generateMetadata({ params })` function that awaits `params`, looks up the matching service in `app/data/services.js`, and returns a metadata object built from that service's `title` and `metaDescription`. Next.js calls this on the server before rendering and injects the result into `<head>` — so each service page gets unique, accurate SEO metadata automatically, and there's a single source of truth (`services.js`) instead of duplicated content.

### 5. `generateStaticParams()`
This function tells Next.js, at build time, every value of `[slug]` that should be **pre-rendered as a static page** — in this case `seo`, `web-development`, and `content-marketing`, pulled straight from the `services` array. As a result, `npm run build` produces fully static HTML for all three service pages (no server round-trip needed per request), which is both faster for users and easier for search engines to crawl and index.

### 6. `sitemap.js`
[app/sitemap.js](app/sitemap.js) is a special Next.js file convention: exporting a `sitemap()` function from `app/sitemap.js` automatically generates a valid `/sitemap.xml` at request/build time — no manual XML, no extra library. It lists every static route (`/`, `/about`, `/services`, `/contact`) plus every dynamically generated service route, each with a `lastModified`, `changeFrequency`, and `priority`. Search engines use this to discover and prioritize crawling your pages.

### 7. `robots.js` (robots.txt)
[app/robots.js](app/robots.js) is the equivalent convention for `/robots.txt`. It declares that all crawlers (`userAgent: "*"`) are allowed to crawl the whole site (`allow: "/"`) and points them to the sitemap URL — telling search engines the site is fully crawlable and where to find the full list of URLs.

### 8. JSON-LD structured data
In [app/layout.js](app/layout.js), an `organizationSchema` object (typed as `schema.org` `Organization`) is serialized with `JSON.stringify` and injected via a `<script type="application/ld+json">` tag in the `<body>`, present on every page. This doesn't change what users see — it gives search engines (and AI crawlers) an unambiguous, machine-readable description of the business (name, URL, logo, contact point), which can power rich results like knowledge panels.

### 9. Internal linking
Every page links meaningfully to related pages using `next/link`, not raw `<a>` tags: the homepage links to Services and Contact; the Services listing links to each service detail page via `ServiceCard`; each service detail page links back to `/services`, to `/contact`, and to **related services** (e.g. the SEO page links to Web Development and Content Marketing); the footer links to every major page and every service. This creates a dense internal link graph, which helps search engines discover and understand the relationship between pages, and distributes page authority ("link equity") across the site.

### 10. Why this architecture is good for SEO
- **Server-rendered by default** — pages arrive as full HTML, so crawlers don't need to execute JavaScript to see content (unlike client-heavy SPAs).
- **Static generation for service pages** — `generateStaticParams()` pre-builds `/services/seo`, etc. at build time, so they're fast (great Core Web Vitals) and always crawlable.
- **Per-page, unique metadata** via `generateMetadata()` and static `metadata` exports avoids duplicate `<title>`/`<meta description>` across pages — a common SEO penalty.
- **Semantic HTML** (`header`, `nav`, `main`, `section`, `article`, `footer`) and one clear `<h1>` per page with a logical `h2`/`h3` hierarchy give crawlers (and screen readers) a clear structure to parse.
- **`sitemap.xml` + `robots.txt`** make the site's full URL set explicit and crawlable.
- **JSON-LD** gives search engines structured, unambiguous business data.
- **Minimal client-side JavaScript** (only `ContactForm` ships JS) keeps bundle size small, which directly improves Core Web Vitals (LCP/INP) — a confirmed Google ranking factor.
- **Dense internal linking** helps search engines discover, crawl, and rank every page relative to the others.
