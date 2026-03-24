
import * as cheerio from 'cheerio';
import type { TrustEvidence } from '../types';

export function analyzeTrust($: cheerio.CheerioAPI, html: string): TrustEvidence {
    const htmlLower = html.toLowerCase();

    return {
        author: detectAuthor($),
        policyLinks: detectPolicyLinks($),
        contactInfo: detectContactInfo(htmlLower),
        citations: countCitations($),
        footnotes: detectFootnotes($)
    };
}

function detectAuthor($: cheerio.CheerioAPI) {
    const metaAuthor = $('meta[name="author"]').attr('content');
    const relAuthor = $('a[rel="author"]').text();
    const byline = $('.author, .byline, .written-by').text();

    const name = metaAuthor || relAuthor || (byline.length < 50 ? byline : null) || null;

    return {
        found: !!name,
        name: name?.trim() || null,
        url: $('a[rel="author"]').attr('href') || null
    };
}

function detectPolicyLinks($: cheerio.CheerioAPI) {
    const links = $('a');
    let privacy = false;
    let terms = false;
    let editorial = false;

    links.each((_, el) => {
        const href = $(el).attr('href')?.toLowerCase() || '';
        const text = $(el).text().toLowerCase();

        if (href.includes('privacy') || text.includes('privacy policy')) privacy = true;
        if (href.includes('terms') || text.includes('terms of service') || text.includes('terms of use')) terms = true;
        if (href.includes('editorial') || text.includes('editorial policy') || text.includes('corrections')) editorial = true;
    });

    return { privacy, terms, editorial };
}

function detectContactInfo(html: string) {
    const details: string[] = [];

    // Check for email
    const emails = html.match(/[\w.-]+@[\w.-]+\.\w+/g);
    if (emails) details.push('Email found');

    // Check for phone
    const phones = html.match(/\+?(\d{1,3})?[-. ]?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/g);
    if (phones && phones.length > 0) details.push('Phone found');

    // Check for physical address keywords
    if (html.includes('address') || html.includes('location')) details.push('Address keywords found');

    return {
        found: details.length > 0,
        details
    };
}

function countCitations($: cheerio.CheerioAPI) {
    let externalLinkCount = 0;
    let academicSources = 0;

    $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (href.startsWith('http')) {
            externalLinkCount++;
            if (href.includes('.edu') || href.includes('.gov') || href.includes('wikipedia') || href.includes('ncbi')) {
                academicSources++;
            }
        }
    });

    return { externalLinkCount, academicSources };
}

function detectFootnotes($: cheerio.CheerioAPI): boolean {
    return $('sup').length > 0 || $('.footnotes').length > 0 || $('[id^="fn"]').length > 0;
}
