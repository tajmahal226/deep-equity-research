# Comprehensive Fix Plan for Deep Equity Research

## Critical Issues Identified

### 1. AI SDK Version Conflicts
- **Problem**: Project uses AI SDK 5 but includes `@ai-sdk/xai` v1.2.15 (v1 spec)
- **Impact**: xAI provider fails with `AI_UnsupportedModelVersionError`
- **Solution**: Remove `@ai-sdk/xai` and create custom xAI provider

### 2. xAI Provider Implementation
- **Problem**: Custom xAI provider still uses AI SDK validation
- **Impact**: Model validation fails even with custom provider
- **Solution**: Create provider that bypasses AI SDK validation entirely

### 3. Provider Configuration Inconsistencies
- **Problem**: `useAiProvider.ts` and `provider.ts` have different provider support
- **Impact**: Some providers work in UI but fail in backend
- **Solution**: Audit and synchronize all provider configurations

### 4. Missing API Proxy Routes
- **Problem**: Several providers configured but missing `/api/ai/[provider]` routes
- **Impact**: API calls fail for those providers
- **Solution**: Create missing proxy routes

### 5. Model Validation Issues
- **Problem**: Inconsistent model mapping and validation logic
- **Impact**: Some models work, others don't
- **Solution**: Centralize and fix model validation logic

## Detailed Fix Steps

### Phase 1: Remove AI SDK Conflicts
1. Remove `@ai-sdk/xai` from package.json
2. Update imports in provider.ts
3. Clean up any remaining v1 spec code

### Phase 2: Fix xAI Provider
1. Create proper custom xAI provider that implements LanguageModel interface
2. Bypass AI SDK validation completely
3. Use direct HTTP calls to xAI API

### Phase 3: Standardize Provider Configurations
1. Audit all providers in useAiProvider.ts vs provider.ts
2. Ensure consistent compatibility modes
3. Fix any missing configurations

### Phase 4: Create Missing API Routes
1. Identify providers without proxy routes
2. Create standardized proxy route template
3. Implement routes for: fireworks, moonshot, cohere, together, groq, perplexity

### Phase 5: Fix Model Validation
1. Centralize model mapping logic
2. Ensure all providers have proper model validation
3. Test model compatibility across all providers

### Phase 6: Testing & Validation
1. Test each provider individually
2. Verify API key handling
3. Test model selection and streaming
4. End-to-end functionality testing

## Expected Outcomes

- xAI (Grok) models work without `AI_UnsupportedModelVersionError`
- All configured providers function properly
- Consistent error handling across providers
- Proper model validation and mapping
- Clean, maintainable codebase

## Risk Assessment

- **High Risk**: Removing @ai-sdk/xai might break other xAI functionality
- **Medium Risk**: Custom provider implementation might have edge cases
- **Low Risk**: Adding missing API routes follows existing patterns
- **Low Risk**: Standardizing configurations is mostly mechanical

## Success Criteria

1. xAI models work without errors
2. All providers in UI have working backend support
3. No AI SDK version conflicts
4. Consistent model validation across providers
5. Clean build with no TypeScript errors