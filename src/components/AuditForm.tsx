'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditForm() {
    const router = useRouter();
    const [url, setUrl] = useState('');
    const [sitemapUrl, setSitemapUrl] = useState('');
    const [deep, setDeep] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!url) return;

        // Build query params
        const params = new URLSearchParams();
        params.set('url', url);
        if (sitemapUrl) {
            params.set('sitemap', sitemapUrl);
        }
        if (deep) {
            params.set('deep', 'true');
        }

        // Navigate to report page
        router.push(`/report?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-6">
            {/* URL Input */}
            <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                    Page URL to Audit <span className="text-red-500">*</span>
                </label>
                <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/page"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Sitemap URL (Optional) */}
            <div>
                <label htmlFor="sitemap" className="block text-sm font-medium text-gray-700 mb-2">
                    Sitemap URL <span className="text-xs text-gray-500">(optional - we'll auto-discover if empty)</span>
                </label>
                <input
                    type="url"
                    id="sitemap"
                    value={sitemapUrl}
                    onChange={(e) => setSitemapUrl(e.target.value)}
                    placeholder="https://example.com/sitemap.xml"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Deep Crawl Toggle */}
            <div className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    id="deep"
                    checked={deep}
                    onChange={(e) => setDeep(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="deep" className="text-sm font-medium text-gray-700">
                    Deep crawl (sample up to 150 URLs from sitemap + run PSI on top 5)
                </label>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
                Run Audit
            </button>
        </form>
    );
}
