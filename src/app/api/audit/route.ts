// Audit API route

import { NextRequest, NextResponse } from 'next/server';
import { runAudit } from '@/lib/audit/pipeline';
import type { AuditInput } from '@/lib/types';

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

        // Run audit
        const result = await runAudit(input);

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
