// Browser-based checks using Playwright (optional, runs only in development/local)
// These checks require a browser runtime and may not work on serverless platforms

import type { ResourceEvidence } from '../types';

interface BrowserChecks {
    consoleErrors: string[];
    screenshot?: string; // Base64 encoded screenshot
    renderTime?: number;
    jsErrors: number;
    resources?: {
        actualLoaded: number;
        failed: number;
        totalSize: number;
    };
}

/**
 * Run browser-based checks (optional, may be disabled in production)
 * Returns null if browser automation is not available or disabled
 */
export async function runBrowserChecks(url: string): Promise<BrowserChecks | null> {
    // Check if we should skip browser checks (e.g., in production/serverless)
    if (process.env.SKIP_BROWSER_CHECKS === 'true') {
        return null;
    }

    try {
        // Dynamic import to avoid loading Playwright if not needed
        const playwright = await import('playwright-core');

        // Try to use system Chrome first (faster), fallback to Chromium
        let browser;
        try {
            browser = await playwright.chromium.launch({
                channel: 'chrome', // Use system Chrome if available
                headless: true,
            });
        } catch {
            // If system Chrome not available, user needs to install browsers
            console.warn('Browser checks skipped: No browser binary found. Run `npx playwright install chromium` to enable.');
            return null;
        }

        const context = await browser.newContext({
            viewport: { width: 375, height: 667 }, // Mobile viewport
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        });

        const page = await context.newPage();

        // Collect console messages
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Collect JavaScript errors
        let jsErrors = 0;
        page.on('pageerror', error => {
            jsErrors++;
            consoleErrors.push(`JS Error: ${error.message}`);
        });

        // Track resource loading
        const failedResources: string[] = [];
        let totalSize = 0;
        let loadedCount = 0;

        page.on('response', async response => {
            loadedCount++;
            try {
                const body = await response.body();
                totalSize += body.length;
            } catch {
                // Ignore errors getting body
            }

            if (!response.ok()) {
                failedResources.push(response.url());
            }
        });

        // Navigate and measure render time
        const startTime = Date.now();
        try {
            await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 15000, // 15s timeout
            });
        } catch (error) {
            console.error('Browser navigation failed:', error);
            await browser.close();
            return null;
        }
        const renderTime = Date.now() - startTime;

        // Take mobile screenshot (optional, can be heavy)
        let screenshot: string | undefined;
        if (process.env.CAPTURE_SCREENSHOTS === 'true') {
            const buffer = await page.screenshot({ fullPage: false });
            screenshot = buffer.toString('base64');
        }

        await browser.close();

        return {
            consoleErrors: consoleErrors.slice(0, 10), // Limit to first 10 errors
            screenshot,
            renderTime,
            jsErrors,
            resources: {
                actualLoaded: loadedCount,
                failed: failedResources.length,
                totalSize: Math.round(totalSize / 1024), // KB
            },
        };

    } catch (error) {
        console.error('Browser checks failed:', error);
        return null;
    }
}

/**
 * Simpler check that just tests if the URL loads without errors
 * Much faster than full browser checks
 */
export async function quickBrowserCheck(url: string): Promise<{ hasConsoleErrors: boolean; jsErrorCount: number } | null> {
    if (process.env.SKIP_BROWSER_CHECKS === 'true') {
        return null;
    }

    try {
        const playwright = await import('playwright-core');

        let browser;
        try {
            browser = await playwright.chromium.launch({
                channel: 'chrome',
                headless: true,
            });
        } catch {
            return null;
        }

        const context = await browser.newContext();
        const page = await context.newPage();

        let hasConsoleErrors = false;
        let jsErrorCount = 0;

        page.on('console', msg => {
            if (msg.type() === 'error') {
                hasConsoleErrors = true;
            }
        });

        page.on('pageerror', () => {
            jsErrorCount++;
        });

        try {
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 10000,
            });

            // Wait a bit for JS to execute
            await page.waitForTimeout(2000);
        } catch (error) {
            console.error('Quick browser check failed:', error);
        }

        await browser.close();

        return {
            hasConsoleErrors,
            jsErrorCount,
        };

    } catch (error) {
        return null;
    }
}
