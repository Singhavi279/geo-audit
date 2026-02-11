// PageSpeed Insights API integration - Enhanced to extract ALL possible data
// PSI returns 149+ audits - we extract everything useful

export interface PSIResult {
    lighthouse: {
        performance: number;
        seo: number;
        bestPractices: number;
        accessibility: number;
    };
    metrics: {
        // Core Web Vitals
        lcp?: number;
        cls?: number;
        tbt?: number;
        fcp?: number;
        ttfb?: number;
        inp?: number;

        // Additional performance metrics
        speedIndex?: number;
        timeToInteractive?: number;
        maxPotentialFid?: number;

        // Resource timing
        domContentLoaded?: number;
        totalPageSize?: number;
        numRequests?: number;
    };
    opportunities: Array<{
        title: string;
        savings?: number; // milliseconds
        savingsBytes?: number; // bytes
        score?: number;
    }>;
    diagnostics: Array<{
        title: string;
        value?: any;
        score?: number;
    }>;
    // Full category scores with details
    categoryDetails?: {
        performance?: any;
        seo?: any;
        bestPractices?: any;
        accessibility?: any;
    };
}

/**
 * Run PageSpeed Insights audit with maximum data extraction
 */
export async function runPageSpeedInsights(
    url: string,
    strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<PSIResult | { error: string } | null> {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;

    if (!apiKey) {
        console.warn('[PSI] API key not found in environment variables (GOOGLE_PAGESPEED_API_KEY). Skipping PSI.');
        return { error: 'Missing API Key (GOOGLE_PAGESPEED_API_KEY)' };
    }

    console.log('[PSI] Using API Key:', apiKey.substring(0, 5) + '...');

    try {
        const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
        apiUrl.searchParams.set('url', url);
        apiUrl.searchParams.set('key', apiKey);
        apiUrl.searchParams.set('strategy', strategy);

        // Request all 4 categories - MUST use append() not set() for multiple values
        apiUrl.searchParams.append('category', 'performance');
        apiUrl.searchParams.append('category', 'seo');
        apiUrl.searchParams.append('category', 'best-practices');
        apiUrl.searchParams.append('category', 'accessibility');

        // Optional parameters from official docs
        apiUrl.searchParams.set('locale', 'en'); // Localize results
        apiUrl.searchParams.set('utm_campaign', 'geo-audit'); // Analytics campaign
        apiUrl.searchParams.set('utm_source', 'api'); // Analytics source

        console.log('[PSI] Requesting audit for:', url);

        const response = await fetch(apiUrl.toString(), {
            headers: {
                'Accept': 'application/json',
                'User-Agent': process.env.USER_AGENT || 'GEOAuditBot/1.0 (+https://geo-audit.vercel.app)',
            },
        });

        if (!response.ok) {
            console.error(`[PSI] API error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('[PSI] Error details:', errorText);

            // Try to extract a friendly error message from the Google API error response
            let friendlyError = `API Error ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error?.message) {
                    friendlyError = errorJson.error.message;
                }
            } catch (e) {
                // Ignore parsing error
            }
            return { error: friendlyError };
        }

        const data = await response.json();
        console.log('[PSI] API Response received');

        // Extract Lighthouse categories
        const categories = data.lighthouseResult?.categories || {};
        const lighthouse = {
            performance: Math.round((categories.performance?.score || 0) * 100),
            seo: Math.round((categories.seo?.score || 0) * 100),
            bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
            accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        };

        console.log('[PSI] Lighthouse scores:', lighthouse);

        // Extract ALL metrics
        const audits = data.lighthouseResult?.audits || {};
        const metrics = {
            // Core Web Vitals
            lcp: audits['largest-contentful-paint']?.numericValue ?
                Math.round(audits['largest-contentful-paint'].numericValue) : undefined,
            cls: audits['cumulative-layout-shift']?.numericValue,
            tbt: audits['total-blocking-time']?.numericValue ?
                Math.round(audits['total-blocking-time'].numericValue) : undefined,
            fcp: audits['first-contentful-paint']?.numericValue ?
                Math.round(audits['first-contentful-paint'].numericValue) : undefined,
            ttfb: audits['server-response-time']?.numericValue ?
                Math.round(audits['server-response-time'].numericValue) : undefined,
            inp: audits['interaction-to-next-paint']?.numericValue,

            // Additional performance metrics
            speedIndex: audits['speed-index']?.numericValue ?
                Math.round(audits['speed-index'].numericValue) : undefined,
            timeToInteractive: audits['interactive']?.numericValue ?
                Math.round(audits['interactive'].numericValue) : undefined,
            maxPotentialFid: audits['max-potential-fid']?.numericValue ?
                Math.round(audits['max-potential-fid'].numericValue) : undefined,

            // Resource metrics
            domContentLoaded: audits['metrics']?.details?.items?.[0]?.observedFirstContentfulPaint,
            totalPageSize: audits['total-byte-weight']?.numericValue ?
                Math.round(audits['total-byte-weight'].numericValue) : undefined,
            numRequests: audits['network-requests']?.details?.items?.length,
        };



        // Extract ALL opportunities (render-blocking, unused code, image optimization, etc.)
        const opportunities: Array<{ title: string; savings?: number; savingsBytes?: number; score?: number }> = [];
        const opportunityAudits = [
            // Critical rendering path
            'render-blocking-resources',
            'uses-rel-preconnect',
            'uses-rel-preload',

            // JavaScript optimization
            'unused-javascript',
            'unminified-javascript',
            'legacy-javascript',
            'modern-image-formats',
            'bootup-time',

            // CSS optimization
            'unused-css-rules',
            'unminified-css',
            'critical-request-chains',

            // Image optimization
            'offscreen-images',
            'modern-image-formats',
            'uses-optimized-images',
            'uses-responsive-images',
            'efficient-animated-content',

            // Caching & compression
            'uses-long-cache-ttl',
            'uses-text-compression',

            // Third-party code
            'third-party-summary',
            'third-party-facades',

            // Fonts
            'font-display',
            'preload-lcp-image',

            // Network
            'redirects',
            'uses-http2',
            'server-response-time',
        ];

        for (const auditKey of opportunityAudits) {
            const audit = audits[auditKey];
            if (audit && (audit.details?.overallSavingsMs || audit.numericValue)) {
                opportunities.push({
                    title: audit.title,
                    savings: audit.details?.overallSavingsMs ?
                        Math.round(audit.details.overallSavingsMs) : undefined,
                    savingsBytes: audit.details?.overallSavingsBytes ?
                        Math.round(audit.details.overallSavingsBytes) : undefined,
                    score: audit.score,
                });
            }
        }

        console.log('[PSI] Opportunities found:', opportunities.length);

        // Extract diagnostics (issues that don't have savings estimates)
        const diagnostics: Array<{ title: string; value?: any; score?: number }> = [];
        const diagnosticAudits = [
            'dom-size',
            'duplicated-javascript',
            'mainthread-work-breakdown',
            'long-tasks',
            'non-composited-animations',
            'unsized-images',
            'viewport',
            'charset',
            'crawlable-anchors',
            'is-crawlable',
            'canonical',
            'meta-description',
            'document-title',
            'hreflang',
            'link-text',
            'structured-data',
            'robots-txt',
        ];

        for (const auditKey of diagnosticAudits) {
            const audit = audits[auditKey];
            if (audit && audit.score !== null) {
                diagnostics.push({
                    title: audit.title,
                    value: audit.displayValue || audit.numericValue,
                    score: audit.score,
                });
            }
        }

        console.log('[PSI] Diagnostics found:', diagnostics.length);

        return {
            lighthouse,
            metrics,
            opportunities,
            diagnostics,
            categoryDetails: {
                performance: categories.performance,
                seo: categories.seo,
                bestPractices: categories['best-practices'],
                accessibility: categories.accessibility,
            },
        };

    } catch (error) {
        console.error('[PSI] Failed to run PageSpeed Insights:', error);
        return { error: error instanceof Error ? error.message : 'Unknown PSI Error' };
    }
}
