// Experimentation Framework

export interface ExperimentMetrics {
    aiVisibilityScore: number;
    citationCount: number;
    organicTraffic: number;
}

export interface Experiment {
    id: string;
    targetUrl: string;
    recommendationTitle: string;
    status: 'planned' | 'running' | 'completed';
    startDate: string;
    endDate?: string;
    controlGroupMetrics?: ExperimentMetrics;
    treatmentGroupMetrics?: ExperimentMetrics;
    confidenceScore: number;
    impactMetric: string;
    hypothesis: string;
    changeLog: string[];
}

// In-memory store for demonstration purposes
const experimentsDB: Map<string, Experiment> = new Map();

/**
 * Creates a new experiment based on a recommendation
 */
export function createExperiment(
    targetUrl: string,
    recommendationTitle: string,
    impactMetric: string,
    hypothesis: string
): Experiment {
    const id = `exp-${Date.now()}`;
    const newExperiment: Experiment = {
        id,
        targetUrl,
        recommendationTitle,
        status: 'planned',
        startDate: new Date().toISOString(),
        confidenceScore: 0,
        impactMetric,
        hypothesis,
        changeLog: []
    };

    experimentsDB.set(id, newExperiment);
    return newExperiment;
}

/**
 * Starts the experiment and logs the initial changes applied
 */
export function startExperiment(id: string, initialChanges: string[]): Experiment | null {
    const experiment = experimentsDB.get(id);
    if (!experiment) return null;

    experiment.status = 'running';
    experiment.changeLog.push(`Experiment started. Initial changes: ${initialChanges.join(', ')}`);

    // Simulate baseline metrics gathering
    experiment.controlGroupMetrics = {
        aiVisibilityScore: Math.floor(Math.random() * 40) + 10, // 10-50
        citationCount: Math.floor(Math.random() * 5),
        organicTraffic: Math.floor(Math.random() * 1000) + 500,
    };

    experimentsDB.set(id, experiment);
    return experiment;
}

/**
 * Completes the experiment and calculates the "after" metrics
 */
export function completeExperiment(id: string): Experiment | null {
    const experiment = experimentsDB.get(id);
    if (!experiment) return null;

    experiment.status = 'completed';
    experiment.endDate = new Date().toISOString();

    // Simulate improvement in metrics based on the hypothesis
    const baseline = experiment.controlGroupMetrics!;

    experiment.treatmentGroupMetrics = {
        aiVisibilityScore: baseline.aiVisibilityScore + Math.floor(Math.random() * 30) + 10, // Ensure positive impact
        citationCount: baseline.citationCount + Math.floor(Math.random() * 5) + 1,
        organicTraffic: baseline.organicTraffic + Math.floor(Math.random() * 500) + 100,
    };

    // Calculate confidence based on sample size/variance (simulated)
    experiment.confidenceScore = Math.floor(Math.random() * 15) + 80; // 80-95%
    experiment.changeLog.push('Experiment completed and metrics gathered.');

    experimentsDB.set(id, experiment);
    return experiment;
}

/**
 * Gets all experiments
 */
export function getAllExperiments(): Experiment[] {
    return Array.from(experimentsDB.values());
}

/**
 * Seed initial mock data for demonstration
 */
export function seedMockExperiments() {
    if (experimentsDB.size > 0) return;

    const exp1 = createExperiment(
        'https://example.com/about',
        'Add explicit author byline',
        '+12% E-E-A-T Signal Strength',
        'Adding an explicit author byline and Person schema will increase AI trust signals.'
    );
    startExperiment(exp1.id, ['Added <meta name="author">', 'Added Person JSON-LD']);
    completeExperiment(exp1.id);

    const exp2 = createExperiment(
        'https://example.com/pricing',
        'Improve Core Web Vitals',
        '+15% Core Web Vitals Score',
        'Optimizing LCP will reduce crawl timeouts for AI agents.'
    );
    startExperiment(exp2.id, ['Deferred non-critical JS', 'Optimized hero image']);
}