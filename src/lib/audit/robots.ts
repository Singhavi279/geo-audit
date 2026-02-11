// Robots.txt parser and checker

import type { RobotsResult } from '../types';
import { getBaseUrl } from './normalize';

/**
 * Fetch and parse robots.txt for a URL
 */
export async function checkRobots(url: string): Promise<RobotsResult> {
    try {
        const baseUrl = getBaseUrl(url);
        const robotsUrl = `${baseUrl}/robots.txt`;

        const response = await fetch(robotsUrl, {
            headers: {
                'User-Agent': process.env.USER_AGENT || 'GEOAuditBot/0.1',
            },
        });

        if (!response.ok) {
            // No robots.txt or error - default to allowed
            return {
                allowed: true,
                sitemaps: [],
            };
        }

        const robotsText = await response.text();
        const result = parseRobotsTxt(robotsText, url);

        return result;
    } catch (error) {
        // Error fetching robots.txt - default to allowed
        return {
            allowed: true,
            sitemaps: [],
        };
    }
}

/**
 * Parse robots.txt content
 */
function parseRobotsTxt(robotsText: string, url: string): RobotsResult {
    const lines = robotsText.split('\n');
    const sitemaps: string[] = [];
    const disallowRules: string[] = [];
    let isWildcardAgent = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip comments and empty lines
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        // Parse User-agent
        if (trimmed.toLowerCase().startsWith('user-agent:')) {
            const agent = trimmed.substring('user-agent:'.length).trim();
            isWildcardAgent = agent === '*';
            continue;
        }

        // Collect sitemap directives
        if (trimmed.toLowerCase().startsWith('sitemap:')) {
            const sitemapUrl = trimmed.substring('sitemap:'.length).trim();
            if (sitemapUrl && !sitemaps.includes(sitemapUrl)) {
                sitemaps.push(sitemapUrl);
            }
            continue;
        }

        // Collect Disallow rules for * user-agent
        if (isWildcardAgent && trimmed.toLowerCase().startsWith('disallow:')) {
            const path = trimmed.substring('disallow:'.length).trim();
            if (path) {
                disallowRules.push(path);
            }
        }
    }

    // Check if URL is allowed
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const allowed = isPathAllowed(pathname, disallowRules);

    return {
        allowed,
        sitemaps,
    };
}

/**
 * Check if a path is allowed based on Disallow rules
 */
function isPathAllowed(pathname: string, disallowRules: string[]): boolean {
    for (const rule of disallowRules) {
        // Simple prefix matching (not full robots.txt spec, but good enough for MVP)
        if (pathname.startsWith(rule)) {
            return false;
        }

        // Wildcard matching (basic)
        if (rule.includes('*')) {
            const pattern = rule.replace(/\*/g, '.*');
            const regex = new RegExp(`^${pattern}`);
            if (regex.test(pathname)) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Parse robots meta tag content
 */
export function parseRobotsMeta(content: string): string[] {
    const directives = content
        .toLowerCase()
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0);

    return directives;
}

/**
 * Check if robots directives contain noindex
 */
export function hasNoIndex(directives: string[]): boolean {
    return directives.includes('noindex');
}

/**
 * Check if robots directives contain nofollow
 */
export function hasNoFollow(directives: string[]): boolean {
    return directives.includes('nofollow');
}
