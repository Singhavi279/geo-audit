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
 * Run complete audit pipeline
 */
export async function runAudit(input: AuditInput): Promise<AuditResult> {
    const startTime = Date.now();

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

        // Run advanced checks (free checks, no API needed)
        const advancedChecks = runAdvancedChecks(fetchResult);

        // Merge advanced checks into onPage evidence
        const onPage = {
            ...onPageBase,
            ...advancedChecks.onPage,
        };

        // Combine robots.txt gate with preliminary gates
        const gates = {
            ...preliminaryGates,
            robots_allowed: robotsResult.allowed,
        };

        // Check if we should skip expensive checks
        const shouldSkipExpensive = !gates.fetchable || !gates.indexable;

        // Step F: Schema extraction (cheap, always run)
        const schemaEvidence = extractSchema(fetchResult.html);

        // Step I: Citation readiness (cheap, always run)
        const citationEvidence = analyzeCitationReadiness(fetchResult.html, onPage);

        // Step G-H: Performance APIs + Browser checks (expensive, conditionally skip)
        let psiResult = null;
        let cruxResult = null;
        let browserResult = null;

        if (!shouldSkipExpensive) {
            // Run PSI, CrUX, and Browser checks in parallel
            [psiResult, cruxResult, browserResult] = await Promise.all([
                runPageSpeedInsights(fetchResult.finalUrl, 'mobile'),
                getCrUXData(fetchResult.finalUrl),
                runBrowserChecks(fetchResult.finalUrl),
            ]);
        }

        // Build evidence object
        const evidence = {
            onPage,
            performance: psiResult ? {
                lighthouse: psiResult.lighthouse,
                metrics: psiResult.metrics,
                opportunities: psiResult.opportunities,
                crux: cruxResult || undefined,
            } : undefined,
            schema: schemaEvidence,
            citation: citationEvidence,
            resources: advancedChecks.resources,
            seo: advancedChecks.seo,
            browser: browserResult ? {
                consoleErrors: browserResult.consoleErrors,
                jsErrors: browserResult.jsErrors,
                renderTime: browserResult.renderTime,
                resources: browserResult.resources,
                screenshot: browserResult.screenshot,
            } : undefined,
        };

        // Calculate scores
        const scores = calculateScores(gates, evidence);

        // Step J: Generate recommendations
        const recommendations = generateRecommendations(gates, evidence);

        // Build findings array
        const findings: Finding[] = [];
        findings.push({ category: 'on-page', type: 'title', value: onPage.title });
        findings.push({ category: 'on-page', type: 'meta_description', value: onPage.metaDescription });
        findings.push({ category: 'on-page', type: 'canonical', value: onPage.canonical });
        findings.push({ category: 'on-page', type: 'h1_count', value: onPage.h1.length });

        if (psiResult?.metrics?.lcp) {
            findings.push({ category: 'performance', type: 'lcp', value: psiResult.metrics.lcp });
        }
        if (psiResult?.metrics?.cls !== undefined) {
            findings.push({ category: 'performance', type: 'cls', value: psiResult.metrics.cls });
        }

        // Step E: Sitemap analysis (optional, run if provided or auto-discover)
        let sitemapSummary = undefined;
        if (input.sitemapUrl || robotsResult.sitemaps.length > 0) {
            const sitemapUrl = input.sitemapUrl || robotsResult.sitemaps[0] || null;
            const sitemapResult = await analyzeSitemap(
                sitemapUrl,
                fetchResult.finalUrl,
                input.deep || false
            );

            if (sitemapResult) {
                sitemapSummary = {
                    summary: sitemapResult.summary,
                    topIssues: sitemapResult.topIssues,
                };
            }
        }

        const elapsedTime = Date.now() - startTime;
        console.log(`Audit completed in ${elapsedTime}ms`);

        // Return result
        const result: AuditResult = {
            input,
            scores,
            gates,
            findings,
            evidence,
            recommendations,
            sitemap: sitemapSummary,
            raw: {
                psi: psiResult,
                crux: cruxResult,
            },
        };

        return result;

    } catch (error) {
        console.error('Audit pipeline failed:', error);
        throw error;
    }
}
