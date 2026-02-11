'use client';

import { useState } from 'react';
import type { Recommendation } from '@/lib/types';

interface RecommendationsProps {
    recommendations: Recommendation[];
}

export default function Recommendations({ recommendations }: RecommendationsProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Helper to map numeric impact to string label
    const getImpactLevel = (impact: number): 'High' | 'Medium' | 'Low' => {
        if (impact >= 4) return 'High';
        if (impact >= 2.5) return 'Medium';
        return 'Low';
    };

    // Antigravity Design: Empowering Copy & Clean UI
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-medium tracking-tight text-text-primary">
                Optimization Opportunities
            </h2>

            <div className="grid grid-cols-1 gap-6">
                {recommendations.map((rec, index) => {
                    const impactLevel = getImpactLevel(rec.impact);

                    return (
                        <div
                            key={index}
                            className={`
                                group glass-panel p-6 rounded-2xl bg-surface-card border border-white/40
                                hover:bg-white transition-all duration-300 ease-out-quint border-l-4
                                ${impactLevel === 'High' ? 'border-l-rose-400' :
                                    impactLevel === 'Medium' ? 'border-l-amber-400' :
                                        'border-l-blue-400'}
                            `}
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`
                                            text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                                            ${rec.category === 'content' ? 'bg-emerald-50 text-emerald-700' :
                                                rec.category === 'trust' ? 'bg-blue-50 text-blue-700' :
                                                    rec.category === 'crawl' ? 'bg-slate-50 text-slate-700' :
                                                        rec.category === 'schema' ? 'bg-purple-50 text-purple-700' :
                                                            rec.category === 'ux' ? 'bg-amber-50 text-amber-700' :
                                                                rec.category === 'llm' ? 'bg-indigo-50 text-indigo-700' :
                                                                    'bg-rose-50 text-rose-700'}
                                        `}>
                                            {rec.category.replace(/_/g, ' ')}
                                        </span>
                                        <span className={`
                                            text-xs font-semibold uppercase tracking-wider
                                            ${impactLevel === 'High' ? 'text-rose-600' :
                                                impactLevel === 'Medium' ? 'text-amber-600' :
                                                    'text-blue-600'}
                                        `}>
                                            {impactLevel} Impact
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-blue-600 transition-colors">
                                        {rec.title}
                                    </h3>
                                </div>
                                <div className="shrink-0 bg-surface-container px-3 py-1 rounded-lg text-xs font-mono text-text-tertiary">
                                    +{rec.scoreImpact || 0} pts
                                </div>
                            </div>

                            <p className="text-text-secondary leading-relaxed mb-4">
                                {rec.description}
                            </p>

                            <div className="bg-surface-container/50 rounded-xl p-4 border border-white/60">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-text-primary mb-1">
                                            💡 Why this matters for AI:
                                        </p>
                                        <p className="text-sm text-text-secondary">
                                            {rec.whyItMatters?.ai || "Improves clarity and structure for LLM parsers."}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-text-primary mb-1">
                                            🔍 SEO Impact:
                                        </p>
                                        <p className="text-sm text-text-secondary">
                                            {rec.whyItMatters?.seo || "Boosts organic rankings."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
