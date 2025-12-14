// Test script to check research functionality with different AI providers
const testQuery = {
  topic: "What are the key investment trends in AI technology stocks?",
  searchDepth: "fast"
};

const providers = [
  { name: 'OpenAI', model: 'gpt-4o' },
  { name: 'Anthropic', model: 'claude-3-sonnet-20240229' },
  { name: 'DeepSeek', model: 'deepseek-chat' },
  { name: 'xAI', model: 'grok-beta' },
  { name: 'Mistral', model: 'mistral-large-latest' }
];

async function testProvider(provider) {
  console.log(`\n🧪 Testing ${provider.name} (${provider.model})...`);

  const payload = {
    query: testQuery.topic,
    provider: provider.name.toLowerCase(),
    thinkingModel: provider.model,
    taskModel: provider.model,
    searchProvider: 'tavily',
    language: 'en',
    maxResult: 10,
    temperature: 0.7
  };

  try {
    console.log(`   → Sending research request...`);
    const response = await fetch('http://localhost:3001/api/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      console.log(`   ❌ ${provider.name}: HTTP ${response.status} - ${response.statusText}`);
      return false;
    }

    // Check if we get a response stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunks = 0;
    let hasContent = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks++;
        const chunk = decoder.decode(value);
        // Look for valid SSE data indicating the AI is working
        if (chunk.includes('event: message') || chunk.includes('event: progress') || chunk.includes('report-plan')) {
          hasContent = true;
          break; // We got valid streaming data
        }

        if (chunks > 5) break; // Don't read forever
      }
    } finally {
      reader.releaseLock();
    }

    if (hasContent) {
      console.log(`   ✅ ${provider.name}: Streaming response received (${chunks} chunks)`);
      return true;
    } else {
      console.log(`   ⚠️  ${provider.name}: Response received but no valid content`);
      return false;
    }

  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log(`   ⏱️  ${provider.name}: Request timed out (30s)`);
    } else {
      console.log(`   ❌ ${provider.name}: ${error.message}`);
    }
    return false;
  }
}

async function runProviderTests() {
  console.log('🚀 Testing AI Providers for Deep Equity Research\n');
  console.log(`Test Query: "${testQuery.topic}"`);
  console.log(`Search Provider: Tavily`);
  console.log(`Search Depth: ${testQuery.searchDepth}`);

  const results = [];

  for (const provider of providers) {
    const success = await testProvider(provider);
    results.push({ provider: provider.name, model: provider.model, success });

    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  results.forEach(result => {
    const status = result.success ? '✅ WORKING' : '❌ FAILED';
    console.log(`${result.provider.padEnd(12)} (${result.model.padEnd(25)}): ${status}`);
  });

  const workingCount = results.filter(r => r.success).length;
  console.log(`\n🎯 ${workingCount}/${results.length} providers working successfully`);

  if (workingCount > 0) {
    const workingProviders = results.filter(r => r.success).map(r => r.provider);
    console.log(`\n✨ Recommended providers: ${workingProviders.join(', ')}`);
  }
}

runProviderTests().catch(console.error);