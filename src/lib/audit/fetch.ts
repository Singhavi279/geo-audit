// HTML fetching with redirect handling

import type { FetchResult } from '../types';

const MAX_REDIRECTS = 5;
const MAX_BODY_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Fetch HTML from a URL with redirect tracking
 */
export async function fetchHTML(url: string, userAgent?: string): Promise<FetchResult> {
    const redirectChain: string[] = [];
    let currentUrl = url;
    let redirectCount = 0;

    const ua = userAgent || process.env.USER_AGENT || 'GEOAuditBot/0.1 (+https://example.com)';

    while (redirectCount <= MAX_REDIRECTS) {
        try {
            const response = await fetch(currentUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': ua,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                redirect: 'manual', // Handle redirects manually to track chain
            });

            const statusCode = response.status;

            // Check if it's a redirect
            if (statusCode >= 300 && statusCode < 400) {
                const location = response.headers.get('location');
                if (!location) {
                    throw new Error(`Redirect response (${statusCode}) without Location header`);
                }

                redirectChain.push(currentUrl);

                // Resolve relative redirects
                currentUrl = new URL(location, currentUrl).toString();
                redirectCount++;

                if (redirectCount > MAX_REDIRECTS) {
                    throw new Error(`Too many redirects (>${MAX_REDIRECTS})`);
                }

                continue; // Follow the redirect
            }

            // Not a redirect - process the response
            const contentType = response.headers.get('content-type') || '';

            // Check if it's HTML
            if (!contentType.toLowerCase().includes('text/html') &&
                !contentType.toLowerCase().includes('application/xhtml')) {
                return {
                    finalUrl: currentUrl,
                    statusCode,
                    redirectChain,
                    headers: Object.fromEntries(response.headers.entries()),
                    html: '',
                    contentType,
                };
            }

            // Get response body with size limit
            const arrayBuffer = await response.arrayBuffer();
            if (arrayBuffer.byteLength > MAX_BODY_SIZE) {
                throw new Error(`Response too large (>${MAX_BODY_SIZE / 1024 / 1024}MB)`);
            }

            const html = new TextDecoder('utf-8').decode(arrayBuffer);

            return {
                finalUrl: currentUrl,
                statusCode,
                redirectChain,
                headers: Object.fromEntries(response.headers.entries()),
                html,
                contentType,
            };

        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch ${currentUrl}: ${error.message}`);
            }
            throw error;
        }
    }

    throw new Error(`Too many redirects (>${MAX_REDIRECTS})`);
}

/**
 * Check if response is HTML content
 */
export function isHTMLContent(contentType: string): boolean {
    const lower = contentType.toLowerCase();
    return lower.includes('text/html') || lower.includes('application/xhtml');
}
