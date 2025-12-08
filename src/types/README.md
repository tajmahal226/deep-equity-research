# AI SDK v5 Type Definitions

This directory contains type definitions that extend the official AI SDK v5 types to support features used in this codebase.

## Why These Types Exist

When upgrading from AI SDK v4 to v5, several breaking changes occurred:
1. `textDelta` → `text`
2. `reasoning` → `reasoning-delta`
3. `part.source` → `part` (source event structure changed)
4. `providerMetadata` moved/restructured

Rather than using `as any` casts everywhere, we've created proper type definitions that accurately represent the v5 streaming response structure.

## Files

### `ai-sdk-v5.d.ts`
Extends the `ai` module with types for:
- `ExtendedStreamPart`: Covers all stream event types
- `StreamSource`: Source/citation objects
- Type guards for runtime checking

## Usage

These types are automatically available via TypeScript's module augmentation. Just import from 'ai' as normal:

```typescript
import { streamText } from 'ai';

for await (const part of result.fullStream) {
  if (part.type === 'reasoning-delta') {
    // TypeScript knows part.text exists
    console.log(part.text);
  }
  
  if (part.type === 'source') {
    // TypeScript knows part.url, part.title exist
    console.log(part.url, part.title);
  }
}
```

## Future Work

As AI SDK v5 stabilizes, these custom types may become unnecessary. Monitor the official `ai` package for:
- Updated type definitions
- Better TypeScript support
- Official documentation of streaming types

When the official types catch up, we can remove these extensions.

## Related Issues

- AI SDK v4 only supported models with spec v1
- Provider packages (@ai-sdk/*) required v5
- This forced the upgrade and type system changes
