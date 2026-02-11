'use client';
import { useState, useEffect } from 'react';

const TASKS = [
    { message: 'Initializing audit scanner...', minProgress: 0, maxProgress: 10 },
    { message: 'Fetching page HTML & resources...', minProgress: 10, maxProgress: 25 },
    { message: 'Normalizing URL & checking redirects...', minProgress: 25, maxProgress: 35 },
    { message: 'Querying Google PageSpeed Insights...', minProgress: 35, maxProgress: 60 },
    { message: 'Analyzing Core Web Vitals (CrUX)...', minProgress: 60, maxProgress: 75 },
    { message: 'Running browser automation checks...', minProgress: 75, maxProgress: 85 },
    { message: 'Evaluating LLM citation readiness...', minProgress: 85, maxProgress: 95 },
    { message: 'Compiling final report...', minProgress: 95, maxProgress: 99 },
];

export default function AuditLoader() {
    const [progress, setProgress] = useState(0);
    const [taskIndex, setTaskIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                // Fast initial progress
                if (prev < 40) {
                    return prev + 2;
                }
                // Slower progress after 40% (simulating real work)
                if (prev < 90) {
                    return prev + 0.5;
                }
                // Very slow crawl at the end
                if (prev < 99) {
                    return prev + 0.1;
                }
                return prev;
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    // Update task message based on progress
    useEffect(() => {
        const currentTask = TASKS.findIndex(t => progress >= t.minProgress && progress < t.maxProgress);
        if (currentTask !== -1 && currentTask !== taskIndex) {
            setTaskIndex(currentTask);
        }
    }, [progress, taskIndex]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 relative overflow-hidden">
            {/* Background: Blurred Low-Fidelity UI Skeleton */}
            <div className="max-w-6xl mx-auto opacity-50 blur-sm pointer-events-none select-none transition-all duration-1000">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-6 w-32 bg-blue-200 rounded mb-4 animate-pulse"></div>
                    <div className="h-10 w-64 bg-gray-300 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Score Card Skeleton */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 h-48">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex flex-col items-center justify-center space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="h-4 w-20 bg-gray-200 rounded"></div>
                            <div className="h-12 w-12 rounded-full bg-gray-200 ring-4 ring-gray-100"></div>
                        </div>
                    ))}
                </div>

                {/* Grid Skeletons */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recommendations Skeleton */}
                        <div className="bg-white rounded-xl shadow-sm p-6 h-96">
                            <div className="h-6 w-48 bg-gray-300 rounded mb-6"></div>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="mb-4 p-4 border rounded-lg bg-gray-50">
                                    <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        {/* Sidebar Skeleton */}
                        <div className="bg-white rounded-xl shadow-sm p-6 h-64">
                            <div className="h-6 w-32 bg-gray-300 rounded mb-4"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-gray-100 rounded"></div>
                                <div className="h-4 w-full bg-gray-100 rounded"></div>
                                <div className="h-4 w-2/3 bg-gray-100 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay: Progress & Status */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-50">
                <div className="w-full max-w-md p-8 text-center">

                    {/* Animated Icon */}
                    <div className="relative w-20 h-20 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-600 text-sm">
                            {Math.round(progress)}%
                        </div>
                    </div>

                    {/* Status Text */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 transition-all duration-300">
                        {TASKS[taskIndex]?.message || 'Processsing...'}
                    </h2>

                    {/* Progress Bar */}
                    <div className="mt-6 h-2 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-200 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <p className="text-sm text-gray-500 mt-4 animate-pulse">
                        This may take 15-20 seconds for deep analysis...
                    </p>
                </div>
            </div>
        </div>
    );
}
