import { shuffle } from "radash";

/**
 * Selects a random API key from a comma-separated list.
 *
 * @param apiKeys - Comma-separated API keys string.
 * @returns A single API key.
 */
export function multiApiKeyPolling(apiKeys = "") {
  return shuffle(apiKeys.split(","))[0];
}

/**
 * Checks if a model is a thinking/reasoning model.
 *
 * @param model - The model identifier.
 * @returns True if it's a thinking model.
 */
export function isThinkingModel(model: string) {
  return (
    model.includes("thinking") ||
    model.startsWith("gemini-2.5-pro") ||
    model.startsWith("gemini-2.5-flash")
  );
}

/**
 * Checks if a model is suitable for networking/task operations.
 *
 * @param model - The model identifier.
 * @returns True if it's a networking model.
 */
export function isNetworkingModel(model: string) {
  return (
    (model.startsWith("gemini-2.0-flash") &&
      !model.includes("lite") &&
      !model.includes("thinking") &&
      !model.includes("image")) ||
    model.startsWith("gemini-2.5-pro") ||
    model.startsWith("gemini-2.5-flash")
  );
}

/**
 * Parses a custom model list string into available and disabled lists.
 * Models starting with '+' are added, '-' are disabled.
 *
 * @param customModelList - Array of custom model strings.
 * @returns Object with available and disabled model lists.
 */
export function getCustomModelList(customModelList: string[]) {
  const availableModelList: string[] = [];
  const disabledModelList: string[] = [];
  customModelList.forEach((model) => {
    if (model.startsWith("+")) {
      availableModelList.push(model.substring(1));
    } else if (model.startsWith("-")) {
      disabledModelList.push(model.substring(1));
    } else {
      availableModelList.push(model);
    }
  });
  return { availableModelList, disabledModelList };
}
