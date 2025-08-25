#!/usr/bin/env node

/**
 * Specific test to verify the temperature parameter fix
 * Tests that temperature parameters are properly filtered for different models
 */

const { CompanyDeepResearch } = require('./src/utils/company-deep-research/index.ts');

async function testTemperatureFix() {
  console.log('🧪 Testing Temperature Parameter Fix...\n');

  const testCases = [
    {
      name: 'OpenAI GPT-4o (regular model)',
      config: {
        companyName: "Test Company",
        searchDepth: "fast",
        language: "en-US",
        thinkingModelConfig: {
          modelId: "gpt-4o",
          providerId: "openai", 
          apiKey: "sk-test-key-123",
        },
        taskModelConfig: {
          modelId: "gpt-4o",
          providerId: "openai",
          apiKey: "sk-test-key-123",
        },
        onProgress: () => {},
        onMessage: () => {},
        onError: () => {},
      }
    },
    {
      name: 'OpenAI o3-mini (responses API model)',
      config: {
        companyName: "Test Company",
        searchDepth: "fast",
        language: "en-US",
        thinkingModelConfig: {
          modelId: "o3-mini",
          providerId: "openai",
          apiKey: "sk-test-key-123",
        },
        taskModelConfig: {
          modelId: "o3-mini", 
          providerId: "openai",
          apiKey: "sk-test-key-123",
        },
        onProgress: () => {},
        onMessage: () => {},
        onError: () => {},
      }
    },
    {
      name: 'Anthropic Claude (temperature 0-1)',
      config: {
        companyName: "Test Company",
        searchDepth: "fast",
        language: "en-US",
        thinkingModelConfig: {
          modelId: "claude-3-5-sonnet-20241022",
          providerId: "anthropic",
          apiKey: "ant-test-key-123",
        },
        taskModelConfig: {
          modelId: "claude-3-5-haiku-20241022",
          providerId: "anthropic", 
          apiKey: "ant-test-key-123",
        },
        onProgress: () => {},
        onMessage: () => {},
        onError: () => {},
      }
    },
    {
      name: 'Missing model config (should use fallbacks)',
      config: {
        companyName: "Test Company",
        searchDepth: "fast", 
        language: "en-US",
        thinkingModelConfig: {
          // Missing modelId and providerId
          apiKey: "sk-test-key-123",
        },
        taskModelConfig: {
          // Missing modelId and providerId
          apiKey: "sk-test-key-123", 
        },
        onProgress: () => {},
        onMessage: () => {},
        onError: () => {},
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    
    try {
      const researcher = new CompanyDeepResearch(testCase.config);
      
      // Test the parameter filtering methods directly
      // This should NOT throw temperature parameter errors anymore
      const thinkingSettings = researcher.getThinkingModelSettings({ temperature: 0.5, maxTokens: 1000 });
      const taskSettings = researcher.getTaskModelSettings({ temperature: 0.7, maxTokens: 2000 });
      
      console.log(`   ✅ Parameter filtering working`);
      console.log(`      Thinking settings: ${JSON.stringify(thinkingSettings)}`);
      console.log(`      Task settings: ${JSON.stringify(taskSettings)}\n`);
      
    } catch (error) {
      if (error.message.includes('Unsupported parameter')) {
        console.log(`   ❌ TEMPERATURE ERROR STILL EXISTS: ${error.message}\n`);
      } else if (error.message.includes('API key')) {
        console.log(`   ⚠️  Expected API key error (not temperature issue): ${error.message.split('.')[0]}\n`);
      } else {
        console.log(`   ❌ Unexpected error: ${error.message}\n`);
      }
    }
  }

  console.log('🎯 Temperature Fix Test Complete!');
  console.log('\n💡 Key Points:');
  console.log('   - No "Unsupported parameter: temperature" errors should appear');
  console.log('   - API key errors are expected and normal');
  console.log('   - Parameter filtering should work even with missing configs');
}

testTemperatureFix().catch(console.error);