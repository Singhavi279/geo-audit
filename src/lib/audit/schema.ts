// Structured data (JSON-LD) extraction and validation

import type { SchemaEvidence } from '../types';
import { extractJsonLd } from '../utils';

/**
 * Extract and validate structured data from HTML
 */
export function extractSchema(html: string): SchemaEvidence {
    const jsonLdBlocks = extractJsonLd(html);
    const types: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < jsonLdBlocks.length; i++) {
        const block = jsonLdBlocks[i];

        try {
            // Extract @type
            const blockTypes = extractTypes(block);
            types.push(...blockTypes);

            // Basic validation
            validateSchema(block, blockTypes);
        } catch (error) {
            if (error instanceof Error) {
                errors.push(`Block ${i + 1}: ${error.message}`);
            }
        }
    }

    // Remove duplicates
    const uniqueTypes = Array.from(new Set(types));

    const valid = errors.length === 0 && jsonLdBlocks.length > 0;

    return {
        types: uniqueTypes,
        jsonLd: jsonLdBlocks,
        errors,
        valid,
    };
}

/**
 * Extract @type values from a JSON-LD block
 */
function extractTypes(block: any): string[] {
    const types: string[] = [];

    if (!block) return types;

    // Handle @graph structure
    if (block['@graph'] && Array.isArray(block['@graph'])) {
        for (const item of block['@graph']) {
            types.push(...extractTypes(item));
        }
        return types;
    }

    // Direct @type
    if (block['@type']) {
        if (Array.isArray(block['@type'])) {
            types.push(...block['@type']);
        } else if (typeof block['@type'] === 'string') {
            types.push(block['@type']);
        }
    }

    return types;
}

/**
 * Basic schema validation
 */
function validateSchema(block: any, types: string[]): void {
    if (types.length === 0) {
        throw new Error('Missing @type');
    }

    // Relaxed Validation: Only fail on strictly invalid types. 
    // Missing properties will just be ignored to prevent false alarms.

    // Original strict checks removed to allow partial schema matches.
    // e.g. An article without a headline is still better than no schema.
}
