
import { describe, it, expect } from "vitest";
import DeepResearch from "@/utils/deep-research";
import { getAIProviderBaseURL } from "@/app/api/utils";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

import { isFunction } from "radash";

describe("Reproduction Test", () => {
    it("logs steps to find crash", async () => {
        console.log("Starting test");
        console.log("isFunction imported:", isFunction);
        try {
            console.log("Checking @ai-sdk/google import");
            const google = createGoogleGenerativeAI({ apiKey: "test" });
            console.log("Google factory created:", !!google);
        } catch (e) {
            console.error("@ai-sdk/google crash:", e);
        }

        console.log("Creating DeepResearch instance");
        let dr;
        try {
            console.log("Evaluating baseURL");
            const baseURL = getAIProviderBaseURL("google");
            console.log("baseURL:", baseURL);

            dr = new DeepResearch({
                AIProvider: {
                    provider: "google",
                    baseURL: baseURL,
                    apiKey: "test-key",
                    thinkingModel: "gemini-2.5-flash-thinking",
                    taskModel: "gemini-2.5-pro",
                    temperature: 0.7,
                },
                searchProvider: {
                    provider: "model",
                    baseURL: "",
                },
            });
            console.log("DeepResearch instance created");
        } catch (e) {
            console.log("DeepResearch constructor crashed (LOG):", e);
            throw e; // rethrow to fail test
        }

        console.log("Calling getThinkingModel");
        try {
            const thinking = await dr.getThinkingModel();
            console.log("Thinking model created:", !!thinking);
        } catch (e) {
            console.error("getThinkingModel crashed:", e);
        }

        console.log("Calling getTaskModel");
        try {
            const task = await dr.getTaskModel();
            console.log("Task model created:", !!task);
        } catch (e) {
            console.error("getTaskModel crashed:", e);
        }
    });
});
