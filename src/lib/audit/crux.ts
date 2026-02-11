// Chrome UX Report (CrUX) API integration - MAXIMUM EXTRACTION
// Based on official documentation: https://developer.chrome.com/docs/crux/api
// Extracts ALL 12 available metrics with full percentiles and distributions

export interface CrUXMetric {
    p75: number;
    p50?: number;
    p25?: number;
    good?: number; // Percentage in "good" range
    needsImprovement?: number; // Percentage in "needs improvement" range
    poor?: number; // Percentage in "poor" range
}

export interface CrUXResult {
    // Core Web Vitals
    lcp?: CrUXMetric; // largest_contentful_paint
    cls?: CrUXMetric; // cumulative_layout_shift
    inp?: CrUXMetric; // interaction_to_next_paint
    fcp?: CrUXMetric; // first_contentful_paint
    ttfb?: CrUXMetric; // experimental_time_to_first_byte

    // LCP Breakdown Metrics
    lcpResourceType?: { [key: string]: number }; // Resource type fractions
    lcpImageTTFB?: CrUXMetric; // largest_contentful_paint_image_time_to_first_byte
    lcpImageLoadDelay?: CrUXMetric; // largest_contentful_paint_image_resource_load_delay
    lcpImageLoadDuration?: CrUXMetric; // largest_contentful_paint_image_resource_load_duration
    lcpImageRenderDelay?: CrUXMetric; // largest_contentful_paint_image_element_render_delay

    // Network & Navigation
    navigationTypes?: { [key: string]: number }; // Navigation type fractions
    roundTripTime?: CrUXMetric; // round_trip_time
    formFactors?: { [key: string]: number }; // Form factor distribution (only when formFactor not specified)

    // Metadata
    formFactor?: 'PHONE' | 'DESKTOP' | 'TABLET' | 'ALL';
    collectionPeriod?: {
        firstDate: string;
        lastDate: string;
    };
}

/**
 * Get CrUX field data for a URL with ALL 13 available metrics
 * Per official docs: if metrics array is NOT specified, ALL metrics are returned automatically
 */
export async function getCrUXData(url: string): Promise<CrUXResult | null> {
    const apiKey = process.env.GOOGLE_CRUX_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY;

    if (!apiKey) {
        console.warn('[CrUX] API key not found - skipping CrUX');
        return null;
    }

    try {
        const apiUrl = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${apiKey}`;

        // Per official docs: omit 'metrics' array to get ALL 13 metrics automatically
        // Try multiple strategies to get data
        const strategies = [
            // 1. URL-level, mobile
            { url, formFactor: 'PHONE' },
            // 2. Origin-level, mobile
            { origin: new URL(url).origin, formFactor: 'PHONE' },
            // 3. URL-level, all devices (gets form_factors metric)
            { url },
            // 4. Origin-level, all devices (gets form_factors metric)
            { origin: new URL(url).origin },
        ];

        let data: any = null;
        let usedStrategy: any = null;

        for (const strategy of strategies) {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(strategy),
            });

            if (response.ok) {
                data = await response.json();
                usedStrategy = strategy;
                console.log('[CrUX] Data found using:', strategy.formFactor || 'ALL',
                    strategy.url ? 'URL' : 'ORIGIN');
                break;
            }
        }

        if (!data) {
            console.warn('[CrUX] No data available after trying all strategies');
            return null;
        }

        // Extract all metrics
        const metrics = data.record?.metrics || {};
        const result: CrUXResult = {};

        // Helper to extract histogram+percentiles metrics
        const extractMetric = (metricData: any): CrUXMetric | undefined => {
            if (!metricData || !metricData.percentiles) return undefined;

            const percentiles = metricData.percentiles || {};
            const histogram = metricData.histogram || [];

            // Calculate distribution percentages from histogram
            let good = 0;
            let needsImprovement = 0;
            let poor = 0;

            if (histogram.length >= 3) {
                good = histogram[0].density || 0;
                needsImprovement = histogram[1]?.density || 0;
                poor = histogram[2]?.density || 0;
            } else if (histogram.length === 2) {
                good = histogram[0].density || 0;
                poor = histogram[1].density || 0;
            }

            return {
                p75: percentiles.p75 || 0,
                p50: percentiles.p50,
                p25: percentiles.p25,
                good: good > 0 ? Math.round(good * 100) : undefined,
                needsImprovement: needsImprovement > 0 ? Math.round(needsImprovement * 100) : undefined,
                poor: poor > 0 ? Math.round(poor * 100) : undefined,
            };
        };

        // Helper to extract fraction-based metrics (navigation types, LCP resource type)
        const extractFractions = (metricData: any): { [key: string]: number } | undefined => {
            if (!metricData || !metricData.fractions) return undefined;

            const result: { [key: string]: number } = {};
            for (const [key, value] of Object.entries(metricData.fractions)) {
                result[key] = Math.round((value as number) * 100);
            }
            return Object.keys(result).length > 0 ? result : undefined;
        };

        // Extract Core Web Vitals
        if (metrics.largest_contentful_paint) {
            result.lcp = extractMetric(metrics.largest_contentful_paint);
        }

        if (metrics.cumulative_layout_shift) {
            result.cls = extractMetric(metrics.cumulative_layout_shift);
        }

        if (metrics.interaction_to_next_paint) {
            result.inp = extractMetric(metrics.interaction_to_next_paint);
        }

        if (metrics.first_contentful_paint) {
            result.fcp = extractMetric(metrics.first_contentful_paint);
        }

        if (metrics.experimental_time_to_first_byte) {
            result.ttfb = extractMetric(metrics.experimental_time_to_first_byte);
        }

        // Extract LCP Breakdown Metrics (NEW!)
        if (metrics.largest_contentful_paint_resource_type) {
            result.lcpResourceType = extractFractions(metrics.largest_contentful_paint_resource_type);
        }

        if (metrics.largest_contentful_paint_image_time_to_first_byte) {
            result.lcpImageTTFB = extractMetric(metrics.largest_contentful_paint_image_time_to_first_byte);
        }

        if (metrics.largest_contentful_paint_image_resource_load_delay) {
            result.lcpImageLoadDelay = extractMetric(metrics.largest_contentful_paint_image_resource_load_delay);
        }

        if (metrics.largest_contentful_paint_image_resource_load_duration) {
            result.lcpImageLoadDuration = extractMetric(metrics.largest_contentful_paint_image_resource_load_duration);
        }

        if (metrics.largest_contentful_paint_image_element_render_delay) {
            result.lcpImageRenderDelay = extractMetric(metrics.largest_contentful_paint_image_element_render_delay);
        }

        // Extract Navigation Types
        if (metrics.navigation_types) {
            result.navigationTypes = extractFractions(metrics.navigation_types);
        }

        // Extract Round Trip Time
        if (metrics.round_trip_time) {
            result.roundTripTime = extractMetric(metrics.round_trip_time);
        }

        // Extract Form Factors (only present when formFactor not specified in request)
        if (metrics.form_factors) {
            result.formFactors = extractFractions(metrics.form_factors);
        }

        // Add metadata
        result.formFactor = (usedStrategy.formFactor as any) || 'ALL';

        if (data.record?.collectionPeriod) {
            const first = data.record.collectionPeriod.firstDate;
            const last = data.record.collectionPeriod.lastDate;
            result.collectionPeriod = {
                firstDate: `${first.year}-${String(first.month).padStart(2, '0')}-${String(first.day).padStart(2, '0')}`,
                lastDate: `${last.year}-${String(last.month).padStart(2, '0')}-${String(last.day).padStart(2, '0')}`,
            };
        }

        const extractedCount = Object.keys(result).filter(k => !['formFactor', 'collectionPeriod'].includes(k)).length;
        console.log(`[CrUX] Extracted ${extractedCount}/12 available metrics`);

        return Object.keys(result).length > 0 ? result : null;

    } catch (error) {
        console.error('[CrUX] Failed to fetch data:', error);
        return null;
    }
}
