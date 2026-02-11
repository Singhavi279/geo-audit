'use client';

import type { AuditResult } from '@/lib/types';

interface ExportButtonsProps {
    result: AuditResult;
}

export default function ExportButtons({ result }: ExportButtonsProps) {
    const handleExportJSON = () => {
        const dataStr = JSON.stringify(result, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `geo-audit-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        // CSV for recommendations
        const headers = [
            'Category',
            'Title',
            'Description',
            'Impact',
            'Effort',
            'Priority',
            'Evidence',
            'Why_it_matters_AI',
            'Why_it_matters_SEO',
            'Affected_URL',
        ];

        const rows = result.recommendations.map(rec => [
            rec.category,
            rec.title,
            rec.description.replace(/"/g, '""'), // Escape quotes
            rec.impact,
            rec.effort,
            rec.priority.toFixed(2),
            rec.evidence.replace(/"/g, '""'),
            rec.whyItMatters.ai.replace(/"/g, '""'),
            rec.whyItMatters.seo.replace(/"/g, '""'),
            result.evidence.onPage.finalUrl,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        const dataBlob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `geo-audit-recommendations-${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-wrap gap-4">
            <button
                onClick={handleExportJSON}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
                📥 Download JSON
            </button>
            <button
                onClick={handleExportCSV}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
                📊 Download CSV (Recommendations)
            </button>
        </div>
    );
}
