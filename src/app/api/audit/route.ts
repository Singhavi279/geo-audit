// Audit API route

import { NextRequest, NextResponse } from 'next/server';
import { runAudit } from '@/lib/audit/pipeline';
import type { AuditInput } from '@/lib/types';

// Allow Vercel Pro/Hobby to run for up to 60s (max for Pro, ignoring Hobby limit if possible or just use max available)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        //Validate input
        if (!body.url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        const input: AuditInput = {
            url: body.url,
            sitemapUrl: body.sitemapUrl || undefined,
            deep: body.deep || false,
        };

        // Determine mode: 'full' (default), 'fast', or 'expensive'
        const mode = body.mode || 'full';

        // Run audit based on mode
        let result;
        if (mode === 'fast') {
            const { runFastAudit } = await import('@/lib/audit/pipeline');
            result = await runFastAudit(input);
        } else if (mode === 'expensive') {
            const { runExpensiveAudit } = await import('@/lib/audit/pipeline');
            result = await runExpensiveAudit(input);
        } else {
            const { runAudit } = await import('@/lib/audit/pipeline');
            result = await runAudit(input);
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Audit API error:', error);

        return NextResponse.json(
            {
                error: 'Audit failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
