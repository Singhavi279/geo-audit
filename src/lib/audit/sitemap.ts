// Sitemap parser and analyzer

import { XMLParser } from 'fast-xml-parser';
import type { SitemapResult } from '../types';
import { isValidUrl } from './normalize';

const MAX_SITEMAPS_TO_FOLLOW = 3;
const MAX_URLS_LIGHT = 25;
const MAX_URLS_DEEP = 150;

interface SitemapEntry {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
}

/**
 * Analyze sitemap and audit sample URLs
 */
export async function analyzeSitemap(
    sitemapUrl: string | null,
    hostUrl: string,
    deep: boolean
): Promise<SitemapResult | null> {
    try {
        let finalSitemapUrl = sitemapUrl;

        // Auto-discovery if not provided
        if (!finalSitemapUrl) {
            finalSitemapUrl = await discoverSitemap(hostUrl);
            if (!finalSitemapUrl) {
                return null; // No sitemap found
            }
        }

        // Fetch and parse sitemap
        const urls = await fetchSitemapUrls(finalSitemapUrl, deep);

        if (urls.length === 0) {
            return {
                urls: [],
                summary: {
                    total: 0,
                    indexable: 0,
                    redirects: 0,
                    errors: 0,
                },
                topIssues: [],
            };
        }

        // Run lightweight checks on sampled URLs
        const maxUrls = deep ? MAX_URLS_DEEP : MAX_URLS_LIGHT;
        const sample = urls.slice(0, maxUrls);

        const checkResults = await Promise.allSettled(
            sample.map(url => lightweightUrlCheck(url))
        );

        // Aggregate results
        let indexable = 0;
        let redirects = 0;
        let errors = 0;
        const issues: Array<{ url: string; issue: string }> = [];

        for (let i = 0; i < checkResults.length; i++) {
            const result = checkResults[i];
            const url = sample[i];

            if (result.status === 'fulfilled') {
                const check = result.value;

                if (check.indexable) {
                    indexable++;
                }
                if (check.isRedirect) {
                    redirects++;
                    issues.push({ url, issue: `Redirect (${check.statusCode})` });
                }
                if (check.isError) {
                    errors++;
                    issues.push({ url, issue: `Error (${check.statusCode})` });
                }
                if (check.hasNoIndex) {
                    issues.push({ url, issue: 'Has noindex directive' });
                }
            } else {
                errors++;
                issues.push({ url, issue: 'Failed to fetch' });
            }
        }

        // Sort issues by severity and take top 10
        const topIssues = issues.slice(0, 10);

        return {
            urls: sample,
            summary: {
                total: sample.length,
                indexable,
                redirects,
                errors,
            },
            topIssues,
        };
    } catch (error) {
        console.error('Sitemap analysis failed:', error);
        return null;
    }
}

/**
 * Auto-discover sitemap URL
 */
async function discoverSitemap(hostUrl: string): Promise<string | null> {
    const baseUrl = new URL(hostUrl).origin;

    // Try common sitemap locations
    const candidates = [
        `${baseUrl}/sitemap_index.xml`,
        `${baseUrl}/sitemap.xml`,
    ];

    for (const url of candidates) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
                return url;
            }
        } catch {
            // Continue to next candidate
        }
    }

    // TODO: Also check robots.txt for Sitemap: directives (already handled in robots.ts)
    return null;
}

/**
 * Fetch URLs from sitemap (handles sitemap index)
 */
async function fetchSitemapUrls(sitemapUrl: string, deep: boolean): Promise<string[]> {
    const urls: string[] = [];

    try {
        const response = await fetch(sitemapUrl);
        if (!response.ok) {
            return [];
        }

        const xmlText = await response.text();
        const parser = new XMLParser();
        const parsed = parser.parse(xmlText);

        // Check if it's a sitemap index
        if (parsed.sitemapindex) {
            const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
                ? parsed.sitemapindex.sitemap
                : [parsed.sitemapindex.sitemap];

            // Follow first N sitemaps
            const toFollow = sitemaps.slice(0, MAX_SITEMAPS_TO_FOLLOW);

            for (const sitemap of toFollow) {
                const loc = sitemap.loc;
                if (loc && isValidUrl(loc)) {
                    const subUrls = await fetchSitemapUrls(loc, deep);
                    urls.push(...subUrls);
                }
            }
        }
        // Regular sitemap with URLs
        else if (parsed.urlset) {
            const entries = Array.isArray(parsed.urlset.url)
                ? parsed.urlset.url
                : [parsed.urlset.url];

            for (const entry of entries) {
                const loc = entry.loc;
                if (loc && isValidUrl(loc)) {
                    urls.push(loc);
                }
            }
        }

        return urls;
    } catch (error) {
        console.error('Failed to fetch sitemap:', error);
        return [];
    }
}

/**
 * Lightweight URL check (status + basic meta)
 */
async function lightweightUrlCheck(url: string): Promise<{
    statusCode: number;
    indexable: boolean;
    isRedirect: boolean;
    isError: boolean;
    hasNoIndex: boolean;
}> {
    try {
        const response = await fetch(url, {
            method: 'HEAD', // Just headers for speed
            redirect: 'manual',
        });

        const statusCode = response.status;
        const isRedirect = statusCode >= 300 && statusCode < 400;
        const isError = statusCode >= 400;

        // Check X-Robots-Tag header
        const robotsHeader = response.headers.get('x-robots-tag') || '';
        const hasNoIndexHeader = robotsHeader.toLowerCase().includes('noindex');

        // For indexability, fetch full HTML if needed (only if 200 OK)
        let hasNoIndexMeta = false;
        if (statusCode === 200) {
            // For lightweight check, we skip fetching full HTML to save time
            // We'll assume indexable unless X-Robots-Tag says otherwise
            hasNoIndexMeta = false;
        }

        const hasNoIndex = hasNoIndexHeader || hasNoIndexMeta;
        const indexable = statusCode === 200 && !hasNoIndex;

        return {
            statusCode,
            indexable,
            isRedirect,
            isError,
            hasNoIndex,
        };
    } catch (error) {
        return {
            statusCode: 0,
            indexable: false,
            isRedirect: false,
            isError: true,
            hasNoIndex: false,
        };
    }
}
