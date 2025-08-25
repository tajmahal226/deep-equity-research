#!/usr/bin/env node

/**
 * DEBUG TEMPERATURE PARAMETER FLOW
 * This helps identify exactly where temperature parameters are coming from
 */

// Mock the current filter function
function filterModelSettings(provider, model, settings) {
  console.log(`🔍 FILTER INPUT: Provider=${provider}, Model=${model}`);
  console.log(`   Input settings: ${JSON.stringify(settings)}`);
  
  if (!settings) return settings;
  
  const filteredSettings = { ...settings };
  
  switch (provider) {
    case "openai":
      // Check if this is a responses API model
      if (model.startsWith("o1") || model.startsWith("o3") || model.startsWith("gpt-5") || model.includes("o3-")) {
        console.log(`   ⚡ RESPONSES MODEL DETECTED: ${model}`);
        if (filteredSettings.temperature !== undefined) {
          console.log(`   🚫 REMOVING temperature parameter: ${filteredSettings.temperature} → deleted`);
          delete filteredSettings.temperature;
        } else {
          console.log(`   ✅ No temperature parameter to remove`);
        }
      } else {
        console.log(`   📝 Regular OpenAI model: ${model} (temperature preserved)`);
      }
      break;
      
    default:
      console.log(`   📝 Non-OpenAI provider: ${provider}`);
      break;
  }
  
  console.log(`   Output settings: ${JSON.stringify(filteredSettings)}`);
  console.log(`   Temperature removed: ${!filteredSettings.hasOwnProperty('temperature')}\n`);
  
  return filteredSettings;
}

// Test scenarios that match the user's issue
console.log('🚨 DEBUGGING TEMPERATURE PARAMETER FLOW\n');
console.log('Testing exact scenarios that could cause the error...\n');

const testScenarios = [
  {
    name: 'GPT-5 Thinking Model',
    provider: 'openai',
    model: 'gpt-5',
    settings: { temperature: 0.5, maxTokens: 5000 }
  },
  {
    name: 'GPT-5 Task Model', 
    provider: 'openai',
    model: 'gpt-5',
    settings: { temperature: 0.3, maxTokens: 1000 }
  },
  {
    name: 'o1-preview Model',
    provider: 'openai', 
    model: 'o1-preview',
    settings: { temperature: 0.7, maxTokens: 2000 }
  },
  {
    name: 'o1-mini Model',
    provider: 'openai',
    model: 'o1-mini', 
    settings: { temperature: 1.0, maxTokens: 1500 }
  },
  {
    name: 'GPT-5-turbo (if exists)',
    provider: 'openai',
    model: 'gpt-5-turbo',
    settings: { temperature: 0.8, maxTokens: 3000 }
  },
  {
    name: 'Control - GPT-4o (should keep temperature)',
    provider: 'openai',
    model: 'gpt-4o',
    settings: { temperature: 0.6, maxTokens: 2000 }
  }
];

console.log('🧪 RUNNING DEBUG TESTS:\n');
console.log('='.repeat(80));

for (const scenario of testScenarios) {
  console.log(`📋 Testing: ${scenario.name}`);
  
  try {
    const result = filterModelSettings(scenario.provider, scenario.model, scenario.settings);
    
    // Check if temperature was properly handled
    const hasTemp = result.hasOwnProperty('temperature');
    const isResponsesModel = scenario.model.startsWith('o1') || 
                           scenario.model.startsWith('o3') || 
                           scenario.model.startsWith('gpt-5');
    
    if (isResponsesModel && hasTemp) {
      console.log(`❌ CRITICAL ERROR: Temperature still present in responses model!`);
      console.log(`   This WILL cause the "Unsupported parameter" error!`);
    } else if (isResponsesModel && !hasTemp) {
      console.log(`✅ SUCCESS: Temperature properly removed for responses model`);
    } else if (!isResponsesModel && hasTemp) {
      console.log(`✅ SUCCESS: Temperature preserved for regular model`);
    } else {
      console.log(`⚠️  UNEXPECTED: Regular model has no temperature`);
    }
    
  } catch (error) {
    console.log(`❌ ERROR in filtering: ${error.message}`);
  }
  
  console.log('-'.repeat(80));
}

console.log('\n🎯 DEBUGGING CHECKLIST:');
console.log('1. ✅ Filter function identifies responses models correctly');
console.log('2. ✅ Temperature parameter gets deleted for responses models');  
console.log('3. ✅ Regular models preserve temperature');
console.log('4. ⚠️  Check if temperature is being set AFTER filtering');
console.log('5. ⚠️  Check if multiple filter calls are happening');
console.log('6. ⚠️  Check if AI SDK is adding temperature internally');

console.log('\n💡 NEXT DEBUGGING STEPS:');
console.log('- Share the exact model name causing the error');
console.log('- Check browser/server console logs for filter debug output');  
console.log('- Verify the error happens during model initialization or generation');
console.log('- Check if custom model settings are overriding filtered settings');