# GEO Audit MVP

> Audit any URL to increase its chance of being selected as a **source** in **LLM citations** and **Google AI results**, while improving **core SEO**.

## Overview

GEO Audit is a lightweight, no-login web application that audits URLs across 5 key dimensions:

1. **Technical SEO** (25 points) - Indexability, canonicals, meta tags
2. **Performance & CWV** (20 points) - PageSpeed Insights, Core Web Vitals
3. **Structured Data** (15 points) - JSON-LD schema validation
4. **Citation Readiness** (30 points) - Answer-first patterns, quotability, extractability
5. **Provenance** (10 points) - Author attribution, dates, trust signals

**Total Score:** 0-100 points with transparent sub-scores

---

## Features

✅ Single URL audit with optional sitemap analysis  
✅ Deep crawl mode (up to 150 URLs + PSI on top 5)  
✅ Prioritized recommendations with impact/effort scoring  
✅ Evidence-backed insights for AI citations + SEO  
✅ JSON & CSV export  
✅ Vercel-deployable (free tier compatible)

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Parsing:** Cheerio, fast-xml-parser
- **APIs:** Google PageSpeed Insights, CrUX (optional)

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Google Cloud account for API keys

### 1. Clone & Install

```bash
cd /Users/aviction/.gemini/antigravity/scratch/geo-audit
npm install
```

### 2. Get API Keys

#### Google PageSpeed Insights API Key (Required)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **PageSpeed Insights API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "PageSpeed Insights API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key
5. (Optional) Restrict the key:
   - Click on the key name
   - Under "API restrictions", select "Restrict key"
   - Choose "PageSpeed Insights API"
   - Save

#### Google CrUX API Key (Optional)

- You can use the same API key as PSI if you enable the **Chrome UX Report API** in Google Cloud Console
- Follow the same steps as above but enable "Chrome UX Report API"

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your keys:

```
GOOGLE_PAGESPEED_API_KEY=your_psi_api_key_here
GOOGLE_CRUX_API_KEY=your_crux_api_key_here  # Optional, can use same as PSI
USER_AGENT=GEOAuditBot/0.1 (+https://yoursite.com)  # Optional
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Test the Audit

Use these sample URLs to validate the audit:

1. **Well-optimized page:**  
   `https://web.dev/articles/lcp`  
   Expected: High performance, good structure, schema present

2. **Heavy JS SPA:**  
   `https://react.dev`  
   Expected: JS-trapped content flag, SPA markers detected

3. **Schema-rich page:**  
   `https://developers.google.com/search/docs/appearance/structured-data/article`  
   Expected: Article schema detected, high structured data score

4. **Test your own pages:**  
   Try pages from your own site to get actionable recommendations

---

## Deployment to Vercel

### Option A: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option B: Deploy via GitHub

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `GOOGLE_PAGESPEED_API_KEY`
   - `GOOGLE_CRUX_API_KEY` (optional)
   - `USER_AGENT` (optional)
6. Deploy!

### Environment Variables in Vercel

After deployment, add your API keys:

1. Go to your project in Vercel dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add each variable:
   - Name: `GOOGLE_PAGESPEED_API_KEY`
   - Value: your API key
   - Environment: Production, Preview, Development (select all)
4. Click "Save"
5. Redeploy for changes to take effect

---

## API Endpoints

### `GET /api/health`

Health check endpoint.

**Response:**
```json
{
  "ok": true
}
```

### `POST /api/audit`

Run audit on a URL.

**Request Body:**
```json
{
  "url": "https://example.com/page",
  "sitemapUrl": "https://example.com/sitemap.xml",  // optional
  "deep": false  // optional, default: false
}
```

**Response:**
```json
{
  "input": {...},
  "scores": {
    "total": 78,
    "technical_seo": 22,
    "performance": 16,
    "structured_data": 12,
    "citation_readiness": 24,
    "provenance": 8
  },
  "gates": {
    "fetchable": true,
    "indexable": true,
    "canonical_ok": true,
    "crawl_ok": true
  },
  "findings": [...],
  "evidence": {...},
  "recommendations": [...],
  "sitemap": {...},  // if sitemap analyzed
  "raw": {...}
}
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── report/
│   │   ├── page.tsx                # Report wrapper with Suspense
│   │   └── ReportContent.tsx       # Report content component
│   ├── api/
│   │   ├── audit/route.ts          # Audit API endpoint
│   │   └── health/route.ts         # Health check endpoint
│   └── layout.tsx                  # Root layout
├── lib/
│   ├── audit/                      # Audit pipeline modules
│   │   ├── pipeline.ts             # Main orchestrator
│   │   ├── normalize.ts            # URL normalization
│   │   ├── fetch.ts                # HTML fetching
│   │   ├── gates.ts                # Eligibility gates
│   │   ├── robots.ts               # robots.txt parser
│   │   ├── sitemap.ts              # Sitemap parser
│   │   ├── schema.ts               # JSON-LD extraction
│   │   ├── performance.ts          # PageSpeed Insights
│   │   ├── crux.ts                 # CrUX field data
│   │   ├── citation.ts             # Citation readiness
│   │   └── recommendations.ts      # Recommendations engine
│   ├── scoring.ts                  # 5-bucket scoring model
│   ├── types.ts                    # TypeScript interfaces
│   └── utils.ts                    # Shared utilities
├── components/
│   ├── AuditForm.tsx               # URL input form
│   ├── ScoreCard.tsx               # Score display
│   ├── TopActions.tsx              # Top 3 priorities
│   ├── Recommendations.tsx         # Full recommendations list
│   ├── Evidence.tsx                # Evidence accordions
│   └── ExportButtons.tsx           # JSON/CSV export
└── tests/                          # Unit tests (future)
```

---

## How It Works

### Audit Pipeline (10 Steps)

1. **Normalize URL** - Add scheme, strip hash
2. **Fetch HTML** - GET with redirect tracking
3. **Extract Gates** - Robots meta, canonical, title, H1
4. **Check robots.txt** - Crawl allowance + sitemap discovery
5. **Sitemap Analysis** - Sample 25-150 URLs, run lightweight checks
6. **Schema Extraction** - Parse JSON-LD, validate types
7. **PageSpeed Insights** - Mobile performance + CWV
8. **CrUX Field Data** - Real-world P75 metrics
9. **Citation Readiness** - Answer-first, structure, quotability, provenance
10. **Generate Recommendations** - Prioritize by impact/effort

### Performance Optimizations

- Parallel execution: HTML + robots + PSI fetch concurrently
- Conditional skips: If gates fail (not indexable), skip expensive PSI/CrUX calls
- Time-boxing: Sitemap analysis limited to prevent timeouts
- Target: **<20 seconds** per audit

---

## Scoring Model

### Eligibility Gates (Hard Cap)
If `fetchable=false` OR `indexable=false`, total score capped at **20**.

### Bucket Weights

| Bucket | Max Points | What It Measures |
|--------|-----------|------------------|
| Technical SEO | 25 | Indexability, canonical, title, meta description |
| Performance | 20 | PSI score, LCP, CLS |
| Structured Data | 15 | Schema presence, validity, relevant types |
| Citation Readiness | 30 | Answer-first, structure, quotable spans, extractability |
| Provenance | 10 | Author, published date |

**Total:** 100 points

---

## Recommendations Engine

Every audit generates prioritized recommendations:

- **Impact** (0-5): How much this affects citations/SEO
- **Effort** (0-5): How hard to implement
- **Priority** = Impact / Effort

Recommendations sorted by:
1. Gate failures (always first)
2. Priority score (descending)

Each recommendation includes:
- Title, description, evidence
- "Why it matters for AI citations"
- "Why it matters for SEO"

---

## Export Formats

### JSON
Full audit object with all evidence and raw API responses.

### CSV (Recommendations Only)
9 columns:
- Category, Title, Description, Impact, Effort, Priority, Evidence, Why_it_matters_AI, Why_it_matters_SEO, Affected_URL

---

## Future Enhancements (Premium)

🔒 **Coming Soon:**
- Competitive SERP & AI source tracking
- Backlink authority & topical authority analysis
- Google Search Console integration
- Full-site crawling & template detection
- LLM citation simulation
- Weekly monitoring & regression alerts

---

## Troubleshooting

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### API Quota Errors

- PSI API has daily limits (free tier: 25,000 requests/day)
- CrUX may not have data for all URLs (fallback: origin-level)
- Check API key restrictions in Google Cloud Console

### Slow Audits

- Deep mode can take 20-30s for large sitemaps
- PSI API calls are the slowest part (5-10s each)
- Consider reducing sitemap sample size if needed

---

## License

MIT

---

## Support

For issues or questions, please open an issue on GitHub.

**Built for the AI-first web** 🚀
