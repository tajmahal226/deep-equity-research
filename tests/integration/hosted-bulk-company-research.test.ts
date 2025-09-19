import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CompanyDeepResearch } from "@/utils/company-deep-research";

const companies = ["Alpha Corp", "Beta Inc"];

interface ProviderCase {
  name: string;
  providerId: string;
  envVars: string[];
  thinkingModelId: string;
  taskModelId: string;
  expectedMessage: RegExp;
}

const hostedProviders: ProviderCase[] = [
  {
    name: "OpenAI",
    providerId: "openai",
    envVars: ["OPENAI_API_KEY"],
    thinkingModelId: "gpt-5",
    taskModelId: "gpt-5-turbo",
    expectedMessage: /No OpenAI API key/i,
  },
  {
    name: "Google",
    providerId: "google",
    envVars: [
      "GOOGLE_GENERATIVE_AI_API_KEY",
      "GOOGLE_API_KEY",
      "GEMINI_API_KEY",
    ],
    thinkingModelId: "gemini-2.5-flash-thinking",
    taskModelId: "gemini-2.5-pro",
    expectedMessage: /No Google API key/i,
  },
  {
    name: "xAI",
    providerId: "xai",
    envVars: ["XAI_API_KEY"],
    thinkingModelId: "grok-3",
    taskModelId: "grok-3",
    expectedMessage: /No xAI API key/i,
  },
  {
    name: "Mistral",
    providerId: "mistral",
    envVars: ["MISTRAL_API_KEY"],
    thinkingModelId: "mistral-large-2411",
    taskModelId: "mistral-large-latest",
    expectedMessage: /No Mistral API key/i,
  },
  {
    name: "OpenRouter",
    providerId: "openrouter",
    envVars: ["OPENROUTER_API_KEY"],
    thinkingModelId: "anthropic/claude-3.5-sonnet",
    taskModelId: "anthropic/claude-3.5-sonnet",
    expectedMessage: /No OpenRouter API key/i,
  },
];

hostedProviders.forEach((providerCase) => {
  describe(`Bulk Company Research Module - ${providerCase.name} Provider`, () => {
    beforeEach(() => {
      providerCase.envVars.forEach((envVar) => {
        vi.stubEnv(envVar, "");
      });
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    companies.forEach((company) => {
      it(`fails with helpful error for missing API key (${company})`, async () => {
        const researcher = new CompanyDeepResearch({
          companyName: company,
          subIndustries: [],
          competitors: [],
          researchSources: [],
          searchDepth: "fast",
          language: "en-US",
          thinkingModelConfig: {
            modelId: providerCase.thinkingModelId,
            providerId: providerCase.providerId,
          },
          taskModelConfig: {
            modelId: providerCase.taskModelId,
            providerId: providerCase.providerId,
          },
        });

        await expect(researcher.runFastResearch()).rejects.toThrow(
          providerCase.expectedMessage,
        );
      });
    });
  });
});
