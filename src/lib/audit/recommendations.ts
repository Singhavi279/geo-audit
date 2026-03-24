// Recommendations engine

import type { Recommendation, Gates, Evidence } from '../types';

/**
 * Generate prioritized recommendations based on 100-point model
 */
export function generateRecommendations(
    gates: Gates,
    evidence: Evidence
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // --- GATES (Critical) ---
    if (!gates.fetchable) {
        recommendations.push(createRecommendation(
            'crawl', // Maps to Crawl & Arch
            'Fix page fetchability',
            `Page returned status ${evidence.onPage.statusCode}. Ensure the page is accessible and returns 200 OK.`,
            `Status: ${evidence.onPage.statusCode}`,
            5, 5
        ));
    }

    if (!gates.indexable) {
        recommendations.push(createRecommendation(
            'crawl',
            'Remove noindex directive',
            'Page has noindex in robots meta or header, blocking search indexing.',
            `Robots: ${evidence.onPage.robotsMeta.join(', ')}`,
            5, 1
        ));
    }

    if (!gates.mobile_friendly) {
        recommendations.push(createRecommendation(
            'ux',
            'Make page mobile-friendly',
            'Viewport meta tag missing or invalid. Ensure page is optimized for mobile devices.',
            'No valid viewport tag found',
            5, 3
        ));
    }

    // --- 1. CONTENT (28 pts) ---
    if (evidence.content?.primaryIntent === 'unknown') {
        recommendations.push(createRecommendation(
            'content',
            'Clarify primary search intent',
            'Content intent (informational, transactional, etc.) is unclear. optimizing for a specific user goal.',
            'Intent detected: unknown',
            4, 3
        ));
    }

    if (evidence.content?.wordCount && evidence.content.wordCount < 500) {
        recommendations.push(createRecommendation(
            'content',
            'Expand content depth',
            'Content is thin (<500 words). Expand with more details, examples, or comprehensive coverage.',
            `Word count: ${evidence.content.wordCount}`,
            3, 3
        ));
    }

    if (evidence.content && !evidence.content.details.hasSummary && !evidence.content.details.hasTldr) {
        recommendations.push(createRecommendation(
            'content',
            'Add TL;DR or Summary',
            'AI models look for concise summaries at the start of content. Add a TL;DR or key takeaways section.',
            'No summary/TLDR detected',
            4, 2
        ));
    }

    // --- 2. TRUST (18 pts) ---
    if (evidence.trust && !evidence.trust.author.found) {
        recommendations.push(createRecommendation(
            'trust',
            'Add explicit author byline',
            'No clear author detected. Add a visible byline and "Person" schema to establish expertise.',
            'No author found',
            4, 1
        ));
    }

    if (evidence.trust && evidence.trust.citations.externalLinkCount === 0) {
        recommendations.push(createRecommendation(
            'trust',
            'Cite external sources',
            'No external citations found. Link to authoritative sources to build trust and network.',
            '0 external links',
            3, 2
        ));
    }

    // --- 3. CRAWL (16 pts) ---
    if (!gates.canonical_ok) {
        recommendations.push(createRecommendation(
            'crawl',
            'Fix canonical tag',
            'Canonical tag is missing or invalid. Ensure self-referencing canonical exists.',
            `Canonical: ${evidence.onPage.canonical || 'missing'}`,
            4, 1
        ));
    }

    // Technical SEO -> Content/Crawl
    if (!evidence.onPage.title) {
        recommendations.push(createRecommendation(
            'content', // Title is content/relevance
            'Add title tag',
            'Missing title tag. Add a descriptive, unique title (50-60 characters).',
            'No title tag found',
            4,
            1
        ));
    } else if (evidence.onPage.title.length < 20 || evidence.onPage.title.length > 70) {
        recommendations.push(createRecommendation(
            'content',
            'Optimize title length',
            'Title should be 50-60 characters for optimal display in search results.',
            `Current length: ${evidence.onPage.title.length} chars`,
            3,
            1
        ));
    }

    if (!evidence.onPage.metaDescription) {
        recommendations.push(createRecommendation(
            'content',
            'Add meta description',
            'Missing meta description. Add a compelling summary (150-160 characters).',
            'No meta description found',
            4,
            1
        ));
    }

    // --- SEO Deep Dive (Images, Links, Headers) ---
    if (evidence.resources?.images?.altTextMissing && evidence.resources.images.altTextMissing > 0) {
        recommendations.push(createRecommendation(
            'content',
            'Add missing image alt text',
            `Found ${evidence.resources.images.altTextMissing} images without alt text. Add descriptive alt text for accessibility and SEO.`,
            `${evidence.resources.images.altTextMissing} images missing alt tags`,
            3, 2
        ));
    }

    if (evidence.seo?.headerStructure && !evidence.seo.headerStructure.valid) {
        recommendations.push(createRecommendation(
            'content',
            'Fix heading hierarchy',
            'Heading structure is invalid (e.g. skipped levels like H2 -> H4). Maintain a logical outline.',
            evidence.seo.headerStructure.issues[0] || 'Invalid heading structure',
            3, 2
        ));
    }

    if (evidence.seo?.links) {
        if (evidence.seo.links.internal === 0) {
            recommendations.push(createRecommendation(
                'crawl',
                'Add internal links',
                'No internal links found. Internal linking helps search engines and AI agents understand site structure.',
                '0 internal links',
                3, 2
            ));
        }
    }

    // --- 4. SCHEMA (12 pts) ---
    if (evidence.schema.types.length === 0) {
        recommendations.push(createRecommendation(
            'schema',
            'Add structured data',
            'No schema markup detected. Add Article, Product, or Organization schema.',
            'No schema found',
            4, 2
        ));
    } else if (evidence.schema.errors.length > 0) {
        recommendations.push(createRecommendation(
            'schema',
            'Fix schema validation errors',
            'Structured data contains syntax errors. Validate with Schema.org validator.',
            `${evidence.schema.errors.length} errors found`,
            3, 2
        ));
    }

    // --- 5. UX (10 pts) ---
    if (evidence.performance?.lighthouse?.performance && evidence.performance.lighthouse.performance < 0.5) {
        recommendations.push(createRecommendation(
            'ux',
            'Improve Core Web Vitals',
            'Page performance is poor (Lighthouse < 50). Optimize LCP and reduce layout shift.',
            `Score: ${Math.round(evidence.performance.lighthouse.performance * 100)}`,
            4, 4
        ));
    }

    // --- 6. LLM (10 pts) ---
    if (evidence.llm && !evidence.llm.llmsTxt.exists) {
        recommendations.push(createRecommendation(
            'llm',
            'Add /llms.txt file',
            'Create an /llms.txt file to guide AI scrapers to your best content.',
            'File not found (404)',
            3, 1
        ));
    }

    if (evidence.llm && evidence.llm.quotable.shortSentences < 5) {
        recommendations.push(createRecommendation(
            'llm',
            'Improve quotability',
            'Content lacks short, punchy statements. Add definitions or clear distinct claims.',
            'Few short sentences found',
            3, 2
        ));
    }

    // Browser checks (Playwright)
    if (evidence.browser) {
        if (evidence.browser.jsErrors && evidence.browser.jsErrors > 0) {
            recommendations.push({
                category: 'crawl',
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
                recommended_action: 'Resolve all JavaScript errors on page load.',
                implementation_steps: [
                    'Review the console output for JS errors.',
                    'Identify the script causing the error.',
                    'Fix or remove the problematic code.',
                    'Test the page to ensure errors are resolved.'
                ],
                expected_outcome: 'Improves reliability of content rendering for AI crawlers.',
                confidence_score: 95,
                estimated_impact_metric: '+10% AI Crawl Success Rate'
            });
        }

        if (evidence.browser.consoleErrors && evidence.browser.consoleErrors.length > 0 && !evidence.browser.jsErrors) {
            recommendations.push({
                category: 'crawl',
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
                recommended_action: 'Address non-critical console errors.',
                implementation_steps: [
                    'Analyze the warnings and errors in the browser console.',
                    'Determine if they affect critical rendering paths.',
                    'Mitigate or fix the underlying issues.'
                ],
                expected_outcome: 'Cleaner page execution and potentially faster rendering.',
                confidence_score: 80,
                estimated_impact_metric: '+5% AI Crawl Success Rate'
            });
        }

        // If render time is slow
        if (evidence.browser.renderTime && evidence.browser.renderTime > 3000) {
            recommendations.push({
                category: 'ux',
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
                recommended_action: 'Optimize critical rendering path to reduce load time.',
                implementation_steps: [
                    'Minimize main-thread work.',
                    'Reduce JavaScript execution time.',
                    'Optimize or defer non-critical resources.'
                ],
                expected_outcome: 'Lower chance of crawl timeouts and better UX.',
                confidence_score: 90,
                estimated_impact_metric: '+15% Core Web Vitals Score'
            });
        }
    }

    // Provenance
    if (!evidence.citation.details.authorFound) {
        recommendations.push({
            category: 'trust',
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
            recommended_action: 'Add a clear author byline to the page.',
            implementation_steps: [
                'Add an author meta tag `<meta name="author" content="Author Name">`.',
                'Ensure the author name is visibly displayed on the page.',
                'Consider adding a short author bio or link to an author profile.'
            ],
            expected_outcome: 'Increases perceived trustworthiness by AI systems.',
            confidence_score: 90,
            estimated_impact_metric: '+12% E-E-A-T Signal Strength'
        });
    }

    if (!evidence.citation.details.dateFound) {
        recommendations.push({
            category: 'trust',
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
            recommended_action: 'Include explicit publish and update dates.',
            implementation_steps: [
                'Add visible publish and update dates near the content title.',
                'Ensure `datePublished` and `dateModified` properties are in the structured data.'
            ],
            expected_outcome: 'Helps AI models prioritize the content as recent and relevant.',
            confidence_score: 95,
            estimated_impact_metric: '+20% Freshness Score'
        });
    }

    // Sort: gate failures first, then by priority (impact/effort)
    return recommendations.sort((a, b) => {
        // Gate failures always first
        const aIsGate = a.impact === 5 && a.category === 'crawl' && (a.title.includes('fetch') || a.title.includes('index'));
        const bIsGate = b.impact === 5 && b.category === 'crawl' && (b.title.includes('fetch') || b.title.includes('index'));

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
    evidenceStr: string,
    impact: number,
    effort: number
): Recommendation {
    const defaultMatters: Record<string, { ai: string; seo: string }> = {
        content: {
            ai: 'Clear, structured content with summaries is easier for AI to ingest and synthesize.',
            seo: 'High-quality content satisfying user intent ranks better.',
        },
        trust: {
            ai: 'AI systems prioritize content from identifiable, authoritative sources.',
            seo: 'E-E-A-T signals are critical for ranking, especially in YMYL topics.',
        },
        crawl: {
            ai: 'If AI bots cannot crawl your page, they cannot learn from it.',
            seo: 'Technical foundation is required for indexing.',
        },
        schema: {
            ai: 'Schema provides explicit semantic meaning to AI models.',
            seo: 'Enables rich snippets and better entity understanding.',
        },
        ux: {
            ai: 'Slow or broken pages may be skipped by resource-constrained bots.',
            seo: 'Core Web Vitals are a direct ranking factor.',
        },
        llm: {
            ai: 'Specific formats (lists, definitions) increase likelihood of direct citation.',
            seo: 'Improves chances of appearing in featured snippets.',
        },
        discover: {
            ai: 'Visuals and feeds help content travel across multimodal AI platforms.',
            seo: 'Increases visibility in Discover and Image search.',
        }
    };

    // Dynamic mapping for actionable layers based on category and title heuristics
    let recommended_action = `Review and improve ${category} optimization.`;
    let implementation_steps = ['Analyze current setup.', 'Apply best practices.', 'Verify changes.'];
    let expected_outcome = 'Improved visibility and performance.';
    let confidence_score = 80;
    let estimated_impact_metric = '+5% Overall Performance';

    if (category === 'content') {
        recommended_action = 'Enhance content depth and structure.';
        implementation_steps = [
            'Review user intent and ensure content aligns.',
            'Expand thin sections with specific details.',
            'Add a clear summary or TL;DR at the beginning.'
        ];
        expected_outcome = 'Increased likelihood of AI citing the content as a comprehensive source.';
        confidence_score = 85;
        estimated_impact_metric = '+15% AI Citation Likelihood';
    } else if (category === 'trust') {
        recommended_action = 'Strengthen E-E-A-T signals.';
        implementation_steps = [
            'Ensure author credentials are clear and visible.',
            'Cite authoritative external sources.',
            'Make editorial policies accessible.'
        ];
        expected_outcome = 'Higher trust scoring from AI evaluation algorithms.';
        confidence_score = 90;
        estimated_impact_metric = '+10% Trust Score';
    } else if (category === 'schema') {
        recommended_action = 'Implement or fix structured data markup.';
        implementation_steps = [
            'Validate current schema using Schema.org tools.',
            'Add missing entity types (e.g., Article, Organization).',
            'Fix any syntax or validation errors.'
        ];
        expected_outcome = 'Explicit semantic meaning provided to AI models, enhancing entity understanding.';
        confidence_score = 95;
        estimated_impact_metric = '+20% Entity Recognition Rate';
    } else if (category === 'crawl') {
        recommended_action = 'Ensure page is fully accessible to bots.';
        implementation_steps = [
            'Check HTTP status codes and ensure 200 OK.',
            'Review robots.txt and meta robots tags.',
            'Verify canonical tags are correctly implemented.'
        ];
        expected_outcome = 'Content is successfully ingested by AI crawlers without blockers.';
        confidence_score = 99;
        estimated_impact_metric = '+100% Crawlability (if blocked)';
    } else if (category === 'ux') {
         recommended_action = 'Optimize page experience and Core Web Vitals.';
         implementation_steps = [
             'Run Lighthouse audits and address LCP/CLS issues.',
             'Ensure the page is fully responsive/mobile-friendly.',
             'Optimize image and script loading.'
         ];
         expected_outcome = 'Lower bounce rates and improved ranking signals due to better user experience.';
         confidence_score = 85;
         estimated_impact_metric = '+10% Page Experience Score';
    } else if (category === 'llm') {
         recommended_action = 'Format content specifically for LLM extraction.';
         implementation_steps = [
             'Add an `/llms.txt` file outlining key content.',
             'Include short, punchy definitions and quotable statements.',
             'Use clear lists and structured semantic HTML.'
         ];
         expected_outcome = 'Higher frequency of direct citations in LLM-generated answers.';
         confidence_score = 90;
         estimated_impact_metric = '+25% LLM Extractability';
    }

    return {
        category,
        title,
        description,
        evidence: evidenceStr,
        whyItMatters: defaultMatters[category] || { ai: 'Important for optimization', seo: 'Good for ranking' },
        impact,
        effort,
        priority: impact / effort,
        scoreImpact: impact * 2, // simplified
        recommended_action,
        implementation_steps,
        expected_outcome,
        confidence_score,
        estimated_impact_metric
    };
}
