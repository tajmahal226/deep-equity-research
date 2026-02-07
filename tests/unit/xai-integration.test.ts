// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createAIProvider } from "@/utils/deep-research/provider";

describe("createAIProvider", () => {
    it("uses custom XAI provider for xai models", async () => {
        const provider = await createAIProvider({
            provider: "xai",
            model: "grok-2-latest",
            baseURL: "https://api.x.ai/v1",
            apiKey: "test-key",
        });

        // The custom XAILanguageModel sets this property to "xai"
        // The generic OpenAI compatible wrapper usually sets it to "openai"
        expect(provider.provider).toBe("xai");
    });
});
