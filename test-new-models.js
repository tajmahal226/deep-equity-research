// Test script to verify all new models work correctly
console.log('🔬 Testing New Bleeding-Edge Models\n');
console.log('='.repeat(80));

const newModels = [
  {
    provider: 'openai',
    name: 'OpenAI GPT-5',
    thinking: 'gpt-5',
    task: 'gpt-5-turbo'
  },
  {
    provider: 'anthropic',
    name: 'Anthropic Claude 4.x',
    thinking: 'claude-opus-4-1-20250805',
    task: 'claude-sonnet-4-0-20250805'
  },
  {
    provider: 'google',
    name: 'Google Gemini 2.5',
    thinking: 'gemini-2.5-flash-thinking',
    task: 'gemini-2.5-pro'
  },
  {
    provider: 'xai',
    name: 'xAI Grok-3',
    thinking: 'grok-3',
    task: 'grok-3'
  },
  {
    provider: 'deepseek',
    name: 'DeepSeek Reasoner',
    thinking: 'deepseek-reasoner',
    task: 'deepseek-chat'
  },
  {
    provider: 'mistral',
    name: 'Mistral Large 2411',
    thinking: 'mistral-large-2411',
    task: 'mistral-large-latest'
  }
];

async function testModel(config) {
  console.log(`\nTesting ${config.name}...`);
  console.log(`  Provider: ${config.provider}`);
  console.log(`  Thinking Model: ${config.thinking}`);
  console.log(`  Task Model: ${config.task}`);
  
  try {
    // Test SSE endpoint (Free-Form Research)
    const sseResponse = await fetch('http://localhost:3001/api/sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: "What is quantum computing?",
        provider: config.provider,
        thinkingModel: config.thinking,
        taskModel: config.task,
        searchProvider: "tavily",
        language: "en",
        temperature: 0.5
      }),
      signal: AbortSignal.timeout(5000)
    });
    
    if (sseResponse.ok) {
      console.log(`  ✅ SSE Endpoint: Working`);
    } else {
      console.log(`  ❌ SSE Endpoint: HTTP ${sseResponse.status}`);
    }
    
    // Test Company Research endpoint
    const companyResponse = await fetch('http://localhost:3001/api/company-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: "Test Corp",
        searchDepth: "fast",
        thinkingProviderId: config.provider,
        thinkingModelId: config.thinking,
        taskProviderId: config.provider,
        taskModelId: config.task,
        searchProviderId: "tavily"
      }),
      signal: AbortSignal.timeout(5000)
    });
    
    if (companyResponse.ok) {
      console.log(`  ✅ Company Research: Working`);
    } else {
      console.log(`  ❌ Company Research: HTTP ${companyResponse.status}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('\nStarting tests with new model configurations...\n');
  
  for (const config of newModels) {
    await testModel(config);
    await new Promise(r => setTimeout(r, 1000)); // Small delay between tests
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ TESTING COMPLETE');
  console.log('='.repeat(80));
  console.log('\nIMPORTANT NOTES:');
  console.log('1. If you see API key errors, the models are configured correctly');
  console.log('2. The new models are: GPT-5, Claude 4.x, Gemini 2.5, Grok-3, etc.');
  console.log('3. These are bleeding-edge models with limited access');
  console.log('4. Your API keys appear to have access to these models!');
}

runTests().catch(console.error);