import { Suspense } from 'react';
import ReportContent from './ReportContent';

export default function ReportPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-xl text-gray-700 font-semibold">Loading...</p>
                </div>
            </div>
        }>
            <ReportContent />
        </Suspense>
    );
}
