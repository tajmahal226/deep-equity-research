// Test all OpenAI models to see which ones work
const openaiModels = [
  // GPT-4 Models
  { name: 'gpt-4o', category: 'GPT-4' },
  { name: 'gpt-4o-mini', category: 'GPT-4' },
  { name: 'gpt-4-turbo', category: 'GPT-4' },
  { name: 'gpt-4-turbo-preview', category: 'GPT-4' },
  { name: 'gpt-4', category: 'GPT-4' },
  { name: 'gpt-4-0125-preview', category: 'GPT-4' },
  { name: 'gpt-4-1106-preview', category: 'GPT-4' },
  
  // GPT-3.5 Models
  { name: 'gpt-3.5-turbo', category: 'GPT-3.5' },
  { name: 'gpt-3.5-turbo-0125', category: 'GPT-3.5' },
  { name: 'gpt-3.5-turbo-1106', category: 'GPT-3.5' },
  
  // O1 Models (Reasoning)
  { name: 'o1-preview', category: 'O1' },
  { name: 'o1-mini', category: 'O1' },
];

async function testOpenAIModel(model) {
  console.log(`\n🧪 Testing OpenAI ${model.name}...`);
  
  const payload = {
    query: "What are the top 3 AI technology trends for investors?",
    provider: "openai",
    thinkingModel: model.name,
    taskModel: model.name,
    searchProvider: "tavily",
    language: "en",
    maxResult: 5,
    temperature: 0.7
  };

  try {
    const response = await fetch('http://localhost:3001/api/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      console.log(`   ❌ ${model.name}: HTTP ${response.status} - ${response.statusText}`);
      return { model: model.name, category: model.category, success: false, error: `HTTP ${response.status}` };
    }

    // Check for streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunks = 0;
    let hasValidContent = false;
    let errorContent = '';

    try {
      while (chunks < 3) { // Check first 3 chunks
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks++;
        const chunk = decoder.decode(value);
        
        // Check for error messages
        if (chunk.includes('error') || chunk.includes('Error') || chunk.includes('failed')) {
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
      console.log(`   ✅ ${model.name}: Working (${chunks} chunks received)`);
      return { model: model.name, category: model.category, success: true, error: null };
    } else if (errorContent) {
      console.log(`   ❌ ${model.name}: Error in response - ${errorContent.slice(0, 100)}...`);
      return { model: model.name, category: model.category, success: false, error: 'Response error' };
    } else {
      console.log(`   ⚠️  ${model.name}: No valid content received`);
      return { model: model.name, category: model.category, success: false, error: 'No content' };
    }

  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log(`   ⏱️  ${model.name}: Request timed out`);
      return { model: model.name, category: model.category, success: false, error: 'Timeout' };
    } else {
      console.log(`   ❌ ${model.name}: ${error.message}`);
      return { model: model.name, category: model.category, success: false, error: error.message };
    }
  }
}

async function runOpenAIModelTests() {
  console.log('🚀 Testing All OpenAI Models for Deep Equity Research\n');
  console.log(`Total models to test: ${openaiModels.length}`);
  console.log(`Test query: "What are the top 3 AI technology trends for investors?"`);
  console.log(`Provider: OpenAI | Search: Tavily\n`);
  
  const results = [];
  
  for (const model of openaiModels) {
    const result = await testOpenAIModel(model);
    results.push(result);
    
    // Wait 1 second between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Group results by category
  const categories = {};
  results.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = [];
    }
    categories[result.category].push(result);
  });
  
  console.log('\n📊 OpenAI Model Test Results:');
  console.log('===============================');
  
  Object.keys(categories).forEach(category => {
    console.log(`\n🏷️  ${category} Models:`);
    categories[category].forEach(result => {
      const status = result.success ? '✅ WORKING' : `❌ FAILED (${result.error})`;
      console.log(`   ${result.model.padEnd(25)}: ${status}`);
    });
  });
  
  const workingModels = results.filter(r => r.success);
  const failedModels = results.filter(r => !r.success);
  
  console.log(`\n🎯 Summary: ${workingModels.length}/${results.length} OpenAI models working`);
  
  if (workingModels.length > 0) {
    console.log(`\n✨ Working Models:`);
    workingModels.forEach(model => {
      console.log(`   • ${model.model} (${model.category})`);
    });
    
    console.log(`\n💡 Recommended for research:`);
    const recommended = workingModels.filter(m => 
      m.model.includes('gpt-4o') || m.model.includes('gpt-4-turbo') || m.model.includes('o1')
    );
    recommended.forEach(model => {
      console.log(`   🌟 ${model.model} - Best for comprehensive analysis`);
    });
  }
  
  if (failedModels.length > 0) {
    console.log(`\n❌ Failed Models:`);
    const errorTypes = {};
    failedModels.forEach(model => {
      if (!errorTypes[model.error]) errorTypes[model.error] = [];
      errorTypes[model.error].push(model.model);
    });
    
    Object.keys(errorTypes).forEach(error => {
      console.log(`   ${error}: ${errorTypes[error].join(', ')}`);
    });
  }
}

runOpenAIModelTests().catch(console.error);