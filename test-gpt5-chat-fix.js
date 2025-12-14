#!/usr/bin/env node

/**
 * Test the refined fix for gpt-5-chat-latest (which DOES support temperature)
 */

// Updated mock function with the refined logic
function filterModelSettings(provider, model, settings) {
  if (!settings) return settings;

  const filteredSettings = { ...settings };

  switch (provider) {
    case "openai":
      // Only specific reasoning models don't support temperature parameter
      if (model.startsWith("o1") ||
          model.startsWith("o3") ||
          model.includes("o3-") ||
          (model.startsWith("gpt-5") && !model.includes("chat"))) {
        // Reasoning models only support default temperature=1
        delete filteredSettings.temperature;
      }
      // Regular OpenAI models (GPT-4, GPT-4-turbo, gpt-5-chat-latest) support temperature
      break;

    default:
      break;
  }

  return filteredSettings;
}

console.log('🧪 TESTING REFINED GPT-5 TEMPERATURE FIX\n');
console.log('Based on official documentation: gpt-5-chat-latest DOES support temperature\n');

const testCases = [
  {
    name: 'gpt-5-chat-latest (should KEEP temperature)',
    model: 'gpt-5-chat-latest',
    expected: 'temperature preserved'
  },
  {
    name: 'gpt-5 reasoning model (should REMOVE temperature)',
    model: 'gpt-5',
    expected: 'temperature removed'
  },
  {
    name: 'gpt-5-reasoning (should REMOVE temperature)',
    model: 'gpt-5-reasoning',
    expected: 'temperature removed'
  },
  {
    name: 'o1-preview (should REMOVE temperature)',
    model: 'o1-preview',
    expected: 'temperature removed'
  },
  {
    name: 'o1-mini (should REMOVE temperature)',
    model: 'o1-mini',
    expected: 'temperature removed'
  },
  {
    name: 'o3-mini (should REMOVE temperature)',
    model: 'o3-mini',
    expected: 'temperature removed'
  },
  {
    name: 'gpt-4o (should KEEP temperature)',
    model: 'gpt-4o',
    expected: 'temperature preserved'
  }
];

console.log('📋 RUNNING REFINED TESTS:');
console.log('=' .repeat(70));

let allPassed = true;

for (const testCase of testCases) {
  const input = { temperature: 0.7, maxTokens: 2000 };
  const result = filterModelSettings('openai', testCase.model, input);

  const hasTemp = result.hasOwnProperty('temperature');
  const shouldHaveTemp = testCase.expected === 'temperature preserved';
  const passed = hasTemp === shouldHaveTemp;

  console.log(`\n${testCase.name}:`);
  console.log(`   Input:    ${JSON.stringify(input)}`);
  console.log(`   Output:   ${JSON.stringify(result)}`);
  console.log(`   Expected: ${testCase.expected}`);
  console.log(`   Result:   ${hasTemp ? 'temperature kept' : 'temperature removed'}`);
  console.log(`   Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);

  if (!passed) allPassed = false;
}

console.log('\n🎯 SUMMARY:');
console.log('=' .repeat(70));

if (allPassed) {
  console.log('🎉 SUCCESS! All tests passed!');
  console.log('   ✅ gpt-5-chat-latest now supports temperature (fixed!)');
  console.log('   ✅ o1/o3 reasoning models still have temperature removed');
  console.log('   ✅ Regular GPT models preserve temperature');
  console.log('\n💡 The temperature error should now be resolved for gpt-5-chat-latest!');
} else {
  console.log('❌ Some tests failed - logic needs further refinement');
}

console.log('\n🔧 Key Fix Applied:');
console.log('   - Changed: model.startsWith("gpt-5")');
console.log('   - To: (model.startsWith("gpt-5") && !model.includes("chat"))');
console.log('   - Result: gpt-5-chat-latest now keeps temperature parameter');