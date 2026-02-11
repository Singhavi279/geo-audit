'use client';

import { useState } from 'react';
import type { Evidence } from '@/lib/types';

interface EvidenceProps {
    evidence: Evidence;
}

export default function Evidence({ evidence }: EvidenceProps) {
    const [activeTab, setActiveTab] = useState<'onpage' | 'performance' | 'schema' | 'citation' | 'browser'>('onpage');

    return (
        <div className="glass-panel p-8 rounded-3xl bg-surface-card border border-white/40 shadow-sm">
            <h2 className="text-2xl font-medium tracking-tight text-text-primary mb-8">Evidence & Details</h2>

            {/* Antigravity Tabs */}
            <div className="flex gap-2 mb-8 p-1.5 bg-surface-container rounded-full w-fit">
                {(['onpage', 'performance', 'schema', 'citation'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-out-quint
                            ${activeTab === tab
                                ? 'bg-white text-text-primary shadow-sm ring-1 ring-black/5'
                                : 'text-text-tertiary hover:text-text-secondary hover:bg-white/50'}
                        `}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div className="bg-surface-container/30 rounded-2xl border border-white/50 p-6 min-h-[300px]">
                {/* On-Page Content */}
                {activeTab === 'onpage' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Title Tag</label>
                            <p className="text-text-primary font-medium leading-relaxed">{evidence.onPage.title || '—'}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Meta Description</label>
                            <p className="text-text-secondary leading-relaxed">{evidence.onPage.metaDescription || '—'}</p>
                        </div>
                        <div className="space-y-1 col-span-full">
                            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Canonical URL</label>
                            <p className="font-mono text-sm text-text-secondary bg-surface-container p-2 rounded-lg break-all">
                                {evidence.onPage.canonical || '—'}
                            </p>
                        </div>
                        <div className="flex gap-8">
                            <div>
                                <label className="text-xs font-semibold text-text-tertiary uppercase">H1 Count</label>
                                <p className="text-2xl font-semibold text-text-primary mt-1">{evidence.onPage.h1.length}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-text-tertiary uppercase">Total H2s</label>
                                <p className="text-2xl font-semibold text-text-primary mt-1">{evidence.onPage.h2Count}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-text-tertiary uppercase">Total H3s</label>
                                <p className="text-2xl font-semibold text-text-primary mt-1">{evidence.onPage.h3Count}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Performance Content */}
                {activeTab === 'performance' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {evidence.performance?.lighthouse ? (
                            <>
                                <div className="p-4 bg-white rounded-xl border border-white/60 shadow-sm text-center">
                                    <div className="text-3xl font-bold text-text-primary mb-1">
                                        {evidence.performance.lighthouse.performance}
                                    </div>
                                    <div className="text-xs text-text-tertiary uppercase font-medium">Performance</div>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-white/60 shadow-sm text-center">
                                    <div className="text-3xl font-bold text-text-primary mb-1">
                                        {evidence.performance.lighthouse.seo}
                                    </div>
                                    <div className="text-xs text-text-tertiary uppercase font-medium">SEO</div>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-white/60 shadow-sm text-center">
                                    <div className="text-3xl font-bold text-text-primary mb-1">
                                        {Math.round(evidence.performance?.metrics?.lcp || 0)}ms
                                    </div>
                                    <div className="text-xs text-text-tertiary uppercase font-medium">LCP</div>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-white/60 shadow-sm text-center">
                                    <div className="text-3xl font-bold text-text-primary mb-1">
                                        {evidence.performance?.metrics?.cls?.toFixed(3) || 0}
                                    </div>
                                    <div className="text-xs text-text-tertiary uppercase font-medium">CLS</div>
                                </div>
                            </>
                        ) : (
                            <p className="text-text-tertiary italic col-span-full text-center py-12">No performance data available.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Structured Data Content */}
            {activeTab === 'schema' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-surface-container rounded-2xl border border-white/50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Schema Validity</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${evidence.schema.valid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {evidence.schema.valid ? 'Valid' : 'Invalid'}
                            </span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-text-tertiary uppercase">Types Detected</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {evidence.schema.types.length ? evidence.schema.types.map((type, i) => (
                                        <span key={i} className="px-3 py-1 bg-white border border-gray-100 rounded-md text-sm text-text-primary font-mono">
                                            {type}
                                        </span>
                                    )) : <span className="text-text-tertiary italic">No schema types found</span>}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-text-tertiary uppercase">Error Count</label>
                                <p className="text-2xl font-semibold text-text-primary mt-1">{evidence.schema.errors.length}</p>
                            </div>
                        </div>
                    </div>

                    {evidence.schema.errors.length > 0 && (
                        <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-100">
                            <h3 className="text-sm font-semibold text-rose-800 uppercase tracking-wide mb-3">Validation Errors</h3>
                            <ul className="space-y-2">
                                {evidence.schema.errors.map((error, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-rose-700">
                                        <span className="select-none">•</span>
                                        <span>{error}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Citation Readiness */}
            {/* Citation Content */}
            {activeTab === 'citation' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 bg-surface-container rounded-2xl border border-white/50 flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${evidence.citation.answerFirst ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            {evidence.citation.answerFirst ? '✓' : '—'}
                        </div>
                        <h4 className="font-semibold text-text-primary mb-1">Answer-First</h4>
                        <p className="text-xs text-text-tertiary">Direct answer formatting</p>
                    </div>

                    <div className="p-5 bg-surface-container rounded-2xl border border-white/50 flex flex-col items-center text-center">
                        <div className="text-2xl font-bold text-text-primary mb-1">{evidence.citation.quotableSpans}</div>
                        <h4 className="font-semibold text-text-primary mb-1">Quotable Spans</h4>
                        <p className="text-xs text-text-tertiary">Total logical segments</p>
                    </div>

                    <div className="p-5 bg-surface-container rounded-2xl border border-white/50 flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${!evidence.citation.jsTrapped ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {!evidence.citation.jsTrapped ? '✓' : '⚠️'}
                        </div>
                        <h4 className="font-semibold text-text-primary mb-1">JS-Free Content</h4>
                        <p className="text-xs text-text-tertiary">Visible without client-side JS</p>
                    </div>

                    <div className="col-span-full grid grid-cols-2 gap-4 mt-2">
                        <div className="p-4 bg-white/50 rounded-xl border border-white/60">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-text-tertiary uppercase">Information Structure</span>
                                <span className="font-mono text-sm font-bold text-text-primary">{evidence.citation.structureScore}/100</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${evidence.citation.structureScore}%` }}></div>
                            </div>
                        </div>
                        <div className="p-4 bg-white/50 rounded-xl border border-white/60">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-text-tertiary uppercase">Provenance Signals</span>
                                <span className="font-mono text-sm font-bold text-text-primary">{evidence.citation.provenanceScore}/100</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${evidence.citation.provenanceScore}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
