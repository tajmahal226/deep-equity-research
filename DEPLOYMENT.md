# Deep Equity Research - Deployment Guide

## 🚀 Vercel Deployment Ready

This repository is fully optimized and ready for deployment to Vercel with zero build errors.

## ✅ Deployment Status

- **Build Status**: ✅ Passing
- **TypeScript**: ✅ No compilation errors
- **ESLint**: ✅ Passing
- **Tests**: ✅ All tests passing
- **Production Ready**: ✅ Verified
- **Security Model**: ✅ User-provided API keys

## 🔐 Security Model: User-Provided Keys

This application follows a **"bring your own key"** model for maximum security and cost control.

### User Keys (Primary Method)

**How it works:**
- Users enter API keys in the Settings UI (⚙️ icon)
- Keys stored in browser localStorage (client-side only)
- Each user pays for their own API usage
- No server-side API costs for the deployment owner

**Recommended for:**
- ✅ Multi-user deployments
- ✅ Public-facing instances
- ✅ Production applications
- ✅ Cost-conscious deployments

### Server Keys (Optional)

Server-side API keys in environment variables are **optional** and only recommended for:

**Use cases:**
- MCP server integration with Claude Desktop (`MCP_*` env vars)
- Demo/testing instances with shared fallback keys
- Single-user deployments where you control all access
- Development environments

**⚠️ Warning:** For multi-user deployments, **DO NOT** set server-side API keys. Each user should provide their own.

### Access Control

**`ACCESS_PASSWORD` (Optional but Recommended):**
- Protects SSE research endpoints from unauthorized access
- Prevents abuse of your deployment infrastructure
- Validated by middleware for `/api/sse`, `/api/crawler`, `/api/mcp`
- Does NOT protect AI/search proxies (they require user keys)

Set in Vercel environment variables (server-side only):
```env
ACCESS_PASSWORD=your_secure_password
```
Share the password with trusted users so they can enter it in the app settings.
Do **not** expose it via `NEXT_PUBLIC_*` variables.

### Rate Limiting

Built-in rate limiting protects proxy endpoints from abuse:

| Endpoint | Default Limit | Configurable Via |
|----------|---------------|------------------|
| AI Proxies | 100 req/hour per IP | `RATE_LIMIT_AI_PROXY` |
| Search Proxies | 200 req/hour per IP | `RATE_LIMIT_SEARCH_PROXY` |
| Research Endpoints | 50 req/hour per IP | `RATE_LIMIT_RESEARCH` |
| Crawler | 50 req/hour per IP | `RATE_LIMIT_CRAWLER` |

Configure in environment variables:
```env
RATE_LIMIT_AI_PROXY=100
RATE_LIMIT_SEARCH_PROXY=200
RATE_LIMIT_RESEARCH=50
RATE_LIMIT_CRAWLER=50
```

## 🌐 Deployment Steps

### Option 1: Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub: `tajmahal226/deep-equity-research`
4. Configure environment variables (see below)
5. Deploy

### Option 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Follow prompts to configure
```

## 🔑 Environment Variables

### For User-Key Model (Recommended)

**Minimal Configuration:**
```env
# Optional: Protect endpoints from abuse (users must input this in Settings)
ACCESS_PASSWORD=your_secure_password

# Optional: Adjust rate limits
RATE_LIMIT_AI_PROXY=100
RATE_LIMIT_SEARCH_PROXY=200
```

Users will provide their own API keys via Settings UI. **No provider keys needed!**

### For Server-Key Model (Optional)

Only set these if you want server-side fallback keys:

#### AI Providers (Optional)
```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
XAI_API_KEY=your_xai_api_key
```

#### Search Providers (Optional)
```env
TAVILY_API_KEY=your_tavily_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
EXA_API_KEY=your_exa_api_key
```

#### Financial Data Providers (Optional)
```env
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FINANCIAL_DATASETS_API_KEY=your_financial_datasets_key
```

### For MCP Server (Optional)

If using Model Context Protocol with Claude Desktop:
```env
MCP_AI_PROVIDER=openai
MCP_SEARCH_PROVIDER=tavily
MCP_TASK_MODEL=gpt-4o
MCP_THINKING_MODEL=gpt-4o
OPENAI_API_KEY=your_openai_api_key  # Required for MCP
TAVILY_API_KEY=your_tavily_api_key   # Required for MCP
```

## 🏗️ Build Information

### Build Stats
- **Compilation Time**: ~15-20 seconds
- **Bundle Size**: 114kB First Load JS
- **Static Pages**: 6 pages pre-rendered
- **API Routes**: 24 serverless functions
- **Middleware Size**: 36kB (optimized)

### Supported Frameworks
- **Next.js**: ^15.3.1 with App Router
- **React**: 19.1.0
- **TypeScript**: Strict mode enabled
- **Tailwind CSS**: 3.4.1
- **Edge Runtime**: Supported

## 🔍 Post-Deployment Verification

### Health Checks
After deployment, verify these endpoints:
- `/` - Main application loads
- `/api/health` - Health check endpoint
- `/api/sse` - Server-sent events working (requires ACCESS_PASSWORD if set)

### User Flow Testing
1. Open the deployed app
2. Click Settings (⚙️) → AI Providers
3. Add an OpenAI API key
4. Go to Search Providers → Add Tavily key
5. Try a research query in any mode
6. Verify results stream correctly

## 🐛 Common Issues & Solutions

### Build Failures
- **ESLint Errors**: All source code ESLint issues resolved
- **TypeScript Errors**: All type issues fixed
- **Missing Dependencies**: All imports properly resolved

### Runtime Issues

**"API key required for openai"**
- ✅ **Expected behavior** - User needs to add their API key in Settings
- Not an error - this is the security model working correctly

**"Rate limit exceeded"**
- User or IP hit the rate limit (100 req/hour for AI proxies)
- Wait for rate limit window to reset
- Adjust `RATE_LIMIT_*` env vars if needed

**"Unauthorized" (403)**
- `ACCESS_PASSWORD` is set but not provided
- Ensure trusted users enter the password in Settings so requests include the header
- Or remove `ACCESS_PASSWORD` to disable protection

### Environment Variables
- **Missing keys**: Not a problem with user-key model
- **API Key Rotation**: Use comma-separated keys for redundancy (server-side only)

## 📊 Monitoring

### Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Monitor function execution times
- Track error rates and user sessions

### Logging
- Application uses structured logging via `/src/utils/logger.ts`
- Error boundaries catch React errors
- API routes have comprehensive error handling

## 🔄 Updates & Maintenance

### Deployment Workflow
1. Make changes to source code
2. Test locally with `pnpm build`
3. Commit and push to main branch
4. Vercel auto-deploys from main branch

### Monitoring Performance
- Check Vercel dashboard for function metrics
- Monitor API response times
- Track user engagement with research features

## 🎯 Production Considerations

### Security
- ✅ User-provided API keys (no server-side key exposure)
- ✅ ACCESS_PASSWORD protects endpoints from abuse
- ✅ Rate limiting prevents proxy abuse
- ✅ Input validation on all endpoints
- ✅ CORS properly configured via middleware

### Scalability
- Serverless functions auto-scale
- Edge runtime for global performance
- Optimized bundle splitting
- Efficient state management
- No shared API key pool to manage

### Cost Control
- **Zero API costs** for deployment owner (user-key model)
- Users pay for their own AI/search usage
- Serverless functions scale to zero when idle
- No database or persistent storage costs

### Reliability
- Comprehensive error handling
- Graceful degradation for missing APIs
- Client-side error boundaries
- Rate limiting prevents service degradation

## 🚨 Security Best Practices

### For Public Deployments

1. **Set ACCESS_PASSWORD:**
   ```env
   ACCESS_PASSWORD=strong_random_password
   ```

2. **Configure Rate Limits:**
   - Start conservative (100/hr for AI, 200/hr for search)
   - Monitor abuse patterns
   - Adjust based on legitimate usage

3. **DO NOT set provider API keys:**
   - Let users provide their own
   - Eliminates cost risk
   - Improves security posture

4. **Monitor logs:**
   - Check for rate limit violations
   - Track authentication failures
   - Identify abuse patterns

### For Private/Demo Deployments

1. **Can set server-side keys** for convenience
2. **Still set ACCESS_PASSWORD** to control access
3. **Monitor API costs** - you're paying for all usage
4. **Consider IP allowlisting** at Vercel level

---

## 🏁 Ready for Launch

Your Deep Equity Research application is **fully deployment-ready** with:
- ✅ Zero build errors
- ✅ Production optimizations
- ✅ User-key security model
- ✅ Rate limiting protection
- ✅ Comprehensive error handling
- ✅ Scalable architecture
- ✅ Zero server-side API costs (user-key model)

Deploy with confidence! 🚀
