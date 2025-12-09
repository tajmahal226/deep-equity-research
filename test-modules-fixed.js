// Fixed test for all modules with correct parameters
const testModules = [
  {
    name: 'Free-Form Research',
    endpoint: '/api/sse',
    payload: (provider, model) => ({
      query: "What are the key trends in semiconductor industry?",
      provider: provider,
      thinkingModel: model,
      taskModel: model,
      searchProvider: "tavily",
      language: "en"
    })
  },
  {
    name: 'Company Deep Dive',
    endpoint: '/api/company-research',
    payload: (provider, model) => ({
      companyName: "NVIDIA Corporation",
      companyWebsite: "https://www.nvidia.com",
      industry: "Technology",
      searchDepth: "medium",
      thinkingProviderId: provider,
      thinkingModelId: model,
      taskProviderId: provider,
      taskModelId: model,
      searchProviderId: "tavily",
      language: "en"
    })
  },
  {
    name: 'Bulk Company Research',
    endpoint: '/api/bulk-company-research',
    payload: (provider, model) => ({
      companies: [
        { name: "Microsoft Corporation", website: "https://microsoft.com" },
        { name: "Alphabet Inc.", website: "https://abc.xyz" }
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
    name: 'Financial Data',
    endpoint: '/api/financial-data',
    payload: (provider, model) => ({
      ticker: "AAPL",
      dataProvider: "yahoo", // or "alpha_vantage"
      period: "annual"
    })
  }
];

const testProviders = [
  { provider: 'openai', models: ['gpt-4o'] },
  { provider: 'anthropic', models: ['claude-3-5-sonnet-20241022'] }
];

async function testModule(module, provider, model) {
  const startTime = Date.now();

  try {
    const payload = module.payload(provider, model);
    console.log(`\nTesting ${module.name} with ${provider}/${model}`);
    console.log(`Payload:`, JSON.stringify(payload, null, 2));

    const response = await fetch(`http://localhost:3001${module.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': module.endpoint.includes('sse') ? 'text/event-stream' : 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });

    const responseTime = Date.now() - startTime;
    console.log(`Response Status: ${response.status} (${responseTime}ms)`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Error Response:`, errorText.slice(0, 200));
      return {
        success: false,
        status: response.status,
        time: responseTime,
        error: errorText.slice(0, 100)
      };
    }

    // For SSE endpoints, check streaming
    if (module.endpoint.includes('sse') || module.endpoint.includes('company-research') || module.endpoint.includes('bulk')) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let hasContent = false;

      try {
        const { value } = await reader.read();
        if (value) {
          const chunk = decoder.decode(value);
          console.log(`First chunk:`, chunk.slice(0, 150));
          hasContent = chunk.includes('event:') || chunk.includes('data:') || chunk.length > 0;
        }
      } finally {
        reader.releaseLock();
      }

      return {
        success: hasContent,
        status: 200,
        time: responseTime
      };
    }

    // For JSON endpoints
    const data = await response.json();
    console.log(`Response Data:`, JSON.stringify(data).slice(0, 150));

    return {
      success: true,
      status: 200,
      time: responseTime,
      hasData: !!data
    };

  } catch (error) {
    console.log(`Error:`, error.message);
    return {
      success: false,
      error: error.message,
      time: Date.now() - startTime
    };
  }
}

async function runFixedTests() {
  console.log('🚀 Testing Research Modules with Correct Parameters\n');
  console.log('='.repeat(80));

  const results = [];

  for (const module of testModules) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`MODULE: ${module.name}`);
    console.log(`Endpoint: ${module.endpoint}`);
    console.log(`${'='.repeat(80)}`);

    for (const providerConfig of testProviders) {
      for (const model of providerConfig.models) {
        const result = await testModule(module, providerConfig.provider, model);

        results.push({
          module: module.name,
          provider: providerConfig.provider,
          model: model,
          ...result
        });

        if (result.success) {
          console.log(`✅ SUCCESS: ${providerConfig.provider}/${model} working!`);
        } else {
          console.log(`❌ FAILED: ${providerConfig.provider}/${model} - ${result.error || `HTTP ${result.status}`}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(80));

  for (const module of testModules) {
    const moduleResults = results.filter(r => r.module === module.name);
    const workingCount = moduleResults.filter(r => r.success).length;

    console.log(`\n${module.name}:`);
    moduleResults.forEach(r => {
      const status = r.success ? '✅' : '❌';
      console.log(`  ${status} ${r.provider}/${r.model} - ${r.time}ms`);
    });
    console.log(`  Summary: ${workingCount}/${moduleResults.length} working`);
  }

  const totalWorking = results.filter(r => r.success).length;
  const totalTests = results.length;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`OVERALL: ${totalWorking}/${totalTests} tests passed`);

  if (totalWorking === totalTests) {
    console.log('🎉 ALL MODULES WORKING WITH ALL PROVIDERS!');
  } else {
    console.log('⚠️  Some modules need attention');
  }
}

runFixedTests().catch(console.error);