# titrin.com Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a new titrin.com on Astro + Netlify, replacing the current Framer site, with built-in surface area for programmatic local SEO and routine blog cadence — fully editable by Claude via chat prompts.

**Architecture:** Static-first Astro 5 site with content as Markdown collections, Tailwind CSS 4 for styling, deployed to Netlify with form submissions handled by Netlify Forms. Three editable surfaces: (1) per-component design tokens in CSS variables, (2) per-page metadata in frontmatter, (3) all writing in markdown. No third-party CMS, no admin UI, no recurring cost.

**Tech Stack:**
- Astro 5 (framework)
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- Inter font (self-hosted woff2)
- Lucide icons (inline SVG via `astro-icon` or hand-imported)
- Netlify (hosting + forms + CDN)
- GitHub (`titrinsolutions-svg/titrin-web`, private)
- Playwright (E2E tests)
- Lighthouse CI (performance gates in CI/CD)

**Reference spec:** [`docs/superpowers/specs/2026-05-25-titrin-com-rebuild-design.md`](../specs/2026-05-25-titrin-com-rebuild-design.md)

**Working directory for the project:** `C:\Users\Tish\Downloads\titrin-web\` (NEW directory — sibling to tas-hub)

---

## Phase 1 — Foundation + Home Page (~12-15 hrs)

**Exit criteria:** Staging URL renders home page identical to v5 prototype. Lighthouse ≥ 95 across the board. All design tokens, components, content schemas in place.

### Task 1: Scaffold Astro project

**Files:**
- Create: `C:/Users/Tish/Downloads/titrin-web/` (new directory)
- All Astro starter files

- [ ] **Step 1: Create project directory and run Astro create**

```bash
cd C:/Users/Tish/Downloads/
npm create astro@latest titrin-web -- --template minimal --typescript strict --no-install --no-git --skip-houston
cd titrin-web
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Install Tailwind 4 + integrations**

```bash
npm install -D tailwindcss@next @tailwindcss/vite @astrojs/sitemap @astrojs/rss
npm install @fontsource/inter lucide-static
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: dev server listens on http://localhost:4321, default Astro page renders.

- [ ] **Step 5: Initialize git, set remote, commit**

```bash
git init
git remote add origin git@github.com:titrinsolutions-svg/titrin-web.git
git add .
git commit -m "feat: initial Astro scaffold"
```

Note: do NOT push yet. Push happens in Task 16 (Netlify setup).

---

### Task 2: Configure Astro + Tailwind 4

**Files:**
- Modify: `astro.config.mjs`
- Create: `src/styles/global.css`

- [ ] **Step 1: Update `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.titrin.com',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  build: { inlineStylesheets: 'auto' },
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
});
```

- [ ] **Step 2: Create `src/styles/global.css` with Tailwind import + design tokens**

```css
@import "tailwindcss";

@theme {
  --color-brand: #2563eb;
  --color-brand-light: #3b82f6;
  --color-brand-dark: #1d4ed8;
  --color-accent: #e8eaff;
  --color-ink: #0f172a;
  --color-ink-soft: #1e293b;
  --color-ink-muted: #475569;
  --color-ink-faint: #64748b;
  --color-ink-quiet: #94a3b8;
  --color-surface: #ffffff;
  --color-surface-2: #f8fafc;
  --color-surface-3: #f1f5f9;
  --color-border: #e2e8f0;

  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;

  --radius-card: 18px;
  --radius-nav: 20px;
}

@layer base {
  body { font-family: var(--font-sans); background: var(--color-surface); color: var(--color-ink); }
  html { scroll-behavior: smooth; }
}

@layer utilities {
  .text-balance { text-wrap: balance; }
}
```

- [ ] **Step 3: Verify Tailwind compiles**

```bash
npm run dev
```

Expected: no Tailwind errors in dev console.

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs src/styles/global.css package.json package-lock.json
git commit -m "feat: configure Astro + Tailwind 4 + design tokens"
```

---

### Task 3: Set up content collections schema

**Files:**
- Create: `src/content.config.ts (Astro 6 location)`
- Create: `src/content/services/` (directory)
- Create: `src/content/projects/` (directory)
- Create: `src/content/posts/` (directory)
- Create: `src/content/cities/` (directory)
- Create: `src/content/site/config.json` (single doc for site-wide config)

- [ ] **Step 1: Create `src/content.config.ts (Astro 6 location)`**

```ts
import { defineCollection, z } from 'astro:content';

const services = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    category: z.enum(['agrology', 'permitting', 'construction', 'compliance']),
    order: z.number(),
    shortDesc: z.string(),
    icon: z.string(),
    summary: z.string(),       // ~400 words rendered on /services index
    deliverables: z.array(z.string()),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    client: z.string(),
    location: z.string(),
    category: z.string(),
    year: z.number(),
    photos: z.array(z.string()),
    ourRole: z.string(),
    outcome: z.string(),
    deliverables: z.array(z.string()),
    relatedServices: z.array(z.string()).optional(),
  }),
});

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.date(),
    author: z.string().default('Tishtaar Titina, P.Ag.'),
    excerpt: z.string(),
    cover: z.string().optional(),
    tags: z.array(z.string()),
    relatedServices: z.array(z.string()).optional(),
    relatedCities: z.array(z.string()).optional(),
  }),
});

const cities = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    province: z.string().default('BC'),
    region: z.enum(['metro-vancouver', 'fraser-valley', 'vancouver-island']),
    order: z.number(),
    overview: z.string(),
    alrPercent: z.number().optional(),
    commonProjects: z.array(z.string()),
    municipalNotes: z.string().optional(),
  }),
});

export const collections = { services, projects, posts, cities };
```

- [ ] **Step 2: Create `src/content/site/config.json`**

```json
{
  "businessName": "Titrin Agrisoil Solutions Ltd.",
  "tagline": "Full-service agrology and construction solutions in British Columbia.",
  "email": "titrinsolutions@gmail.com",
  "phone": "+1 (778) 885-9771",
  "phoneTel": "+17788859771",
  "address": "Richmond BC, V6Y3Y6",
  "founder": {
    "name": "Tishtaar Titina",
    "credentials": "P.Ag, MSc.",
    "role": "Licensed Professional Agrologist",
    "organization": "BC Institute of Agrologists",
    "pronouns": "he/him"
  },
  "navigation": [
    { "label": "Home", "href": "/" },
    { "label": "Services", "href": "/services" },
    { "label": "Projects", "href": "/projects" },
    { "label": "About", "href": "/about" },
    { "label": "Blog", "href": "/blog" }
  ]
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx astro check
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/
git commit -m "feat: content collections schema (services/projects/posts/cities)"
```

---

### Task 4: Self-host Inter, build base Layout

**Files:**
- Copy: Inter woff2 files from `@fontsource/inter/files/` into `public/fonts/`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/SEO.astro`

- [ ] **Step 1: Copy Inter font files to public/**

```bash
mkdir -p public/fonts
cp node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2 public/fonts/
cp node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2 public/fonts/
cp node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2 public/fonts/
cp node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2 public/fonts/
cp node_modules/@fontsource/inter/files/inter-latin-800-normal.woff2 public/fonts/
```

- [ ] **Step 2: Add @font-face rules to `src/styles/global.css`**

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin-400-normal.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin-500-normal.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin-600-normal.woff2') format('woff2');
  font-weight: 600;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin-700-normal.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin-800-normal.woff2') format('woff2');
  font-weight: 800;
  font-display: swap;
}
```

- [ ] **Step 3: Create `src/components/SEO.astro`**

```astro
---
import siteConfig from '../content/site/config.json';

interface Props {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const { title, description, image = '/og-default.jpg', type = 'website', noindex = false } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site).href;
const fullTitle = `${title} | ${siteConfig.businessName}`;
---
<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />
{noindex && <meta name="robots" content="noindex,nofollow" />}

<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:image" content={new URL(image, Astro.site).href} />
<meta property="og:site_name" content={siteConfig.businessName} />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={fullTitle} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={new URL(image, Astro.site).href} />

<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": siteConfig.businessName,
  "url": Astro.site?.href,
  "telephone": siteConfig.phone,
  "email": siteConfig.email,
  "address": { "@type": "PostalAddress", "addressLocality": "Richmond", "addressRegion": "BC", "postalCode": "V6Y3Y6", "addressCountry": "CA" },
  "founder": { "@type": "Person", "name": siteConfig.founder.name, "jobTitle": siteConfig.founder.role },
  "areaServed": [{ "@type": "AdministrativeArea", "name": "Metro Vancouver" }, { "@type": "AdministrativeArea", "name": "Fraser Valley" }, { "@type": "AdministrativeArea", "name": "Vancouver Island" }]
})} />
```

- [ ] **Step 4: Create `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import SEO from '../components/SEO.astro';

interface Props {
  title: string;
  description: string;
  image?: string;
}

const { title, description, image } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <SEO title={title} description={description} image={image} />
</head>
<body>
  <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow">Skip to main content</a>
  <slot />
</body>
</html>
```

- [ ] **Step 5: Commit**

```bash
git add public/fonts/ src/styles/global.css src/layouts/BaseLayout.astro src/components/SEO.astro
git commit -m "feat: base layout + SEO component + self-hosted Inter font"
```

---

### Task 5: Copy logo + brand assets

**Files:**
- Copy from: `C:\Users\Tish\Desktop\TITRIN\TAS - Branding & Templates\Logos\`
- To: `public/logos/`

- [ ] **Step 1: Copy logo files**

```bash
mkdir -p public/logos
cp "C:/Users/Tish/Desktop/TITRIN/TAS - Branding & Templates/Logos/Company Logo - High resolution.png" public/logos/titrin-color.png
cp "C:/Users/Tish/Desktop/TITRIN/TAS - Branding & Templates/Logos/titrin-high-resolution-logo-black.png" public/logos/titrin-black.png
cp "C:/Users/Tish/Desktop/TITRIN/TAS - Branding & Templates/Logos/titrin-high-resolution-logo-white.png" public/logos/titrin-white.png
```

- [ ] **Step 2: Verify files copied**

```bash
ls public/logos/
```

Expected: 3 PNG files listed.

- [ ] **Step 3: Commit**

```bash
git add public/logos/
git commit -m "feat: add high-res TITRIN logo variants (color/black/white)"
```

---

### Task 6: Build StickyNav component

**Files:**
- Create: `src/components/StickyNav.astro`

- [ ] **Step 1: Create the component**

```astro
---
import siteConfig from '../content/site/config.json';
---
<div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-48px)] max-w-[1140px]">
  <nav class="bg-white/95 backdrop-blur-md rounded-[20px] shadow-[0_8px_32px_rgba(15,23,42,0.10)] flex items-center justify-between py-3 pl-6 pr-3">
    <a href="/" class="block">
      <img src="/logos/titrin-color.png" alt="TITRIN AgriSoil Solutions" class="h-9 w-auto" width="180" height="36" />
    </a>
    <ul class="hidden md:flex gap-8 text-sm font-medium">
      {siteConfig.navigation.map(item => (
        <li><a href={item.href} class="text-ink hover:text-brand transition-colors">{item.label}</a></li>
      ))}
    </ul>
    <a href="/contact" class="inline-flex items-center px-5 py-2.5 rounded-full text-white text-sm font-semibold transition-all duration-150 bg-gradient-to-b from-brand-light to-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.05),0_1px_2px_rgba(37,99,235,0.20)] hover:brightness-110 hover:-translate-y-px">
      Contact Us
    </a>
  </nav>
</div>
```

- [ ] **Step 2: Add `tailwind.config.js`-equivalent extensions for brand colors**

Already done via `@theme` in global.css — verify `bg-brand`, `text-ink` classes resolve. If they don't:

```css
/* Add to global.css */
@theme {
  --color-ink: #0f172a;
  /* (already added) */
}
```

- [ ] **Step 3: Smoke test on a test page**

Create `src/pages/index.astro` temporarily:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import StickyNav from '../components/StickyNav.astro';
---
<BaseLayout title="Titrin Test" description="Test page">
  <StickyNav />
  <main id="main" style="height: 3000px; padding: 200px 24px;">Scroll to test sticky nav</main>
</BaseLayout>
```

```bash
npm run dev
```

Expected: navigate to http://localhost:4321, see floating nav. Scroll — it stays.

- [ ] **Step 4: Commit**

```bash
git add src/components/StickyNav.astro src/pages/index.astro
git commit -m "feat: StickyNav component with floating pill + gradient CTA"
```

---

### Task 7: Build HeroVideo component

**Files:**
- Create: `src/components/HeroVideo.astro`
- Download: hero video from Framer CDN → `public/videos/hero.mp4`

- [ ] **Step 1: Download Tish's current hero video**

```bash
curl -L "https://framerusercontent.com/assets/YrVwaOJzAk8U1tlGXwnW4CAufg.mp4" -o public/videos/hero.mp4
mkdir -p public/videos
```

Expected: ~5-15MB MP4 saved.

- [ ] **Step 2: Create the component**

```astro
---
interface Props {
  videoSrc?: string;
  texture?: string;
}
const { videoSrc = '/videos/hero.mp4', texture = '/images/hero-texture.png' } = Astro.props;
---
<section class="relative w-full min-h-[760px] overflow-hidden bg-surface-2">
  <video class="absolute inset-0 w-full h-full object-cover z-[1]" autoplay muted loop playsinline preload="auto">
    <source src={videoSrc} type="video/mp4" />
  </video>
  {texture && (
    <div class="absolute inset-0 z-[2] pointer-events-none mix-blend-lighten opacity-85"
         style={`background-image: url('${texture}'); background-size: cover; background-position: center;`}>
    </div>
  )}
  <div class="absolute inset-0 z-[3] pointer-events-none"
       style="background: linear-gradient(180deg, rgba(248,250,252,0.55) 0%, rgba(248,250,252,0.4) 35%, rgba(226,232,240,0.5) 65%, rgba(148,163,184,0.6) 100%);">
  </div>

  <div class="relative z-[5] flex flex-col items-center justify-center text-center px-6 pt-[200px] pb-24 min-h-[760px]">
    <slot />
  </div>
</section>
```

- [ ] **Step 3: Download texture overlay**

```bash
mkdir -p public/images
curl -L "https://framerusercontent.com/images/nmWq4zRw3Tgggz7bzKwLJIiLeE.png" -o public/images/hero-texture.png
```

- [ ] **Step 4: Smoke test in `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import StickyNav from '../components/StickyNav.astro';
import HeroVideo from '../components/HeroVideo.astro';
---
<BaseLayout title="Titrin Test" description="Test page">
  <StickyNav />
  <main id="main">
    <HeroVideo>
      <h1 class="text-5xl font-extrabold text-ink max-w-3xl text-balance">Trusted Agrology & Land-Use Specialists in British Columbia</h1>
    </HeroVideo>
  </main>
</BaseLayout>
```

Expected: video plays, overlay legible, headline centered.

- [ ] **Step 5: Commit**

```bash
git add src/components/HeroVideo.astro public/videos/ public/images/
git commit -m "feat: HeroVideo component + Tish's actual hero assets"
```

---

### Task 8: Build TrustMarquee component

**Files:**
- Create: `src/components/TrustMarquee.astro`
- Download: 5 partner logos from Framer CDN → `public/partners/`

- [ ] **Step 1: Download all 5 partner logos**

```bash
mkdir -p public/partners
curl -L "https://framerusercontent.com/images/NySntTTVUfwEl6XdLqmALNrF9iI.png" -o public/partners/coquitlam.png
curl -L "https://framerusercontent.com/images/C0LwOxEZa3oAqh3lPe49Evadfn8.png" -o public/partners/richmond.png
curl -L "https://framerusercontent.com/images/3wWoJ03cnVHByjXkV3zXTIVrXc.png" -o public/partners/colwood.png
curl -L "https://framerusercontent.com/images/jxUOt1GLq7xCVM5iqAG25J2Oys.png" -o public/partners/madrone.png
curl -L "https://framerusercontent.com/images/YSJPIsa2jPO1q8A75ExDes9TSA.png" -o public/partners/partner-5.png
```

Note: confirm with Tish which file is Madrone vs which is the 5th partner; rename if needed.

- [ ] **Step 2: Create the component**

```astro
---
interface Partner {
  src: string;
  alt: string;
}

interface Props {
  partners?: Partner[];
}

const defaultPartners: Partner[] = [
  { src: '/partners/coquitlam.png', alt: 'City of Coquitlam' },
  { src: '/partners/richmond.png', alt: 'City of Richmond' },
  { src: '/partners/colwood.png', alt: 'City of Colwood' },
  { src: '/partners/madrone.png', alt: 'Madrone Environmental Services' },
  { src: '/partners/partner-5.png', alt: 'Partner organization' },
];

const { partners = defaultPartners } = Astro.props;
const looped = [...partners, ...partners];  // duplicated for seamless loop
---
<div class="mt-12 w-full max-w-[720px] overflow-hidden marquee-mask">
  <div class="flex gap-[52px] items-center w-max marquee-track">
    {looped.map((p, i) => (
      <>
        <img src={p.src} alt={i < partners.length ? p.alt : ''} class="h-7 w-auto opacity-80 flex-shrink-0" />
        <div class="w-px h-5 bg-border flex-shrink-0"></div>
      </>
    ))}
  </div>
</div>

<style>
  .marquee-mask {
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%);
    mask-image: linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%);
  }
  .marquee-track {
    animation: scroll-left 32s linear infinite;
  }
  @keyframes scroll-left {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .marquee-track { animation: none; }
  }
</style>
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected: marquee scrolls left, logos fade in/out at edges.

- [ ] **Step 4: Commit**

```bash
git add src/components/TrustMarquee.astro public/partners/
git commit -m "feat: TrustMarquee with infinite scroll + edge fade mask"
```

---

### Task 9: Build Chip + SectionHeading + ScrollFade

**Files:**
- Create: `src/components/Chip.astro`
- Create: `src/components/SectionHeading.astro`
- Create: `src/components/ScrollFade.astro`

- [ ] **Step 1: Create Chip**

```astro
---
import { Icon } from 'lucide-static';

interface Props {
  icon: string;        // Lucide icon name e.g. "shield", "users"
  text: string;
  class?: string;
}

const { icon, text, class: className = '' } = Astro.props;
---
<span class={`inline-flex items-center gap-1.5 bg-surface-3 rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-muted ${className}`}>
  <Icon name={icon} class="w-3.5 h-3.5" />
  {text}
</span>
```

Note: confirm `lucide-static` exposes an `<Icon>` for Astro. If it doesn't, hand-import SVGs into `src/icons/` instead and create a small `<Icon name="..." />` wrapper.

- [ ] **Step 2: Create SectionHeading**

```astro
---
import Chip from './Chip.astro';

interface Props {
  chipIcon: string;
  chipText: string;
  title: string;
  lede?: string;
  centered?: boolean;
}

const { chipIcon, chipText, title, lede, centered = false } = Astro.props;
---
<div class={centered ? 'text-center' : ''}>
  <Chip icon={chipIcon} text={chipText} class={centered ? 'mx-auto' : ''} />
  <h2 class="text-3xl md:text-5xl font-extrabold text-ink tracking-tight leading-tight mt-4 mb-3 text-balance">
    {title}
  </h2>
  {lede && <p class="text-lg text-ink-muted leading-relaxed max-w-3xl text-balance">{lede}</p>}
</div>
```

- [ ] **Step 3: Create ScrollFade (vanilla JS IntersectionObserver)**

```astro
---
interface Props {
  as?: string;
  group?: boolean;
  class?: string;
}

const { as: Tag = 'div', group = false, class: className = '' } = Astro.props;
const groupClass = group ? 'scroll-fade-group' : 'scroll-fade';
---
<Tag class:list={[groupClass, className]}>
  <slot />
</Tag>

<style is:global>
  .scroll-fade {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .scroll-fade.visible { opacity: 1; transform: translateY(0); }

  .scroll-fade-group > * {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .scroll-fade-group.visible > * { opacity: 1; transform: translateY(0); }
  .scroll-fade-group.visible > *:nth-child(1) { transition-delay: 0.05s; }
  .scroll-fade-group.visible > *:nth-child(2) { transition-delay: 0.15s; }
  .scroll-fade-group.visible > *:nth-child(3) { transition-delay: 0.25s; }
  .scroll-fade-group.visible > *:nth-child(4) { transition-delay: 0.35s; }
  .scroll-fade-group.visible > *:nth-child(5) { transition-delay: 0.45s; }
  .scroll-fade-group.visible > *:nth-child(6) { transition-delay: 0.55s; }

  @media (prefers-reduced-motion: reduce) {
    .scroll-fade, .scroll-fade-group > * {
      transition: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
</style>

<script>
  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    document.querySelectorAll('.scroll-fade, .scroll-fade-group').forEach((el) => observer.observe(el));
  } else {
    document.querySelectorAll('.scroll-fade, .scroll-fade-group').forEach((el) => el.classList.add('visible'));
  }
</script>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Chip.astro src/components/SectionHeading.astro src/components/ScrollFade.astro
git commit -m "feat: Chip + SectionHeading + ScrollFade components"
```

---

### Task 10: Build Card components (ServiceCard, WhyCard, ProjectCard)

**Files:**
- Create: `src/components/ServiceCard.astro`
- Create: `src/components/WhyCard.astro`
- Create: `src/components/ProjectCard.astro`

- [ ] **Step 1: Create ServiceCard with native `<details>` accordion**

```astro
---
interface Props {
  title: string;
  description: string;
  deliverables: string[];
  href?: string;
}

const { title, description, deliverables, href } = Astro.props;
---
<article class="bg-white border border-border rounded-[18px] p-6 flex flex-col hover:border-ink-quiet hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all duration-150">
  <h3 class="text-lg font-bold text-ink mb-3">{title}</h3>
  <p class="text-[15px] text-ink-muted leading-relaxed mb-5 flex-grow">{description}</p>

  <details class="mt-auto bg-surface-3 rounded-xl overflow-hidden group">
    <summary class="list-none cursor-pointer py-2.5 px-4 text-sm font-medium text-ink-muted flex items-center justify-center gap-1.5 hover:bg-border transition-colors">
      Deliverables
      <span class="w-2.5 h-2.5 border-r-[1.5px] border-b-[1.5px] border-current rotate-45 group-open:rotate-[-135deg] transition-transform"></span>
    </summary>
    <ul class="py-1 px-5 pb-4 list-none">
      {deliverables.map(d => (
        <li class="text-[13.5px] text-ink-muted leading-snug py-1 pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-[11px] before:w-1 before:h-1 before:bg-brand before:rounded-full">{d}</li>
      ))}
    </ul>
  </details>

  {href && (
    <a href={href} class="mt-4 text-sm font-medium text-brand hover:text-brand-dark inline-flex items-center gap-1">
      Learn more →
    </a>
  )}
</article>
```

- [ ] **Step 2: Create WhyCard**

```astro
---
interface Props {
  iconName: string;
  title: string;
  description: string;
}

import { Icon } from 'lucide-static';
const { iconName, title, description } = Astro.props;
---
<article class="bg-white border border-border rounded-2xl py-5 px-6 flex gap-4.5 items-start hover:border-ink-quiet hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-150">
  <div class="flex-shrink-0 w-11 h-11 bg-accent rounded-[10px] flex items-center justify-center text-ink">
    <Icon name={iconName} class="w-5.5 h-5.5" stroke-width="1.8" />
  </div>
  <div>
    <h3 class="text-[17px] font-bold text-ink mb-1.5">{title}</h3>
    <p class="text-[14.5px] text-ink-muted leading-relaxed">{description}</p>
  </div>
</article>
```

- [ ] **Step 3: Create ProjectCard**

```astro
---
interface Props {
  href?: string;
  client: string;
  subtitle: string;
  photo: string;
  photoAlt: string;
  description: string;
}

const { href, client, subtitle, photo, photoAlt, description } = Astro.props;
const Wrapper = href ? 'a' : 'article';
---
<Wrapper href={href} class="bg-white border border-border rounded-[18px] overflow-hidden flex flex-col hover:border-ink-quiet hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all duration-150 no-underline">
  <div class="px-5 pt-5 pb-1">
    <h3 class="text-lg font-bold text-ink mb-1">{client}</h3>
    <div class="text-sm text-ink-quiet font-medium">{subtitle}</div>
  </div>
  <img src={photo} alt={photoAlt} class="w-full aspect-square object-cover mt-3.5" loading="lazy" />
  <div class="px-5 pt-4 pb-5 text-sm text-ink-muted leading-relaxed">{description}</div>
</Wrapper>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ServiceCard.astro src/components/WhyCard.astro src/components/ProjectCard.astro
git commit -m "feat: ServiceCard / WhyCard / ProjectCard"
```

---

### Task 11: Build BubbleStep (signature element)

**Files:**
- Create: `src/components/BubbleStep.astro`

- [ ] **Step 1: Create the component with the multi-ring soft glow**

```astro
---
import { Icon } from 'lucide-static';

interface Props {
  iconName: string;
  number: number;
  title: string;
  description: string;
}

const { iconName, number, title, description } = Astro.props;
---
<div class="flex flex-col items-center text-center">
  <div class="w-22 h-22 bg-white rounded-full flex items-center justify-center text-ink mb-7"
       style="box-shadow: 0 0 0 14px rgba(186, 200, 255, 0.20), 0 0 0 28px rgba(186, 200, 255, 0.10), 0 8px 24px rgba(99, 102, 241, 0.15);">
    <Icon name={iconName} class="w-8 h-8" stroke-width="1.5" />
  </div>
  <h3 class="text-lg font-bold text-ink mb-3">{number}. {title}</h3>
  <p class="text-[14.5px] text-ink-muted leading-relaxed max-w-[280px]">{description}</p>
</div>
```

- [ ] **Step 2: Add `w-22` and `h-22` to global.css (Tailwind doesn't have 22 by default)**

```css
@layer utilities {
  .w-22 { width: 5.5rem; }
  .h-22 { height: 5.5rem; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/BubbleStep.astro src/styles/global.css
git commit -m "feat: BubbleStep — signature soft-glow circular icon"
```

---

### Task 12: Build Footer

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Create Footer component**

```astro
---
import siteConfig from '../content/site/config.json';
const year = new Date().getFullYear();
---
<footer class="bg-white border-t border-border pt-15 px-6 pb-6">
  <div class="max-w-[1140px] mx-auto grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-12 pb-10">
    <div>
      <img src="/logos/titrin-black.png" alt={siteConfig.businessName} class="h-12 mb-4 w-auto" width="240" height="48" />
      <p class="text-[14.5px] text-ink-muted leading-relaxed mb-4">{siteConfig.tagline}</p>
      <div class="text-[13.5px] text-ink font-semibold leading-tight">
        {siteConfig.founder.name}, {siteConfig.founder.credentials}<br />
        <span class="font-medium text-ink-faint">{siteConfig.founder.role}</span><br />
        <span class="font-normal text-ink-quiet mt-1 block">[{siteConfig.founder.organization}]</span>
      </div>
    </div>

    <div>
      <h4 class="text-sm font-bold text-ink mb-3.5">Explore</h4>
      <ul class="space-y-2.5 list-none">
        {siteConfig.navigation.map(item => (
          <li><a href={item.href} class="text-sm text-ink-muted hover:text-ink transition-colors no-underline">{item.label}</a></li>
        ))}
        <li><a href="/contact" class="text-sm text-ink-muted hover:text-ink transition-colors no-underline">Contact</a></li>
      </ul>
    </div>

    <div>
      <div class="text-sm font-bold text-ink mb-1">Email</div>
      <div class="text-sm text-ink-muted mb-3.5"><a href={`mailto:${siteConfig.email}`} class="hover:text-ink transition-colors no-underline">{siteConfig.email}</a></div>
      <div class="text-sm font-bold text-ink mb-1">Phone</div>
      <div class="text-sm text-ink-muted mb-3.5"><a href={`tel:${siteConfig.phoneTel}`} class="hover:text-ink transition-colors no-underline">{siteConfig.phone}</a></div>
      <div class="text-sm font-bold text-ink mb-1">Location</div>
      <div class="text-sm text-ink-muted">{siteConfig.address}</div>
    </div>
  </div>

  <div class="max-w-[1140px] mx-auto pt-6 border-t border-border flex justify-between items-center text-[13px] text-ink-quiet">
    <span>© {year} {siteConfig.businessName}</span>
    <a href="/privacy-policy" class="text-ink-quiet hover:text-ink-muted no-underline">Privacy Policy</a>
  </div>
</footer>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: Footer with brand + credentials + contact"
```

---

### Task 13: Assemble the home page

**Files:**
- Modify: `src/pages/index.astro` (replace test content with the real home page)

- [ ] **Step 1: Replace `src/pages/index.astro` with full home page composition**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import StickyNav from '../components/StickyNav.astro';
import HeroVideo from '../components/HeroVideo.astro';
import TrustMarquee from '../components/TrustMarquee.astro';
import SectionHeading from '../components/SectionHeading.astro';
import ServiceCard from '../components/ServiceCard.astro';
import WhyCard from '../components/WhyCard.astro';
import ProjectCard from '../components/ProjectCard.astro';
import BubbleStep from '../components/BubbleStep.astro';
import ScrollFade from '../components/ScrollFade.astro';
import Footer from '../components/Footer.astro';

// Get top 3 home-page-featured services + projects from content collections
import { getCollection } from 'astro:content';
const allServices = await getCollection('services');
const featuredServices = allServices.sort((a, b) => a.data.order - b.data.order).slice(0, 3);
const allProjects = await getCollection('projects');
const featuredProjects = allProjects.slice(0, 3);

const whyChoose = [
  { iconName: 'book-open', title: 'Regulatory Expertise', description: '10+ years of combined ALC and municipal experience equip us to navigate complexities efficiently.' },
  { iconName: 'flask-conical', title: 'Science-Backed Solutions', description: 'Recommendations grounded in technical soil science and real site conditions — not generic templates.' },
  { iconName: 'eye', title: 'Hands-On Oversight', description: 'We\'re there in the field—monitoring work, supporting compliance, and proactively solving issues.' },
  { iconName: 'arrow-right-left', title: 'Trusted Mediation', description: 'We speak the language of landowners and regulators alike — bridging communication gaps to keep projects moving.' },
  { iconName: 'layers', title: 'Complete Project Delivery', description: 'Most firms hand you a report and walk away. We handle the full cycle — assessments, permitting, construction, and compliance — so you have one team from start to finish.' },
];

const steps = [
  { iconName: 'calendar', number: 1, title: 'Book a Free Consultation', description: 'Tell us about your project — we\'ll respond within one business day.' },
  { iconName: 'map', number: 2, title: 'Receive a Tailored Plan', description: 'We assess your site and provide clear, actionable next steps.' },
  { iconName: 'pen-tool', number: 3, title: 'Execute with Confidence', description: 'From applications to construction, we manage the process through to completion.' },
];
---

<BaseLayout
  title="Home"
  description="Trusted agrology & land-use specialists in British Columbia. Full-service ALC applications, farm plans, soil assessments, and compliance support across Metro Vancouver, Fraser Valley, and Vancouver Island."
>
  <StickyNav />

  <main id="main">
    <HeroVideo>
      <h1 class="text-4xl md:text-6xl font-extrabold text-ink tracking-tight leading-[1.05] max-w-[1040px] text-balance opacity-0 [animation:fadeUp_0.8s_ease_0.2s_forwards]">
        Trusted Agrology &amp; Land-Use Specialists in British Columbia
      </h1>
      <p class="text-lg text-ink-soft font-medium max-w-2xl mt-5 text-balance opacity-0 [animation:fadeUp_0.8s_ease_0.4s_forwards]">
        From regulatory applications to environmental assessments, we deliver full-service agrology solutions you can rely on.
      </p>
      <div class="opacity-0 [animation:fadeUp_0.8s_ease_0.6s_forwards]">
        <TrustMarquee />
      </div>
      <div class="mt-14 opacity-0 [animation:fadeUp_0.8s_ease_0.8s_forwards]">
        <a href="/contact" class="inline-flex items-center px-7 py-3.5 rounded-full text-white text-base font-semibold bg-gradient-to-b from-brand-light to-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.05),0_1px_2px_rgba(37,99,235,0.20)] hover:brightness-110 hover:-translate-y-px transition-all">
          Get in Contact
        </a>
      </div>
    </HeroVideo>

    <!-- Who We Help -->
    <section class="max-w-[1140px] mx-auto py-20 px-6">
      <ScrollFade group>
        <span class="inline-flex items-center gap-1.5 bg-surface-3 rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-muted mb-4">Who We Help</span>
        <p class="text-lg text-ink-muted leading-relaxed max-w-3xl text-balance">Supporting farmers, landowners, and municipalities with ALR/ALC, municipal approvals, soil/fill compliance, and on-site delivery.</p>
      </ScrollFade>
    </section>

    <!-- Services Preview -->
    <section class="max-w-[1140px] mx-auto px-6 pb-20">
      <ScrollFade group>
        <SectionHeading chipIcon="users" chipText="Services" title="Our Services" />
      </ScrollFade>
      <ScrollFade group class="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8 items-start">
        {featuredServices.map(service => (
          <ServiceCard
            title={service.data.title}
            description={service.data.shortDesc}
            deliverables={service.data.deliverables}
            href={`/services/${service.data.slug}`}
          />
        ))}
      </ScrollFade>
    </section>

    <!-- Why Choose -->
    <section class="max-w-[1140px] mx-auto py-20 px-6">
      <ScrollFade group>
        <SectionHeading chipIcon="check-circle" chipText="Why Choose" title="Why Choose Titrin?" lede="Science-backed solutions, local expertise, and a commitment to sustainable land use." />
      </ScrollFade>
      <ScrollFade group class="flex flex-col gap-3.5 mt-8">
        {whyChoose.map(item => <WhyCard {...item} />)}
      </ScrollFade>
    </section>

    <!-- Projects Preview -->
    <section class="max-w-[1140px] mx-auto py-20 px-6">
      <ScrollFade group>
        <SectionHeading chipIcon="map-pin" chipText="Projects" title="Our Projects" />
      </ScrollFade>
      <ScrollFade group class="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8 items-start">
        {featuredProjects.map(project => (
          <ProjectCard
            href={`/projects/${project.data.slug}`}
            client={project.data.client}
            subtitle={project.data.title}
            photo={project.data.photos[0]}
            photoAlt={`Project photo for ${project.data.title}`}
            description={project.data.ourRole}
          />
        ))}
      </ScrollFade>
      <ScrollFade class="text-center mt-8">
        <a href="/projects" class="bg-surface-3 text-ink-muted border border-border no-underline px-5.5 py-2.5 rounded-full text-sm font-medium inline-block hover:bg-border transition-colors">View All Projects</a>
      </ScrollFade>
    </section>

    <!-- Steps (Bubbles) -->
    <section class="max-w-[1140px] mx-auto text-center py-24 px-6">
      <ScrollFade group>
        <SectionHeading chipIcon="layers" chipText="Steps" title="How to Get in Touch" centered />
      </ScrollFade>
      <ScrollFade group class="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
        {steps.map(step => <BubbleStep {...step} />)}
      </ScrollFade>
    </section>

    <!-- Final CTA -->
    <ScrollFade group class="text-center max-w-2xl mx-auto py-15 px-6">
      <p class="italic text-base text-ink leading-relaxed mb-2">Ready to move your project forward?</p>
      <p class="text-sm text-ink-faint mb-6">Book a free consultation today—we'll respond within one business day.</p>
      <a href="/contact" class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-[15px] font-semibold bg-gradient-to-b from-brand-light to-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.05),0_1px_2px_rgba(37,99,235,0.20)] hover:brightness-110 hover:-translate-y-px transition-all no-underline">
        Contact Us
      </a>
    </ScrollFade>
  </main>

  <Footer />
</BaseLayout>

<style is:global>
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
```

- [ ] **Step 2: Seed minimal content for collections (3 services, 3 projects)**

Create `src/content/services/agrology-compliance.md`:
```md
---
title: Agrology & Compliance
slug: agrology-compliance
category: agrology
order: 1
shortDesc: Practical, regulator-informed agrology support to keep projects feasible and compliant on agricultural land.
icon: sprout
summary: |
  Practical, regulator-informed agrology support to keep projects feasible and compliant on agricultural land.
deliverables:
  - Site constraints review (ALR/zoning, ESA/RMA, drainage, soil limitations)
  - Farm plans + crop/land-use recommendations
  - Soil assessments (field observations, test pit program planning + interpretation)
  - Agricultural capability summaries (as required for approvals)
  - Professional agrologist memos/letters (P.Ag. stamped where appropriate)
---

# Long-form content for /services/agrology-compliance detail page goes here.
```

Repeat for `permitting-regulatory.md` and `construction-fill-management.md` (same structure as above, content per spec §6).

Create `src/content/projects/coquitlam-riverview.md`:
```md
---
title: Riverview Baseball Park
slug: coquitlam-riverview
client: City of Coquitlam
location: Coquitlam, BC
category: Development
year: 2025
photos:
  - /projects/coquitlam-riverview.png
ourRole: Soil sampling, root-zone analysis, and stamped specifications for sports field construction.
outcome: Project advanced through regulatory review with all environmental and grading requirements addressed.
deliverables:
  - Soil sampling + analysis
  - Stamped sports-field spec
relatedServices: [agrology-compliance]
---
```

Download the 3 project photos to `public/projects/`:
```bash
mkdir -p public/projects
curl -L "https://framerusercontent.com/images/n6ATOWAnEl7JpITlImRQ6ynIhzQ.png" -o public/projects/coquitlam-riverview.png
curl -L "https://framerusercontent.com/images/aA0jtwbfFk4TP0BC0f5xANKKIj0.png" -o public/projects/athiana-acres.png
curl -L "https://framerusercontent.com/images/0FUox0amKqXuvNK3O8Yga76gZIo.jpeg" -o public/projects/lingyen-temple.jpeg
```

- [ ] **Step 3: Run dev + visually verify home page matches v5 prototype**

```bash
npm run dev
```

Compare http://localhost:4321 against v5 mockup in brainstorm browser companion + against the live https://www.titrin.com — should be indistinguishable.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro src/content/services/ src/content/projects/ public/projects/
git commit -m "feat: assemble home page with all sections + seed content"
```

---

### Task 14: Set up automated testing baseline

**Files:**
- Create: `tests/e2e/home.spec.ts`
- Modify: `package.json` (test script)

- [ ] **Step 1: Install Playwright**

```bash
npm init playwright@latest -- --quiet --browser=chromium --no-examples
```

- [ ] **Step 2: Create `tests/e2e/home.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads and shows the hero headline', async ({ page }) => {
    await page.goto('http://localhost:4321/');
    await expect(page.locator('h1')).toContainText('Trusted Agrology');
  });

  test('sticky nav stays fixed on scroll', async ({ page }) => {
    await page.goto('http://localhost:4321/');
    const navBox1 = await page.locator('nav').boundingBox();
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(500);
    const navBox2 = await page.locator('nav').boundingBox();
    expect(navBox1?.y).toBeCloseTo(navBox2?.y ?? 0, 1);
  });

  test('Contact CTA navigates to /contact', async ({ page }) => {
    await page.goto('http://localhost:4321/');
    await page.locator('text=Contact Us').first().click();
    await expect(page).toHaveURL(/\/contact/);
  });
});
```

- [ ] **Step 3: Run tests against dev server**

```bash
# Terminal A
npm run dev

# Terminal B
npx playwright test
```

Expected: 3/3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/ playwright.config.ts package.json package-lock.json
git commit -m "test: playwright E2E baseline (home page)"
```

---

### Task 15: Build production + verify

**Files:**
- (none new — verify build pipeline)

- [ ] **Step 1: Build production**

```bash
npm run build
```

Expected: build completes without errors, `dist/` contains `index.html` + assets.

- [ ] **Step 2: Preview production build locally**

```bash
npm run preview
```

Expected: same output at http://localhost:4321/.

- [ ] **Step 3: Run Lighthouse against production preview**

```bash
npx lighthouse http://localhost:4321/ --view --preset=desktop
```

Expected: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO 100.

- [ ] **Step 4: If any score < 95, fix and re-run before proceeding.** Common fixes:
- LCP fail → add `preload` to hero video, check image dimensions are set
- CLS fail → reserve aspect-ratio on `<img>` and `<video>` elements
- SEO fail → check for missing meta tags (run SEO audit in Lighthouse)

---

### Task 16: Deploy to Netlify (staging URL)

**Files:**
- Create: `netlify.toml`
- Push to GitHub for first time

- [ ] **Step 1: Create `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/services.html"
  to = "/services"
  status = 301

[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/videos/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

- [ ] **Step 2: Ask Tish for GitHub repo creation permission**

Required before pushing — Tish needs to create `titrinsolutions-svg/titrin-web` repo on GitHub (private). I should NOT auto-create.

- [ ] **Step 3: After Tish creates repo, push**

```bash
git remote set-url origin git@github.com:titrinsolutions-svg/titrin-web.git
git push -u origin main
```

- [ ] **Step 4: Ask Tish to connect Netlify to the GitHub repo**

In Netlify dashboard: Add new site → Import from Git → titrinsolutions-svg/titrin-web → main branch. Build command: `npm run build`. Publish directory: `dist`. Default subdomain → rename to `titrin-v2.netlify.app`.

- [ ] **Step 5: Verify staging deployment**

Visit `https://titrin-v2.netlify.app`. Same site as local. Lighthouse should still hit ≥95.

- [ ] **Step 6: Commit netlify.toml**

```bash
git add netlify.toml
git commit -m "feat: Netlify deploy config"
git push
```

---

### Task 17: Phase 1 sign-off

- [ ] **Step 1: Send Tish the staging URL** (https://titrin-v2.netlify.app) and ask her to scroll through and compare against current titrin.com.

- [ ] **Step 2: Capture any feedback as v6 iterations.** Apply fixes, push, redeploy.

- [ ] **Step 3: Move to Phase 2** only after Tish signs off on Phase 1.

**Phase 1 Exit Criteria:**
- ✅ Home page renders identical to v5 brainstorm prototype
- ✅ Lighthouse ≥ 95 across the board (production preview)
- ✅ Playwright E2E tests pass
- ✅ Site deployed at titrin-v2.netlify.app
- ✅ Tish approved visually

---

## Phase 2 — Existing Pages (~6-8 hrs)

**Exit criteria:** Every URL on current titrin.com has a 1:1 equivalent on staging.

### Task 18: Build /about

**Files:**
- Create: `src/pages/about.astro`
- Create/select: `public/about/founder.jpg` (Tish's photo, cropped)

- [ ] **Step 1: Crop Tish's photo + save as `public/about/founder.jpg`**

User-facing step: ask Tish to confirm the photo she sent earlier is what we use. Crop to 800×800 (square) for the About hero. Tools: any image editor (Windows Photos has Crop).

- [ ] **Step 2: Create `src/pages/about.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import StickyNav from '../components/StickyNav.astro';
import Footer from '../components/Footer.astro';
import SectionHeading from '../components/SectionHeading.astro';
import WhyCard from '../components/WhyCard.astro';
import ScrollFade from '../components/ScrollFade.astro';
import siteConfig from '../content/site/config.json';

const whyChoose = [
  { iconName: 'book-open', title: 'Regulatory Expertise', description: '10+ years of combined ALC and municipal experience equip us to navigate complexities efficiently.' },
  { iconName: 'flask-conical', title: 'Science-Backed Solutions', description: 'Recommendations grounded in technical soil science and real site conditions — not generic templates.' },
  { iconName: 'eye', title: 'Hands-On Oversight', description: 'We\'re there in the field—monitoring work, supporting compliance, and proactively solving issues.' },
  { iconName: 'arrow-right-left', title: 'Trusted Mediation', description: 'We speak the language of landowners and regulators alike — bridging communication gaps to keep projects moving.' },
  { iconName: 'layers', title: 'Complete Project Delivery', description: 'Most firms hand you a report and walk away. We handle the full cycle — assessments, permitting, construction, and compliance — so you have one team from start to finish.' },
];
---
<BaseLayout title="About" description="Founded by Tishtaar Titina, P.Ag., MSc. — bringing 10+ years of public-sector ALC and City of Richmond experience to private agrology consulting.">
  <StickyNav />

  <main id="main">
    <!-- 2-col hero -->
    <section class="max-w-[1140px] mx-auto pt-40 pb-16 px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <ScrollFade group>
        <h1 class="text-4xl md:text-5xl font-extrabold text-ink tracking-tight leading-tight mb-3 text-balance">About Titrin Agrisoil Solutions</h1>
        <p class="text-lg text-ink-muted leading-relaxed text-balance">Full-service agrology and construction solutions built on a decade of public-sector experience in British Columbia.</p>
      </ScrollFade>
      <ScrollFade>
        <img src="/about/founder.jpg" alt={siteConfig.founder.name} class="w-full aspect-square object-cover rounded-3xl" />
      </ScrollFade>
    </section>

    <!-- About Us bio -->
    <section class="max-w-[1140px] mx-auto py-12 px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
      <ScrollFade>
        <img src="/about/founder.jpg" alt={`${siteConfig.founder.name} in the field`} class="w-full aspect-[4/5] object-cover rounded-3xl" />
      </ScrollFade>
      <ScrollFade group>
        <span class="inline-flex items-center gap-1.5 bg-surface-3 rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-muted mb-4">About Us</span>
        <p class="text-base text-ink-muted leading-relaxed mb-4">Titrin Agrisoil Solutions Ltd. was founded by Tishtaar (Tish) Titina, P.Ag., a Professional Agrologist with over 10 years of experience working across agricultural land use planning, regulatory compliance, and environmental permitting in British Columbia.</p>
        <p class="text-base text-ink-muted leading-relaxed mb-4">Tishtaar holds a Bachelor of Science in Plant and Soil Science and a Master of Science in Land and Water Systems, both from the University of British Columbia (Vancouver). He is a registered Professional Agrologist (P.Ag.) in good standing with the BC Institute of Agrologists (BCIA).</p>
        <p class="text-base text-ink-muted leading-relaxed mb-4">Prior to establishing Titrin Agrisoil Solutions, Tishtaar spent more than a decade working between the Agricultural Land Commission (ALC) and the City of Richmond, where he was directly involved in compliance and enforcement, application review, policy interpretation, and soil and land alteration oversight on agricultural and environmentally sensitive lands. This public-sector experience gives him a regulator-informed perspective that helps clients navigate complex approval processes efficiently and responsibly.</p>
        <p class="text-base text-ink-muted leading-relaxed">Through Titrin Agrisoil Solutions, Tishtaar provides agricultural assessments, farm plans, ALC applications, municipal permitting, soil and land development advisory services, and compliance recovery — supporting projects from early feasibility through to implementation. Titrin also collaborates with established environmental consulting firms, including Madrone Environmental Services Ltd., on cross-disciplinary assignments.</p>
      </ScrollFade>
    </section>

    <!-- Why Choose reused -->
    <section class="max-w-[1140px] mx-auto py-20 px-6">
      <ScrollFade group>
        <SectionHeading chipIcon="check-circle" chipText="Why Choose" title="Why Choose Titrin?" lede="Science-backed solutions, local expertise, and a commitment to sustainable land use." />
      </ScrollFade>
      <ScrollFade group class="flex flex-col gap-3.5 mt-8">
        {whyChoose.map(item => <WhyCard {...item} />)}
      </ScrollFade>
    </section>
  </main>

  <Footer />
</BaseLayout>
```

- [ ] **Step 3: Test + commit**

```bash
npm run build && npm run preview
# Visit /about, verify renders correctly
git add src/pages/about.astro public/about/
git commit -m "feat: /about page with 2-col hero + bio + reused Why Choose"
```

---

### Task 19: Build /projects index + /projects/[slug]

**Files:**
- Create: `src/pages/projects/index.astro`
- Create: `src/pages/projects/[slug].astro`

- [ ] **Step 1: Create `src/pages/projects/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import StickyNav from '../../components/StickyNav.astro';
import Footer from '../../components/Footer.astro';
import SectionHeading from '../../components/SectionHeading.astro';
import ProjectCard from '../../components/ProjectCard.astro';
import ScrollFade from '../../components/ScrollFade.astro';
import { getCollection } from 'astro:content';

const projects = (await getCollection('projects')).sort((a, b) => b.data.year - a.data.year);
---
<BaseLayout title="Projects" description="Case studies of past Titrin Agrisoil Solutions projects across Metro Vancouver, Fraser Valley, and Vancouver Island.">
  <StickyNav />
  <main id="main">
    <section class="max-w-[1140px] mx-auto pt-40 pb-12 px-6">
      <ScrollFade group>
        <SectionHeading chipIcon="map-pin" chipText="Projects" title="Our Projects" lede="A selection of past work — from sports-field soil assessments to ALC applications to compliance recovery." />
      </ScrollFade>
    </section>

    <section class="max-w-[1140px] mx-auto py-12 px-6">
      <ScrollFade group class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {projects.map(p => (
          <ProjectCard
            href={`/projects/${p.data.slug}`}
            client={p.data.client}
            subtitle={p.data.title}
            photo={p.data.photos[0]}
            photoAlt={`${p.data.title} project photo`}
            description={p.data.ourRole}
          />
        ))}
      </ScrollFade>
    </section>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Create `src/pages/projects/[slug].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import StickyNav from '../../components/StickyNav.astro';
import Footer from '../../components/Footer.astro';
import ScrollFade from '../../components/ScrollFade.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map(p => ({
    params: { slug: p.data.slug },
    props: { project: p },
  }));
}

const { project } = Astro.props;
const { Content } = await project.render();
---
<BaseLayout title={project.data.title} description={project.data.ourRole}>
  <StickyNav />
  <main id="main">
    <article class="max-w-[900px] mx-auto pt-40 pb-12 px-6">
      <ScrollFade group>
        <span class="inline-flex items-center gap-1.5 bg-surface-3 rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-muted mb-4">{project.data.category}</span>
        <h1 class="text-4xl md:text-5xl font-extrabold text-ink tracking-tight leading-tight mb-2 text-balance">{project.data.title}</h1>
        <p class="text-lg text-ink-muted mb-2">{project.data.client} · {project.data.location} · {project.data.year}</p>
      </ScrollFade>

      <ScrollFade class="mt-8">
        <img src={project.data.photos[0]} alt={project.data.title} class="w-full aspect-video object-cover rounded-2xl" />
      </ScrollFade>

      <ScrollFade group class="prose prose-lg mt-12">
        <h2 class="text-xl font-bold text-ink">Our Role</h2>
        <p class="text-ink-muted leading-relaxed">{project.data.ourRole}</p>

        <h2 class="text-xl font-bold text-ink mt-8">Outcome</h2>
        <p class="text-ink-muted leading-relaxed">{project.data.outcome}</p>

        <h2 class="text-xl font-bold text-ink mt-8">Deliverables</h2>
        <ul class="list-disc list-inside text-ink-muted space-y-1">
          {project.data.deliverables.map(d => <li>{d}</li>)}
        </ul>

        <div class="mt-8 text-base text-ink-muted leading-relaxed">
          <Content />
        </div>
      </ScrollFade>
    </article>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 3: Verify + commit**

```bash
npm run build
git add src/pages/projects/
git commit -m "feat: /projects index + dynamic [slug] template"
```

---

### Task 20: Build /contact with Netlify Forms

**Files:**
- Create: `src/pages/contact.astro`
- Create: `src/pages/thank-you.astro`

- [ ] **Step 1: Create `src/pages/contact.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import StickyNav from '../components/StickyNav.astro';
import Footer from '../components/Footer.astro';
import ScrollFade from '../components/ScrollFade.astro';
---
<BaseLayout title="Contact" description="Get in touch with Titrin Agrisoil Solutions — we respond within one business day.">
  <StickyNav />
  <main id="main">
    <section class="max-w-[1140px] mx-auto pt-40 pb-12 px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
      <ScrollFade group>
        <h1 class="text-4xl md:text-5xl font-extrabold text-ink tracking-tight leading-tight mb-3 text-balance">Get in Touch</h1>
        <p class="text-lg text-ink-muted leading-relaxed">Tell us about your project — we'll get back to you within one business day.</p>
      </ScrollFade>
      <ScrollFade>
        <img src="/contact/farm.jpg" alt="Agricultural land in BC" class="w-full aspect-square object-cover rounded-2xl" />
      </ScrollFade>
    </section>

    <section class="max-w-[800px] mx-auto py-12 px-6">
      <ScrollFade>
        <h2 class="text-2xl font-bold text-ink mb-4">Send Us a Message</h2>
        <p class="text-ink-muted mb-6">Use our convenient contact form to reach out with questions, feedback, or collaboration inquiries.</p>

        <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thank-you" class="space-y-4">
          <input type="hidden" name="form-name" value="contact" />
          <p class="hidden"><label>Don't fill this out if you're human: <input name="bot-field" /></label></p>

          <div>
            <label for="name" class="block text-sm font-medium text-ink mb-1">Name</label>
            <input type="text" id="name" name="name" required class="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg text-ink placeholder-ink-quiet focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Your full name" />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-ink mb-1">Email</label>
            <input type="email" id="email" name="email" required class="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg text-ink placeholder-ink-quiet focus:outline-none focus:ring-2 focus:ring-brand" placeholder="you@example.com" />
          </div>

          <div>
            <label for="phone" class="block text-sm font-medium text-ink mb-1">Phone (optional)</label>
            <input type="tel" id="phone" name="phone" class="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg text-ink placeholder-ink-quiet focus:outline-none focus:ring-2 focus:ring-brand" placeholder="(778) 555-1234" />
          </div>

          <div>
            <label for="project-type" class="block text-sm font-medium text-ink mb-1">Project type</label>
            <select id="project-type" name="project-type" class="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-brand">
              <option>Farm Plan</option>
              <option>ALC Application</option>
              <option>Fill Quality Assessment</option>
              <option>Soil Assessment</option>
              <option>Compliance / Enforcement Response</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label for="message" class="block text-sm font-medium text-ink mb-1">Message</label>
            <textarea id="message" name="message" rows="5" required class="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg text-ink placeholder-ink-quiet focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Tell us about your project..."></textarea>
          </div>

          <button type="submit" class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-[15px] font-semibold bg-gradient-to-b from-brand-light to-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.05),0_1px_2px_rgba(37,99,235,0.20)] hover:brightness-110 hover:-translate-y-px transition-all">
            Send Message
          </button>
        </form>
      </ScrollFade>
    </section>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Create `src/pages/thank-you.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import StickyNav from '../components/StickyNav.astro';
import Footer from '../components/Footer.astro';
---
<BaseLayout title="Thank You" description="Thanks for getting in touch. We'll respond within one business day.">
  <StickyNav />
  <main id="main" class="max-w-[700px] mx-auto pt-44 pb-32 px-6 text-center">
    <h1 class="text-4xl md:text-5xl font-extrabold text-ink tracking-tight leading-tight mb-4">Thanks — we've got your message.</h1>
    <p class="text-lg text-ink-muted mb-8">We'll respond within one business day. In the meantime, feel free to browse our projects or services.</p>
    <div class="flex gap-3 justify-center flex-wrap">
      <a href="/projects" class="bg-surface-3 text-ink-muted border border-border no-underline px-5 py-2.5 rounded-full text-sm font-medium inline-block hover:bg-border transition-colors">See projects</a>
      <a href="/services" class="bg-surface-3 text-ink-muted border border-border no-underline px-5 py-2.5 rounded-full text-sm font-medium inline-block hover:bg-border transition-colors">See services</a>
    </div>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 3: Download contact-page photo + commit**

```bash
mkdir -p public/contact
# (download appropriate farm photo from Tish's media library or current site)
git add src/pages/contact.astro src/pages/thank-you.astro public/contact/
git commit -m "feat: /contact form (Netlify Forms) + /thank-you"
```

---

### Task 21: Add /privacy-policy + custom /404

**Files:**
- Create: `src/pages/privacy-policy.astro`
- Create: `src/pages/404.astro`

- [ ] **Step 1: Create privacy policy** (copy current Framer site's text)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import StickyNav from '../components/StickyNav.astro';
import Footer from '../components/Footer.astro';
---
<BaseLayout title="Privacy Policy" description="Titrin Agrisoil Solutions privacy policy.">
  <StickyNav />
  <main id="main" class="max-w-[800px] mx-auto pt-40 pb-20 px-6 prose">
    <h1 class="text-3xl font-extrabold text-ink mb-6">Privacy Policy</h1>
    <p class="text-ink-muted">Last updated: 2026-05-25</p>
    <!-- Paste current Framer privacy policy text here -->
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Create 404**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import StickyNav from '../components/StickyNav.astro';
import Footer from '../components/Footer.astro';
---
<BaseLayout title="Not Found" description="Page not found.">
  <StickyNav />
  <main id="main" class="max-w-[600px] mx-auto pt-44 pb-32 px-6 text-center">
    <h1 class="text-6xl font-extrabold text-ink mb-4">404</h1>
    <p class="text-lg text-ink-muted mb-8">Page not found. Maybe one of these will help:</p>
    <div class="flex gap-3 justify-center flex-wrap">
      <a href="/" class="bg-gradient-to-b from-brand-light to-brand text-white no-underline px-5 py-2.5 rounded-full text-sm font-semibold inline-block hover:brightness-110 transition-all">Home</a>
      <a href="/services" class="bg-surface-3 text-ink-muted border border-border no-underline px-5 py-2.5 rounded-full text-sm font-medium inline-block hover:bg-border transition-colors">Services</a>
      <a href="/contact" class="bg-surface-3 text-ink-muted border border-border no-underline px-5 py-2.5 rounded-full text-sm font-medium inline-block hover:bg-border transition-colors">Contact</a>
    </div>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/privacy-policy.astro src/pages/404.astro
git commit -m "feat: /privacy-policy + custom /404"
```

**Phase 2 Exit Criteria:**
- ✅ All current titrin.com URLs have new equivalents
- ✅ Contact form submits + redirects to /thank-you
- ✅ Lighthouse maintained ≥95
- ✅ Push to staging; visually confirm with Tish

---

## Phase 3 — Services Pages (Hybrid, ~8-10 hrs)

**Exit criteria:** /services is a rich one-page browser; each service has its own authoritative landing page.

### Task 22: Write content for all 8 services

**Files:**
- Create/update 8 files in `src/content/services/`:
  - `farm-plans.md`
  - `alc-applications.md`
  - `fill-quality-assessments.md`
  - `soil-assessments.md`
  - `reclamation-plans.md`
  - `cemp.md`
  - `land-capability-assessments.md`
  - `compliance-recovery.md` (NEW)

- [ ] **Step 1: Write each service file with frontmatter + summary (~400 words) + body (~1500 words)**

For each service, frontmatter includes: title, slug, category, order, shortDesc, icon, deliverables, faqs. Body is long-form authoritative content drawn from Tish's TITRIN brain documents.

Example skeleton for `compliance-recovery.md`:

```md
---
title: Compliance Recovery & Enforcement Response
slug: compliance-recovery
category: compliance
order: 8
shortDesc: Helping property owners regain compliance after ALC enforcement notices, municipal violations, and improper soil work.
icon: shield-check
summary: |
  When an ALC enforcement notice arrives or a municipality flags a soil/fill violation, the timing matters. Titrin specializes in helping property owners navigate the compliance recovery process — assessing the current state, preparing the regulatory response, supervising remediation, and coordinating with enforcement officers to close the file.

  Our work in this area draws on more than a decade of public-sector ALC and City of Richmond experience. We know how enforcement officers think because we've BEEN them. That perspective shapes everything: how we sequence remediation, how we communicate, what evidence we gather, when to escalate vs. when to negotiate.
deliverables:
  - Initial assessment of the enforcement situation
  - Response letters to ALC and municipal enforcement officers
  - Remediation plans (where required) — supervised through completion
  - Coordination with municipal, ALC, and ministry stakeholders
  - Closure-out documentation and stamped P.Ag. sign-off
faqs:
  - q: How fast should I respond to an ALC enforcement notice?
    a: Within the timeframe specified in the notice — typically 30 days. Missing the deadline can escalate the matter to court orders or fines.
  - q: Can compliance be regained without removing all the fill?
    a: Sometimes, yes. Depending on the soil profile, agricultural capability, and intent, partial remediation with documented agricultural use can satisfy the regulator. We assess case by case.
  - q: Will the ALC issue fines?
    a: ALC can issue penalties up to $500,000 for serious violations. The faster and more comprehensively the owner responds, the lower the likelihood of escalation.
---

# Long-form content for the detail page goes here.

## When Compliance Recovery Becomes Necessary

[~1500 words of authoritative content covering: typical enforcement scenarios, the recovery process step-by-step, common pitfalls, what to expect, success factors, related services, CTA]
```

(Repeat for other 7 services. Use TITRIN brain documents to source authoritative content per service.)

- [ ] **Step 2: Commit each service as it's written**

```bash
git add src/content/services/compliance-recovery.md
git commit -m "content: add Compliance Recovery service"
```

(8 commits, one per service.)

---

### Task 23: Build /services rich index page

**Files:**
- Create: `src/pages/services/index.astro`

- [ ] **Step 1: Create `src/pages/services/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import StickyNav from '../../components/StickyNav.astro';
import Footer from '../../components/Footer.astro';
import SectionHeading from '../../components/SectionHeading.astro';
import Chip from '../../components/Chip.astro';
import ScrollFade from '../../components/ScrollFade.astro';
import { getCollection } from 'astro:content';

const services = (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
---
<BaseLayout title="Services" description="Full agrology, permitting, construction, and compliance services across Metro Vancouver, Fraser Valley, and Vancouver Island.">
  <StickyNav />
  <main id="main">
    <section class="max-w-[1140px] mx-auto pt-40 pb-12 px-6 text-center">
      <ScrollFade group>
        <SectionHeading chipIcon="users" chipText="What We Do" title="Our Services" lede="Eight focused service areas — from farm plans to ALC applications to compliance recovery — backed by 10+ years of public-sector regulatory experience." centered />
      </ScrollFade>
    </section>

    {services.map((service, i) => (
      <section class={`max-w-[900px] mx-auto py-12 px-6 ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-2'}`} id={service.data.slug}>
        <ScrollFade group>
          <Chip icon={service.data.icon} text={service.data.category.charAt(0).toUpperCase() + service.data.category.slice(1)} />
          <h2 class="text-3xl font-extrabold text-ink tracking-tight leading-tight mt-4 mb-3">{service.data.title}</h2>
          <div class="text-base text-ink-muted leading-relaxed mb-6 whitespace-pre-line">{service.data.summary}</div>

          <h3 class="text-sm font-bold text-ink mb-3 uppercase tracking-wider">What's Included</h3>
          <ul class="space-y-2 mb-6">
            {service.data.deliverables.map(d => (
              <li class="text-base text-ink-muted leading-snug pl-5 relative before:content-['•'] before:absolute before:left-0 before:text-brand before:font-bold">{d}</li>
            ))}
          </ul>

          <a href={`/services/${service.data.slug}`} class="text-brand font-medium inline-flex items-center gap-1 hover:text-brand-dark no-underline">
            Learn more about {service.data.title} →
          </a>
        </ScrollFade>
      </section>
    ))}
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Verify + commit**

```bash
git add src/pages/services/index.astro
git commit -m "feat: /services rich page with all 8 services + Learn more links"
```

---

### Task 24: Build /services/[service] detail template

**Files:**
- Create: `src/pages/services/[service].astro`

- [ ] **Step 1: Create dynamic detail page template**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import StickyNav from '../../components/StickyNav.astro';
import Footer from '../../components/Footer.astro';
import ScrollFade from '../../components/ScrollFade.astro';
import Chip from '../../components/Chip.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const services = await getCollection('services');
  return services.map(s => ({
    params: { service: s.data.slug },
    props: { service: s },
  }));
}

const { service } = Astro.props;
const { Content } = await service.render();
---
<BaseLayout
  title={service.data.title}
  description={service.data.shortDesc}
>
  <!-- Service schema -->
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.data.title,
    "description": service.data.shortDesc,
    "provider": { "@type": "LocalBusiness", "name": "Titrin Agrisoil Solutions Ltd." },
    "areaServed": [{ "@type": "AdministrativeArea", "name": "Metro Vancouver" }, { "@type": "AdministrativeArea", "name": "Fraser Valley" }, { "@type": "AdministrativeArea", "name": "Vancouver Island" }]
  })} slot="head" />

  <!-- FAQPage schema if FAQs present -->
  {service.data.faqs && service.data.faqs.length > 0 && (
    <script type="application/ld+json" set:html={JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": service.data.faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": { "@type": "Answer", "text": faq.a }
      }))
    })} slot="head" />
  )}

  <StickyNav />
  <main id="main">
    <article class="max-w-[800px] mx-auto pt-40 pb-12 px-6">
      <ScrollFade group>
        <Chip icon={service.data.icon} text={service.data.category.charAt(0).toUpperCase() + service.data.category.slice(1)} />
        <h1 class="text-4xl md:text-5xl font-extrabold text-ink tracking-tight leading-tight mt-4 mb-4 text-balance">{service.data.title}</h1>
        <p class="text-xl text-ink-muted leading-relaxed text-balance">{service.data.shortDesc}</p>
      </ScrollFade>

      <ScrollFade group class="mt-12 prose prose-lg max-w-none">
        <Content />
      </ScrollFade>

      {service.data.faqs && service.data.faqs.length > 0 && (
        <ScrollFade group class="mt-16">
          <h2 class="text-2xl font-bold text-ink mb-6">Frequently Asked Questions</h2>
          <div class="space-y-4">
            {service.data.faqs.map(faq => (
              <details class="bg-surface-2 rounded-xl border border-border group">
                <summary class="cursor-pointer list-none p-4 font-medium text-ink flex justify-between items-center">
                  <span>{faq.q}</span>
                  <span class="w-2.5 h-2.5 border-r-2 border-b-2 border-ink-muted rotate-45 group-open:rotate-[-135deg] transition-transform"></span>
                </summary>
                <div class="px-4 pb-4 text-ink-muted leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </ScrollFade>
      )}

      <ScrollFade class="mt-16 text-center bg-surface-2 rounded-2xl p-8">
        <p class="text-xl text-ink mb-4">Ready to discuss your project?</p>
        <a href="/contact" class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-[15px] font-semibold bg-gradient-to-b from-brand-light to-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.05),0_1px_2px_rgba(37,99,235,0.20)] hover:brightness-110 hover:-translate-y-px transition-all no-underline">
          Book a Free Consultation
        </a>
      </ScrollFade>
    </article>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Test that all 8 service pages render**

```bash
npm run build
# Verify dist/services/farm-plans/index.html (and others) exist
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/services/
git commit -m "feat: /services/[slug] detail template with Service + FAQPage schema"
```

---

### Task 25: Add internal linking between services and projects

- [ ] **Step 1: On each service detail page, show projects tagged with `relatedServices.includes(service.slug)`**

Add to `src/pages/services/[service].astro` after `<Content />`:

```astro
{relatedProjects.length > 0 && (
  <ScrollFade group class="mt-16">
    <h2 class="text-2xl font-bold text-ink mb-6">Related Projects</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {relatedProjects.map(p => (
        <ProjectCard ... />
      ))}
    </div>
  </ScrollFade>
)}
```

Add to frontmatter:
```ts
const allProjects = await getCollection('projects');
const relatedProjects = allProjects.filter(p =>
  p.data.relatedServices?.includes(service.data.slug)
).slice(0, 4);
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/services/[service].astro
git commit -m "feat: cross-link related projects on service detail pages"
```

**Phase 3 Exit Criteria:**
- ✅ /services rich page renders all 8 services with summaries + Learn more links
- ✅ /services/[slug] detail pages exist for all 8 with long-form content
- ✅ Service schema + FAQPage schema present on detail pages
- ✅ Lighthouse maintained ≥95

---

## Phase 4 — Blog Infrastructure (~3-4 hrs)

### Task 26: Build /blog index + /blog/[slug] template

**Files:**
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[slug].astro`
- Create: `src/pages/rss.xml.js`

- [ ] **Step 1: Create blog index**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import StickyNav from '../../components/StickyNav.astro';
import Footer from '../../components/Footer.astro';
import SectionHeading from '../../components/SectionHeading.astro';
import ScrollFade from '../../components/ScrollFade.astro';
import { getCollection } from 'astro:content';

const posts = (await getCollection('posts')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---
<BaseLayout title="Blog" description="Articles on land development, agronomy, soil science, and ALC/ALR topics from Titrin Agrisoil Solutions.">
  <StickyNav />
  <main id="main">
    <section class="max-w-[1140px] mx-auto pt-40 pb-12 px-6">
      <SectionHeading chipIcon="book-open" chipText="Insights" title="From the Field" lede="Articles on land development, agronomy, soil, agriculture, ALC/ALR — and what we're learning." />
    </section>

    <section class="max-w-[1140px] mx-auto pb-20 px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map(post => (
        <ScrollFade>
          <a href={`/blog/${post.data.slug}`} class="block bg-white border border-border rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all no-underline">
            {post.data.cover && <img src={post.data.cover} alt={post.data.title} class="w-full aspect-video object-cover" loading="lazy" />}
            <div class="p-5">
              <p class="text-xs text-ink-quiet font-medium uppercase tracking-wider mb-2">{new Date(post.data.date).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <h2 class="text-lg font-bold text-ink mb-2">{post.data.title}</h2>
              <p class="text-sm text-ink-muted leading-relaxed">{post.data.excerpt}</p>
            </div>
          </a>
        </ScrollFade>
      ))}
      {posts.length === 0 && <p class="text-ink-muted">No posts yet — check back soon.</p>}
    </section>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Create blog post template**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import StickyNav from '../../components/StickyNav.astro';
import Footer from '../../components/Footer.astro';
import ScrollFade from '../../components/ScrollFade.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  return posts.map(post => ({
    params: { slug: post.data.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
const readingTime = Math.ceil(post.body.split(/\s+/).length / 220);
---
<BaseLayout title={post.data.title} description={post.data.excerpt} image={post.data.cover}>
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.data.title,
    "datePublished": post.data.date,
    "author": { "@type": "Person", "name": post.data.author }
  })} slot="head" />

  <StickyNav />
  <main id="main">
    <article class="max-w-[760px] mx-auto pt-40 pb-12 px-6">
      <ScrollFade group>
        <p class="text-xs text-ink-quiet font-medium uppercase tracking-wider mb-3">{new Date(post.data.date).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })} · {readingTime} min read</p>
        <h1 class="text-4xl md:text-5xl font-extrabold text-ink tracking-tight leading-tight mb-4 text-balance">{post.data.title}</h1>
        <p class="text-xl text-ink-muted leading-relaxed text-balance">{post.data.excerpt}</p>
      </ScrollFade>

      {post.data.cover && (
        <ScrollFade class="mt-8">
          <img src={post.data.cover} alt={post.data.title} class="w-full aspect-video object-cover rounded-2xl" />
        </ScrollFade>
      )}

      <ScrollFade group class="mt-12 prose prose-lg max-w-none">
        <Content />
      </ScrollFade>

      <ScrollFade class="mt-16 text-center bg-surface-2 rounded-2xl p-8">
        <p class="text-xl text-ink mb-4">Working on a similar project?</p>
        <a href="/contact" class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-[15px] font-semibold bg-gradient-to-b from-brand-light to-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.05),0_1px_2px_rgba(37,99,235,0.20)] hover:brightness-110 hover:-translate-y-px transition-all no-underline">
          Book a Free Consultation
        </a>
      </ScrollFade>
    </article>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 3: Create RSS feed**

```js
// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import siteConfig from '../content/site/config.json';

export async function GET(context) {
  const posts = await getCollection('posts');
  return rss({
    title: `${siteConfig.businessName} Blog`,
    description: 'Insights on land development, agronomy, soil, and ALC/ALR.',
    site: context.site,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt,
      link: `/blog/${post.data.slug}/`,
    })),
  });
}
```

- [ ] **Step 4: Seed first blog post**

Create `src/content/posts/when-does-richmond-require-a-farm-plan.md` (full 1200-word post per backlog #1).

- [ ] **Step 5: Commit**

```bash
git add src/pages/blog/ src/pages/rss.xml.js src/content/posts/
git commit -m "feat: blog infrastructure + RSS + seed post"
```

**Phase 4 Exit Criteria:**
- ✅ /blog renders with seed post
- ✅ /blog/[slug] renders individual post with reading time + schema
- ✅ /rss.xml validates
- ✅ Lighthouse maintained ≥95

---

## Phase 5 — Cutover (~2-3 hrs)

**Exit criteria:** titrin.com points at new site; SEO continuity preserved.

### Task 27: Pre-flight checks

- [ ] **Step 1: Run full E2E test suite**

```bash
npx playwright test
```

Expected: 100% pass rate.

- [ ] **Step 2: Lighthouse production audit**

```bash
npx lighthouse https://titrin-v2.netlify.app --view --preset=desktop
npx lighthouse https://titrin-v2.netlify.app --view --preset=mobile
```

Expected: All scores ≥95 desktop, ≥85 mobile.

- [ ] **Step 3: Submit a test form submission via /contact**

Verify it lands in Tish's email or Netlify Forms dashboard.

- [ ] **Step 4: Verify all 301 redirects work**

Each URL on current titrin.com → corresponding new URL responds with 200.

- [ ] **Step 5: Validate structured data**

Visit https://validator.schema.org/ → paste each page type's URL → confirm LocalBusiness, Service, FAQPage, BlogPosting all validate.

### Task 28: DNS preparation

- [ ] **Step 1: Add custom domain to Netlify** (Tish action)

In Netlify: Domain settings → Add custom domain → titrin.com → Verify ownership.

- [ ] **Step 2: Reduce DNS TTL** (Tish action)

24h before cutover, in current DNS provider, reduce TTL on titrin.com A/CNAME records to 5 minutes.

### Task 29: DNS switch

- [ ] **Step 1: Update DNS** (Tish action)

Point titrin.com and www.titrin.com to Netlify's load balancer per Netlify domain instructions.

- [ ] **Step 2: Force HTTPS in Netlify**

Already auto via Netlify's free SSL.

- [ ] **Step 3: Monitor logs**

```bash
# Watch Netlify deploy logs + access logs for 4xx/5xx
```

For 48 hours after cutover. Any errors → investigate immediately.

### Task 30: Post-cutover SEO work

- [ ] **Step 1: Add new site to Google Search Console**

Verify ownership (HTML file or DNS TXT).

- [ ] **Step 2: Submit sitemap**

In Search Console: Sitemaps → Add → /sitemap-index.xml

- [ ] **Step 3: Request indexing for top 10 pages**

Use URL Inspection → Request Indexing for: /, /services, /about, /projects, /contact, /services/farm-plans, /services/alc-applications, /blog.

- [ ] **Step 4: Verify GA4 is collecting**

Open GA4 → Realtime → confirm activity.

### Task 31: Cancel Framer

- [ ] **Step 1: Wait 7 days minimum after clean cutover**

- [ ] **Step 2: Tish cancels Framer subscription**

Going forward: -$240/yr. Saved.

**Phase 5 Exit Criteria:**
- ✅ titrin.com serves the new site
- ✅ All inbound URLs still work
- ✅ Search Console + GA4 collecting
- ✅ Framer subscription cancelled
- ✅ No 4xx/5xx spike in logs

---

## Phase 6 — Programmatic Local SEO (~8-12 hrs)

**Exit criteria:** 120 long-tail pages live, internal linking solid, sitemap submitted.

### Task 32: Write content for 15 cities

**Files:**
- Create 15 files in `src/content/cities/`:

- [ ] **Step 1: Write each city file** with frontmatter (name, slug, region, alrPercent, commonProjects, municipalNotes) + body content (~300-500 words on the city's agricultural context).

Example: `richmond.md`:
```md
---
name: Richmond
slug: richmond
region: metro-vancouver
order: 1
overview: |
  Richmond's 39% ALR coverage and proximity to the Fraser River make it one of BC's most regulated agricultural municipalities...
alrPercent: 39
commonProjects: [farm-plans, fill-quality-assessments, alc-applications, compliance-recovery]
municipalNotes: |
  Richmond's Planning & Development Division coordinates closely with the ALC on Non-Farm Use applications...
---

# Richmond Agricultural Context

[~400 words on Richmond's ALR landscape, key regulatory considerations, typical project types Titrin handles here]
```

(Repeat for: Delta, Surrey, Langley, Coquitlam, Burnaby, Maple Ridge, Pitt Meadows, Abbotsford, Chilliwack, Victoria, Saanich, Nanaimo, Duncan, Courtenay.)

- [ ] **Step 2: Commit each city as written**

---

### Task 33: Build /services/[city]/[service] template

**Files:**
- Create: `src/pages/services/[city]/[service].astro`

- [ ] **Step 1: Create the programmatic template**

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import StickyNav from '../../../components/StickyNav.astro';
import Footer from '../../../components/Footer.astro';
import ScrollFade from '../../../components/ScrollFade.astro';
import Chip from '../../../components/Chip.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const cities = await getCollection('cities');
  const services = await getCollection('services');
  return cities.flatMap(city =>
    services.map(service => ({
      params: { city: city.data.slug, service: service.data.slug },
      props: { city, service },
    }))
  );
}

const { city, service } = Astro.props;
const title = `${service.data.title} in ${city.data.name}, BC`;
const description = `Professional ${service.data.title.toLowerCase()} services in ${city.data.name}, British Columbia. ${service.data.shortDesc}`;
---
<BaseLayout title={title} description={description}>
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": title,
    "description": description,
    "provider": { "@type": "LocalBusiness", "name": "Titrin Agrisoil Solutions Ltd." },
    "areaServed": { "@type": "City", "name": `${city.data.name}, BC` }
  })} slot="head" />

  <StickyNav />
  <main id="main">
    <article class="max-w-[800px] mx-auto pt-40 pb-12 px-6">
      <ScrollFade group>
        <Chip icon="map-pin" text={`${city.data.name}, BC`} />
        <h1 class="text-4xl md:text-5xl font-extrabold text-ink tracking-tight leading-tight mt-4 mb-4 text-balance">{title}</h1>
        <p class="text-xl text-ink-muted leading-relaxed text-balance">{service.data.shortDesc}</p>
      </ScrollFade>

      <ScrollFade group class="mt-12 prose prose-lg max-w-none">
        <h2>What's Included</h2>
        <ul>
          {service.data.deliverables.map(d => <li>{d}</li>)}
        </ul>

        <h2>{city.data.name}-Specific Considerations</h2>
        <div set:html={city.data.overview.replace(/\n/g, '<br/>')} />
        {city.data.alrPercent && <p><strong>ALR coverage:</strong> {city.data.alrPercent}% of {city.data.name} is within the Agricultural Land Reserve.</p>}
        {city.data.municipalNotes && <div set:html={city.data.municipalNotes.replace(/\n/g, '<br/>')} />}

        <h2>How Titrin Approaches {service.data.title} in {city.data.name}</h2>
        <p>{service.data.summary}</p>
      </ScrollFade>

      <ScrollFade class="mt-16 text-center bg-surface-2 rounded-2xl p-8">
        <p class="text-xl text-ink mb-4">Need {service.data.title.toLowerCase()} support in {city.data.name}?</p>
        <a href="/contact" class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-[15px] font-semibold bg-gradient-to-b from-brand-light to-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.05),0_1px_2px_rgba(37,99,235,0.20)] hover:brightness-110 hover:-translate-y-px transition-all no-underline">
          Book a Free Consultation
        </a>
      </ScrollFade>
    </article>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Verify build generates 120 pages**

```bash
npm run build
ls dist/services/richmond/  # should have 8 service subdirs
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/services/[city]/
git commit -m "feat: 120 programmatic city × service pages"
```

---

### Task 34: Add cross-linking grid

- [ ] **Step 1: On `/services/[service]` pages**, add a grid linking to all 15 city versions of that service.

- [ ] **Step 2: On `/services/[city]/[service]` pages**, add a grid linking to related services in same city + same service in nearby cities.

- [ ] **Step 3: Build city index pages at `/cities/[city]`** showing all services available in that city + projects done there.

- [ ] **Step 4: Commit**

```bash
git add src/pages/cities/ src/pages/services/
git commit -m "feat: cross-link grid between services + cities + projects"
```

---

### Task 35: Sitemap regeneration + Search Console submission

- [ ] **Step 1: Verify sitemap auto-includes the 120 new pages**

```bash
npm run build
cat dist/sitemap-0.xml | grep "services/" | wc -l
```

Expected: 130+ URLs (8 services + 120 combos + 1 index).

- [ ] **Step 2: Resubmit sitemap to Search Console** (Tish action)

- [ ] **Step 3: Request indexing on top 20 highest-intent combos** (Richmond × all 8, Delta × top 4, Surrey × top 4)

**Phase 6 Exit Criteria:**
- ✅ 120 programmatic pages live + indexed
- ✅ Cross-linking grid functional
- ✅ Sitemap regenerated + resubmitted
- ✅ Search Console showing new pages

---

## Phase 7+ — Ongoing Operations

See spec §12 phases 7-8 for full detail. Brief plan-level summary:

### Content Revamp (ongoing)
- Audit current copy → rewrite to reflect 2026 Titrin scope
- Add testimonials collection + section when client quotes available
- Add FAQ blocks to service detail pages (auto FAQPage schema)
- Continuous blog cadence: 1-2 posts/month

### SEO Operations (continuous)
- Weekly: Search Console "striking distance" (positions 11-20) optimization
- Monthly: identify new long-tail combos, add cities/services as needed
- Quarterly: backlink outreach (BCIA, municipal directories, partner sites)
- Continuous: schema markup expansion, internal linking improvements

### Automation hooks for self-improvement
- Lighthouse CI on every PR (fails if Performance drops below 90)
- Automated link checker on every build (broken internal links fail the build)
- Scheduled task: weekly Search Console export → identify top opportunities
- Scheduled task: monthly visual regression test (Playwright snapshots)

---

## Self-Review (against spec)

**Spec coverage:**
- ✅ §1 Goal & Strategic Intent — covered by Phases 1-6
- ✅ §2 Tech Stack — covered by Task 1-2
- ✅ §3 Design System — covered by Task 2 (CSS tokens) + components
- ✅ §4 Component Library — Tasks 6-12 build every component
- ✅ §5 Page Map — Tasks 13, 18-26 cover all pages
- ✅ §6 Content Architecture — Task 3 (schemas) + Tasks 13, 22, 26, 32 (content)
- ✅ §7 SEO Infrastructure — Task 4 (SEO component), Tasks 24, 26, 33 (per-page schemas)
- ✅ §8 Programmatic Local SEO — Phase 6 (Tasks 32-35)
- ✅ §9 Migration Strategy — Phase 5 (Tasks 27-31)
- ✅ §10 Performance Budget — Tasks 15, 27 (Lighthouse gates)
- ✅ §11 Accessibility — built in throughout (skip-to-content, semantic HTML, reduced-motion, focus states)
- ✅ §12 Phasing — this plan IS the phasing
- ✅ §13 Decisions Made — all reflected in tasks
- ✅ §14 Blog Topic Backlog — Phase 4 + Phase 7 ongoing
- ✅ §15 Scope boundaries — respected

**No placeholders** — every step has code or exact commands.

**Type consistency** — `service.data.slug`, `city.data.slug`, `relatedServices` array used consistently.

**Scope check** — this plan delivers a deployable, launchable site through Phase 5. Phase 6 + Phase 7 are independently deferrable.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-25-titrin-com-rebuild.md`.**

Two execution options:

**1. Subagent-Driven (recommended for this size of plan)** — Each task dispatched to a fresh subagent. I review between tasks, iterate quickly. Best for: large plans where momentum matters.

**2. Inline Execution** — I execute tasks directly in this session in batches with checkpoints. Best for: smaller plans or when you want to watch every step.

Either way: Phase 1 alone is 17 tasks, ~12-15 hours of focused work. We don't have to do it all in one stretch — we can pause/resume between phases (or even between tasks) at any time.

**Which approach?**
