'use client';

import { useState } from 'react';
import type { Evidence } from '@/lib/types';

interface EvidenceProps {
    evidence: Evidence;
}

export default function Evidence({ evidence }: EvidenceProps) {
    const [activeTab, setActiveTab] = useState<'content' | 'trust' | 'crawl' | 'schema' | 'ux' | 'llm'>('content');

    const tabs = [
        { id: 'content', label: 'Content' },
        { id: 'trust', label: 'Trust' },
        { id: 'crawl', label: 'Crawl' },
        { id: 'schema', label: 'Schema' },
        { id: 'ux', label: 'UX' },
        { id: 'llm', label: 'LLM' },
    ] as const;

    return (
        <div className="glass-panel p-8 rounded-3xl bg-surface-card border border-white/40 shadow-sm">
            <h2 className="text-2xl font-medium tracking-tight text-text-primary mb-8">Audit Evidence</h2>

            <div className="flex gap-2 mb-8 p-1.5 bg-surface-container rounded-full w-fit flex-wrap">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-out-quint
                            ${activeTab === tab.id
                                ? 'bg-white text-text-primary shadow-sm ring-1 ring-black/5'
                                : 'text-text-tertiary hover:text-text-secondary hover:bg-white/50'}
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-surface-container/30 rounded-2xl border border-white/50 p-6 min-h-[300px]">

                {/* Content Tab */}
                {activeTab === 'content' && evidence.content && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-white/60 rounded-xl">
                            <label className="text-xs font-semibold text-text-tertiary uppercase">Primary Intent</label>
                            <div className="text-xl font-bold capitalize mt-1 text-indigo-900">{evidence.content.primaryIntent}</div>
                        </div>
                        <div className="p-4 bg-white/60 rounded-xl">
                            <label className="text-xs font-semibold text-text-tertiary uppercase">Word Count</label>
                            <div className="text-xl font-bold mt-1 text-gray-900">{evidence.content.wordCount}</div>
                        </div>

                        {/* New: Header Structure */}
                        {evidence.seo?.headerStructure && (
                            <div className="p-4 bg-white/60 rounded-xl">
                                <label className="text-xs font-semibold text-text-tertiary uppercase">Header Structure</label>
                                <div className="mt-1">
                                    {evidence.seo.headerStructure.valid ? (
                                        <span className="text-green-700 font-bold flex items-center gap-2">
                                            Valid (H1-H6) ✓
                                        </span>
                                    ) : (
                                        <div className="text-red-600 text-sm font-medium">
                                            {evidence.seo.headerStructure.issues[0]}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* New: Images */}
                        {evidence.resources?.images && (
                            <div className="p-4 bg-white/60 rounded-xl">
                                <label className="text-xs font-semibold text-text-tertiary uppercase">Images & Accessibility</label>
                                <div className="flex gap-4 mt-1">
                                    <div className="text-center">
                                        <div className="text-lg font-bold">{evidence.resources.images.total}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">Total</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-lg font-bold ${evidence.resources.images.altTextMissing > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {evidence.resources.images.altTextMissing}
                                        </div>
                                        <div className="text-[10px] text-gray-500 uppercase">Missing Alt</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="col-span-full">
                            <label className="text-xs font-semibold text-text-tertiary uppercase">Freshness</label>
                            <div className="flex items-center gap-4 mt-2">
                                <span className={`px-3 py-1 rounded-full text-sm ${evidence.content.freshness.isRecent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {evidence.content.freshness.isRecent ? 'Recent' : 'Old / Undated'}
                                </span>
                                <span className="text-sm text-gray-600">
                                    Last Updated: {evidence.content.freshness.lastUpdated || 'Not found'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Trust Tab */}
                {activeTab === 'trust' && evidence.trust && (
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl">
                            <span className="font-medium">Author Identified</span>
                            {evidence.trust.author.found ? (
                                <span className="text-green-600 font-bold">{evidence.trust.author.name}</span>
                            ) : (
                                <span className="text-red-500 font-bold">No</span>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl">
                            <span className="font-medium">Policy Links</span>
                            <div className="flex gap-2">
                                <span className={`px-2 py-0.5 text-xs rounded ${evidence.trust.policyLinks.privacy ? 'bg-green-100 text-green-800' : 'bg-gray-200'}`}>Privacy</span>
                                <span className={`px-2 py-0.5 text-xs rounded ${evidence.trust.policyLinks.terms ? 'bg-green-100 text-green-800' : 'bg-gray-200'}`}>Terms</span>
                                <span className={`px-2 py-0.5 text-xs rounded ${evidence.trust.policyLinks.editorial ? 'bg-green-100 text-green-800' : 'bg-gray-200'}`}>Editorial</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl">
                            <span className="font-medium">External Citations</span>
                            <span className="font-bold">{evidence.trust.citations.externalLinkCount} ({evidence.trust.citations.academicSources} academic)</span>
                        </div>
                    </div>
                )}

                {/* LLM Tab */}
                {activeTab === 'llm' && evidence.llm && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-white/60 rounded-xl border border-indigo-100">
                            <label className="text-xs font-semibold text-text-tertiary uppercase">llms.txt</label>
                            <div className="mt-1 flex items-center gap-2">
                                {evidence.llm.llmsTxt.exists ? (
                                    <span className="text-green-600 font-bold text-lg">Found ✓</span>
                                ) : (
                                    <span className="text-gray-400 font-medium">Not found</span>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-white/60 rounded-xl border border-indigo-100">
                            <label className="text-xs font-semibold text-text-tertiary uppercase">Quotable Sentences</label>
                            <div className="mt-1 text-2xl font-bold">{evidence.llm.quotable.shortSentences}</div>
                        </div>
                    </div>
                )}

                {/* Crawl Tab */}
                {activeTab === 'crawl' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/60 rounded-xl">
                            <label className="text-xs font-semibold text-text-tertiary uppercase">Canonical URL</label>
                            <code className="block mt-1 text-sm bg-gray-50 p-2 rounded break-all">{evidence.onPage.canonical || 'Missing'}</code>
                        </div>
                        <div className="p-4 bg-white/60 rounded-xl">
                            <label className="text-xs font-semibold text-text-tertiary uppercase">Robots Meta</label>
                            <code className="block mt-1 text-sm bg-gray-50 p-2 rounded">{evidence.onPage.robotsMeta.join(', ') || 'None'}</code>
                        </div>

                        {/* New: Link Stats */}
                        {evidence.seo?.links && (
                            <div className="col-span-full p-4 bg-white/60 rounded-xl">
                                <label className="text-xs font-semibold text-text-tertiary uppercase">Link Analysis</label>
                                <div className="flex items-center gap-8 mt-2">
                                    <div>
                                        <div className="text-xl font-bold text-gray-900">{evidence.seo.links.internal}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">Internal</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-gray-900">{evidence.seo.links.external}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">External</div>
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                                        <div className="bg-indigo-500 h-full" style={{ width: `${(evidence.seo.links.internal / (evidence.seo.links.internal + evidence.seo.links.external || 1)) * 100}%` }}></div>
                                        <div className="bg-purple-500 h-full" style={{ width: `${(evidence.seo.links.external / (evidence.seo.links.internal + evidence.seo.links.external || 1)) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Schema Tab */}
                {activeTab === 'schema' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-white/60 rounded-xl">
                            <label className="text-xs font-semibold text-text-tertiary uppercase mb-2 block">Types Detected</label>
                            <div className="flex flex-wrap gap-2">
                                {evidence.schema.types.length ? evidence.schema.types.map(t => (
                                    <span key={t} className="px-3 py-1 bg-blue-50 text-blue-800 rounded-md text-sm">{t}</span>
                                )) : <span className="text-gray-500 italic">No structured data found</span>}
                            </div>
                        </div>
                        {evidence.schema.errors.length > 0 && (
                            <div className="p-4 bg-red-50 text-red-800 rounded-xl text-sm">
                                <strong>Errors:</strong>
                                <ul className="list-disc pl-5 mt-1">
                                    {evidence.schema.errors.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* UX Tab */}
                {activeTab === 'ux' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/60 rounded-xl text-center">
                            <div className="text-3xl font-bold mb-1">{evidence.performance?.lighthouse?.performance || '-'}</div>
                            <div className="text-xs uppercase text-gray-500">Lighthouse Score</div>
                        </div>
                        <div className="p-4 bg-white/60 rounded-xl text-center">
                            <div className="text-3xl font-bold mb-1">{Math.round(evidence.performance?.metrics?.lcp || 0)}ms</div>
                            <div className="text-xs uppercase text-gray-500">LCP</div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
