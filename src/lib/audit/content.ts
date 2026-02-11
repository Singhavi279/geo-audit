
import * as cheerio from 'cheerio';
import type { ContentEvidence } from '../types';

export function analyzeContent(html: string): ContentEvidence {
    const $ = cheerio.load(html);
    const text = $('body').text();

    return {
        primaryIntent: detectIntent($, text),
        wordCount: countWords(text),
        mediaCount: countMedia($),
        freshness: detectFreshness($),
        details: {
            hasTldr: checkTldr($),
            hasSummary: checkSummary($),
            hasDefinitions: checkDefinitions($)
        }
    };
}

function detectIntent($: cheerio.CheerioAPI, text: string): 'informational' | 'transactional' | 'mixed' | 'unknown' {
    const title = $('title').text().toLowerCase();
    const h1 = $('h1').first().text().toLowerCase();
    const combined = title + ' ' + h1;

    const infoKeywords = ['how to', 'guide', 'what is', 'tutorial', 'explained', 'tips', 'best practices'];
    const transKeywords = ['buy', 'price', 'shop', 'sale', 'cart', 'checkout', 'pricing', 'subscribe'];

    let infoScore = 0;
    let transScore = 0;

    infoKeywords.forEach(k => { if (combined.includes(k)) infoScore++; });
    transKeywords.forEach(k => { if (combined.includes(k)) transScore++; });

    if (infoScore > 0 && transScore === 0) return 'informational';
    if (transScore > 0 && infoScore === 0) return 'transactional';
    if (infoScore > 0 && transScore > 0) return 'mixed';

    // Fallback: check body content density
    if (text.length > 2000) return 'informational';

    return 'unknown';
}

function countWords(text: string): number {
    return text.trim().split(/\s+/).length;
}

function countMedia($: cheerio.CheerioAPI) {
    const imgs = $('img');
    let withAlt = 0;
    imgs.each((_, el) => {
        if ($(el).attr('alt')) withAlt++;
    });

    return {
        images: imgs.length,
        withAlt,
        videos: $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length
    };
}

function detectFreshness($: cheerio.CheerioAPI) {
    // Check Schema
    const schema = $('script[type="application/ld+json"]').html();
    let schemaDate = null;
    if (schema) {
        try {
            const json = JSON.parse(schema);
            // Handle array or single object
            const objects = Array.isArray(json) ? json : [json];
            for (const obj of objects) {
                if (obj.dateModified) schemaDate = obj.dateModified;
                else if (obj.datePublished) schemaDate = obj.datePublished;
            }
        } catch (e) { } // Ignore parse errors
    }

    // Check visible dates
    const timeText = $('time').attr('datetime') || $('time').text();
    const metaDate = $('meta[property="article:modified_time"]').attr('content') ||
        $('meta[property="article:published_time"]').attr('content');

    console.log('[FRESHNESS] Dates found:', { schemaDate, timeText, metaDate });

    const bestDate = schemaDate || metaDate || (timeText?.match(/\d{4}-\d{2}-\d{2}/) ? timeText : null);

    let isRecent = false;
    if (bestDate) {
        const date = new Date(bestDate);
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        isRecent = date > twoYearsAgo;
    }

    return {
        lastUpdated: bestDate,
        published: $('meta[property="article:published_time"]').attr('content') || null,
        isRecent
    };
}

function checkTldr($: cheerio.CheerioAPI): boolean {
    const text = $('body').text().toLowerCase();
    return text.includes('tl;dr') || text.includes('key takeaways') || $('.tldr').length > 0;
}

function checkSummary($: cheerio.CheerioAPI): boolean {
    return $('meta[name="description"]').length > 0 || $('.summary').length > 0;
}

function checkDefinitions($: cheerio.CheerioAPI): boolean {
    return $('dl').length > 0 || $('.definition').length > 0 || $('body').text().includes('definition:');
}
