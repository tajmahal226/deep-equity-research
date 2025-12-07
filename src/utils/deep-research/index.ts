import { streamText, generateText } from "ai";
import { type GoogleGenerativeAIProviderMetadata } from "@ai-sdk/google";
import { createAIProvider } from "./provider";
import { handleError } from "../error";
import { useTaskStore } from "@/store/task";
import { createSearchProvider } from "./search";
import { getMaxTokens } from "@/constants/token-limits";
import { logger } from "@/utils/logger";
import {
  getSystemPrompt,
  writeReportPlanPrompt,
  generateSerpQueriesPrompt,
  processResultPrompt,
  processSearchResultPrompt,
  writeFinalReportPrompt,
  getSERPQuerySchema,
} from "./prompts";
import { outputGuidelinesPrompt } from "@/constants/prompts";
import { isNetworkingModel } from "@/utils/model";
import { ThinkTagStreamProcessor, removeJsonMarkdown } from "@/utils/text";
import { pick, unique, flat, isFunction } from "radash";

export interface DeepResearchOptions {
  AIProvider: {
    baseURL: string;
    apiKey?: string;
    provider: string;
    thinkingModel: string;
    taskModel: string;
    temperature?: number;
  };
  searchProvider: {
    baseURL: string;
    apiKey?: string;
    provider: string;
    maxResult?: number;
  };
  language?: string;
  onMessage?: (event: string, data: any) => void;
}

interface FinalReportResult {
  title: string;
  finalReport: string;
  learnings: string[];
  sources: Source[];
  images: ImageSource[];
}

export interface DeepResearchSearchTask {
  query: string;
  researchGoal: string;
}

export interface DeepResearchSearchResult {
  query: string;
  researchGoal: string;
  learning: string;
  sources?: {
    url: string;
    title?: string;
  }[];
  images?: {
    url: string;
    description?: string;
  }[];
}

export function addQuoteBeforeAllLine(text: string = "") {
  if (!text) {
    return "";
  }
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

/**
 * Main deep research class that orchestrates the research workflow.
 */
class DeepResearch {
  protected options: DeepResearchOptions;
  onMessage: (event: string, data: any) => void = () => { };

  /**
   * Initializes the DeepResearch instance with configuration options.
   *
   * @param options - Configuration options for AI and search providers.
   */
  constructor(options: DeepResearchOptions) {
    this.options = options;
    if (isFunction(options.onMessage)) {
      this.onMessage = options.onMessage;
    }
  }

  /**
   * Gets a configured AI provider instance for thinking/planning tasks.
   *
   * @returns Configured AI provider.
   */
  async getThinkingModel() {
    console.log("[DeepResearch] getThinkingModel called");
    if (!this.options) console.error("[DeepResearch] options is undefined!");
    const { AIProvider } = this.options;
    if (!AIProvider) console.error("[DeepResearch] AIProvider is undefined!");

    console.log("[DeepResearch] calling pick on AIProvider:", AIProvider);
    const AIProviderBaseOptions = pick(AIProvider, ["baseURL", "apiKey"]);
    console.log("[DeepResearch] pick result:", AIProviderBaseOptions);

    const { provider, thinkingModel } = AIProvider;

    // Don't pass temperature for reasoning models like GPT-5
    let settings: any = undefined;
    if (AIProvider.temperature !== undefined) {
      settings = { temperature: AIProvider.temperature };
    }
    const maxTokens = getMaxTokens(AIProvider.provider, AIProvider.thinkingModel);
    if (maxTokens !== undefined) {
      settings = { ...(settings || {}), maxTokens };
    }

    logger.log(`[DEBUG] DeepResearch.getThinkingModel: model="${AIProvider.thinkingModel}", temperature=${AIProvider.temperature}, finalSettings=`, settings);

    return await createAIProvider({
      provider: AIProvider.provider,
      model: AIProvider.thinkingModel,
      settings,
      ...AIProviderBaseOptions,
    });
  }

  /**
   * Gets a configured AI provider instance for task execution (e.g., analyzing search results).
   *
   * @returns Configured AI provider.
   */
  async getTaskModel() {
    const { AIProvider } = this.options;
    const AIProviderBaseOptions = pick(AIProvider, ["baseURL", "apiKey"]);

    // Build settings object
    const settings: any = {};

    // Add temperature only if not restricted (don't pass temperature for reasoning models like GPT-5)
    if (AIProvider.temperature !== undefined) {
      settings.temperature = AIProvider.temperature;
    }

    // Add Google-specific settings
    if (AIProvider.provider === "google" && isNetworkingModel(AIProvider.taskModel)) {
      settings.useSearchGrounding = true;
    }
    const maxTokens = getMaxTokens(AIProvider.provider, AIProvider.taskModel);
    if (maxTokens !== undefined) {
      settings.maxTokens = maxTokens;
    }

    const finalSettings = Object.keys(settings).length > 0 ? settings : undefined;
    logger.log(`[DEBUG] DeepResearch.getTaskModel: model="${AIProvider.taskModel}", temperature=${AIProvider.temperature}, finalSettings=`, finalSettings);

    return await createAIProvider({
      provider: AIProvider.provider,
      model: AIProvider.taskModel,
      settings: finalSettings,
      ...AIProviderBaseOptions,
    });
  }

  getResponseLanguagePrompt() {
    return this.options.language
      ? `**Respond in ${this.options.language}**`
      : `**Respond in the same language as the user's language**`;
  }

  /**
   * Generates a research plan based on the user's query.
   *
   * @param query - The research query.
   * @returns The generated research plan.
   */
  async writeReportPlan(query: string): Promise<string> {
    this.onMessage("progress", { step: "report-plan", status: "start" });
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const result = streamText({
      model: await this.getThinkingModel(),
      system: getSystemPrompt(),
      prompt: [
        writeReportPlanPrompt(query),
        this.getResponseLanguagePrompt(),
      ].join("\n\n"),
    });
    let content = "";
    this.onMessage("message", { type: "text", text: "<report-plan>\n" });
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        thinkTagStreamProcessor.processChunk(
          part.textDelta,
          (data) => {
            content += data;
            this.onMessage("message", { type: "text", text: data });
          },
          (data) => {
            this.onMessage("reasoning", { type: "text", text: data });
          }
        );
      } else if (part.type === "reasoning") {
        this.onMessage("reasoning", { type: "text", text: part.textDelta });
      }
    }
    this.onMessage("message", { type: "text", text: "\n</report-plan>\n\n" });
    this.onMessage("progress", {
      step: "report-plan",
      status: "end",
      data: content,
    });
    return content;
  }

  /**
   * Generates SERP queries based on the research plan.
   *
   * @param reportPlan - The research plan.
   * @returns List of search tasks.
   */
  async generateSERPQuery(
    reportPlan: string
  ): Promise<DeepResearchSearchTask[]> {
    this.onMessage("progress", { step: "serp-query", status: "start" });
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const { text } = await generateText({
      model: await this.getThinkingModel(),
      system: getSystemPrompt(),
      prompt: [
        generateSerpQueriesPrompt(reportPlan),
        this.getResponseLanguagePrompt(),
      ].join("\n\n"),
    });
    const querySchema = getSERPQuerySchema();
    let content = "";
    thinkTagStreamProcessor.processChunk(text, (data) => {
      content += data;
    });
    const data = JSON.parse(removeJsonMarkdown(content));
    thinkTagStreamProcessor.end();
    const result = querySchema.safeParse(data);
    if (result.success) {
      const tasks: DeepResearchSearchTask[] = data.map(
        (item: { query: string; researchGoal?: string }) => ({
          query: item.query,
          researchGoal: item.researchGoal || "",
        })
      );
      this.onMessage("progress", {
        step: "serp-query",
        status: "end",
        data: tasks,
      });
      return tasks;
    } else {
      throw new Error(result.error.message);
    }
  }

  /**
   * Executes search tasks and processes results.
   *
   * @param tasks - List of search tasks.
   * @param enableReferences - Whether to include references.
   * @returns List of processed search results.
   */
  async runSearchTask(
    tasks: DeepResearchSearchTask[],
    enableReferences = true
  ): Promise<SearchTask[]> {
    this.onMessage("progress", { step: "task-list", status: "start" });
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const results: SearchTask[] = [];
    for await (const item of tasks) {
      this.onMessage("progress", {
        step: "search-task",
        status: "start",
        name: item.query,
      });
      let content = "";
      let searchResult;
      let sources: Source[] = [];
      let images: ImageSource[] = [];
      const { provider: aiProvider, taskModel } = this.options.AIProvider;
      const { provider = "model", maxResult = 5 } = this.options.searchProvider;
      if (provider === "model") {
        const getTools = async () => {
          // Enable OpenAI's built-in search tool
          if (
            provider === "model" &&
            aiProvider === "openai" &&
            taskModel.startsWith("gpt-4o")
          ) {
            const { openai } = await import("@ai-sdk/openai");
            return {
              web_search_preview: openai.tools.webSearchPreview({
                // optional configuration:
                searchContextSize: maxResult > 5 ? "high" : "medium",
              }),
            };
          } else {
            return undefined;
          }
        };
        const getProviderOptions = () => {
          // Enable OpenRouter's built-in search tool
          if (provider === "model" && aiProvider === "openrouter") {
            return {
              openrouter: {
                plugins: [
                  {
                    id: "web",
                    max_results: maxResult ?? 5,
                  },
                ],
              },
            };
          } else {
            return undefined;
          }
        };

        searchResult = streamText({
          model: await this.getTaskModel(),
          system: getSystemPrompt(),
          prompt: [
            processResultPrompt(item.query, item.researchGoal),
            this.getResponseLanguagePrompt(),
          ].join("\n\n"),
          tools: await getTools(),
          providerOptions: getProviderOptions(),
        });
      } else {
        try {
          const result = await createSearchProvider({
            query: item.query,
            ...this.options.searchProvider,
          });

          sources = result.sources;
          images = result.images;
        } catch (err) {
          if (err instanceof Error) {
            throw err;
          }
          throw new Error(`[${provider}] Search failed`);
        }
        searchResult = streamText({
          model: await this.getTaskModel(),
          system: getSystemPrompt(),
          prompt: [
            processSearchResultPrompt(
              item.query,
              item.researchGoal,
              sources,
              sources.length > 0 && enableReferences
            ),
            this.getResponseLanguagePrompt(),
          ].join("\n\n"),
        });
      }

      this.onMessage("message", { type: "text", text: "<search-task>\n" });
      this.onMessage("message", { type: "text", text: `## ${item.query}\n\n` });
      this.onMessage("message", {
        type: "text",
        text: `${addQuoteBeforeAllLine(item.researchGoal)}\n\n`,
      });
      for await (const part of searchResult.fullStream) {
        if (part.type === "text-delta") {
          thinkTagStreamProcessor.processChunk(
            part.textDelta,
            (data) => {
              content += data;
              this.onMessage("message", { type: "text", text: data });
            },
            (data) => {
              this.onMessage("reasoning", { type: "text", text: data });
            }
          );
        } else if (part.type === "reasoning") {
          this.onMessage("reasoning", { type: "text", text: part.textDelta });
        } else if (part.type === "source") {
          sources.push(part.source);
        } else if (part.type === "finish") {
          if (part.providerMetadata?.google) {
            const { groundingMetadata } = part.providerMetadata.google;
            const googleGroundingMetadata =
              groundingMetadata as GoogleGenerativeAIProviderMetadata["groundingMetadata"];
            if (googleGroundingMetadata?.groundingSupports) {
              googleGroundingMetadata.groundingSupports.forEach(
                ({ segment, groundingChunkIndices }) => {
                  if (segment.text && groundingChunkIndices) {
                    const index = groundingChunkIndices.map(
                      (idx: number) => `[${idx + 1}]`
                    );
                    content = content.replaceAll(
                      segment.text,
                      `${segment.text}${index.join("")}`
                    );
                  }
                }
              );
            }
          } else if (part.providerMetadata?.openai) {
            // Fixed the problem that OpenAI cannot generate markdown reference link syntax properly in Chinese context
            content = content.replaceAll("【", "[").replaceAll("】", "]");
          }
        }
      }
      thinkTagStreamProcessor.end();

      if (images.length > 0) {
        const imageContent =
          "\n\n---\n\n" +
          images
            .map(
              (source) =>
                `![${source.description || source.url}](${source.url})`
            )
            .join("\n");
        content += imageContent;
        this.onMessage("message", { type: "text", text: imageContent });
      }

      if (sources.length > 0) {
        const sourceContent =
          "\n\n---\n\n" +
          sources
            .map(
              (item, idx) =>
                `[${idx + 1}]: ${item.url}${item.title ? ` "${item.title.replaceAll('"', " ")}"` : ""
                }`
            )
            .join("\n");
        content += sourceContent;
        this.onMessage("message", { type: "text", text: sourceContent });
      }
      this.onMessage("message", { type: "text", text: "\n</search-task>\n\n" });

      const task: SearchTask = {
        query: item.query,
        researchGoal: item.researchGoal,
        state: "completed",
        learning: content,
        sources,
        images,
      };
      results.push(task);
      this.onMessage("progress", {
        step: "search-task",
        status: "end",
        name: item.query,
        data: task,
      });
    }
    this.onMessage("progress", { step: "task-list", status: "end" });
    return results;
  }

  /**
   * Writes the final research report.
   *
   * @param reportPlan - The original plan.
   * @param tasks - The results from search tasks.
   * @param enableCitationImage - Include images.
   * @param enableReferences - Include references.
   * @returns Final report object.
   */
  async writeFinalReport(
    reportPlan: string,
    tasks: DeepResearchSearchResult[],
    enableCitationImage = true,
    enableReferences = true
  ): Promise<FinalReportResult> {
    this.onMessage("progress", { step: "final-report", status: "start" });
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const learnings = tasks.map((item) => item.learning);
    const sources: Source[] = unique(
      flat(tasks.map((item) => item.sources || [])),
      (item) => item.url
    );
    const images: ImageSource[] = unique(
      flat(tasks.map((item) => item.images || [])),
      (item) => item.url
    );
    const result = streamText({
      model: await this.getThinkingModel(),
      system: [getSystemPrompt(), outputGuidelinesPrompt].join("\n\n"),
      prompt: [
        writeFinalReportPrompt(
          reportPlan,
          learnings,
          sources.map((item) => pick(item, ["title", "url"])),
          images,
          "",
          images.length > 0 && enableCitationImage,
          sources.length > 0 && enableReferences
        ),
        this.getResponseLanguagePrompt(),
      ].join("\n\n"),
    });
    let content = "";
    this.onMessage("message", { type: "text", text: "<final-report>\n" });
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        thinkTagStreamProcessor.processChunk(
          part.textDelta,
          (data) => {
            content += data;
            this.onMessage("message", { type: "text", text: data });
          },
          (data) => {
            this.onMessage("reasoning", { type: "text", text: data });
          }
        );
      } else if (part.type === "reasoning") {
        this.onMessage("reasoning", { type: "text", text: part.textDelta });
      } else if (part.type === "source") {
        sources.push(part.source);
      } else if (part.type === "finish") {
        if (sources.length > 0) {
          const sourceContent =
            "\n\n---\n\n" +
            sources
              .map(
                (item, idx) =>
                  `[${idx + 1}]: ${item.url}${item.title ? ` "${item.title.replaceAll('"', " ")}"` : ""
                  }`
              )
              .join("\n");
          content += sourceContent;
        }
      }
    }
    this.onMessage("message", { type: "text", text: "\n</final-report>\n\n" });
    thinkTagStreamProcessor.end();

    const title = content
      .split("\n")[0]
      .replaceAll("#", "")
      .replaceAll("*", "")
      .trim();

    const finalReportResult: FinalReportResult = {
      title,
      finalReport: content,
      learnings,
      sources,
      images,
    };
    this.onMessage("progress", {
      step: "final-report",
      status: "end",
      data: finalReportResult,
    });
    return finalReportResult;
  }

  /**
   * Starts the full deep research process.
   *
   * @param query - The user's query.
   * @param enableCitationImage - Include images.
   * @param enableReferences - Include references.
   * @returns The final report result.
   */
  async start(
    query: string,
    enableCitationImage = true,
    enableReferences = true
  ) {
    const { setStatus } = useTaskStore.getState();
    try {
      setStatus("loading");
      const reportPlan = await this.writeReportPlan(query);
      const tasks = await this.generateSERPQuery(reportPlan);
      const results = await this.runSearchTask(tasks, enableReferences);
      const finalReport = await this.writeFinalReport(
        reportPlan,
        results,
        enableCitationImage,
        enableReferences
      );
      setStatus("success");
      return finalReport;
    } catch (err) {
      setStatus("error");
      handleError(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      this.onMessage("error", { message: errorMessage });
      throw new Error(errorMessage);
    }
  }
}

export default DeepResearch;
