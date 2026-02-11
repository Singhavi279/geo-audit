'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AuditResult } from '@/lib/types';
import ScoreCard from '@/components/ScoreCard';
import TopActions from '@/components/TopActions';
import Recommendations from '@/components/Recommendations';
import Evidence from '@/components/Evidence';
import ExportButtons from '@/components/ExportButtons';
import AuditLoader from '@/components/AuditLoader';
import Link from 'next/link';

export default function ReportContent() {
    const searchParams = useSearchParams();
    const [result, setResult] = useState<AuditResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Antigravity: Ensure body background matches page surface
    useEffect(() => {
        document.body.style.background = 'var(--surface-page)';
    }, []);

    useEffect(() => {
        const runAudit = async () => {
            const url = searchParams.get('url');
            const sitemap = searchParams.get('sitemap');
            const deep = searchParams.get('deep') === 'true';
            const useMock = searchParams.get('mock') === 'true';

            if (!url) {
                setError('No URL provided');
                setLoading(false);
                return;
            }

            try {
                // Use mock endpoint if mock=true in URL
                const endpoint = useMock ? '/api/audit-mock' : '/api/audit';

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        url,
                        sitemapUrl: sitemap || undefined,
                        deep,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Audit failed');
                }

                const data = await response.json();
                console.log('[AUDIT] Full result data:', data);
                console.log('[AUDIT] Performance evidence:', data.evidence?.performance);
                console.log('[AUDIT] Performance score:', data.scores?.performance);
                setResult(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        runAudit();
    }, [searchParams]);



    if (loading) {
        return <AuditLoader />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
                    <div className="text-5xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Audit Failed</h1>
                    <p className="text-gray-700 mb-6">{error}</p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    if (!result) {
        return null;
    }

    return (
        <div className="min-h-screen bg-surface-page font-sans text-text-primary">
            <div className="container mx-auto px-4 py-16 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-block text-text-secondary hover:text-text-primary font-medium mb-6 transition-colors"
                    >
                        ← Run Another Audit
                    </Link>
                    <h1 className="text-6xl font-medium tracking-tighter text-text-primary mb-4">
                        Audit Report
                    </h1>
                    <p className="text-text-tertiary font-mono text-sm break-all opacity-80">
                        {result.evidence.onPage.finalUrl}
                    </p>
                </div>

                {/* Score Card */}
                <div className="mb-8">
                    <ScoreCard scores={result.scores} gates={result.gates} />
                </div>

                {/* Top 3 Actions */}
                <div className="mb-8">
                    <TopActions recommendations={result.recommendations} />
                </div>

                {/* Recommendations */}
                <div className="mb-8">
                    <Recommendations recommendations={result.recommendations} />
                </div>

                {/* Evidence */}
                <div className="mb-8">
                    <Evidence evidence={result.evidence} />
                </div>

                {/* Export */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Export Results</h2>
                    <ExportButtons result={result} />
                </div>

                {/* Locked Premium Panel */}
                <div className="glass-panel p-10 rounded-3xl mt-12 bg-surface-container-low/50 border border-white/20">
                    <h3 className="text-2xl font-medium text-text-primary mb-4 tracking-tight">
                        🔒 Unlock Deep Insights
                    </h3>
                    <p className="text-text-secondary mb-6 max-w-2xl leading-relaxed">
                        Go beyond surface signals. Access our premium suite to track how your content performs across AI platforms and search engines over time.
                    </p>
                    <ul className="text-text-secondary space-y-3 mb-8">
                        <li className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-text-primary"></span>
                            Track citations in AI answers across geos/devices
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-text-primary"></span>
                            Identify citation gaps vs competitors analysis
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-text-primary"></span>
                            Full backlink & topical authority analysis
                        </li>
                    </ul>
                    <button className="px-8 py-3 bg-text-primary text-surface-page rounded-full font-medium hover:bg-black/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                        Join Waitlist
                    </button>
                </div>

                {/* Footer */}
                <footer className="text-center py-16 text-text-tertiary text-sm border-t border-gray-200/50 mt-16">
                    <p className="opacity-60">GEO Audit MVP • Built for the AI-first web</p>
                </footer>
            </div>
        </div>
    );
}
