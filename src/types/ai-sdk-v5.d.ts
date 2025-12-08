/**
 * AI SDK v5 Type Definitions
 * 
 * These types extend the official AI SDK v5 to support features used in this codebase.
 * Fixes type errors from the v4 → v5 migration.
 */

import type { LanguageModelV2FinishReason, LanguageModelV2Usage } from 'ai';

declare module 'ai' {
  /**
   * Extended stream part types for AI SDK v5
   */
  export interface ExtendedStreamPart {
    type: 
      | 'text-delta'
      | 'reasoning-delta'
      | 'source'
      | 'finish'
      | 'tool-call'
      | 'tool-result'
      | 'error';
    
    // Text delta content
    text?: string;
    
    // Source information (for grounding/citations)
    sourceType?: 'url' | 'document';
    id?: string;
    url?: string;
    title?: string;
    mediaType?: string;
    filename?: string;
    
    // Provider metadata (available on finish events)
    providerMetadata?: {
      google?: {
        groundingMetadata?: any;
      };
      openai?: any;
    };
    
    // Finish information
    finishReason?: LanguageModelV2FinishReason;
    totalUsage?: LanguageModelV2Usage;
  }

  /**
   * Source object for citations/grounding
   */
  export interface StreamSource {
    type: 'source';
    sourceType: 'url' | 'document';
    id: string;
    url?: string;
    title?: string;
    mediaType?: string;
    filename?: string;
  }
}

/**
 * Type guard to check if a part has provider metadata
 */
export function hasProviderMetadata(part: any): part is { providerMetadata: any } {
  return part && typeof part === 'object' && 'providerMetadata' in part;
}

/**
 * Type guard for source parts
 */
export function isSourcePart(part: any): part is { type: 'source'; url?: string; title?: string } {
  return part && part.type === 'source';
}
