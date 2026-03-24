// Advanced audit checks - 19 free checks that don't require external APIs
import * as cheerio from 'cheerio';
import type { FetchResult } from '../types';
import type { ResourceEvidence, SEOEvidence } from '../types';

// List of deprecated HTML tags
const DEPRECATED_TAGS = [
    'acronym', 'applet', 'basefont', 'big', 'blink', 'center', 'dir',
    'font', 'frame', 'frameset', 'isindex', 'keygen', 'listing',
    'marquee', 'menu', 'nobr', 'noembed', 'noframes', 'plaintext',
    'rb', 'rtc', 's', 'spacer', 'strike', 'tt', 'u', 'xmp'
];

// Common stop words to exclude from keyword analysis
const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for',
    'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or',
    'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they',
    'this', 'to', 'was', 'will', 'with'
]);

interface AdvancedChecks {
    onPage: {
        favicon: string | null;
        viewport: string | null;
        charset: string | null;
        deprecatedTags: string[];
        domSize: number;
        googleAnalytics: boolean;
        unsafeLinks: number;
    };
    resources: ResourceEvidence;
    seo: SEOEvidence;
}

export function runAdvancedChecks($: cheerio.CheerioAPI, fetchResult: FetchResult): AdvancedChecks {
    return {
        onPage: {
            favicon: checkFavicon($),
            viewport: checkViewport($),
            charset: checkCharset($, fetchResult.headers),
            deprecatedTags: checkDeprecatedTags($),
            domSize: checkDOMSize($),
            googleAnalytics: checkGoogleAnalytics($),
            unsafeLinks: checkUnsafeLinks($),
        },
        resources: analyzeResources($, fetchResult.headers),
        seo: analyzeSEO($),
    };
}

// 1. Favicon Test
function checkFavicon($: cheerio.CheerioAPI): string | null {
    // Check for various favicon link tags
    const favicon = $('link[rel="icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href') ||
        $('link[rel="apple-touch-icon"]').attr('href');

    return favicon || null;
}

// 2. Meta Viewport Test
function checkViewport($: cheerio.CheerioAPI): string | null {
    return $('meta[name="viewport"]').attr('content') || null;
}

// 3. Charset Declaration Test
function checkCharset($: cheerio.CheerioAPI, headers: Record<string, string>): string | null {
    // Check meta tag
    const metaCharset = $('meta[charset]').attr('charset') ||
        $('meta[http-equiv="Content-Type"]').attr('content');

    // Check HTTP header
    const contentType = headers['content-type'] || '';
    const headerCharset = contentType.match(/charset=([^;]+)/)?.[1];

    return metaCharset || headerCharset || null;
}

// 4. Deprecated HTML Tags Test
function checkDeprecatedTags($: cheerio.CheerioAPI): string[] {
    const found: string[] = [];

    DEPRECATED_TAGS.forEach(tag => {
        if ($(tag).length > 0) {
            found.push(tag);
        }
    });

    return found;
}

// 5. DOM Size Test
function checkDOMSize($: cheerio.CheerioAPI): number {
    // Count all elements in the DOM
    return $('*').length;
}

// 6. Google Analytics Test
function checkGoogleAnalytics($: cheerio.CheerioAPI): boolean {
    const html = $.html();

    // Check for various GA implementations
    const hasGA4 = html.includes('gtag/js') || html.includes('G-');
    const hasUA = html.includes('google-analytics.com/analytics.js') || html.includes('UA-');
    const hasGTM = html.includes('googletagmanager.com/gtm.js') || html.includes('GTM-');

    return hasGA4 || hasUA || hasGTM;
}

// 7. Unsafe Cross-Origin Links Test
function checkUnsafeLinks($: cheerio.CheerioAPI): number {
    let unsafeCount = 0;

    $('a[target="_blank"]').each((_, el) => {
        const rel = $(el).attr('rel') || '';
        if (!rel.includes('noopener') || !rel.includes('noreferrer')) {
            unsafeCount++;
        }
    });

    return unsafeCount;
}

// 8-14. Resource Optimization Checks
function analyzeResources($: cheerio.CheerioAPI, headers: Record<string, string>): ResourceEvidence {
    const images = analyzeImages($);
    const scripts = analyzeScripts($);
    const styles = analyzeStyles($);

    return {
        images,
        scripts,
        styles,
    };
}

// Image Analysis
function analyzeImages($: cheerio.CheerioAPI) {
    const imgs = $('img');
    let withAspectIssues = 0;
    let withoutSrcset = 0;
    let modernFormats = 0;
    let legacyFormats = 0;
    let altTextMissing = 0; // Phase 6

    imgs.each((_, el) => {
        const $img = $(el);
        const src = $img.attr('src') || '';
        const srcset = $img.attr('srcset');
        const width = $img.attr('width');
        const height = $img.attr('height');

        // Check for srcset (responsive images)
        if (!srcset) {
            withoutSrcset++;
        }

        // Check for aspect ratio attributes
        if (!width || !height) {
            withAspectIssues++;
        }

        // Check for modern image formats
        if (src.match(/\.(webp|avif)$/i)) {
            modernFormats++;
        } else if (src.match(/\.(jpg|jpeg|png|gif)$/i)) {
            legacyFormats++;
        }

        // Check for alt text (Phase 6)
        const alt = $img.attr('alt');
        if (!alt || alt.trim().length === 0) {
            altTextMissing++;
        }
    });

    return {
        total: imgs.length,
        withAspectIssues,
        withoutSrcset,
        modernFormats,
        legacyFormats,
        altTextMissing, // Phase 6
        cached: 0, // Would need to fetch each image to check headers
        uncached: 0,
    };
}

// Script Analysis
function analyzeScripts($: cheerio.CheerioAPI) {
    const scripts = $('script[src]');
    let blocking = 0;
    let minified = 0;
    let unminified = 0;

    scripts.each((_, el) => {
        const $script = $(el);
        const src = $script.attr('src') || '';
        const async = $script.attr('async');
        const defer = $script.attr('defer');

        // Check if blocking (no async/defer)
        if (!async && !defer) {
            blocking++;
        }

        // Check if likely minified (contains .min.js)
        if (src.includes('.min.js')) {
            minified++;
        } else if (src.endsWith('.js')) {
            unminified++;
        }
    });

    return {
        total: scripts.length,
        blocking,
        minified,
        unminified,
        cached: 0, // Would need to fetch each script
        uncached: 0,
    };
}

// Style Analysis
function analyzeStyles($: cheerio.CheerioAPI) {
    const links = $('link[rel="stylesheet"]');
    const inlineStyles = $('style');
    let blocking = 0;
    let hasMediaQueries = false;

    links.each((_, el) => {
        const $link = $(el);
        const media = $link.attr('media');

        // Styles are blocking unless they have media attribute or are preloaded
        if (!media || media === 'all') {
            blocking++;
        }

        if (media && media !== 'all') {
            hasMediaQueries = true;
        }
    });

    // Check inline styles for media queries
    inlineStyles.each((_, el) => {
        const content = $(el).html() || '';
        if (content.includes('@media')) {
            hasMediaQueries = true;
        }
    });

    return {
        total: links.length + inlineStyles.length,
        blocking,
        cached: 0, // Would need to fetch each stylesheet
        uncached: 0,
        hasMediaQueries,
    };
}

// 15-17. SEO Analysis
function analyzeSEO($: cheerio.CheerioAPI): SEOEvidence {
    const keywords = analyzeKeywords($);
    const links = analyzeLinks($);
    const headerStructure = analyzeHeaderStructure($);

    return {
        keywords,
        custom404: false, // Would need to test /404 endpoint separately
        sslErrors: [], // Would need SSL certificate validation
        links, // Phase 6
        headerStructure, // Phase 6
    };
}

// Phase 6: Link Analysis
function analyzeLinks($: cheerio.CheerioAPI) {
    let internal = 0;
    let external = 0;

    $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';

        if (href.startsWith('/') || href.startsWith('#') || href.includes('localhost') || !href.startsWith('http')) {
            internal++;
        } else {
            external++;
        }
    });

    return {
        internal,
        external,
        broken: 0, // Would need fetch to verify
    };
}

// Phase 6: Header Hierarchy Analysis
function analyzeHeaderStructure($: cheerio.CheerioAPI) {
    const issues: string[] = [];
    const headers = $('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;

    // Check for multiple H1s (often discouraged but valid in HTML5, Semrush flags it)
    if ($('h1').length > 1) {
        issues.push('Multiple H1 tags found');
    }

    if ($('h1').length === 0) {
        issues.push('Missing H1 tag');
    }

    headers.each((_, el) => {
        const level = parseInt(el.tagName.substring(1));

        // Skip if first header is not H1 (already covered by missing H1 check logic partially)
        // Checks for skipping levels (e.g. H2 -> H4)
        if (lastLevel > 0 && level > lastLevel + 1) {
            issues.push(`Skipped heading level: H${lastLevel} -> H${level}`);
        }

        lastLevel = level;
    });

    return {
        valid: issues.length === 0,
        issues: issues.slice(0, 5), // Top 5 issues
    };
}

// Keyword Analysis
function analyzeKeywords($: cheerio.CheerioAPI) {
    // Extract all visible text
    const text = $('body').text().toLowerCase();

    // Tokenize and count words
    const words = text
        .replace(/[^\w\s]/g, ' ') // Remove punctuation
        .split(/\s+/)
        .filter(word =>
            word.length > 3 && // Min length
            !STOP_WORDS.has(word) && // Not a stop word
            !/^\d+$/.test(word) // Not just numbers
        );

    // Count frequency
    const frequency: Record<string, number> = {};
    words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });

    // Sort by frequency
    const sorted = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .map(([word, count]) => ({ word, count }));

    return {
        cloud: sorted.slice(0, 50), // Top 50 for cloud
        mostCommon: sorted.slice(0, 20), // Top 20 most common
    };
}
