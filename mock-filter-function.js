// Mock the filterModelSettings function with the EXACT fix applied
function filterModelSettings(provider, model, settings) {
  if (!settings) return settings;

  const filteredSettings = { ...settings };

  switch (provider) {
    case "openai":
      // OpenAI API parameters based on official documentation
      // For responses API (o3, GPT-5): temperature parameter is NOT supported at all
      if (model.startsWith("o3") || model.startsWith("gpt-5") || model.includes("o3-")) {
        // Responses API does NOT support temperature parameter - remove it completely
        delete filteredSettings.temperature;
      }
      // Regular OpenAI models support temperature 0-2
      break;

    case "anthropic":
      // Anthropic Claude supports temperature 0-1
      if (filteredSettings.temperature !== undefined && filteredSettings.temperature > 1) {
        filteredSettings.temperature = 1;
      }
      break;

    default:
      // Other providers typically support temperature
      break;
  }

  return filteredSettings;
}

module.exports = { filterModelSettings };
