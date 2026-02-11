// Scoring model - 5 buckets totaling 100 points

import type { Scores, Gates, Evidence } from './types';

/**
 * Calculate audit scores across 5 buckets
 */
export function calculateScores(
    gates: Gates,
    evidence: Evidence
): Scores {
    // Calculate individual bucket scores
    const technical_seo = calculateTechnicalSEOScore(gates, evidence.onPage);
    const performance = calculatePerformanceScore(evidence.performance);
    const structured_data = calculateStructuredDataScore(evidence.schema);
    const citation_readiness = calculateCitationReadinessScore(evidence.citation);
    const provenance = calculateProvenanceScore(evidence.citation);

    // Sum total
    let total = technical_seo + performance + structured_data + citation_readiness + provenance;

    // Apply gate cap: if fetchable or indexable fails, cap at 20
    if (!gates.fetchable || !gates.indexable) {
        total = Math.min(total, 20);
    }

    return {
        total: Math.round(total),
        technical_seo: Math.round(technical_seo),
        performance: Math.round(performance),
        structured_data: Math.round(structured_data),
        citation_readiness: Math.round(citation_readiness),
        provenance: Math.round(provenance),
    };
}

/**
 * Technical SEO score (25 points)
 */
function calculateTechnicalSEOScore(gates: Gates, onPage: any): number {
    let score = 0;

    // Indexable (8 points)
    if (gates.indexable) {
        score += 8;
    }

    // Canonical present and valid (7 points)
    if (gates.canonical_ok) {
        score += 7;
    }

    // Title tag (5 points)
    if (onPage.title && onPage.title.length >= 20 && onPage.title.length <= 70) {
        score += 5;
    } else if (onPage.title) {
        score += 2;
    }

    // Meta description (5 points)
    if (onPage.metaDescription && onPage.metaDescription.length >= 50 && onPage.metaDescription.length <= 160) {
        score += 5;
    } else if (onPage.metaDescription) {
        score += 2;
    }

    return Math.min(score, 25);
}

/**
 * Performance score (20 points)
 */
function calculatePerformanceScore(perfEvidence: any): number {
    console.log('[SCORING] calculatePerformanceScore called with:', {
        exists: !!perfEvidence,
        hasLighthouse: !!perfEvidence?.lighthouse,
        lighthouseValue: perfEvidence?.lighthouse,
        fullEvidence: perfEvidence
    });

    if (!perfEvidence || !perfEvidence.lighthouse) {
        console.log('[SCORING] Returning 0 - no perfEvidence or lighthouse');
        return 0; // No PSI data
    }

    let score = 0;

    // Lighthouse performance score (12 points)
    const perfScore = perfEvidence.lighthouse.performance || 0;
    console.log('[SCORING] Lighthouse performance score:', perfScore);
    score += (perfScore / 100) * 12;

    // CWV - LCP (4 points)
    const lcp = perfEvidence.metrics?.lcp;
    if (lcp) {
        if (lcp <= 2500) {
            score += 4;
        } else if (lcp <= 4000) {
            score += 2;
        }
    }

    // CWV - CLS (4 points)
    const cls = perfEvidence.metrics?.cls;
    if (cls !== undefined) {
        if (cls <= 0.1) {
            score += 4;
        } else if (cls <= 0.25) {
            score += 2;
        }
    }

    const finalScore = Math.min(score, 20);
    console.log('[SCORING] Final performance score:', finalScore, 'from raw:', score);
    return finalScore;
}

/**
 * Structured data score (15 points)
 */
function calculateStructuredDataScore(schemaEvidence: any): number {
    let score = 0;

    // Schema present (5 points)
    if (schemaEvidence.types.length > 0) {
        score += 5;
    }

    // Valid schema (5 points)
    if (schemaEvidence.valid && schemaEvidence.errors.length === 0) {
        score += 5;
    }

    // Relevant schema types (5 points)
    const relevantTypes = [
        'Article', 'NewsArticle', 'BlogPosting',
        'FAQPage', 'HowTo', 'QAPage',
        'Organization', 'Person',
        'Product', 'Review',
    ];

    const hasRelevant = schemaEvidence.types.some((type: string) =>
        relevantTypes.includes(type)
    );

    if (hasRelevant) {
        score += 5;
    }

    return Math.min(score, 15);
}

/**
 * Citation readiness score (30 points)
 */
function calculateCitationReadinessScore(citationEvidence: any): number {
    let score = 0;

    // Answer-first pattern (6 points)
    if (citationEvidence.answerFirst) {
        score += 6;
    }

    // Structure score (10 points) - already scored 0-100, normalize to 0-10
    score += (citationEvidence.structureScore / 100) * 10;

    // Quotable spans (8 points)
    const quotableSpans = citationEvidence.quotableSpans;
    if (quotableSpans >= 20) {
        score += 8;
    } else if (quotableSpans >= 10) {
        score += 5;
    } else if (quotableSpans >= 5) {
        score += 3;
    }

    // Extractability (6 points) - already scored 0-100, normalize to 0-6
    score += (citationEvidence.extractabilityScore / 100) * 6;

    return Math.min(score, 30);
}

/**
 * Provenance score (10 points)
 */
function calculateProvenanceScore(citationEvidence: any): number {
    let score = 0;

    // Author found (5 points)
    if (citationEvidence.details.authorFound) {
        score += 5;
    }

    // Date found (5 points)
    if (citationEvidence.details.dateFound) {
        score += 5;
    }

    return Math.min(score, 10);
}
