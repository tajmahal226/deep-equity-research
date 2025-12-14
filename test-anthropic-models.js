// Comprehensive test of all Anthropic Claude models
const anthropicModels = [
  // Claude 3 Models (Latest Generation)
  { name: 'claude-3-opus-20240229', category: 'Claude 3', tier: 'Flagship' },
  { name: 'claude-3-sonnet-20240229', category: 'Claude 3', tier: 'Balanced' },
  { name: 'claude-3-haiku-20240307', category: 'Claude 3', tier: 'Fast' },

  // Claude 3.5 Models (Newest)
  { name: 'claude-3-5-sonnet-20240620', category: 'Claude 3.5', tier: 'Enhanced' },
  { name: 'claude-3-5-sonnet-20241022', category: 'Claude 3.5', tier: 'Latest' },
  { name: 'claude-3-5-haiku-20241022', category: 'Claude 3.5', tier: 'Fast Enhanced' },

  // Legacy Claude 2 Models
  { name: 'claude-2.1', category: 'Claude 2', tier: 'Legacy' },
  { name: 'claude-2.0', category: 'Claude 2', tier: 'Legacy' },

  // Instant Models (Fast, Economical)
  { name: 'claude-instant-1.2', category: 'Claude Instant', tier: 'Economy' },

  // Potential new models to test
  { name: 'claude-3-opus-latest', category: 'Claude 3', tier: 'Latest Opus' },
  { name: 'claude-3-5-opus-20241022', category: 'Claude 3.5', tier: 'Premium' },
];

async function testAnthropicModel(model) {
  console.log(`\n🧪 Testing Anthropic ${model.name} (${model.tier})...`);

  const payload = {
    query: "Analyze the competitive advantages of Microsoft vs Google in enterprise AI services. Focus on: revenue models, market share, technical capabilities, and 3-year outlook.",
    provider: "anthropic",
    thinkingModel: model.name,
    taskModel: model.name,
    searchProvider: "tavily",
    language: "en",
    maxResult: 10,
    temperature: 0.5 // Balanced for Claude models
  };

  try {
    const response = await fetch('http://localhost:3001/api/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000) // 20 second timeout
    });

    console.log(`   Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      const errorPreview = errorText.slice(0, 150).replace(/\n/g, ' ');

      if (errorText.includes('model_not_found') || errorText.includes('invalid_model')) {
        console.log(`   ❌ ${model.name}: Model not available on your API key`);
        return { model: model.name, category: model.category, tier: model.tier, success: false, error: 'Model not available' };
      }

      console.log(`   ❌ ${model.name}: HTTP ${response.status}`);
      console.log(`      → Error: ${errorPreview}`);
      return { model: model.name, category: model.category, tier: model.tier, success: false, error: `HTTP ${response.status}` };
    }

    // Check for streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunks = 0;
    let hasValidContent = false;
    let firstChunk = '';
    let totalBytes = 0;

    try {
      const startTime = Date.now();

      while (chunks < 5) { // Check first 5 chunks
        const { done, value } = await reader.read();
        if (done) break;

        chunks++;
        totalBytes += value.length;
        const chunk = decoder.decode(value);

        if (chunks === 1) {
          firstChunk = chunk.slice(0, 200);
        }

        // Look for valid Claude response patterns
        if (chunk.includes('event: message') ||
            chunk.includes('event: progress') ||
            chunk.includes('report-plan') ||
            chunk.includes('thinking') ||
            chunk.includes('analyzing')) {
          hasValidContent = true;
          break;
        }
      }

      const responseTime = Date.now() - startTime;

      if (hasValidContent) {
        console.log(`   ✅ ${model.name}: Working perfectly!`);
        console.log(`      → Response time: ${responseTime}ms | Chunks: ${chunks} | Bytes: ${totalBytes}`);
        console.log(`      → Preview: ${firstChunk.replace(/\n/g, ' ').slice(0, 80)}...`);
        return {
          model: model.name,
          category: model.category,
          tier: model.tier,
          success: true,
          responseTime,
          chunks,
          bytes: totalBytes
        };
      }

    } finally {
      reader.releaseLock();
    }

    console.log(`   ⚠️  ${model.name}: Connected but no valid streaming content`);
    return { model: model.name, category: model.category, tier: model.tier, success: false, error: 'No streaming content' };

  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log(`   ⏱️  ${model.name}: Request timed out (20s)`);
      return { model: model.name, category: model.category, tier: model.tier, success: false, error: 'Timeout' };
    } else {
      console.log(`   ❌ ${model.name}: ${error.message}`);
      return { model: model.name, category: model.category, tier: model.tier, success: false, error: error.message };
    }
  }
}

async function runAnthropicTests() {
  console.log('🚀 Testing All Anthropic Claude Models for Deep Equity Research\n');
  console.log(`Provider: Anthropic`);
  console.log(`API Key: ${process.env.ANTHROPIC_API_KEY ? 'Configured ✓' : 'From Docker env ✓'}`);
  console.log(`Total models to test: ${anthropicModels.length}`);
  console.log(`Test query: Enterprise AI competitive analysis (MSFT vs GOOGL)\n`);
  console.log('='.repeat(70));

  const results = [];

  for (const model of anthropicModels) {
    const result = await testAnthropicModel(model);
    results.push(result);

    // Wait 1.5 seconds between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Group results by category
  const categories = {};
  results.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = [];
    }
    categories[result.category].push(result);
  });

  console.log('\n' + '='.repeat(70));
  console.log('📊 Anthropic Claude Model Test Results:');
  console.log('='.repeat(70));

  Object.keys(categories).forEach(category => {
    console.log(`\n🏷️  ${category} Models:`);
    categories[category].forEach(result => {
      const status = result.success
        ? `✅ WORKING (${result.responseTime}ms, ${result.chunks} chunks)`
        : `❌ FAILED (${result.error})`;
      console.log(`   ${result.model.padEnd(35)} [${result.tier.padEnd(15)}]: ${status}`);
    });
  });

  const workingModels = results.filter(r => r.success);
  const failedModels = results.filter(r => !r.success);

  console.log('\n' + '='.repeat(70));
  console.log(`🎯 Summary: ${workingModels.length}/${results.length} Anthropic models working`);

  if (workingModels.length > 0) {
    console.log(`\n✨ Working Claude Models (${workingModels.length}):`);

    // Sort by response time
    workingModels.sort((a, b) => a.responseTime - b.responseTime);

    console.log('\n🏆 Performance Ranking (by speed):');
    workingModels.forEach((model, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`   ${medal} ${model.model} - ${model.responseTime}ms (${model.tier})`);
    });

    console.log(`\n💡 Recommendations for Equity Research:`);

    const opus = workingModels.find(m => m.model.includes('opus'));
    const sonnet = workingModels.find(m => m.model.includes('sonnet'));
    const haiku = workingModels.find(m => m.model.includes('haiku'));

    if (opus) {
      console.log(`   🌟 Deep Analysis: ${opus.model}`);
      console.log(`      → Best for: Comprehensive company analysis, complex financial modeling`);
    }
    if (sonnet) {
      console.log(`   ⚡ Balanced: ${sonnet.model}`);
      console.log(`      → Best for: Daily research, earnings analysis, sector comparisons`);
    }
    if (haiku) {
      console.log(`   💨 Fast Screening: ${haiku.model}`);
      console.log(`      → Best for: Quick screening, bulk analysis, real-time monitoring`);
    }
  }

  if (failedModels.length > 0) {
    console.log(`\n❌ Models Not Available (${failedModels.length}):`);
    const errorGroups = {};
    failedModels.forEach(model => {
      if (!errorGroups[model.error]) errorGroups[model.error] = [];
      errorGroups[model.error].push(model.model);
    });

    Object.keys(errorGroups).forEach(error => {
      console.log(`   ${error}:`);
      errorGroups[error].forEach(model => {
        console.log(`      - ${model}`);
      });
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('💎 Claude Model Insights for Equity Research:');
  console.log('='.repeat(70));
  console.log(`
  • Claude 3 Opus: Most capable for complex analysis (200k context)
  • Claude 3.5 Sonnet: Best balance of speed and capability
  • Claude 3 Haiku: Fastest for high-volume screening
  • Claude Instant: Most cost-effective for basic queries

  All Claude models excel at:
  - Understanding financial statements
  - Analyzing competitive dynamics
  - Risk assessment and compliance
  - Nuanced market interpretation
  `);
}

runAnthropicTests().catch(console.error);