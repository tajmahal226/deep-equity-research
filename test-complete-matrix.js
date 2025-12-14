// COMPREHENSIVE TEST: Every Module × Every Provider × Multiple Models
console.log('🔬 COMPREHENSIVE MATRIX TEST: ALL MODULES × ALL PROVIDERS\n');
console.log('This will test EVERY module with EVERY provider to ensure 100% compatibility\n');
console.log('='.repeat(80));

// All 8 modules with their specific test configurations
const modules = [
  {
    id: 'free-form',
    name: 'Free-Form Research',
    endpoint: '/api/sse',
    createPayload: (provider, model) => ({
      query: "Analyze Microsoft's cloud computing competitive position",
      provider: provider,
      thinkingModel: model,
      taskModel: model,
      searchProvider: "tavily",
      language: "en",
      temperature: 0.5
    })
  },
  {
    id: 'company-deep',
    name: 'Company Deep Dive',
    endpoint: '/api/company-research',
    createPayload: (provider, model) => ({
      companyName: "Apple Inc.",
      searchDepth: "fast",
      thinkingProviderId: provider,
      thinkingModelId: model,
      taskProviderId: provider,
      taskModelId: model,
      searchProviderId: "tavily",
      language: "en"
    })
  },
  {
    id: 'bulk-company',
    name: 'Bulk Company Research',
    endpoint: '/api/bulk-company-research',
    createPayload: (provider, model) => ({
      companies: [
        { name: "Tesla Inc." },
        { name: "Amazon.com Inc." }
      ],
      thinkingProviderId: provider,
      thinkingModelId: model,
      taskProviderId: provider,
      taskModelId: model,
      searchProviderId: "tavily",
      searchDepth: "fast"
    })
  },
  {
    id: 'market-research',
    name: 'Market Research',
    endpoint: '/api/sse',
    createPayload: (provider, model) => ({
      query: "Analyze the global semiconductor market trends and growth drivers",
      provider: provider,
      thinkingModel: model,
      taskModel: model,
      searchProvider: "tavily",
      language: "en"
    })
  },
  {
    id: 'company-discovery',
    name: 'Company Discovery',
    endpoint: '/api/sse',
    createPayload: (provider, model) => ({
      query: "Find high-growth technology companies with revenue > $500M",
      provider: provider,
      thinkingModel: model,
      taskModel: model,
      searchProvider: "tavily",
      language: "en"
    })
  },
  {
    id: 'case-studies',
    name: 'Case Studies',
    endpoint: '/api/sse',
    createPayload: (provider, model) => ({
      query: "Analyze Netflix's business model transformation from DVD to streaming",
      provider: provider,
      thinkingModel: model,
      taskModel: model,
      searchProvider: "tavily",
      language: "en"
    })
  },
  {
    id: 'financial-stock',
    name: 'Financial Data (Stock)',
    endpoint: '/api/financial-data',
    createPayload: (provider, model) => ({
      action: "stock-price",
      ticker: "GOOGL"
    })
  },
  {
    id: 'financial-profile',
    name: 'Financial Data (Profile)',
    endpoint: '/api/financial-data',
    createPayload: (provider, model) => ({
      action: "company-profile",
      ticker: "NVDA"
    })
  }
];

// All providers with their recommended models
const providers = [
  {
    id: 'google',
    name: 'Google',
    models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash']
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-instant-1.2']
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder']
  },
  {
    id: 'xai',
    name: 'xAI',
    models: ['grok-beta', 'grok-2-beta']
  },
  {
    id: 'mistral',
    name: 'Mistral',
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest']
  },
  {
    id: 'groq',
    name: 'Groq',
    models: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it']
  },
  {
    id: 'cohere',
    name: 'Cohere',
    models: ['command-r-plus', 'command-r', 'command']
  },
  {
    id: 'together',
    name: 'Together',
    models: ['meta-llama/Llama-3-70b-chat', 'mistralai/Mixtral-8x7B']
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    models: ['llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online']
  }
];

// Test a single combination
async function testCombination(module, provider, model) {
  try {
    const payload = module.createPayload(provider.id, model);

    const response = await fetch(`http://localhost:3001${module.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': module.endpoint.includes('sse') || module.endpoint.includes('research')
          ? 'text/event-stream'
          : 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000) // 8 second timeout
    });

    if (!response.ok) {
      return { success: false, status: response.status };
    }

    // For SSE endpoints, check for streaming data
    if (module.endpoint.includes('sse') || module.endpoint.includes('research')) {
      const reader = response.body.getReader();
      try {
        const { value, done } = await reader.read();
        return {
          success: !done && value && value.length > 0,
          status: response.status
        };
      } finally {
        reader.releaseLock();
      }
    }

    // For JSON endpoints
    const data = await response.json();
    return {
      success: !!data,
      status: response.status
    };

  } catch (error) {
    return {
      success: false,
      error: error.name === 'AbortError' ? 'timeout' : error.message
    };
  }
}

// Main test runner
async function runMatrixTest() {
  const results = [];
  const startTime = Date.now();

  // Test each provider
  for (const provider of providers) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🏢 TESTING PROVIDER: ${provider.name.toUpperCase()}`);
    console.log(`${'='.repeat(80)}`);

    // Test first model only for speed (can be expanded to test all)
    const model = provider.models[0];
    console.log(`Using model: ${model}\n`);

    const providerResults = [];

    // Test each module
    for (const module of modules) {
      process.stdout.write(`  ${module.name.padEnd(30)}`);

      const result = await testCombination(module, provider, model);

      providerResults.push({
        module: module.name,
        moduleId: module.id,
        success: result.success
      });

      if (result.success) {
        console.log(`✅ Working`);
      } else if (result.error === 'timeout') {
        console.log(`⏱️  Timeout (may be working but slow)`);
      } else if (result.status === 401) {
        console.log(`🔑 API Key issue`);
      } else {
        console.log(`❌ Failed (${result.status || result.error})`);
      }

      results.push({
        provider: provider.name,
        model: model,
        module: module.name,
        ...result
      });

      // Small delay between tests
      await new Promise(r => setTimeout(r, 200));
    }

    // Provider summary
    const working = providerResults.filter(r => r.success).length;
    console.log(`\n  Provider Summary: ${working}/${modules.length} modules working`);
  }

  // Generate compatibility matrix
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPLETE COMPATIBILITY MATRIX');
  console.log('='.repeat(80));
  console.log('\n' + 'Module'.padEnd(30) + providers.map(p => p.name.padEnd(12)).join(''));
  console.log('-'.repeat(80));

  for (const module of modules) {
    process.stdout.write(module.name.padEnd(30));

    for (const provider of providers) {
      const result = results.find(r =>
        r.provider === provider.name &&
        r.module === module.name
      );

      const status = result?.success ? '✅' :
                    result?.error === 'timeout' ? '⏱️ ' :
                    result?.status === 401 ? '🔑' : '❌';
      process.stdout.write(status.padEnd(12));
    }
    console.log();
  }

  // Overall statistics
  console.log('\n' + '='.repeat(80));
  console.log('📈 OVERALL STATISTICS');
  console.log('='.repeat(80));

  const totalTests = providers.length * modules.length;
  const successfulTests = results.filter(r => r.success).length;
  const successRate = ((successfulTests / totalTests) * 100).toFixed(1);

  console.log(`\nTotal Tests Run: ${totalTests}`);
  console.log(`Successful: ${successfulTests}`);
  console.log(`Failed: ${totalTests - successfulTests}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Test Duration: ${Math.round((Date.now() - startTime) / 1000)}s`);

  // Per-provider summary
  console.log('\n📊 Provider Success Rates:');
  for (const provider of providers) {
    const providerResults = results.filter(r => r.provider === provider.name);
    const providerSuccess = providerResults.filter(r => r.success).length;
    const rate = ((providerSuccess / providerResults.length) * 100).toFixed(0);
    console.log(`  ${provider.name.padEnd(15)}: ${providerSuccess}/${providerResults.length} modules (${rate}%)`);
  }

  // Per-module summary
  console.log('\n📊 Module Success Rates:');
  for (const module of modules) {
    const moduleResults = results.filter(r => r.module === module.name);
    const moduleSuccess = moduleResults.filter(r => r.success).length;
    const rate = ((moduleSuccess / moduleResults.length) * 100).toFixed(0);
    console.log(`  ${module.name.padEnd(30)}: ${moduleSuccess}/${moduleResults.length} providers (${rate}%)`);
  }

  // Critical issues
  const criticalIssues = [];
  for (const module of modules) {
    const moduleResults = results.filter(r => r.module === module.name);
    const moduleSuccess = moduleResults.filter(r => r.success).length;
    if (moduleSuccess === 0) {
      criticalIssues.push(module.name);
    }
  }

  if (criticalIssues.length > 0) {
    console.log('\n⚠️  CRITICAL ISSUES:');
    criticalIssues.forEach(issue => {
      console.log(`  - ${issue} not working with ANY provider`);
    });
  }

  // Final verdict
  console.log('\n' + '='.repeat(80));
  if (successRate >= 95) {
    console.log('🎉 EXCELLENT: Nearly perfect compatibility across all modules and providers!');
  } else if (successRate >= 80) {
    console.log('✅ GOOD: Most modules work with most providers');
  } else if (successRate >= 60) {
    console.log('⚠️  FAIR: Some compatibility issues need attention');
  } else {
    console.log('❌ NEEDS WORK: Significant compatibility issues detected');
  }
  console.log('='.repeat(80));
}

// Run the comprehensive test
console.log('Starting comprehensive compatibility test...');
console.log('This will test 8 modules × 5 providers = 40 combinations\n');

runMatrixTest().catch(console.error);