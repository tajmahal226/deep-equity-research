# Model Filtering System

## Overview

The Deep Equity Research platform includes an automated model filtering system that excludes AI models older than a specified age from UI dropdowns. This helps users focus on current, high-performing models while maintaining backwards compatibility for API requests.

## Features

- **Automatic Filtering**: Models older than 12 months (configurable) are automatically excluded from UI dropdowns
- **API Compatibility**: Legacy models are still accepted in API requests for backwards compatibility
- **Configurable Thresholds**: Customize the age threshold via environment variables
- **Release Date Tracking**: Comprehensive metadata for 100+ models across 10 providers
- **Smart Warnings**: Console warnings when stale models are used

## Configuration

### Environment Variables

Add to your `.env.local`:

```bash
# Enable/disable stale model filtering (default: true)
NEXT_PUBLIC_EXCLUDE_STALE_MODELS=true

# Maximum model age in months (default: 12)
NEXT_PUBLIC_MAX_MODEL_AGE_MONTHS=12
```

### Example Configurations

**Strict filtering (6 months):**
```bash
NEXT_PUBLIC_EXCLUDE_STALE_MODELS=true
NEXT_PUBLIC_MAX_MODEL_AGE_MONTHS=6
```

**No filtering (show all models):**
```bash
NEXT_PUBLIC_EXCLUDE_STALE_MODELS=false
```

**Extended threshold (18 months):**
```bash
NEXT_PUBLIC_EXCLUDE_STALE_MODELS=true
NEXT_PUBLIC_MAX_MODEL_AGE_MONTHS=18
```

## Implementation Details

### File Structure

```
src/utils/
├── model-metadata.ts      # Release dates and filtering logic
└── validation.ts          # Model validation with filtering support
```

### Key Components

#### 1. Model Metadata (`model-metadata.ts`)

Contains release dates for all models:

```typescript
export const MODEL_RELEASE_DATES: Record<string, Record<string, string>> = {
  openai: {
    'gpt-5': '2025-01',
    'gpt-4o': '2024-05',
    'gpt-3.5-turbo': '2022-11',  // Will be filtered
    // ...
  },
  // ... other providers
};
```

#### 2. Filtering Functions

```typescript
// Get models within age threshold
getActiveModels(provider: string, maxAgeMonths: number = 12): Set<string>

// Get models older than threshold
getStaleModels(provider: string, maxAgeMonths: number = 12): Set<string>

// Check if specific model is stale
isModelStale(provider: string, model: string, maxAgeMonths: number = 12): boolean

// Get model age in months
getModelAgeMonths(provider: string, model: string): number | null
```

#### 3. Validation Integration

```typescript
// Get valid models with optional filtering
getValidModels(provider: string, excludeStale: boolean = true): Set<string>

// Validate model (accepts legacy models, logs warnings)
isValidModel(provider: string, model: string, strict: boolean = false): boolean
```

## Filtered Models (as of 2025)

### OpenAI
**Filtered (>12 months old):**
- `gpt-3.5-turbo` (2022-11)
- `gpt-3.5-turbo-16k` (2023-06)
- `gpt-3.5-turbo-1106` (2023-11)

### Anthropic
**Filtered (>12 months old):**
- `claude-instant-1.2` (2023-03)
- `claude-2.0` (2023-07)
- `claude-2.1` (2023-11)

### Google
**Filtered (>12 months old):**
- `gemini-pro` (2023-12)
- `gemini-pro-vision` (2023-12)

### Other Providers
Most other providers only have recent models, so minimal filtering applies.

## Usage Examples

### In UI Components

```typescript
import { VALID_MODELS } from '@/utils/validation';

// VALID_MODELS automatically excludes stale models
const openaiModels = Array.from(VALID_MODELS.openai);
// Returns: ['gpt-5', 'gpt-4o', 'gpt-4-turbo', ...] (no gpt-3.5-turbo)
```

### In API Validation

```typescript
import { isValidModel } from '@/utils/validation';

// Lenient validation (accepts legacy models, logs warning)
const valid1 = isValidModel('openai', 'gpt-3.5-turbo');
// Returns: true
// Console: "Warning: Model 'gpt-3.5-turbo' is stale (>12 months old)"

// Strict validation (rejects legacy models)
const valid2 = isValidModel('openai', 'gpt-3.5-turbo', true);
// Returns: false
// Console: "Stale model 'gpt-3.5-turbo' rejected"
```

### Getting Model Info

```typescript
import { getModelAgeMonths, getModelReleaseDate } from '@/utils/model-metadata';

const age = getModelAgeMonths('openai', 'gpt-4o');
// Returns: 8 (as of Jan 2025)

const releaseDate = getModelReleaseDate('openai', 'gpt-4o');
// Returns: "2024-05"
```

## Maintenance

### Adding New Models

When new models are released, update `MODEL_RELEASE_DATES` in `model-metadata.ts`:

```typescript
export const MODEL_RELEASE_DATES = {
  openai: {
    // Add new model with release date (YYYY-MM format)
    'gpt-6': '2026-01',
    // ...existing models
  },
};
```

### Updating Release Dates

If a model's release date was incorrect, update the date in `MODEL_RELEASE_DATES`:

```typescript
'existing-model': '2024-03',  // Updated from '2024-02'
```

## Testing

### Manual Testing

```bash
# Run test script
node test-model-filtering.js
```

### Integration Testing

```bash
# Lint check
npm run lint

# Dev server with filtering enabled
NEXT_PUBLIC_EXCLUDE_STALE_MODELS=true npm run dev

# Dev server with filtering disabled
NEXT_PUBLIC_EXCLUDE_STALE_MODELS=false npm run dev
```

## Backwards Compatibility

- **UI Dropdowns**: Only show active models (user-friendly)
- **API Endpoints**: Accept both active and legacy models (backwards compatible)
- **Validation**: Lenient by default, logs warnings for stale models
- **Migration**: Users can still use existing configurations with legacy models

## Benefits

1. **Better UX**: Users see only relevant, current models
2. **Performance**: Newer models typically have better performance/cost ratios
3. **Security**: Reduces risk of using deprecated models with known limitations
4. **Maintainability**: Centralized model metadata for easy updates
5. **Flexibility**: Environment-based configuration for different deployments

## Troubleshooting

### Models Missing from Dropdown

**Cause**: Model is older than `NEXT_PUBLIC_MAX_MODEL_AGE_MONTHS`

**Solution**: Either:
1. Increase age threshold: `NEXT_PUBLIC_MAX_MODEL_AGE_MONTHS=24`
2. Disable filtering: `NEXT_PUBLIC_EXCLUDE_STALE_MODELS=false`

### API Validation Warnings

**Cause**: Using legacy model in API request

**Solution**: 
- Update to newer model (recommended)
- Or set `NEXT_PUBLIC_EXCLUDE_STALE_MODELS=false` to silence warnings

### Unknown Model Error

**Cause**: Model not in `MODEL_RELEASE_DATES`

**Solution**: Add model to `model-metadata.ts` with release date

## Future Enhancements

Potential improvements for future versions:

- [ ] Admin UI to manage model metadata
- [ ] Automatic model deprecation warnings from providers
- [ ] Model performance metrics integration
- [ ] Cost-based filtering (exclude expensive legacy models)
- [ ] Provider-specific age thresholds
- [ ] Model recommendation system based on task type
