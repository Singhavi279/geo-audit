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
  // 7-Category Model (100 pts)
  content_intent: number;       // 28 pts
  trust_eat: number;           // 18 pts
  crawl_architecture: number;  // 16 pts
  structured_data: number;     // 12 pts
  page_experience: number;     // 10 pts
  llm_extractability: number;  // 10 pts
  discover_readiness: number;  // 6 pts
}

export interface Gates {
  fetchable: boolean;
  indexable: boolean;
  canonical_ok: boolean;
  crawl_ok: boolean;
  mobile_friendly: boolean; // New
  spam_flags: boolean;      // New
}

export interface Finding {
  category: string;
  type: string;
  value: unknown;
}

export interface Evidence {
  onPage: OnPageEvidence;
  performance?: PerformanceEvidence;
  performanceError?: string;
  schema: SchemaEvidence;
  citation: CitationEvidence;
  resources?: ResourceEvidence;
  seo?: SEOEvidence;
  browser?: BrowserEvidence;
  // New Modules
  trust?: TrustEvidence;
  content?: ContentEvidence;
  llm?: LLMEvidence;
}

export interface TrustEvidence {
  author: { found: boolean; name: string | null; url: string | null };
  policyLinks: { privacy: boolean; terms: boolean; editorial: boolean };
  contactInfo: { found: boolean; details: string[] };
  citations: { externalLinkCount: number; academicSources: number };
  footnotes: boolean;
}

export interface ContentEvidence {
  primaryIntent: 'informational' | 'transactional' | 'mixed' | 'unknown';
  wordCount: number;
  mediaCount: { images: number; withAlt: number; videos: number };
  freshness: {
    lastUpdated: string | null;
    published: string | null;
    isRecent: boolean; // < 2 years
  };
  details: {
    hasTldr: boolean;
    hasSummary: boolean;
    hasDefinitions: boolean;
  };
}

export interface LLMEvidence {
  llmsTxt: { exists: boolean; path: string | null };
  semanticDensity: {
    h1: number;
    h2: number;
    h3: number;
    p: number;
    listItems: number;
  };
  quotable: {
    shortSentences: number;
    definitions: number;
  };
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
  mobile?: {
    isResponsive: boolean;
    viewportMeta: string | null;
  };
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
  category: 'content' | 'trust' | 'crawl' | 'schema' | 'ux' | 'llm' | 'discover';
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
    altTextMissing: number; // Phase 6
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
  links?: { // Phase 6
    internal: number;
    external: number;
    broken: number;
  };
  headerStructure?: { // Phase 6
    valid: boolean;
    issues: string[];
  };
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


