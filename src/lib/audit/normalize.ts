// URL normalization utilities

export interface NormalizeResult {
    normalized: string;
    canonical: string;
    hasScheme: boolean;
    protocol: string;
    host: string;
    pathname: string;
}

/**
 * Normalize a URL for auditing
 * - Add https:// if missing
 * - Strip hash fragments
 * - Keep query parameters
 * - Return normalized URL and canonical candidate
 */
export function normalizeUrl(rawUrl: string): NormalizeResult {
    let normalized = rawUrl.trim();

    // Add scheme if missing
    const hasScheme = /^https?:\/\//i.test(normalized);
    if (!hasScheme) {
        normalized = `https://${normalized}`;
    }

    try {
        const url = new URL(normalized);

        // Remove hash fragment
        url.hash = '';

        // Get components
        const protocol = url.protocol.replace(':', '');
        const host = url.host;
        const pathname = url.pathname;

        // Canonical candidate (without query params for canonical comparison)
        const canonicalUrl = new URL(normalized);
        canonicalUrl.hash = '';
        canonicalUrl.search = '';
        const canonical = canonicalUrl.toString();

        return {
            normalized: url.toString(),
            canonical,
            hasScheme,
            protocol,
            host,
            pathname,
        };
    } catch (error) {
        throw new Error(`Invalid URL: ${rawUrl}`);
    }
}

/**
 * Check if a URL is valid
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get the base URL (protocol + host)
 */
export function getBaseUrl(url: string): string {
    try {
        const parsed = new URL(url);
        return `${parsed.protocol}//${parsed.host}`;
    } catch {
        throw new Error(`Invalid URL: ${url}`);
    }
}

/**
 * Resolve a relative URL against a base URL
 */
export function resolveUrl(base: string, relative: string): string {
    try {
        return new URL(relative, base).toString();
    } catch {
        return relative;
    }
}
