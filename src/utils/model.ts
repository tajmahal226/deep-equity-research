import { shuffle } from "radash";

export function multiApiKeyPolling(apiKeys = "") {
  return shuffle(apiKeys.split(","))[0];
}

export function isThinkingModel(model: string) {
  return (
    model.includes("thinking") ||
    model.startsWith("gemini-2.5-pro") ||
    model.startsWith("gemini-2.5-flash") ||
    model.startsWith("gemini-3-pro") ||
    model.startsWith("gemini-3-flash")
  );
}

export function isNetworkingModel(model: string) {
  return (
    (model.startsWith("gemini-2.0-flash") &&
      !model.includes("lite") &&
      !model.includes("thinking") &&
      !model.includes("image")) ||
    model.startsWith("gemini-2.5-pro") ||
    model.startsWith("gemini-2.5-flash") ||
    model.startsWith("gemini-3-pro") ||
    model.startsWith("gemini-3-flash")
  );
}

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
