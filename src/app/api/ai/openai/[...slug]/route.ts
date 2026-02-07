import { OPENAI_BASE_URL } from "@/constants/urls";
import { createProxyHandler } from "../../create-proxy-handler";
import { normalizeOpenAISlugForModel } from "@/utils/openai-models";

export const runtime = "edge";
export const preferredRegion = [
  "cle1",
  "iad1",
  "pdx1",
  "sfo1",
  "sin1",
  "syd1",
  "hnd1",
  "kix1",
];

const API_PROXY_BASE_URL = process.env.OPENAI_API_BASE_URL || OPENAI_BASE_URL;

const handler = createProxyHandler(API_PROXY_BASE_URL, {
  preprocess: async (body, slug) => {
    // Handle endpoint routing based on model type
    if (body && body.model) {
      const model = body.model;

      // Handle undefined or missing model names
      if (!model || model === "undefined" || model === "") {
        throw new Error("Model name is required");
      }

      // Normalize model name to handle hypothetical/invalid models and
      // route requests to the proper OpenAI endpoint (chat vs responses)
      const { model: normalizedModel, slug: normalizedSlug } =
        normalizeOpenAISlugForModel(slug, model);

      if (normalizedModel && normalizedModel !== model) {
        body.model = normalizedModel;
      }

      if (normalizedSlug) {
        return { body, slug: normalizedSlug };
      }
    }
    return { body, slug };
  },
});

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
