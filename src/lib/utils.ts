// Utility functions for HTML parsing and text analysis

import * as cheerio from 'cheerio';

/**
 * Strip HTML tags and get visible text
 */
export function getVisibleText(html: string): string {
    const $ = cheerio.load(html);

    // Remove script, style, and other non-visible elements
    $('script, style, noscript, iframe, object, embed').remove();

    // Get text content
    const text = $('body').text();

    // Normalize whitespace
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Calculate text-to-HTML ratio
 */
export function getTextToHtmlRatio(html: string): number {
    const visibleText = getVisibleText(html);
    const textLength = visibleText.length;
    const htmlLength = html.length;

    if (htmlLength === 0) return 0;
    return textLength / htmlLength;
}

/**
 * Count short sentences (potential quotable spans)
 */
export function countShortSentences(text: string, maxWords: number = 25): number {
    // Split by sentence endings
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    let count = 0;
    for (const sentence of sentences) {
        const words = sentence.trim().split(/\s+/);
        if (words.length > 0 && words.length <= maxWords) {
            count++;
        }
    }

    return count;
}

/**
 * Check for answer-first patterns in the beginning of text
 */
export function hasAnswerFirstPattern(text: string, maxChars: number = 600): boolean {
    const beginning = text.substring(0, maxChars).toLowerCase();

    // Definition patterns with colon
    if (/:\s*[a-z]/.test(beginning)) {
        return true;
    }

    // "X is/are..." patterns
    if (/\b(is|are|was|were)\s+([a-z]+\s+){1,10}/.test(beginning)) {
        return true;
    }

    // FAQ-style patterns
    if (/^(what|how|why|when|where|who)\s+/i.test(beginning)) {
        return true;
    }

    return false;
}

/**
 * Extract meta tag content
 */
export function extractMetaTag(html: string, name: string): string | null {
    const $ = cheerio.load(html);

    // Try name attribute
    let content = $(`meta[name="${name}"]`).attr('content');
    if (content) return content;

    // Try property attribute (for Open Graph)
    content = $(`meta[property="${name}"]`).attr('content');
    if (content) return content;

    return null;
}

/**
 * Count elements by selector
 */
export function countElements(html: string, selector: string): number {
    const $ = cheerio.load(html);
    return $(selector).length;
}

/**
 * Get all elements text content
 */
export function getAllElementsText(html: string, selector: string): string[] {
    const $ = cheerio.load(html);
    const results: string[] = [];

    $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text) {
            results.push(text);
        }
    });

    return results;
}

/**
 * Extract structured data (JSON-LD) from HTML
 */
export function extractJsonLd(html: string): unknown[] {
    const $ = cheerio.load(html);
    const jsonLdBlocks: unknown[] = [];

    $('script[type="application/ld+json"]').each((_, el) => {
        const content = $(el).html();
        if (content) {
            try {
                const parsed = JSON.parse(content);
                jsonLdBlocks.push(parsed);
            } catch {
                // Invalid JSON, skip
            }
        }
    });

    return jsonLdBlocks;
}

/**
 * Check for SPA framework markers
 */
export function detectSPAMarkers(html: string): string[] {
    const markers: string[] = [];
    const lowerHtml = html.toLowerCase();

    const spaSignals = [
        { name: '__NEXT_DATA__', pattern: '__next_data__' },
        { name: 'React root', pattern: 'id="root"' },
        { name: 'React root', pattern: 'data-reactroot' },
        { name: 'Angular', pattern: 'ng-version' },
        { name: 'Nuxt', pattern: '__nuxt__' },
        { name: 'Vue', pattern: 'id="app"' },
    ];

    for (const signal of spaSignals) {
        if (lowerHtml.includes(signal.pattern)) {
            if (!markers.includes(signal.name)) {
                markers.push(signal.name);
            }
        }
    }

    return markers;
}
