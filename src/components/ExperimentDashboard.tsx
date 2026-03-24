'use client';

import { useState, useEffect } from 'react';
import { Experiment, seedMockExperiments, getAllExperiments, startExperiment, completeExperiment } from '@/lib/experiment/experimentManager';

export default function ExperimentDashboard() {
    const [experiments, setExperiments] = useState<Experiment[]>([]);

    useEffect(() => {
        // Ensure mock data exists and load it
        seedMockExperiments();
        setExperiments(getAllExperiments());
    }, []);

    const handleRunExperiment = (id: string) => {
        startExperiment(id, ['Initiated from dashboard']);
        setExperiments(getAllExperiments());
    };

    const handleCompleteExperiment = (id: string) => {
        completeExperiment(id);
        setExperiments(getAllExperiments());
    };

    const renderMetricsDiff = (baseline: number, treatment: number, metricName: string) => {
        const diff = treatment - baseline;
        const percentage = baseline === 0 ? 'N/A' : ((diff / baseline) * 100).toFixed(1) + '%';
        const isPositive = diff > 0;

        return (
            <div className="flex flex-col mb-2">
                <span className="text-xs text-text-tertiary uppercase tracking-wider">{metricName}</span>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-text-primary">{treatment}</span>
                    <span className={`text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? '↑' : '↓'} {Math.abs(diff)} ({percentage})
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-medium tracking-tight text-text-primary mb-6">
                Active Experiments & Outcomes
            </h2>

            <div className="grid grid-cols-1 gap-6">
                {experiments.map(exp => (
                    <div key={exp.id} className="glass-panel p-6 rounded-2xl bg-surface-card border border-white/40">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full ${
                                        exp.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                        exp.status === 'running' ? 'bg-blue-50 text-blue-700' :
                                        'bg-slate-50 text-slate-700'
                                    }`}>
                                        {exp.status}
                                    </span>
                                    {exp.status === 'completed' && (
                                        <span className="text-xs font-medium text-text-secondary bg-surface-container px-2 py-0.5 rounded-full">
                                            {exp.confidenceScore}% Confidence
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-semibold text-text-primary">{exp.recommendationTitle}</h3>
                                <p className="text-sm text-text-secondary mt-1 max-w-2xl">{exp.hypothesis}</p>
                            </div>
                            <div className="shrink-0 flex gap-2">
                                {exp.status === 'planned' && (
                                    <button onClick={() => handleRunExperiment(exp.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                                        Start Experiment
                                    </button>
                                )}
                                {exp.status === 'running' && (
                                    <button onClick={() => handleCompleteExperiment(exp.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
                                        Complete & Measure
                                    </button>
                                )}
                            </div>
                        </div>

                        {exp.status === 'completed' && exp.controlGroupMetrics && exp.treatmentGroupMetrics && (
                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <h4 className="text-sm font-bold text-text-primary mb-4 text-blue-900">📊 Measured Impact</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-container/30 p-4 rounded-xl">
                                    {renderMetricsDiff(exp.controlGroupMetrics.aiVisibilityScore, exp.treatmentGroupMetrics.aiVisibilityScore, 'AI Visibility Score')}
                                    {renderMetricsDiff(exp.controlGroupMetrics.citationCount, exp.treatmentGroupMetrics.citationCount, 'AI Citations')}
                                    {renderMetricsDiff(exp.controlGroupMetrics.organicTraffic, exp.treatmentGroupMetrics.organicTraffic, 'Organic Traffic')}
                                </div>

                                <div className="mt-6 bg-emerald-50/50 rounded-xl p-5 border border-emerald-100">
                                    <h5 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
                                        <span>📝</span> Case Study Summary
                                    </h5>
                                    <p className="text-sm text-emerald-800/80 leading-relaxed">
                                        By applying the recommendation <strong>"{exp.recommendationTitle}"</strong> on {exp.targetUrl}, we observed a
                                        <strong> +{exp.controlGroupMetrics.aiVisibilityScore === 0 ? 'N/A' : ((exp.treatmentGroupMetrics.aiVisibilityScore - exp.controlGroupMetrics.aiVisibilityScore) / exp.controlGroupMetrics.aiVisibilityScore * 100).toFixed(1) + '%'} </strong>
                                        increase in AI visibility over the test period. The result is statistically significant with a confidence score of {exp.confidenceScore}%.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {experiments.length === 0 && (
                    <div className="text-center py-12 bg-surface-container/50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-text-secondary">No active experiments. Start one from your recommendations!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
