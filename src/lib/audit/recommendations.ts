// Recommendations engine

import type { Recommendation, Gates, Evidence } from '../types';

/**
 * Generate prioritized recommendations
 */
export function generateRecommendations(
    gates: Gates,
    evidence: Evidence
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Gate failures (highest priority)
    if (!gates.fetchable) {
        recommendations.push({
            category: 'technical_seo',
            title: 'Fix page fetchability',
            description: `Page returned status ${evidence.onPage.statusCode}. Ensure the page is accessible and returns 200 OK.`,
            evidence: `Status: ${evidence.onPage.statusCode}`,
            whyItMatters: {
                ai: 'AI systems cannot process or cite pages that are not accessible.',
                seo: '4xx/5xx errors prevent indexing entirely.',
            },
            impact: 5,
            effort: 3,
            priority: 5 / 3,
            scoreImpact: 20,
        });
    }

    if (!gates.indexable) {
        recommendations.push({
            category: 'technical_seo',
            title: 'Remove noindex directive',
            description: 'Page has noindex in robots meta or header, blocking search indexing.',
            evidence: `Robots meta: ${evidence.onPage.robotsMeta.join(', ')} | Header: ${evidence.onPage.robotsHeader || 'none'}`,
            whyItMatters: {
                ai: 'Noindex blocks all search engine indexing, making the page invisible to AI systems.',
                seo: 'Critical: Page will not appear in search results.',
            },
            impact: 5,
            effort: 1,
            priority: 5,
            scoreImpact: 20,
        });
    }

    if (!gates.canonical_ok) {
        recommendations.push({
            category: 'technical_seo',
            title: 'Add or fix canonical tag',
            description: 'Missing or malformed canonical link. Add a valid self-referencing canonical.',
            evidence: `Canonical: ${evidence.onPage.canonical || 'missing'}`,
            whyItMatters: {
                ai: 'Canonicals help AI systems attribute the correct source version.',
                seo: 'Prevents duplicate content issues and consolidates ranking signals.',
            },
            impact: 4,
            effort: 1,
            priority: 4,
            scoreImpact: 15,
        });
    }

    // Technical SEO
    if (!evidence.onPage.title) {
        recommendations.push(createRecommendation(
            'technical_seo',
            'Add title tag',
            'Missing title tag. Add a descriptive, unique title (50-60 characters).',
            'No title tag found',
            4,
            1
        ));
    } else if (evidence.onPage.title.length < 20 || evidence.onPage.title.length > 70) {
        recommendations.push(createRecommendation(
            'technical_seo',
            'Optimize title length',
            'Title should be 50-60 characters for optimal display in search results.',
            `Current length: ${evidence.onPage.title.length} chars`,
            3,
            1
        ));
    }

    if (!evidence.onPage.metaDescription) {
        recommendations.push(createRecommendation(
            'technical_seo',
            'Add meta description',
            'Missing meta description. Add a compelling summary (150-160 characters).',
            'No meta description found',
            4,
            1
        ));
    }

    // Structured data
    if (evidence.schema.types.length === 0) {
        recommendations.push({
            category: 'structured_data',
            title: 'Add structured data (JSON-LD)',
            description: 'No structured data detected. Add relevant schema markup (Article, FAQPage, Organization, etc.).',
            evidence: 'No JSON-LD blocks found',
            whyItMatters: {
                ai: 'Schema helps LLMs identify content type, author, and entity relationships for better citations.',
                seo: 'Enables rich results and improves entity understanding.',
            },
            impact: 4,
            effort: 2,
            priority: 2,
            scoreImpact: 10,
        });
    } else if (!evidence.schema.valid || evidence.schema.errors.length > 0) {
        recommendations.push({
            category: 'structured_data',
            title: 'Fix structured data errors',
            description: 'Schema validation errors detected. Review and fix JSON-LD markup.',
            evidence: `Errors: ${evidence.schema.errors.slice(0, 2).join('; ')}`,
            whyItMatters: {
                ai: 'Invalid schema may be ignored by AI systems.',
                seo: 'Errors prevent rich results eligibility.',
            },
            impact: 3,
            effort: 2,
            priority: 1.5,
            scoreImpact: 5,
        });
    }

    // Performance
    if (evidence.performance?.lighthouse) {
        const perfScore = evidence.performance.lighthouse.performance;
        if (perfScore < 50) {
            recommendations.push({
                category: 'performance',
                title: 'Improve page performance',
                description: 'Low performance score. Focus on LCP, CLS, and reducing blocking resources.',
                evidence: `Performance score: ${perfScore}/100`,
                whyItMatters: {
                    ai: 'Slow pages may timeout during AI crawling or indexing.',
                    seo: 'Performance is a ranking factor; poor CWVs hurt visibility.',
                },
                impact: 4,
                effort: 4,
                priority: 1,
                scoreImpact: 10,
            });
        }

        const lcp = evidence.performance.metrics?.lcp;
        if (lcp && lcp > 2500) {
            recommendations.push({
                category: 'performance',
                title: 'Optimize Largest Contentful Paint (LCP)',
                description: 'LCP exceeds recommended threshold. Optimize images, fonts, and server response time.',
                evidence: `LCP: ${Math.round(lcp)}ms (target: <2500ms)`,
                whyItMatters: {
                    ai: 'Slow loading content may be incomplete during AI crawling.',
                    seo: 'LCP is a Core Web Vital and ranking factor.',
                },
                impact: 4,
                effort: 3,
                priority: 4 / 3,
                scoreImpact: 10,
            });
        }
    }

    // Citation readiness
    if (!evidence.citation.answerFirst) {
        recommendations.push({
            category: 'citation_readiness',
            title: 'Add answer-first content',
            description: 'Start with a clear definition or summary in the first 400-600 characters.',
            evidence: 'No answer-first pattern detected',
            whyItMatters: {
                ai: 'LLMs heavily favor pages that provide direct answers early for citation.',
                seo: 'Featured snippet and AI Overview eligibility.',
            },
            impact: 5,
            effort: 2,
            priority: 2.5,
            scoreImpact: 15,
        });
    }

    if (evidence.citation.details.h1Count === 0) {
        recommendations.push(createRecommendation(
            'citation_readiness',
            'Add H1 heading',
            'Missing H1. Add exactly one H1 that clearly states the page topic.',
            'No H1 found',
            4,
            1
        ));
    } else if (evidence.citation.details.h1Count > 1) {
        recommendations.push(createRecommendation(
            'citation_readiness',
            'Use single H1',
            'Multiple H1s detected. Use exactly one H1 per page for clarity.',
            `Found ${evidence.citation.details.h1Count} H1s`,
            3,
            1
        ));
    }

    if (evidence.citation.details.h2Count < 3) {
        recommendations.push(createRecommendation(
            'citation_readiness',
            'Add more subheadings (H2/H3)',
            'Insufficient heading structure. Add H2/H3 sections to organize content.',
            `H2s: ${evidence.citation.details.h2Count}, H3s: ${evidence.citation.details.h3Count}`,
            3,
            2
        ));
    }

    if (evidence.citation.quotableSpans < 10) {
        recommendations.push({
            category: 'citation_readiness',
            title: 'Increase quotable content',
            description: 'Add more short, standalone sentences and bullet points that can be easily quoted.',
            evidence: `Only ${evidence.citation.quotableSpans} quotable spans found`,
            whyItMatters: {
                ai: 'LLMs prefer short, clear statements for direct citations.',
                seo: 'Improves featured snippet eligibility.',
            },
            impact: 4,
            effort: 2,
            priority: 2,
            scoreImpact: 10,
        });
    }

    if (evidence.citation.jsTrapped) {
        recommendations.push({
            category: 'citation_readiness',
            title: 'Fix JavaScript-trapped content',
            description: 'Content appears to be heavily reliant on JavaScript. Ensure critical content is in HTML.',
            evidence: `SPA markers: ${evidence.citation.details.spaMarkers.join(', ')}`,
            whyItMatters: {
                ai: 'AI crawlers may not execute JavaScript, missing your content entirely.',
                seo: 'Search engines prefer server-rendered content for reliable indexing.',
            },
            impact: 5,
            effort: 5,
            priority: 1,
            scoreImpact: 15,
        });
    }

    // Browser checks (Playwright)
    if (evidence.browser) {
        if (evidence.browser.jsErrors && evidence.browser.jsErrors > 0) {
            recommendations.push({
                category: 'technical_seo',
                title: 'Fix JavaScript errors',
                description: `${evidence.browser.jsErrors} JavaScript error(s) detected during page load. Fix these errors to improve page reliability.`,
                evidence: (evidence.browser.consoleErrors || []).slice(0, 2).join(' | '),
                whyItMatters: {
                    ai: 'JavaScript errors may prevent content from loading properly for AI crawlers.',
                    seo: 'Errors can impact user experience and page functionality.',
                },
                impact: 4,
                effort: 3,
                priority: 4 / 3,
                scoreImpact: 10,
            });
        }

        if (evidence.browser.consoleErrors && evidence.browser.consoleErrors.length > 0 && !evidence.browser.jsErrors) {
            recommendations.push({
                category: 'technical_seo',
                title: 'Review console errors',
                description: `${evidence.browser.consoleErrors.length} console error(s) logged. These may indicate non-critical issues or third-party script failures.`,
                evidence: evidence.browser.consoleErrors.slice(0, 5).join(' | '),
                whyItMatters: {
                    ai: 'Console errors may indicate broken functionality that affects AI crawlers.',
                    seo: 'Clean console logs indicate better page health.',
                },
                impact: 2,
                effort: 2,
                priority: 1,
                scoreImpact: 5,
            });
        }

        // If render time is slow
        if (evidence.browser.renderTime && evidence.browser.renderTime > 3000) {
            recommendations.push({
                category: 'performance',
                title: 'Improve render time',
                description: `Page took ${Math.round(evidence.browser.renderTime / 1000)}s to render. Optimize to under 3 seconds.`,
                evidence: `Render time: ${evidence.browser.renderTime}ms`,
                whyItMatters: {
                    ai: 'Slow rendering may cause timeouts during AI crawling.',
                    seo: 'User experience and Core Web Vitals are affected.',
                },
                impact: 3,
                effort: 4,
                priority: 0.75,
                scoreImpact: 5,
            });
        }
    }

    // Provenance
    if (!evidence.citation.details.authorFound) {
        recommendations.push({
            category: 'provenance',
            title: 'Add author byline',
            description: 'No author detected. Add author meta tag and visible byline.',
            evidence: 'No author found',
            whyItMatters: {
                ai: 'Author attribution increases trust and citation likelihood.',
                seo: 'E-E-A-T signal for content quality.',
            },
            impact: 3,
            effort: 1,
            priority: 3,
            scoreImpact: 5,
        });
    }

    if (!evidence.citation.details.dateFound) {
        recommendations.push({
            category: 'provenance',
            title: 'Add published/updated date',
            description: 'No date detected. Add datePublished and dateModified in schema and visible on page.',
            evidence: 'No date found',
            whyItMatters: {
                ai: 'Dates help AI systems assess content freshness for citations.',
                seo: 'Freshness is a ranking signal.',
            },
            impact: 3,
            effort: 1,
            priority: 3,
            scoreImpact: 5,
        });
    }

    // Sort: gate failures first, then by priority
    return recommendations.sort((a, b) => {
        // Gate failures always first
        const aIsGate = a.impact === 5 && a.title.toLowerCase().includes('fix');
        const bIsGate = b.impact === 5 && b.title.toLowerCase().includes('fix');

        if (aIsGate && !bIsGate) return -1;
        if (!aIsGate && bIsGate) return 1;

        // Then by priority
        return b.priority - a.priority;
    });
}

/**
 * Helper to create a standard recommendation
 */
function createRecommendation(
    category: Recommendation['category'],
    title: string,
    description: string,
    evidence: string,
    impact: number,
    effort: number
): Recommendation {
    const defaultMatters = {
        technical_seo: {
            ai: 'Improves page eligibility for AI indexing and citations.',
            seo: 'Enhances search visibility and ranking potential.',
        },
        performance: {
            ai: 'Faster pages are more reliably crawled and indexed by AI systems.',
            seo: 'Performance is a Core Web Vital and ranking factor.',
        },
        structured_data: {
            ai: 'Helps AI systems understand content type and entities.',
            seo: 'Enables rich results and improves search understanding.',
        },
        citation_readiness: {
            ai: 'Makes content easier for LLMs to extract and cite accurately.',
            seo: 'Improves featured snippet and AI Overview eligibility.',
        },
        provenance: {
            ai: 'Increases trust signals for citation selection.',
            seo: 'Strengthens E-E-A-T (Experience, Expertise, Authoritativeness, Trust).',
        },
    };

    return {
        category,
        title,
        description,
        evidence,
        whyItMatters: defaultMatters[category],
        impact,
        effort,
        priority: impact / effort,
        scoreImpact: impact * 2, // Auto-calculated score impact
    };
}
