# Bundle Analysis Guide

## Quick Start

Run bundle analysis to identify optimization opportunities:

```bash
npm run analyze
```

This will:
1. Build the production bundle
2. Generate interactive HTML reports
3. Open reports in your browser

## What to Look For

### 🔴 Red Flags
- **Large dependencies** (>500KB)
- **Duplicate packages** (same library loaded multiple times)
- **Unused code** (tree-shaking opportunities)

### 🟡 Optimization Opportunities
- Code splitting opportunities
- Dynamic imports for large components
- Lazy loading for routes

### ✅ Good Practices
- Most chunks < 250KB
- Vendor bundles properly split
- Minimal duplication

## Common Issues & Fixes

### Issue: Large Bundle Size

**Check for:**
- Moment.js (use date-fns instead)
- Lodash (use lodash-es or individual imports)
- Large UI libraries loaded all at once

**Fix:**
```js
// Bad
import _ from 'lodash';

// Good  
import pick from 'lodash/pick';
```

### Issue: Duplicate Dependencies

**Cause:** Multiple versions of same package

**Fix:**
```bash
npm dedupe
```

### Issue: Large Initial Load

**Fix:** Use dynamic imports
```js
// Before
import HeavyComponent from './HeavyComponent';

// After
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>
});
```

## Configuration

Bundle analyzer is configured in `next.config.cjs`:
- Enabled when `ANALYZE=true`
- Wraps the base TypeScript config
- Generates reports in `.next/analyze/`

## Tips

1. Run analysis before major releases
2. Set bundle size budgets
3. Monitor trends over time
4. Focus on user-facing bundles first
