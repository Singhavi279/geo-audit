'use client';

import type { Scores, Gates, Evidence } from '@/lib/types';

interface ScoreCardProps {
    scores: Scores;
    gates: Gates;
    evidence?: Evidence;
    processing?: boolean;
}

export default function ScoreCard({ scores, gates, evidence, processing }: ScoreCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 50) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Total Score */}
            <div className="text-center mb-8">
                <div className={`text-7xl font-bold ${getScoreColor(scores.total)} mb-2`}>
                    {scores.total}
                </div>
                <div className="text-gray-600 text-lg">Overall Score</div>
            </div>

            {/* Sub-scores */}
            <div className="grid md:grid-cols-5 gap-4 mb-8">
                <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor((scores.technical_seo / 25) * 100)}`}>
                        {scores.technical_seo}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Technical SEO</div>
                    <div className="text-xs text-gray-500">/25</div>
                </div>

                <div className="text-center group relative">
                    <div className={`text-3xl font-bold ${evidence?.performance ? getScoreColor((scores.performance / 20) * 100) : 'text-gray-400'}`}>
                        {processing ? (
                            <span className="inline-block animate-pulse">...</span>
                        ) : (
                            evidence?.performance ? scores.performance : '-'
                        )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                        Performance
                        {processing && <span className="ml-1 text-blue-500 animate-spin inline-block">↻</span>}
                        {evidence?.performanceError && (
                            <span className="ml-1 text-red-500 cursor-help" title={evidence.performanceError}>⚠️</span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">/20</div>

                    {/* Tooltip for error */}
                    {evidence?.performanceError && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            {evidence.performanceError}
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor((scores.structured_data / 15) * 100)}`}>
                        {scores.structured_data}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Structured Data</div>
                    <div className="text-xs text-gray-500">/15</div>
                </div>

                <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor((scores.citation_readiness / 30) * 100)}`}>
                        {scores.citation_readiness}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Citation Ready</div>
                    <div className="text-xs text-gray-500">/30</div>
                </div>

                <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor((scores.provenance / 10) * 100)}`}>
                        {scores.provenance}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Provenance</div>
                    <div className="text-xs text-gray-500">/10</div>
                </div>
            </div>

            {/* Gates */}
            <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Eligibility Gates</h3>
                <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${gates.fetchable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {gates.fetchable ? '✓' : '✗'} Fetchable
                    </span>

                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${gates.indexable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {gates.indexable ? '✓' : '✗'} Indexable
                    </span>

                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${gates.canonical_ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {gates.canonical_ok ? '✓' : '✗'} Canonical OK
                    </span>

                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${gates.crawl_ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {gates.crawl_ok ? '✓' : '✗'} Crawl OK
                    </span>
                </div>
            </div>
        </div>
    );
}
