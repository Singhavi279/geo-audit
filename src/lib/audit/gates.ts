// Eligibility gates and on-page extraction

import * as cheerio from 'cheerio';
import type { Gates, OnPageEvidence } from '../types';
import { parseRobotsMeta, hasNoIndex } from './robots';
import { extractMetaTag, getAllElementsText, countElements } from '../utils';

export interface GatesResult {
    gates: Gates;
    onPage: OnPageEvidence;
}

/**
 * Extract eligibility gates and on-page evidence from HTML
 */
export function extractGates(
    html: string,
    headers: Record<string, string>,
    finalUrl: string,
    statusCode: number,
    redirectChain: string[]
): GatesResult {
    const $ = cheerio.load(html);

    // Extract on-page elements
    const title = $('title').first().text().trim() || null;
    const metaDescription = extractMetaTag(html, 'description');
    const canonical = $('link[rel="canonical"]').attr('href') || null;

    // Robots directives
    const robotsMetaContent = extractMetaTag(html, 'robots') || '';
    const robotsMeta = parseRobotsMeta(robotsMetaContent);
    const robotsHeader = headers['x-robots-tag'] || null;
    const robotsHeaderDirectives = robotsHeader ? parseRobotsMeta(robotsHeader) : [];

    // H1 tags
    const h1 = getAllElementsText(html, 'h1');
    const h2Count = countElements(html, 'h2');
    const h3Count = countElements(html, 'h3');

    // Open Graph tags
    const og: Record<string, string> = {};
    $('meta[property^="og:"]').each((_, el) => {
        const property = $(el).attr('property');
        const content = $(el).attr('content');
        if (property && content) {
            og[property] = content;
        }
    });

    // Twitter Card tags
    $('meta[name^="twitter:"]').each((_, el) => {
        const name = $(el).attr('name');
        const content = $(el).attr('content');
        if (name && content) {
            og[name] = content;
        }
    });

    // Build onPage evidence
    const onPage: OnPageEvidence = {
        finalUrl,
        statusCode,
        redirectChain,
        contentType: headers['content-type'] || 'unknown',
        title,
        metaDescription,
        canonical,
        robotsMeta,
        robotsHeader,
        h1,
        h2Count,
        h3Count,
        og,
        hasContent: hasContent(html),
        // Advanced checks - will be populated by advanced module
        favicon: undefined,
        viewport: undefined,
        charset: undefined,
        deprecatedTags: undefined,
        domSize: undefined,
        googleAnalytics: undefined,
        unsafeLinks: undefined,
    };

    // Determine gates
    const fetchable = statusCode === 200;

    // Check for noindex in meta or header
    const hasNoIndexMeta = hasNoIndex(robotsMeta);
    const hasNoIndexHeader = hasNoIndex(robotsHeaderDirectives);
    const indexable = !hasNoIndexMeta && !hasNoIndexHeader;

    // Canonical check - basic validation
    let canonical_ok = true;
    if (!canonical) {
        canonical_ok = false;
    } else {
        try {
            new URL(canonical);
            // Canonical exists and is valid URL
        } catch {
            canonical_ok = false;
        }
    }

    // Crawl OK - will be determined by robots.txt check (handled separately)
    const crawl_ok = true; // Placeholder, will be updated by robots.txt check

    const gates: Gates = {
        fetchable,
        indexable,
        canonical_ok,
        crawl_ok,
    };

    return {
        gates,
        onPage,
    };
}

/**
 * Check if content is present and meaningful
 */
export function hasContent(html: string): boolean {
    const $ = cheerio.load(html);

    // Remove non-visible elements
    $('script, style, noscript').remove();

    const text = $('body').text().trim();

    // Require at least 100 characters of visible text
    return text.length >= 100;
}
