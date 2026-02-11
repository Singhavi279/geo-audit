'use client';

import type { Scores, Gates, Evidence } from '@/lib/types';

interface ScoreCardProps {
    scores: Scores;
    gates: Gates;
    evidence?: Evidence;
    processing?: boolean;
}

export default function ScoreCard({ scores, gates, evidence, processing }: ScoreCardProps) {
    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Total Score */}
            <div className="text-center mb-8 border-b pb-8">
                <div className={`text-8xl font-black mb-2 tracking-tighter ${getScoreColor(scores.total)}`}>
                    {scores.total}
                    <span className="text-3xl text-gray-300 font-normal">/100</span>
                </div>
                <div className="text-gray-500 uppercase tracking-widest text-sm font-semibold">Citation Readiness Score</div>
            </div>

            {/* Sub-scores Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <ScoreItem
                    label="Content & Intent"
                    score={scores.content_intent}
                    max={28}
                    icon="📝"
                    color={getScoreColor((scores.content_intent / 28) * 100)}
                />
                <ScoreItem
                    label="Trust & E-E-A-T"
                    score={scores.trust_eat}
                    max={18}
                    icon="🛡️"
                    color={getScoreColor((scores.trust_eat / 18) * 100)}
                />
                <ScoreItem
                    label="Crawl & Arch"
                    score={scores.crawl_architecture}
                    max={16}
                    icon="🕸️"
                    color={getScoreColor((scores.crawl_architecture / 16) * 100)}
                />
                <ScoreItem
                    label="Structured Data"
                    score={scores.structured_data}
                    max={12}
                    icon="🏗️"
                    color={getScoreColor((scores.structured_data / 12) * 100)}
                />
                <ScoreItem
                    label="Page Experience"
                    score={scores.page_experience}
                    max={10}
                    icon="⚡"
                    color={getScoreColor((scores.page_experience / 10) * 100)}
                />
                <ScoreItem
                    label="Extractability"
                    score={scores.llm_extractability}
                    max={10}
                    icon="🤖"
                    color={getScoreColor((scores.llm_extractability / 10) * 100)}
                />
                <ScoreItem
                    label="Discover"
                    score={scores.discover_readiness}
                    max={6}
                    icon="📰"
                    color={getScoreColor((scores.discover_readiness / 6) * 100)}
                />
            </div>

            {/* Gates */}
            <div className="bg-gray-50 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-center">
                <span className="text-xs font-bold text-gray-400 uppercase mr-2">Critical Gates:</span>
                <GateStatus label="Fetchable" status={gates.fetchable} />
                <GateStatus label="Indexable" status={gates.indexable} />
                <GateStatus label="Canonical" status={gates.canonical_ok} />
                <GateStatus label="Mobile" status={gates.mobile_friendly} />
            </div>
        </div>
    );
}

function ScoreItem({ label, score, max, icon, color }: { label: string, score: number, max: number, icon: string, color: string }) {
    return (
        <div className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-2xl mb-1">{icon}</span>
            <div className={`text-2xl font-bold ${color}`}>
                {score}<span className="text-gray-300 text-sm font-normal">/{max}</span>
            </div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide text-center mt-1">{label}</div>
        </div>
    );
}

function GateStatus({ label, status }: { label: string, status: boolean }) {
    return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${status ? 'bg-white border-green-200 text-green-700 shadow-sm' : 'bg-red-50 border-red-100 text-red-600'}`}>
            {status ? '✓' : '✗'} {label}
        </span>
    );
}
