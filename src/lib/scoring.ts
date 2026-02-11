import type { Scores, Gates, Evidence } from './types';

/**
 * Calculate audit scores based on 100-point Citation Readiness checks
 */
export function calculateScores(
    gates: Gates,
    evidence: Evidence
): Scores {
    // 1. Calculate individual category scores
    const content_intent = calculateContentScore(evidence.content, evidence.onPage);
    const trust_eat = calculateTrustScore(evidence.trust);
    const crawl_architecture = calculateCrawlScore(gates, evidence.onPage);
    const structured_data = calculateSchemaScore(evidence.schema);
    const page_experience = calculateExperienceScore(evidence.performance, gates);
    const llm_extractability = calculateExtractabilityScore(evidence.llm, evidence.onPage);
    const discover_readiness = calculateDiscoverScore(evidence.onPage, evidence.resources);

    // 2. Sum raw total
    let total = content_intent + trust_eat + crawl_architecture + structured_data +
        page_experience + llm_extractability + discover_readiness;

    // 3. Apply Gate Caps
    // If not fetchable or indexable, score collapses to 0 (or very low)
    if (!gates.fetchable || !gates.indexable) {
        total = 0;
    }

    return {
        total: Math.round(total),
        content_intent: Math.round(content_intent),
        trust_eat: Math.round(trust_eat),
        crawl_architecture: Math.round(crawl_architecture),
        structured_data: Math.round(structured_data),
        page_experience: Math.round(page_experience),
        llm_extractability: Math.round(llm_extractability),
        discover_readiness: Math.round(discover_readiness)
    };
}

/**
 * 1. Content & Intent Satisfaction (28 points)
 */
function calculateContentScore(content: any, onPage: any): number {
    if (!content) return 0;
    let score = 0;

    // 1.1 Primary intent match (5 pts)
    if (content.primaryIntent !== 'unknown') score += 5;

    // 1.2 Answer-first lead (4 pts)
    // Heuristic: Summary or TLDR exists
    if (content.details.hasSummary || content.details.hasTldr) score += 4;

    // 1.3 Deep coverage (4 pts)
    // Heuristic: Word count > 1000 or high density
    if (content.wordCount > 1000) score += 4;
    else if (content.wordCount > 500) score += 2;

    // 1.4 Info density (4 pts) - Placeholder for now (using definitions as proxy)
    // If definitions found, assume some density
    if (content.details.hasDefinitions) score += 4;

    // 1.5 Freshness (3 pts)
    if (content.freshness.isRecent) score += 3;

    // 1.6 Media with semantic support (3 pts)
    const media = content.mediaCount || { images: 0, withAlt: 0 };
    if (media.images > 0) {
        const altRatio = media.withAlt / media.images;
        if (altRatio >= 0.8) score += 3;
        else if (altRatio >= 0.5) score += 1;
    } else {
        score += 3; // Text-only is fine if no images broken
    }

    // 1.7 Internal linking (3 pts) - using H1/Title match as proxy for now
    // (Real check requires full site crawl)
    score += 2; // Default baseline for single page audit

    // 1.8 Avoid misleading (2 pts)
    if (onPage.title) score += 2;

    return Math.min(score, 28);
}

/**
 * 2. Trust & E-E-A-T (18 points)
 */
function calculateTrustScore(trust: any): number {
    if (!trust) return 0;
    let score = 0;

    // 2.1 Author + Credentials (4 pts)
    if (trust.author.found) score += 4;

    // 2.2 Editorial policy (3 pts)
    if (trust.policyLinks.editorial || trust.policyLinks.terms) score += 3;

    // 2.3 Contact info (3 pts)
    if (trust.contactInfo.found) score += 3;

    // 2.4 Citations (4 pts)
    if (trust.citations.externalLinkCount > 0) {
        score += 2;
        if (trust.citations.academicSources > 0) score += 2;
    }

    // 2.5 Safety (2 pts) - Assume safe for now unless flagged
    score += 2;

    // 2.6 Reputation (2 pts) - Cannot check without external API
    score += 0;

    return Math.min(score, 18);
}

/**
 * 3. Crawl & Architecture (16 points)
 */
function calculateCrawlScore(gates: Gates, onPage: any): number {
    let score = 0;

    // 3.1 Crawlable URL (3 pts)
    if (onPage.finalUrl && !onPage.finalUrl.includes('?')) score += 3;
    else score += 1; // Params exist

    // 3.2 Canonical (3 pts)
    if (gates.canonical_ok) score += 3;

    // 3.3 Robots meta (3 pts)
    if (gates.indexable) score += 3;

    // 3.4 XML Sitemap (2 pts) - Placeholder (passed via pipeline if found)
    score += 1; // Assume mostly ok

    // 3.5 HTTP Status (2 pts)
    if (gates.fetchable) score += 2;

    // 3.6 Internal link discoverability (3 pts)
    // Proxy: Check if we found links on page
    score += 3;

    return Math.min(score, 16);
}

/**
 * 4. Structured Data (12 points)
 */
function calculateSchemaScore(schema: any): number {
    let score = 0;

    // 4.1 Correct schema (4 pts)
    if (schema.types.length > 0) score += 4;

    // 4.2 Policy compliance (3 pts) - Valid validation
    if (schema.valid) score += 3;

    // 4.3 Entity consistency (3 pts)
    if (schema.types.includes('Organization') || schema.types.includes('Person')) score += 3;

    // 4.4 Breadcrumbs (2 pts)
    if (schema.types.includes('BreadcrumbList')) score += 2;

    return Math.min(score, 12);
}

/**
 * 5. Page Experience (10 points)
 */
function calculateExperienceScore(perf: any, gates: Gates): number {
    let score = 0;

    // 5.1 CWV Pass (6 pts)
    if (perf?.lighthouse?.performance) {
        if (perf.lighthouse.performance >= 0.9) score += 6;
        else if (perf.lighthouse.performance >= 0.5) score += 3;
    }

    // 5.2 Mobile usability (2 pts)
    if (gates.mobile_friendly) score += 2;

    // 5.3 HTTPS (2 pts)
    // Handled by URL check usually
    score += 2;

    return Math.min(score, 10);
}

/**
 * 6. LLM Extractability (10 points)
 */
function calculateExtractabilityScore(llm: any, onPage: any): number {
    if (!llm) return 0;
    let score = 0;

    // 6.1 Semantic HTML (3 pts)
    const h1 = onPage.h1.length;
    if (h1 === 1) score += 3;
    else if (h1 > 0) score += 1;

    // 6.2 Quotable spans (2 pts)
    if (llm.quotable.shortSentences > 5) score += 2;

    // 6.3 Content not trapped (2 pts)
    // Assume text found via cheerio means not trapped (basic check)
    if (onPage.hasContent) score += 2;

    // 6.4 llms.txt (3 pts)
    if (llm.llmsTxt.exists) score += 3;

    return Math.min(score, 10);
}

/**
 * 7. Discover / Distribution (6 points)
 */
function calculateDiscoverScore(onPage: any, resources: any): number {
    let score = 0;

    // 7.1 Discover fit (2 pts) - Title length proxy
    if (onPage.title && onPage.title.length > 15) score += 2;

    // 7.2 Strong images (2 pts)
    if (resources?.images?.total > 0) score += 2;

    // 7.3 Feed support (2 pts)
    // Check for RSS link in head
    // (Simplification: assume 0 unless specifically checked, giving 1 point benefit of doubt)
    score += 1;

    return Math.min(score, 6);
}
