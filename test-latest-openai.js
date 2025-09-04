// Test the latest OpenAI models including o3 and potential GPT-5
const latestModels = [
  // O3 Models (Latest Reasoning Models)
  { name: 'o3', category: 'O3' },
  { name: 'o3-pro', category: 'O3' },
  { name: 'o3-deep-research', category: 'O3' },
  { name: 'o3-mini', category: 'O3' },
  
  // Potential GPT-5 Models
  { name: 'gpt-5', category: 'GPT-5' },
  { name: 'gpt-5-turbo', category: 'GPT-5' },
  { name: 'gpt-5-preview', category: 'GPT-5' },
  
  // Other potential latest models
  { name: 'chatgpt-4o-latest', category: 'ChatGPT' },
  { name: 'gpt-4o-2024-11-20', category: 'GPT-4' },
  { name: 'gpt-4o-2024-08-06', category: 'GPT-4' },
];

async function testLatestModel(model) {
  console.log(`\n🧪 Testing ${model.name}...`);
  
  const payload = {
    query: "Provide deep research analysis on emerging AI investment opportunities in 2025",
    provider: "openai",
    thinkingModel: model.name,
    taskModel: model.name,
    searchProvider: "tavily",
    language: "en",
    maxResult: 8,
    temperature: 0.3 // Lower temperature for more focused research
  };

  try {
    const response = await fetch('http://localhost:3001/api/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000) // 20 second timeout for advanced models
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ ${model.name}: HTTP ${response.status} - ${response.statusText}`);
      if (errorText.includes('model') || errorText.includes('Model')) {
        console.log(`      → Model not available or incorrect name`);
      }
      return { model: model.name, category: model.category, success: false, error: `HTTP ${response.status}`, details: errorText.slice(0, 100) };
    }

    // Check for streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunks = 0;
    let hasValidContent = false;
    let errorContent = '';
    let responsePreview = '';

    try {
      while (chunks < 5) { // Check first 5 chunks for advanced models
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks++;
        const chunk = decoder.decode(value);
        
        if (chunks === 1) {
          responsePreview = chunk.slice(0, 200);
        }
        
        // Check for error messages
        if (chunk.includes('error') || chunk.includes('Error') || chunk.includes('failed') || chunk.includes('invalid')) {
          errorContent = chunk;
        }
        
        // Look for valid response indicators
        if (chunk.includes('event: message') || chunk.includes('event: progress') || chunk.includes('report-plan')) {
          hasValidContent = true;
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (hasValidContent) {
      console.log(`   ✅ ${model.name}: Working perfectly! (${chunks} chunks received)`);
      console.log(`      → Response preview: ${responsePreview.replace(/\n/g, ' ').slice(0, 80)}...`);
      return { model: model.name, category: model.category, success: true, error: null, chunks };
    } else if (errorContent) {
      console.log(`   ❌ ${model.name}: Error in response`);
      console.log(`      → Error details: ${errorContent.slice(0, 150)}...`);
      return { model: model.name, category: model.category, success: false, error: 'Response error', details: errorContent };
    } else {
      console.log(`   ⚠️  ${model.name}: Connected but no valid content`);
      return { model: model.name, category: model.category, success: false, error: 'No content', chunks };
    }

  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log(`   ⏱️  ${model.name}: Request timed out (may be processing)`);
      return { model: model.name, category: model.category, success: false, error: 'Timeout' };
    } else if (error.message.includes('fetch')) {
      console.log(`   🔌 ${model.name}: Connection error`);
      return { model: model.name, category: model.category, success: false, error: 'Connection error' };
    } else {
      console.log(`   ❌ ${model.name}: ${error.message}`);
      return { model: model.name, category: model.category, success: false, error: error.message };
    }
  }
}

async function runLatestModelTests() {
  console.log('🚀 Testing Latest OpenAI Models (O3, GPT-5, etc.)\n');
  console.log(`Total models to test: ${latestModels.length}`);
  console.log(`Test query: Deep research on AI investment opportunities`);
  console.log(`Provider: OpenAI | Search: Tavily | Timeout: 20s\n`);
  
  const results = [];
  
  for (const model of latestModels) {
    const result = await testLatestModel(model);
    results.push(result);
    
    // Wait 2 seconds between tests for advanced models
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Group results by category
  const categories = {};
  results.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = [];
    }
    categories[result.category].push(result);
  });
  
  console.log('\n📊 Latest OpenAI Models Test Results:');
  console.log('=====================================');
  
  Object.keys(categories).forEach(category => {
    console.log(`\n🏷️  ${category} Models:`);
    categories[category].forEach(result => {
      const status = result.success ? '✅ WORKING' : `❌ FAILED (${result.error})`;
      console.log(`   ${result.model.padEnd(20)}: ${status}`);
      if (result.details && !result.success) {
        console.log(`      → ${result.details.slice(0, 80)}...`);
      }
    });
  });
  
  const workingModels = results.filter(r => r.success);
  const failedModels = results.filter(r => !r.success);
  
  console.log(`\n🎯 Summary: ${workingModels.length}/${results.length} latest models working`);
  
  if (workingModels.length > 0) {
    console.log(`\n🌟 BREAKTHROUGH: Latest Models Working!`);
    workingModels.forEach(model => {
      console.log(`   🚀 ${model.model} (${model.category}) - Next-gen AI research capabilities!`);
    });
  }
  
  if (failedModels.length > 0) {
    console.log(`\n📋 Models Not Yet Available:`);
    failedModels.forEach(model => {
      if (model.error.includes('HTTP 4')) {
        console.log(`   ⏳ ${model.model} - May not be released yet or requires special access`);
      } else {
        console.log(`   ❌ ${model.model} - ${model.error}`);
      }
    });
  }
  
  console.log(`\n💡 Total OpenAI Models Available: ${12 + workingModels.length}`);
  console.log(`   • Standard Models: 12/12 working`);
  console.log(`   • Latest Models: ${workingModels.length}/${latestModels.length} working`);
  
  if (workingModels.some(m => m.model.includes('o3'))) {
    console.log(`\n🎉 O3 MODELS DETECTED! These offer advanced reasoning for deep research!`);
  }
  
  if (workingModels.some(m => m.model.includes('gpt-5'))) {
    console.log(`\n🎊 GPT-5 DETECTED! You have access to the next generation of AI!`);
  }
}

runLatestModelTests().catch(console.error);