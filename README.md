# SideBySide

An enterprise-grade AI product discovery, lab benchmark evaluation, and side-by-side comparison platform built with Next.js 16.4, React 19.2, TypeScript, Zustand, and a Prisma 7 / PostgreSQL data model.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:3000`.

verify TypeScript and production static generation:

```sh
npm run typecheck
npm run build
```

## Key capabilities

- **Multi-Criteria AI Product Advisor (`/`, `POST /api/recommend`)**: Combines natural-language intent extraction (category, budget ceiling, use-case signals, and priorities) with structured refinement controls, role badges (*Best Overall Fit*, *Best Value Alternative*, *Performance Upgrade*, *Compact Pick*), and an instant head-to-head tradeoff synthesis.
- **Full Lab Catalog Explorer (`/#catalog`, `GET /api/products`)**: 27 lab-evaluated demo models across all 14 product verticals with instant search, category filtering, budget ceilings, and multi-dimensional sorting (Overall Lab Score, Value Index, Popularity, Price).
- **Weighted Decision Matrix (`/compare`, `POST /api/compare`)**: Supports 2 to 5 products per category, deep-linkable URL state (`/compare?slugs=...`), one-click shareable URLs, automatic numeric winner highlighting (`★`), and interactive user priority sliders (Value, Performance, Longevity, Ergonomics) that recalculate a personalized winner in real time.
- **Triangulated Product Intelligence (`/products/[slug]`)**: Features normalized 0–100 Lab Scorecards, benchmark subscore bars, editorial *Best For / Skip If* verdicts, grouped technical specifications, separated review tabs (AI Consensus, Lab Bench Notes, Editorial, Verified Buyers), a 6-month price trajectory chart, and a transparent multi-merchant comparison & local price-alert drawer.
- **SEO & Structured Data (`/sitemap.xml`, `/robots.txt`)**: Prerenders 52 static routes with Schema.org `Product`, `AggregateRating`, and `AggregateOffer` JSON-LD.
- **Enterprise PostgreSQL Schema (`prisma/schema.prisma`)**: Models `Category`, `Product`, `LabBenchmark`, `Review`, `PriceOffer`, `PriceSnapshot`, `User`, `WishlistItem`, `PriceAlert`, `AffiliateClick`, and `Comparison`.

## Data provenance

All products, lab telemetry scores, reviews, and merchant offers included in the repository are transparent fictional demo records (`FICTIONAL_DEMO`) designed to demonstrate commercial discovery, comparison, and conversion workflows without unverified external claims.
