# titrin.com Rebuild — Design Specification

**Date:** 2026-05-25
**Status:** Draft — awaiting Tish's review before implementation planning
**Author:** Claude (in collaboration with Tish Titina, P.Ag.)

---

## 1. Goal & Strategic Intent

Migrate **titrin.com** off Framer (Basic plan, $240/yr, locked behind Server API beta access) onto a **code-controlled static site** that Claude can edit, optimize, and expand routinely without manual editor work.

**Why this matters for the business:**

- **Lead-gen ceiling.** Titrin is a local-services consultancy. The single biggest SEO play is **programmatic local pages** (every city × every service = ~70 long-tail-targeting pages). On Framer this is misery; on a code site this is the natural mode.
- **Content velocity.** Blog cadence is the bottleneck. On Framer, every post requires opening the editor. On the new stack, a chat prompt becomes a live post in ~60 seconds.
- **Cost.** Framer Basic is $240/yr, prices already rising (collections cut 2→1 in latest pricing update). New stack is **$0/yr** (Netlify free tier, GitHub free, open-source dependencies).
- **Ownership.** You own the site. No vendor lock-in. Lock-in escape cost grows with every CMS entry on Framer; on the new stack it's always zero.

**What success looks like at launch:**

1. New titrin.com loads instantly (Core Web Vitals top-decile)
2. Visually **indistinguishable** from current Framer site at first glance — same hero video, same logos, same pill-chip vocabulary, same bubbles
3. **Improvements baked in** that Framer can't easily do: programmatic SEO surface area ready, blog infrastructure ready, structured data on every page
4. Zero broken inbound links — every current URL either matches or 301-redirects to its new equivalent
5. **Editable by Claude via chat prompt only** — no Framer-style canvas editing required

---

## 2. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | [Astro](https://astro.build/) 5 | Static-first, best-in-class SEO, ships zero JS by default. Content collections are first-class. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) 4 | Same family Tish already uses in tas-hub. Atomic, fast, no CSS-in-JS overhead. |
| **Icons** | [Lucide](https://lucide.dev/) (via `lucide` npm or inline SVG) | Same library tas-hub uses. Stroke-style matches current Framer aesthetic. |
| **Type** | [Inter](https://rsms.me/inter/) (Google Fonts, self-hosted) | What current Framer site uses. Self-hosting eliminates Google Fonts request. |
| **Content** | Markdown + frontmatter in Astro Content Collections | Plain files in git. Diffable, AI-editable, no CMS service to manage. |
| **Hosting** | [Netlify](https://www.netlify.com/) (free tier) | Already used by tas-hub. Git-push deploys. CDN included. Build minutes well under free tier. |
| **Source control** | GitHub (private repo `titrinsolutions-svg/titrin-web`) | Same org as tas-hub. Auto-deploys on push. |
| **Forms** | Netlify Forms (free tier — 100 submissions/mo) | Drop-in for the Contact page. Submissions piped to `titrinsolutions@gmail.com`. |
| **Analytics** | Google Analytics 4 (current) + Google Search Console | GA4 already in place on current site — same property re-used. |
| **Sitemap / robots / RSS** | `@astrojs/sitemap`, native robots.txt, Astro RSS | All built into the framework. |
| **Image optimization** | Astro's built-in Sharp pipeline | Automatic WebP/AVIF, responsive `srcset`. |
| **Deployment** | Netlify auto-deploy on `git push origin main` | Same pattern as tas-hub. |

**No third-party CMS (Sanity, Contentful, etc.).** Content lives in markdown files in the repo. Reasons: zero recurring cost, AI-native (I edit markdown faster than I navigate a CMS UI), no auth surface to manage, no API to hit. The tradeoff is no in-browser editor for Tish — but Tish has explicitly said the goal is for Claude to do edits, not for her to.

**No JavaScript framework client-side** unless specifically needed for a section. Astro ships zero JS by default. The Intersection-Observer fade-in (~20 lines) and the marquee animation are CSS + a tiny vanilla JS hook, no React.

---

## 3. Design System

### 3.1 Color Palette

Extracted from current titrin.com via Chrome MCP inspection. All values in CSS variable form:

```css
:root {
  /* Foundation */
  --color-bg: #ffffff;
  --color-bg-soft: #f8fafc;        /* hero gradient top */
  --color-bg-soft-2: #f1f5f9;      /* chip bg, accordion bg */
  --color-bg-soft-3: #e2e8f0;      /* card borders, dividers */
  --color-bg-soft-4: #cbd5e1;      /* hero gradient mid */
  --color-bg-soft-5: #94a3b8;      /* hero gradient bottom, muted text */

  /* Text */
  --color-text: #0f172a;           /* headings, near-black */
  --color-text-strong: #1e293b;    /* sub-headlines over gradient */
  --color-text-muted: #475569;     /* body */
  --color-text-faint: #64748b;     /* secondary body */
  --color-text-quiet: #94a3b8;     /* placeholders, sub-labels */

  /* Brand */
  --color-brand: #2563eb;          /* primary cobalt blue */
  --color-brand-light: #3b82f6;    /* gradient top of CTA */
  --color-brand-dark: #1d4ed8;     /* hover state */
  --color-brand-glow: rgba(37,99,235,0.20);

  /* Accent (the "bubble" halo) */
  --color-accent: #e8eaff;         /* icon container bg, bubble halo seed */
  --color-accent-soft: rgba(186, 200, 255, 0.20);
  --color-accent-faint: rgba(186, 200, 255, 0.10);
}
```

### 3.2 Typography

**Font family:** `'Inter', system-ui, -apple-system, sans-serif` (self-hosted Inter from rsms.me, woff2).

**Type scale:**

| Use | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|
| Hero H1 | `clamp(36px, 5vw, 60px)` | 800 | 1.05 | -0.03em |
| Section H2 | `clamp(28px, 3.5vw, 44px)` | 800 | 1.1 | -0.02em |
| Card H3 | 19px | 700 | 1.3 | normal |
| Lede (sub-text large) | 18px | 500 | 1.55 | normal |
| Body | 15-16px | 400-500 | 1.55 | normal |
| Card body | 14-15px | 400 | 1.55 | normal |
| Chip | 13px | 500 | 1 | normal |
| Caption / sub-label | 13-14px | 500 | 1.5 | normal |
| Tiny / footer copyright | 13px | 400 | 1.5 | normal |

**Notes:**
- Headings use `text-wrap: balance` for naturally-broken multi-line text.
- Body uses 400/500 selectively — sub-headlines bumped to 500 when sitting over a gradient/video for legibility.

### 3.3 Spacing Scale

Tailwind default spacing scale is sufficient (multiples of 4px). Key rhythm points:

| Token | px | Use |
|---|---|---|
| `space-2` | 8px | Tight chip gap, list bullet inset |
| `space-3` | 12px | Heading → subhead margin |
| `space-4` | 16px | Chip → heading margin |
| `space-6` | 24px | Card internal padding |
| `space-8` | 32px | Grid → next-grid spacing |
| `space-10` | 40px | Steps gap |
| `space-12` | 48px | Hero → next section padding |
| `space-20` | 80px | Section vertical padding |
| `space-24` | 96px | Hero top padding (above floating nav) |

### 3.4 Border Radius

| Token | px | Use |
|---|---|---|
| `radius-sm` | 6px | Inline buttons, small chips |
| `radius-md` | 10-12px | Icon containers, accordion bg |
| `radius-lg` | 16-18px | Cards |
| `radius-xl` | 20px | Floating nav |
| `radius-full` | 9999px | Pills, CTA buttons, chips, bubbles |

### 3.5 Shadows

```css
--shadow-nav: 0 8px 32px rgba(15,23,42,0.10);            /* floating nav */
--shadow-card-hover: 0 12px 32px rgba(15,23,42,0.06);    /* card hover lift */
--shadow-cta:
  inset 0 1px 0 rgba(255,255,255,0.25),
  inset 0 -1px 0 rgba(0,0,0,0.05),
  0 1px 2px rgba(37,99,235,0.20);                        /* CTA buttons */
--shadow-cta-hover:
  inset 0 1px 0 rgba(255,255,255,0.30),
  0 4px 12px rgba(37,99,235,0.30);                       /* CTA hover */
--shadow-bubble:
  0 0 0 14px rgba(186, 200, 255, 0.20),
  0 0 0 28px rgba(186, 200, 255, 0.10),
  0 8px 24px rgba(99, 102, 241, 0.15);                   /* THE signature bubble glow */
```

### 3.6 Motion

| Pattern | Spec |
|---|---|
| Page-load fade-up (hero) | 0.8s ease, staggered 0.2s/0.4s/0.6s/0.8s |
| Scroll-triggered fade-up | 0.8s cubic-bezier(0.16, 1, 0.3, 1), staggered children 50ms apart |
| Hover transitions | 0.15s ease (color, transform, background) |
| Button hover lift | translateY(-1px) |
| Card hover lift | translateY(-2px) + shadow swap |
| Marquee scroll | 32s linear infinite, translateX(0 → -50%) |
| Loop seam | Phase 2: re-cut hero video with 1s crossfade at boundary |

**Reduced motion:** All animations disabled when `prefers-reduced-motion: reduce`. Accessibility baseline.

---

## 4. Component Library

Each component below is an Astro component (`.astro` file). Composable, typed props, no runtime JS unless needed.

### Layout & Chrome
- **`<Layout>`** — root HTML, sets `<head>`, font loading, GA4
- **`<StickyNav>`** — fixed floating pill, glass blur background, logo + 4 links + gradient CTA
- **`<Footer>`** — 3-col (brand + credentials | Explore | contact info) + © + Privacy link

### Hero & Media
- **`<HeroVideo>`** — full-bleed autoplay/muted/loop video + texture overlay + gradient + content slot
- **`<TrustMarquee>`** — infinite horizontal scroll with gradient-mask fade edges, accepts an array of logo refs

### Section Building Blocks
- **`<Chip text="..." icon="...">`** — rounded pill label with mini Lucide icon
- **`<SectionHeading chip="..." title="..." lede="...">`** — chip + H2 + optional lede paragraph
- **`<ScrollFade as="div" group?>`** — wraps content for IntersectionObserver fade-in; `group` flag enables staggered children

### Cards
- **`<ServiceCard title desc deliverables[]>`** — bordered card with optional accordion of deliverables (uses native `<details>`)
- **`<WhyCard icon title desc>`** — horizontal card with light-blue icon container
- **`<ProjectCard slug client subtitle photo desc>`** — image + title + sub + desc
- **`<BubbleStep icon number title desc>`** — circular soft-glow bubble + numbered step
- **`<FeatureCard>`** — flexible card for new sections (testimonials, FAQs, stats)

### Buttons
- **`<GradientCTA href text icon? variant=primary|secondary|ghost>`** — the cobalt gradient pill button + variants

### SEO
- **`<SEO title description image type schema?>`** — sets all meta tags, OG, Twitter, JSON-LD; per-page customization
- **`<LocalBusinessSchema>`** — drops the LocalBusiness JSON-LD on every page (site-wide consistency)

---

## 5. Page Map

### 5.1 Pages that exist today (mirrored at launch)

| URL | Type | Notes |
|---|---|---|
| `/` | Static | Home page — 8 sections from current titrin.com |
| `/about` | Static | About — 2-col hero + bio + reused Why Choose |
| `/projects` | Static index | Project case studies grid |
| `/projects/[slug]` | Dynamic | One page per case study (NEW — currently no detail pages exist) |
| `/contact` | Static + form | Get-in-Touch form via Netlify Forms |
| `/privacy-policy` | Static | Carry over |
| `/thank-you` | Static | Form submission confirmation |
| `/404` | Static | Custom 404 |

### 5.2 NEW pages (strategic adds)

| URL | Type | Why we're adding it |
|---|---|---|
| `/services` | Static (rich) | Currently the nav anchors to home #services. Dedicated rich page with substantial section per service (~400 words each) for browsing UX + ranks for "agrology services BC" type queries. Sections link to per-service detail pages. |
| `/services/[service]` | Dynamic | One page per service — long-form authoritative content (~1500 words) targeting "[service] BC" queries. The "Learn more" destination from the /services sections. |
| `/blog` | Static index | Blog index page. SEO + ongoing content marketing. |
| `/blog/[slug]` | Dynamic | Individual blog posts. |
| `/services/[city]/[service]` | Dynamic (programmatic) | **The strategic moonshot.** 15 cities × 8 services = ~120 pages targeting "[service] in [city] BC" long-tail queries. |

**Services architecture decision (2026-05-25):** **Hybrid (Option C)** — rich `/services` page with section per service, each linking to its own detail page. Same content sourced from a single markdown file per service, rendered two ways (summary on index, long-form on detail). One write, two ranking surfaces.

### 5.3 Page structure templates

Each template is rendered from a content collection or a city/service combination. Example for the programmatic combo page `/services/richmond/farm-plans`:

1. SEO `<head>` (title: "Farm Plans in Richmond, BC | Titrin Agrisoil Solutions", description, OG, JSON-LD Service schema)
2. Sticky nav
3. Hero (compact — H1 = "Farm Plans for Richmond Properties", subhead, "Book Free Consult" CTA)
4. "What's Included" — list of deliverables for that service
5. "Richmond-specific considerations" — paragraph generated from the city's frontmatter (ALR % of city, key municipal contacts, common project types)
6. Sample/recent projects in Richmond (if any in the projects collection match)
7. Related services (link grid to other Richmond × X pages)
8. Final CTA
9. Footer

Even small unique-content variations across pages avoid Google's duplicate-content penalty while maintaining brand consistency.

---

## 6. Content Architecture (Astro Content Collections)

All content lives in `src/content/` as markdown files with typed frontmatter. Six collections:

### `services` (one file per service, 7-10 services total)
```yaml
---
title: "Farm Plans"
slug: "farm-plans"
category: "agrology"     # one of: agrology | permitting | construction
order: 1
shortDesc: "Crop, land-use, and regulatory roadmaps for ALR properties."
icon: "sprout"           # Lucide icon name
deliverables:
  - "Site constraints review (ALR/zoning, drainage, soil)"
  - "Crop and land-use recommendations"
  - "Agricultural capability summary"
faqs:
  - q: "When do I need a Farm Plan?"
    a: "..."
---

# Long-form authoritative markdown content here for the service detail page
```

### `projects` (one per case study)
```yaml
---
title: "City of Coquitlam — Riverview Baseball Park"
slug: "coquitlam-riverview"
client: "City of Coquitlam"
location: "Coquitlam, BC"
category: "Development"   # for chip badge
year: 2025
photos:
  - "/projects/coquitlam-riverview/photo-1.jpg"
ourRole: "Soil sampling, root-zone analysis, stamped specifications..."
outcome: "Project advanced through regulatory review..."
deliverables:
  - "Soil sampling + analysis"
  - "Stamped sports-field spec"
relatedServices: ["farm-plans", "soil-assessments"]
---

# Markdown long-form case study content
```

### `posts` (blog)
```yaml
---
title: "When does Richmond require a Farm Plan?"
slug: "richmond-farm-plan-requirements"
date: 2026-05-25
author: "Tishtaar Titina, P.Ag."
excerpt: "..."
cover: "/blog/richmond-farm-plan/cover.jpg"
tags: ["richmond", "farm-plans", "alc"]
relatedServices: ["farm-plans"]
relatedCities: ["richmond"]
---

# Markdown blog content
```

### `cities` (Metro Vancouver / Fraser Valley municipalities)
```yaml
---
name: "Richmond"
slug: "richmond"
province: "BC"
order: 1   # priority — Richmond first because it's home
overview: "..."
alrPercent: 39   # % of city in ALR
commonProjects: ["farm-plans", "fill-management", "alc-applications"]
municipalContacts:
  - role: "Planning & Development"
    detail: "..."
---

# Optional markdown content for city overview page
```

### `testimonials` (future — empty at launch)
```yaml
---
client: "..."
role: "..."
quote: "..."
project: "coquitlam-riverview"   # optional link
---
```

### `siteConfig` (single doc — global config)
```yaml
---
businessName: "Titrin Agrisoil Solutions Ltd."
tagline: "Full-service agrology and construction solutions in British Columbia."
phone: "+1 778 885 9771"
email: "titrinsolutions@gmail.com"
address: "Richmond BC, V6Y3Y6"
founder:
  name: "Tishtaar Titina"
  credentials: "P.Ag, MSc."
  role: "Licensed Professional Agrologist"
  organization: "BC Institute of Agrologists"
socialLinks: {}
---
```

**Why markdown collections:** I can create/edit any of these via a single chat prompt. Type-safety via Zod schemas in `src/content/config.ts` catches mistakes at build time, not in production. Plain text files in git mean every edit is versioned.

---

## 7. SEO Infrastructure

### 7.1 Per-page meta
Every page renders a `<SEO>` component that emits:
- `<title>` — page title (with " | Titrin Agrisoil Solutions" suffix)
- `<meta name="description">`
- `<meta name="robots" content="index,follow">`
- `<link rel="canonical">`
- Open Graph tags (og:title, og:description, og:image, og:type, og:url)
- Twitter Card tags
- JSON-LD structured data (see below)

### 7.2 Structured data (JSON-LD)
On every page:
- **`LocalBusiness`** — name, founder (Tishtaar Titina), address, phone, geo, hours, areaServed (all Metro Vancouver + Fraser Valley municipalities)

Per page type:
- **`/services/[service]`** — `Service` schema
- **`/projects/[slug]`** — `CreativeWork` or `Article`
- **`/blog/[slug]`** — `BlogPosting` schema with author, datePublished
- **`/services/[city]/[service]`** — `Service` scoped to specific city
- **FAQ blocks** — `FAQPage` schema where applicable

This gives Google rich snippets in search results (star ratings, FAQ accordions, business info panel).

### 7.3 Sitemap, robots, RSS
- `sitemap.xml` auto-generated by `@astrojs/sitemap` at build time
- `robots.txt` allows all crawlers, references sitemap
- `rss.xml` for blog (so future readers can subscribe)

### 7.4 Performance as a ranking factor
Astro static output + Netlify CDN should hit:
- LCP < 1.5s (mostly limited by hero video)
- CLS < 0.05
- INP < 200ms
- Lighthouse Performance score > 95

Google uses Core Web Vitals as a ranking signal. Beating Framer's bundle size is automatic with static-first Astro.

### 7.5 Google Search Console + Analytics setup
- Verify new site in Search Console as soon as it's live on staging URL
- Submit sitemap immediately after cutover
- Keep existing GA4 property and update tracking ID
- Set up Search Console + GA4 integration

---

## 8. The Programmatic Local SEO Play

This is the strategic differentiator over current Framer site.

### 8.1 The pages

**Cities (initial 15)** — covering Titrin's actual geography of practice:
- **Metro Vancouver / Fraser Valley:** Richmond, Delta, Surrey, Langley, Coquitlam, Burnaby, Maple Ridge, Pitt Meadows, Abbotsford, Chilliwack
- **Vancouver Island:** Victoria, Saanich, Nanaimo, Duncan, Courtenay

**Services (initial 8):** Farm Plans, ALC Applications, Fill Quality Assessments, Soil Assessments, Reclamation Plans, CEMP, Land Capability Assessments, **Compliance Recovery & Enforcement Response**.

15 × 8 = **120 programmatic pages**, each at `/services/[city]/[service]/`.

The 8th service — **Compliance Recovery & Enforcement Response** — is new vs. the current titrin.com and reflects Titrin's expanded scope: helping property owners regain compliance after ALC enforcement notices, municipal violation orders, improper soil work, or other regulatory situations. This is high-intent inbound search territory ("ALC enforcement notice help", "soil violation richmond bc") with low competition.

### 8.2 Why this works

Each page targets a high-intent long-tail search like:
- "farm plan richmond bc"
- "ALC application delta"
- "fill quality assessment surrey"

These searches have **low competition** (most agrology firms haven't bothered with location-specific landing pages) and **high purchase intent** (someone searching for "X in Y city" is much more likely to call than someone searching for general "agrology firm").

### 8.3 Content per combo page

Each combo page is unique because it blends:
- The service-level content (from `services` collection)
- City-specific frontmatter (ALR %, common project types, municipal contacts) (from `cities` collection)
- Any past Titrin projects matching that city (from `projects` collection)
- A unique intro paragraph generated from city+service combination

Result: 70 pages that share consistent structure but have meaningfully unique content. Google rewards this pattern; punishes copy-paste pages.

### 8.4 Internal linking
- City pages link to all 7 service combos for that city
- Service pages link to all 10 city combos for that service
- Combo pages link laterally to "Related cities" and "Related services"

This builds topical authority. Within ~3 months of indexing, expect first-page rankings on at least half of the 70 long-tail queries.

---

## 9. Migration Plan (Cutover Strategy)

### 9.1 Build on staging first
- Repo: `titrinsolutions-svg/titrin-web` (private GitHub repo)
- Staging URL: `titrin-v2.netlify.app` (Netlify default subdomain)
- Build and validate at staging until ready

### 9.2 URL mapping for 301 redirects

| Current URL | New URL | Status |
|---|---|---|
| `/` | `/` | Direct match |
| `/about` | `/about` | Direct match |
| `/projects` | `/projects` | Direct match |
| `/contact` | `/contact` | Direct match |
| `/privacy-policy` | `/privacy-policy` | Direct match |
| `/thank-you` | `/thank-you` | Direct match |
| `/404` | `/404` | Direct match |
| (Services nav anchor `#services` on home) | `/services` | NEW page replaces anchor |

All current URLs map directly. **Zero redirect chains needed** for content that exists today.

### 9.3 Cutover steps

1. Verify staging site renders correctly across desktop + mobile
2. Lighthouse audit on staging — must hit ≥95 Performance, ≥100 Accessibility, ≥100 SEO
3. Verify all forms submit to Tish's email
4. Add new site to Google Search Console (verify ownership)
5. Submit sitemap to Search Console
6. Pre-cutover communication: notify Tish 24h before DNS switch
7. Switch DNS for `titrin.com` and `www.titrin.com` to Netlify
8. Monitor 4xx/5xx in Netlify logs for 48h
9. Cancel Framer subscription **only after** 7 days of clean operation on new site

### 9.4 SEO juice preservation
- 301 redirects ensure PageRank flows from old URLs to new (where URLs change)
- Sitemap re-submitted immediately
- "Request indexing" in Search Console for top 10 pages
- Same GA4 property = same historical data continuity

---

## 10. Performance Budget

| Metric | Target | Floor (must hit) |
|---|---|---|
| LCP (Largest Contentful Paint) | < 1.5s | < 2.5s |
| CLS (Cumulative Layout Shift) | < 0.05 | < 0.1 |
| INP (Interaction to Next Paint) | < 100ms | < 200ms |
| Total bundle (JS) | < 30KB | < 60KB |
| Hero video size | < 4MB | < 8MB |
| Lighthouse Performance | ≥ 95 | ≥ 85 |
| Lighthouse Accessibility | 100 | ≥ 95 |
| Lighthouse Best Practices | 100 | ≥ 95 |
| Lighthouse SEO | 100 | 100 |

If we miss any "Floor" metric, we don't ship.

### Image optimization
- All images served as WebP with AVIF fallback (Astro Sharp pipeline)
- Responsive `srcset` for hero photos
- `loading="lazy"` on everything below the fold
- Aspect-ratio reserved to prevent CLS

### Video
- Hero video preload = "auto" (visible immediately)
- Lower bitrate variants generated (480p, 720p, 1080p) and served via `<source>` media queries
- Consider downloading current Framer-hosted MP4 and re-encoding with crossfaded loop seam during Phase 1

---

## 11. Accessibility (WCAG 2.1 AA)

| Area | Requirement |
|---|---|
| Color contrast | All text ≥ 4.5:1 against background; large text ≥ 3:1 |
| Keyboard nav | All interactive elements reachable and operable via keyboard |
| Focus indicators | Visible focus ring on every interactive element |
| ARIA labels | Icon-only buttons have `aria-label`; decorative SVGs have `aria-hidden="true"` |
| Semantic HTML | `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` used correctly |
| Skip-to-content | Hidden-until-focused link at top of every page |
| Reduced motion | `prefers-reduced-motion: reduce` disables all transitions |
| Alt text | Every meaningful image has descriptive alt; decorative images use `alt=""` |
| Form labels | Every form input has a `<label>` |
| Headings | Logical heading order (one H1 per page, no skipped levels) |

We'll run automated audits with axe-core + manual screen-reader pass (NVDA on Windows) before launch.

---

## 12. Phasing

### Phase 1 — Foundation + Home Page (~12-15 hrs)
1. Scaffold Astro project, Tailwind, Lucide, content collections config
2. Build design system tokens
3. Build component library (StickyNav, HeroVideo, TrustMarquee, Chip, ScrollFade, Cards, Bubble, GradientCTA, Footer)
4. Build home page identical to v5 prototype
5. Set up Netlify deploy + staging URL
6. Lighthouse audit; tune to performance budget

**Exit criteria:** Staging URL renders home page identical to current titrin.com, Lighthouse ≥ 95.

### Phase 2 — Existing Pages (~6-8 hrs)
1. `/about` (2-col hero + bio + reused Why Choose)
2. `/projects` (index) + `/projects/[slug]` (detail template) — populated with 3-5 existing case studies
3. `/contact` with Netlify Forms
4. `/privacy-policy`, `/thank-you`, `/404`

**Exit criteria:** Every URL on current titrin.com has a 1:1 equivalent on staging.

### Phase 3 — Services Pages (Hybrid architecture, ~8-10 hrs)
1. `/services` rich page with substantial sections per service (8 sections, ~400 words each)
2. `/services/[service]` detail pages (one per service, ~1500 words each)
3. Content source: each service has one markdown file with `summary` (rendered on `/services`) and `body` (rendered on detail page)
4. Long-form content draws on TAS scope-of-practice docs in Tish's TITRIN brain
5. Internal cross-linking: detail pages link back to /services and to related city × service combo pages

**Exit criteria:** /services is the polished one-page service browser; each service has its own authoritative landing page.

### Phase 4 — Blog Infrastructure (~3-4 hrs)
1. `/blog` index
2. `/blog/[slug]` post template with reading time, related links, author bio
3. RSS feed
4. ONE seed post to validate the pipeline (no big content backfill yet — that's Phase 6)

**Exit criteria:** Tish can prompt "write a blog post about X" and I can ship it in <10 minutes.

### Phase 5 — Cutover (~2-3 hrs)
1. Final pre-flight checks
2. DNS switch
3. Search Console + sitemap submission
4. Monitor for 48h
5. Cancel Framer after 7 days clean

**Exit criteria:** titrin.com points at new site; SEO continuity preserved.

### Phase 6 — Programmatic Local SEO (~8-12 hrs)
1. Populate `cities` collection (15 cities — Metro Vancouver + Fraser Valley + Vancouver Island)
2. Build `/services/[city]/[service]` template
3. Generate 120 unique combo pages (15 cities × 8 services)
4. Cross-link city + service grids
5. Submit expanded sitemap
6. Request indexing in Search Console for the highest-intent pages (Richmond × all 8 services, etc.)

**Exit criteria:** 120 long-tail pages live, internal linking solid, sitemap submitted.

### Phase 7 — Content Revamp (ongoing)
1. Content audit of current titrin.com text (the ChatGPT-generated copy Tish mentioned)
2. Rewrite home + about + service pages with current Titrin scope (informed by my context on the business)
3. Add testimonials collection + section
4. Add FAQ blocks (with FAQPage schema for SEO snippets)
5. Continuous blog cadence (target: 1-2 posts/month)

**Exit criteria:** Site content reflects current Titrin scope, not 2024-launch scope.

### Phase 8 — SEO Operations (continuous)
1. Weekly: review Search Console for queries reaching position 11-20 ("striking distance"), optimize those pages
2. Monthly: identify new long-tail combos to add
3. Quarterly: backlink outreach to municipal directories, BCIA, BC ag associations
4. Continuous: schema markup expansion, internal linking improvements

**Exit criteria:** None — this is the new normal of running the site.

---

## 13. Risks & Open Questions

### Risks
1. **Framer's CDN may revoke hotlinking** for the assets we currently use (video, logos, project photos). **Mitigation:** Download all assets to the new project's `public/` folder during Phase 1, host them ourselves. This is also better for performance (CDN sits with Netlify, not Framer).
2. **DNS cutover causes brief downtime.** **Mitigation:** TTL reduction 24h pre-cutover; expected downtime <5 minutes.
3. **Lost analytics history** if we switch GA4 properties accidentally. **Mitigation:** Keep the same GA4 property ID, just update the tracking snippet location.
4. **Content gap during migration** if I rewrite copy and it's worse than current. **Mitigation:** Phase 7 happens AFTER launch, not during; current copy is preserved at launch.
5. **The video loop seam** is on the original file; not technically a migration risk, but Tish noticed it. **Mitigation:** Re-cut the video in Phase 1 with a 1-second crossfade at the boundary, OR find a longer single-shot piece.

### Decisions made (2026-05-25 review)
1. **Pronouns in bio:** He/him. Current bio is correct — no change.
2. **Founder photo:** Use the photo Tish sent in chat as the launch headshot (with tighter crop + minor color adjustment). Upgrade in Phase 7 polish if desired — options include AI headshot services (HeadshotPro, Aragon — $20–50) or a professional photographer in Richmond ($200–500). Not blocking launch.
3. **Initial city list:** Expanded to 15 cities — Metro Vancouver / Fraser Valley (10) + Vancouver Island (5). See §8.1 for the full list.
4. **Initial service list:** 8 services confirmed, including the new **Compliance Recovery & Enforcement Response** (Titrin's expanded scope around helping owners regain compliance). See §8.1.
5. **Logo files:** High-res originals located at `C:\Users\Tish\Desktop\TITRIN\TAS - Branding & Templates\Logos\`. Three variants will be used: color (primary), black (print/dark UI), white (dark backgrounds). All copied into `public/logos/` during Phase 1.
6. **Hero video:** Keep current file. Re-cut with 1-second crossfaded loop in Phase 1 polish (eliminates the seam Tish noticed). Open to commissioning a better video later if a stronger option surfaces.
7. **Blog topics:** Industry-focused — land development, agronomy, soil science, agriculture, ALC/ALR. See §16 for the initial backlog of ~12 post ideas.
8. **Testimonials:** Deferred to future. No testimonials at launch. Will add a `testimonials` collection when client quotes are available.

### Partnership credentials
**Madrone Environmental Services Ltd.** is one of Titrin's active partners (shown in the current hero trust marquee). Madrone's logo carries over to the new build. The partnership credential gets a quiet but visible nod in the About page bio.

---

## 14. Blog Topic Backlog (Initial 12 Posts)

Per Tish's direction (industry-focused: land development, agronomy, soil, agriculture, ALC/ALR), here's the seed backlog. Each is also a long-tail SEO play.

| # | Working title | Primary keyword | Length target |
|---|---|---|---|
| 1 | When does Richmond require a Farm Plan? | "farm plan richmond bc" | 1200 words |
| 2 | ALR vs ALC: What's the difference for BC landowners? | "ALR ALC difference" | 1000 words |
| 3 | Fill Quality Assessments: A Field Guide for Property Owners | "fill quality assessment BC" | 1500 words |
| 4 | The 7 most common reasons ALC applications get refused | "ALC application refused" | 1400 words |
| 5 | Soil capability ratings explained: Class 1 to Class 7 | "soil capability classes BC" | 1300 words |
| 6 | What to do when you receive an ALC enforcement notice | "ALC enforcement notice" | 1500 words |
| 7 | Drainage on agricultural land: What every owner should know | "agricultural drainage BC" | 1200 words |
| 8 | Farm Plans in Metro Vancouver: Municipality-by-municipality | "metro vancouver farm plan" | 1800 words |
| 9 | Reclamation Management Agreements (RMA): When required, what to expect | "RMA reclamation BC" | 1400 words |
| 10 | Soil Removal Permits: Step-by-step ALC application guide | "ALC soil removal application" | 1600 words |
| 11 | Working with municipalities on agricultural land approvals | "municipal ALC approval" | 1200 words |
| 12 | What it costs to fix an ALC violation (and how to avoid one) | "ALC violation fine BC" | 1300 words |

**Publishing cadence target:** 1–2 posts per month. Sustained, that's 12–24 posts/year × ~1000 words = 12,000–24,000 words of fresh content annually. Each post can rank, drive traffic, and link internally to relevant services + city pages.

**Per-post structure (template):**
1. Hero image + title + reading time + date
2. TL;DR box (3-sentence summary for skimmers + AI search engines)
3. Body (markdown with H2/H3 structure, internal links)
4. FAQ section (3–5 questions) — auto-generates FAQPage schema for rich snippets
5. "Related services" links (cross-links to service detail pages)
6. CTA: "Need help with this? Book a consult"
7. Author bio sidebar

---

## 15. What This Spec Is NOT

To keep scope honest:

- **Not a code dump.** No actual `.astro` files written here. That happens in implementation.
- **Not a CMS replacement design.** Content authoring is via chat-with-Claude → markdown commits, not a Tish-facing admin UI.
- **Not a sales/marketing strategy document.** This focuses on the technical and design rebuild. Lead-gen funnel design, email nurture sequences, paid ads — separate efforts.
- **Not a complete brand refresh.** We're rebuilding the website with the same brand at launch. Brand evolution (logo refinement, color tuning) can happen in Phase 7 if desired.

---

## 16. Sign-Off

**Before any code is written, Tish reviews this spec and approves it.**

Once approved:
1. I invoke the `writing-plans` skill to produce the detailed phase-by-phase implementation plan
2. Tish reviews and approves that plan
3. I scaffold the Astro project and begin Phase 1

If Tish wants changes to this spec, she sends feedback in chat, I revise inline, and we re-confirm before moving on.

---

*End of spec.*
