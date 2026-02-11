# GEO Audit

A next-generation AI Search Optimization (AISO) audit tool designed to evaluate websites for "Citation Readiness" in the age of LLMs (ChatGPT, Gemini, Perplexity).

## Features

- **7-Category Scoring Model**: Evaluates Content, Trust (E-E-A-T), Crawlability, Schema, UX, Extractability (LLM), and Discover Readiness.
- **Deep Evidence Extraction**: Analyzes HTML structure, metadata, and content quality.
- **SEO Deep Dive**: Checks for header hierarchy, link balance, and image accessibility.
- **Technical Loader**: Real-time feedback on audit progress.
- **Actionable Recommendations**: Prioritized fixes to improve LLM visibility and SEO rankings.

## Getting Started

1.  Cloning the repository:
    ```bash
    git clone <repository-url>
    cd geo-audit
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Parser**: Cheerio
- **Browser Automation**: Playwright (optional for deep checks)
