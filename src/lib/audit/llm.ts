
import * as cheerio from 'cheerio';
import type { LLMEvidence } from '../types';

export async function analyzeLLM($: cheerio.CheerioAPI, baseUrl: string): Promise<LLMEvidence> {
    const llmsTxtPath = new URL('/llms.txt', baseUrl).toString();
    const llmsTxtExists = await checkUrlExists(llmsTxtPath);

    return {
        llmsTxt: {
            exists: llmsTxtExists,
            path: llmsTxtExists ? llmsTxtPath : null
        },
        semanticDensity: calculateDensity($),
        quotable: calculateQuotability($)
    };
}

async function checkUrlExists(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
        return res.ok;
    } catch {
        return false;
    }
}

function calculateDensity($: cheerio.CheerioAPI) {
    return {
        h1: $('h1').length,
        h2: $('h2').length,
        h3: $('h3').length,
        p: $('p').length,
        listItems: $('li').length
    };
}

function calculateQuotability($: cheerio.CheerioAPI) {
    let shortSentences = 0;
    let definitions = 0;

    $('p').each((_, el) => {
        const text = $(el).text().trim();
        // Check for short, definitive sentences (e.g., "X is Y.")
        if (text.length > 20 && text.length < 100 && text.includes(' is ')) {
            shortSentences++;
        }

        if (text.includes('defined as') || text.includes('refers to')) {
            definitions++;
        }
    });

    // Lists are also highly quotable
    shortSentences += $('li').length;

    return { shortSentences, definitions };
}
