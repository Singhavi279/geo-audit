// Core TypeScript interfaces for GEO Audit

export interface AuditInput {
  url: string;
  sitemapUrl?: string;
  deep?: boolean;
}

export interface AuditResult {
  input: AuditInput;
  scores: Scores;
  gates: Gates;
  findings: Finding[];
  evidence: Evidence;
  recommendations: Recommendation[];
  sitemap?: SitemapSummary;
  raw?: RawData;
}

export interface Scores {
  total: number;
  technical_seo: number;
  performance: number;
  structured_data: number;
  citation_readiness: number;
  provenance: number;
}

export interface Gates {
  fetchable: boolean;
  indexable: boolean;
  canonical_ok: boolean;
  crawl_ok: boolean;
}

export interface Finding {
  category: string;
  type: string;
  value: unknown;
}

export interface Evidence {
  onPage: OnPageEvidence;
  performance?: PerformanceEvidence;
  schema: SchemaEvidence;
  citation: CitationEvidence;
  resources?: ResourceEvidence;
  seo?: SEOEvidence;
  browser?: BrowserEvidence;
}

export interface OnPageEvidence {
  finalUrl: string;
  statusCode: number;
  redirectChain: string[];
  contentType: string;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robotsMeta: string[];
  robotsHeader: string | null;
  h1: string[];
  h2Count: number;
  h3Count: number;
  og: Record<string, string>;
  hasContent: boolean;
  // New advanced checks
  favicon?: string | null;
  viewport?: string | null;
  charset?: string | null;
  deprecatedTags?: string[];
  domSize?: number;
  googleAnalytics?: boolean;
  unsafeLinks?: number;
}

export interface PerformanceEvidence {
  lighthouse?: {
    performance: number;
    seo: number;
    bestPractices: number;
    accessibility: number;
  };
  metrics?: {
    lcp?: number;
    cls?: number;
    tbt?: number;
    fcp?: number;
    ttfb?: number;
    inp?: number;
  };
  opportunities?: Array<{
    title: string;
    savings?: number;
  }>;
  crux?: {
    lcp?: { p75: number };
    cls?: { p75: number };
    inp?: { p75: number };
  };
}

export interface SchemaEvidence {
  types: string[];
  jsonLd: unknown[];
  errors: string[];
  valid: boolean;
}

export interface CitationEvidence {
  answerFirst: boolean;
  structureScore: number;
  quotableSpans: number;
  provenanceScore: number;
  extractabilityScore: number;
  jsTrapped: boolean;
  details: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    listCount: number;
    tableCount: number;
    shortSentences: number;
    bulletPoints: number;
    authorFound: boolean;
    dateFound: boolean;
    textToHtmlRatio: number;
    spaMarkers: string[];
    scriptDensity: number;
  };
}

export interface Recommendation {
  category: 'technical_seo' | 'performance' | 'structured_data' | 'citation_readiness' | 'provenance';
  title: string;
  description: string;
  evidence: string;
  whyItMatters: {
    ai: string;
    seo: string;
  };
  impact: number; // 0-5
  effort: number; // 0-5
  priority: number; // impact/effort
  scoreImpact?: number;
}

export interface SitemapSummary {
  summary: {
    total: number;
    indexable: number;
    redirects: number;
    errors: number;
  };
  topIssues: Array<{
    url: string;
    issue: string;
  }>;
}

export interface RawData {
  psi?: unknown;
  crux?: unknown;
}

// HTML fetch result
export interface FetchResult {
  finalUrl: string;
  statusCode: number;
  redirectChain: string[];
  headers: Record<string, string>;
  html: string;
  contentType: string;
}

// Robots.txt result
export interface RobotsResult {
  allowed: boolean;
  sitemaps: string[];
}

// Sitemap result
export interface SitemapResult {
  urls: string[];
  summary: {
    total: number;
    indexable: number;
    redirects: number;
    errors: number;
  };
  topIssues: Array<{
    url: string;
    issue: string;
  }>;
}

// Resource optimization evidence
export interface ResourceEvidence {
  images?: {
    total: number;
    withAspectIssues: number;
    withoutSrcset: number;
    modernFormats: number;
    legacyFormats: number;
    cached: number;
    uncached: number;
  };
  scripts?: {
    total: number;
    blocking: number;
    minified: number;
    unminified: number;
    cached: number;
    uncached: number;
  };
  styles?: {
    total: number;
    blocking: number;
    cached: number;
    uncached: number;
    hasMediaQueries: boolean;
  };
}

// SEO-specific evidence
export interface SEOEvidence {
  keywords?: {
    cloud: Array<{ word: string; count: number }>;
    mostCommon: Array<{ word: string; count: number }>;
  };
  custom404?: boolean;
  sslErrors?: string[];
}

// Browser-based evidence (optional, requires Playwright)
export interface BrowserEvidence {
  consoleErrors?: string[];
  screenshot?: string; // Base64 encoded
  renderTime?: number; // milliseconds
  jsErrors?: number;
  resources?: {
    actualLoaded: number;
    failed: number;
    totalSize: number; // KB
  };
}


