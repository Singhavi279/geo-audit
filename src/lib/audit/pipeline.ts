import { analyzeContent } from './content';
import { analyzeTrust } from './trust';
import { analyzeLLM } from './llm';
// Main audit pipeline orchestrator

import type { AuditInput, AuditResult, Finding } from '../types';
import { normalizeUrl } from './normalize';
import { fetchHTML } from './fetch';
import { extractGates, hasContent } from './gates';
import { checkRobots } from './robots';
import { analyzeSitemap } from './sitemap';
import { extractSchema } from './schema';
import { runPageSpeedInsights } from './performance';
import { getCrUXData } from './crux';
import { analyzeCitationReadiness } from './citation';
import { runAdvancedChecks } from './advanced';
import { runBrowserChecks } from './browser';
import { calculateScores } from '../scoring';
import { generateRecommendations } from './recommendations';

/**
 * Run fast audit checks (HTML, SEO, Schema, Gates)
 * Returns full result with performance/browser as undefined
 */
export async function runFastAudit(input: AuditInput): Promise<AuditResult> {
    const startTime = Date.now();
    console.log('[AUDIT] Starting FAST audit for:', input.url);

    try {
        // Step A: Normalize URL
        const { normalized } = normalizeUrl(input.url);

        // Step B-D-G: Parallel fetch (HTML + robots + sitemap check)
        const [fetchResult, robotsResult] = await Promise.all([
            fetchHTML(normalized),
            checkRobots(normalized),
        ]);

        // Step C: Extract gates and on-page evidence
        const { gates: preliminaryGates, onPage: onPageBase } = extractGates(
            fetchResult.html,
            fetchResult.headers,
            fetchResult.finalUrl,
            fetchResult.statusCode,
            fetchResult.redirectChain
        );

        // 4. Run Analysis (Parallel)
        console.log('[AUDIT] Starting parallel analysis modules...');
        const [
            sitemapResult,
            advanced,
            citation,
            schema,
            content,
            trust,
            llm
        ] = await Promise.all([
            analyzeSitemap(input.sitemapUrl || robotsResult.sitemaps[0], fetchResult.finalUrl, input.deep || false),
            Promise.resolve(runAdvancedChecks(fetchResult)),
            Promise.resolve(analyzeCitationReadiness(fetchResult.html, onPageBase)),
            Promise.resolve(extractSchema(fetchResult.html)),
            Promise.resolve(analyzeContent(fetchResult.html)),
            Promise.resolve(analyzeTrust(fetchResult.html)),
            analyzeLLM(fetchResult.html, fetchResult.finalUrl)
        ]);

        // Merge advanced checks into onPage evidence
        const onPage = {
            ...onPageBase,
            ...advanced.onPage,
        };

        // Combine robots.txt gate with preliminary gates
        const gates = {
            ...preliminaryGates,
            robots_allowed: robotsResult.allowed,
        };

        // Build evidence object (Performance/Browser missing)
        const evidence = {
            onPage,
            performance: undefined,
            performanceError: undefined,
            schema,
            citation,
            resources: advanced.resources,
            seo: advanced.seo,
            browser: undefined,
            content,
            trust,
            llm
        };

        // Calculate scores (Performance will be 0)
        const scores = calculateScores(gates, evidence);

        // Step J: Generate recommendations
        const recommendations = generateRecommendations(gates, evidence);

        // Build findings array
        const findings: Finding[] = [];
        findings.push({ category: 'on-page', type: 'title', value: onPage.title });
        findings.push({ category: 'on-page', type: 'meta_description', value: onPage.metaDescription });
        findings.push({ category: 'on-page', type: 'canonical', value: onPage.canonical });
        findings.push({ category: 'on-page', type: 'h1_count', value: onPage.h1.length });

        // Step E: Sitemap (already run in parallel above if needed, but let's just use the result)
        const sitemapSummary = sitemapResult ? {
            summary: sitemapResult.summary,
            topIssues: sitemapResult.topIssues
        } : undefined;

        const elapsedTime = Date.now() - startTime;
        console.log(`[AUDIT] Fast audit completed in ${elapsedTime}ms`);

        return {
            input,
            scores,
            gates,
            findings,
            evidence,
            recommendations,
            sitemap: sitemapSummary,
            raw: { psi: null, crux: null },
        };

    } catch (error) {
        console.error('Fast audit failed:', error);
        throw error;
    }
}

/**
 * Run expensive audit checks (PSI, CrUX, Browser) in parallel
 * Returns partial evidence to merge
 */
export async function runExpensiveAudit(input: AuditInput): Promise<{
    performance: any;
    performanceError?: string;
    browser: any;
    crux: any;
}> {
    const startTime = Date.now();
    console.log('[AUDIT] Starting EXPENSIVE audit for:', input.url);

    try {
        const { normalized } = normalizeUrl(input.url);

        // PSI handles its own fetching, Browser handles its own.
        // We just need to trigger them.

        // Isolate expensive checks so one slow check doesn't kill the others
        // PSI: 45s timeout (critical)
        // Browser: 10s timeout (fail fast)
        // CrUX: 10s timeout

        const psiPromise = Promise.race([
            runPageSpeedInsights(normalized, 'mobile'),
            new Promise(resolve => setTimeout(() => resolve({ error: 'PSI Timed Out (45s)' }), 45000))
        ]);

        const browserPromise = Promise.race([
            runBrowserChecks(normalized),
            new Promise(resolve => setTimeout(() => resolve(null), 10000)) // Silent fail for browser after 10s
        ]);

        const cruxPromise = Promise.race([
            getCrUXData(normalized),
            new Promise(resolve => setTimeout(() => resolve(null), 10000))
        ]);

        // Run all in parallel
        const [psiResult, browserResult, cruxResult] = await Promise.all([
            psiPromise,
            browserPromise,
            cruxPromise
        ]) as [any, any, any];

        const elapsedTime = Date.now() - startTime;
        console.log(`[AUDIT] Expensive audit completed in ${elapsedTime}ms`);


        return {
            performance: (psiResult && !('error' in psiResult)) ? {
                lighthouse: (psiResult as any).lighthouse,
                metrics: (psiResult as any).metrics,
                opportunities: (psiResult as any).opportunities,
                crux: cruxResult || undefined,
            } : undefined,
            performanceError: (psiResult && 'error' in psiResult) ? (psiResult as any).error : undefined,
            browser: browserResult ? {
                consoleErrors: browserResult.consoleErrors,
                jsErrors: browserResult.jsErrors,
                renderTime: browserResult.renderTime,
                resources: browserResult.resources,
                screenshot: browserResult.screenshot,
            } : undefined,
            crux: cruxResult,
        };

    } catch (error) {
        console.error('Expensive audit failed:', error);
        throw error;
    }
}

/**
 * Legacy wrapper for backward compatibility or serverside full runs
 */
export async function runAudit(input: AuditInput): Promise<AuditResult> {
    // Run fast first
    const fastResult = await runFastAudit(input);

    // Then expensive
    const expensiveResult = await runExpensiveAudit(input);

    // Merge
    fastResult.evidence.performance = expensiveResult.performance;
    fastResult.evidence.performanceError = expensiveResult.performanceError;
    fastResult.evidence.browser = expensiveResult.browser;
    fastResult.raw = { psi: expensiveResult.performance, crux: expensiveResult.crux };

    // Recalculate scores with new evidence
    fastResult.scores = calculateScores(fastResult.gates, fastResult.evidence);

    // Regenerate findings/recommendations if needed (skipped for now as they mostly depend on fast data + PSI metrics)
    // Actually, PSI metrics add findings, so we should add them.
    if (expensiveResult.performance?.metrics?.lcp) {
        fastResult.findings.push({ category: 'performance', type: 'lcp', value: expensiveResult.performance.metrics.lcp });
    }
    if (expensiveResult.performance?.metrics?.cls !== undefined) {
        fastResult.findings.push({ category: 'performance', type: 'cls', value: expensiveResult.performance.metrics.cls });
    }

    return fastResult;
}
