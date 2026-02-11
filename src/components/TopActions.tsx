'use client';

import type { Recommendation } from '@/lib/types';

interface TopActionsProps {
    recommendations: Recommendation[];
}

export default function TopActions({ recommendations }: TopActionsProps) {
    const top3 = recommendations.slice(0, 3);

    return (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎯 Top 3 Priority Actions
            </h2>
            <div className="space-y-3">
                {top3.map((rec, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                                #{idx + 1}
                            </span>
                        </div>
                        <p className="text-sm text-gray-700">{rec.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
