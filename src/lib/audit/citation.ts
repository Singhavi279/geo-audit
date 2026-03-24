// Citation readiness analysis

import type { CitationEvidence, OnPageEvidence } from '../types';
import * as cheerio from 'cheerio';
import {
    getVisibleText,
    getTextToHtmlRatio,
    countShortSentences,
    hasAnswerFirstPattern,
    countElements,
    detectSPAMarkers,
} from '../utils';

/**
 * Analyze citation readiness of a page
 */
export function analyzeCitationReadiness(
    $: cheerio.CheerioAPI,
    html: string,
    onPage: OnPageEvidence
): CitationEvidence {
    const visibleText = getVisibleText($);
    const textToHtmlRatio = getTextToHtmlRatio($, html.length);

    // Answer-first detection
    const answerFirst = hasAnswerFirstPattern(visibleText, 600);

    // Structure analysis
    const h1Count = onPage.h1.length;
    const h2Count = onPage.h2Count;
    const h3Count = onPage.h3Count;
    const listCount = countElements($, 'ul, ol');
    const tableCount = countElements($, 'table');

    // Structure score (0-100)
    let structureScore = 0;

    // Exactly 1 H1 is ideal
    if (h1Count === 1) {
        structureScore += 25;
    } else if (h1Count > 1) {
        structureScore += 10; // Multiple H1s acceptable but not ideal
    }

    // Sufficient H2/H3 sections
    if (h2Count >= 3) {
        structureScore += 25;
    } else if (h2Count > 0) {
        structureScore += 15;
    }

    if (h3Count >= 2) {
        structureScore += 20;
    } else if (h3Count > 0) {
        structureScore += 10;
    }

    // Lists and tables add structure
    if (listCount > 0) {
        structureScore += 15;
    }
    if (tableCount > 0) {
        structureScore += 15;
    }

    structureScore = Math.min(100, structureScore);

    // Quotable spans
    const shortSentences = countShortSentences(visibleText, 25);
    const bulletPoints = countElements($, 'li');
    const quotableSpans = shortSentences + bulletPoints;

    // Provenance detection
    const authorFound = detectAuthor(html);
    const dateFound = detectDate(html);

    let provenanceScore = 0;
    if (authorFound) provenanceScore += 50;
    if (dateFound) provenanceScore += 50;

    // Extractability
    const spaMarkers = detectSPAMarkers(html);
    const scriptCount = countElements($, 'script');
    const textLength = visibleText.length;

    // Script density (scripts per 1000 chars of text)
    const scriptDensity = textLength > 0 ? (scriptCount / textLength) * 1000 : 0;

    // JS-trapped detection
    const jsTrapped =
        spaMarkers.length > 0 &&
        (textToHtmlRatio < 0.05 || scriptDensity > 10);

    // Extractability score (0-100)
    let extractabilityScore = 0;

    if (textToHtmlRatio >= 0.15) {
        extractabilityScore += 50;
    } else if (textToHtmlRatio >= 0.08) {
        extractabilityScore += 30;
    } else if (textToHtmlRatio >= 0.03) {
        extractabilityScore += 15;
    }

    if (!jsTrapped) {
        extractabilityScore += 30;
    }

    if (textLength >= 500) {
        extractabilityScore += 20;
    } else if (textLength >= 200) {
        extractabilityScore += 10;
    }

    extractabilityScore = Math.min(100, extractabilityScore);

    return {
        answerFirst,
        structureScore,
        quotableSpans,
        provenanceScore,
        extractabilityScore,
        jsTrapped,
        details: {
            h1Count,
            h2Count,
            h3Count,
            listCount,
            tableCount,
            shortSentences,
            bulletPoints,
            authorFound,
            dateFound,
            textToHtmlRatio,
            spaMarkers,
            scriptDensity,
        },
    };
}

/**
 * Detect author/byline
 */
function detectAuthor(html: string): boolean {
    const lowerHtml = html.toLowerCase();

    // Check for author meta tag
    if (lowerHtml.includes('name="author"')) {
        return true;
    }

    // Check for common byline patterns
    const bylinePatterns = [
        /by\s+[A-Z][a-z]+\s+[A-Z][a-z]+/i, // "By John Doe"
        /written\s+by/i,
        /posted\s+by/i,
        /published\s+by/i,
        /curated\s+by/i,
        /author:/i,
        /class="[^"]*author[^"]*"/i,  // loosely matches any class containing 'author'
        /class="[^"]*byline[^"]*"/i,
        /id="[^"]*author[^"]*"/i,
        /rel="author"/i,
        /itemprop="author"/i,
    ];

    for (const pattern of bylinePatterns) {
        if (pattern.test(html)) {
            return true;
        }
    }

    return false;
}

/**
 * Detect published/updated date
 */
function detectDate(html: string): boolean {
    const lowerHtml = html.toLowerCase();

    // Check for date meta tags
    const dateMeta = [
        'article:published_time',
        'article:modified_time',
        'datePublished',
        'dateModified',
    ];

    for (const meta of dateMeta) {
        if (lowerHtml.includes(meta.toLowerCase())) {
            return true;
        }
    }

    // Check for common date patterns
    const datePatterns = [
        /published:/i,
        /updated:/i,
        /last\s+modified:/i,
        /class="published"/i,
        /class="date"/i,
        /itemprop="datePublished"/i,
    ];

    for (const pattern of datePatterns) {
        if (pattern.test(html)) {
            return true;
        }
    }

    return false;
}
