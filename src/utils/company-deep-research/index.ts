/**
 * Company Deep Research Implementation
 * 
 * This is the main class that handles all company-specific research logic.
 * It adapts the general deep research flow for investment analysis of companies.
 * 
 * What this does:
 * - Takes company information and generates targeted research
 * - Supports three depth levels: fast, medium, and deep
 * - Uses investment research structure from companyDivePrompts.ts
 * - Integrates with AI providers and search providers
 * 
 * Files it depends on:
 * - /src/utils/deep-research/index.ts (base research logic we're extending)
 * - /src/constants/companyDivePrompts.ts (investment research structure)
 * - /src/utils/model.ts (AI model interactions)
 * - /src/hooks/useAiProvider.ts and useSearchProvider.ts (provider configs)
 * 
 * How to modify:
 * - To change research sections: Update INVESTMENT_RESEARCH_SECTIONS in companyDivePrompts.ts
 * - To add new search strategies: Modify generateCompanySearchQueries method
 * - To change output format: Update the report generation methods
 */

import { 
  systemInstruction, 
  outputGuidelinesPrompt, 
  guidelinesPrompt,
  INVESTMENT_RESEARCH_SECTIONS 
} from "@/constants/companyDivePrompts";
import { multiApiKeyPolling } from "@/utils/model";
import { 
  getAIProviderBaseURL, 
  getAIProviderApiKey,
  getSearchProviderBaseURL,
  getSearchProviderApiKey 
} from "@/app/api/utils";
import { streamText, generateText } from "ai";
import { createAIProvider } from "@/utils/deep-research/provider";
import { createSearchProvider } from "@/utils/deep-research/search";
import { logger } from "@/utils/logger";
import { ThinkTagStreamProcessor } from "@/utils/text";
// Removed unused import: pick from radash

// Import types we'll need
interface CompanyResearchConfig {
  // Company information
  companyName: string;
  companyWebsite?: string;
  industry?: string;
  subIndustries: string[];
  competitors: string[];
  researchSources: string[];
  additionalContext?: string;
  
  // Research settings
  searchDepth: "fast" | "medium" | "deep";
  language: string;
  
  // AI provider configuration
  thinkingModelConfig?: {
    modelId: string;
    providerId: string;
    apiKey?: string;
  };
  taskModelConfig?: {
    modelId: string;
    providerId: string;
    apiKey?: string;
  };
  
  // Search provider
  searchProviderId?: string;
  searchProviderApiKey?: string;
  
  // Callback functions for real-time updates
  onProgress?: (data: any) => void;
  onMessage?: (data: any) => void;
  onReasoning?: (data: any) => void;
  onError?: (error: Error) => void;
}

// Structure for a search task
interface CompanySearchTask {
  query: string;
  researchGoal: string;
  section: string; // Which investment section this relates to
  priority: "high" | "medium" | "low";
}

// Result structure
interface CompanyResearchResult {
  report: {
    title: string;
    content: string;
    sections: Record<string, string>; // Each investment section
  };
  sources: Array<{
    title: string;
    url: string;
    relevance: string;
  }>;
  images: Array<{
    url: string;
    description: string;
    source: string;
  }>;
}

export class CompanyDeepResearch {
  private config: CompanyResearchConfig;
  private thinkingModel: any; // The model used for reasoning and report writing
  private taskModel: any; // The model used for quick tasks and search processing
  private searchProvider: any; // The search provider (Tavily, etc.)
  private initialized: boolean = false;
  
  constructor(config: CompanyResearchConfig) {
    this.config = config;
    
    // Debug: Check if imports are loaded
    logger.log("CompanyDeepResearch constructor - Checking imports:");
    logger.log("systemInstruction:", typeof systemInstruction, systemInstruction?.substring(0, 50) + "...");
    logger.log("outputGuidelinesPrompt:", typeof outputGuidelinesPrompt, outputGuidelinesPrompt?.substring(0, 50) + "...");
    logger.log(
      "INVESTMENT_RESEARCH_SECTIONS:",
      typeof INVESTMENT_RESEARCH_SECTIONS,
      Object.keys(INVESTMENT_RESEARCH_SECTIONS || {})
    );
  }
  
  /**
   * Initialize AI models and search provider
   * This is separate from constructor to allow async operations
   * 
   * How this works:
   * 1. Gets default provider/model settings from environment
   * 2. Overrides with user-specified settings if provided
   * 3. Creates AI provider instances using the deep-research provider factory
   * 4. Initializes search provider for web searches
   */
  private async init() {
    // Skip if already initialized
    if (this.initialized) return;
    
    this.config.onProgress?.({
      step: "initialization",
      status: "Initializing AI models and search providers"
    });
    
    try {
      // Step 1: Determine AI provider and models
      // Users must configure their API keys and models through the settings UI, or we'll use defaults
      if (!this.config.thinkingModelConfig?.providerId || !this.config.thinkingModelConfig?.modelId) {
        throw new Error('Thinking model not configured. Please click the settings gear icon in the top-right corner to configure your AI provider, API key, and models.');
      }
      
      if (!this.config.taskModelConfig?.providerId || !this.config.taskModelConfig?.modelId) {
        throw new Error('Task model not configured. Please click the settings gear icon in the top-right corner to configure your AI provider, API key, and models.');
      }
      
      const thinkingProvider = this.config.thinkingModelConfig.providerId;
      const thinkingModel = this.config.thinkingModelConfig.modelId;
      const taskProvider = this.config.taskModelConfig.providerId;
      const taskModel = this.config.taskModelConfig.modelId;
      
      // Step 2: Initialize thinking model (for complex reasoning)
      try {
        const clientApiKey = this.config.thinkingModelConfig?.apiKey;
        const serverApiKey = getAIProviderApiKey(thinkingProvider);
        const apiKey = clientApiKey || serverApiKey;
        
        if (!apiKey) {
          if (thinkingProvider === "openai" && (thinkingModel.includes("o3") || thinkingModel.startsWith("gpt-5"))) {
            throw new Error(`No OpenAI API key found for ${thinkingModel}. Advanced OpenAI models (GPT-5, o3 series) require a valid API key. Please click the settings gear icon in the top-right corner to enter your OpenAI API key, or set the OPENAI_API_KEY environment variable.`);
          }
          if (thinkingProvider === "anthropic") {
            throw new Error(`No Anthropic API key found for Claude ${thinkingModel}. Please click the settings gear icon in the top-right corner to enter your Anthropic API key, or set the ANTHROPIC_API_KEY environment variable.`);
          }
          if (thinkingProvider === "deepseek" && thinkingModel.includes("reasoner")) {
            throw new Error(`No DeepSeek API key found for reasoning model ${thinkingModel}. Please click the settings gear icon in the top-right corner to enter your DeepSeek API key, or set the DEEPSEEK_API_KEY environment variable.`);
          }
          if (thinkingProvider === "xai") {
            throw new Error(`No xAI API key found for Grok ${thinkingModel}. Please click the settings gear icon in the top-right corner to enter your xAI API key, or set the XAI_API_KEY environment variable.`);
          }
          throw new Error(`No API key found for ${thinkingProvider}. Please click the settings gear icon in the top-right corner to enter your ${thinkingProvider.toUpperCase()} API key.`);
        }
        
        this.thinkingModel = await createAIProvider({
          provider: thinkingProvider,
          model: thinkingModel,
          baseURL: getAIProviderBaseURL(thinkingProvider),
          apiKey: multiApiKeyPolling(apiKey),
        });
      } catch (error) {
        console.error("Failed to initialize thinking model:", error);
        throw new Error(`Failed to initialize thinking model (${thinkingProvider}/${thinkingModel}): ${error}`);
      }
      
      // Step 3: Initialize task model (for quick processing)
      try {
        const clientApiKey = this.config.taskModelConfig?.apiKey;
        const serverApiKey = getAIProviderApiKey(taskProvider);
        const apiKey = clientApiKey || serverApiKey;
        
        if (!apiKey) {
          if (taskProvider === "openai" && (taskModel.includes("o3") || taskModel.startsWith("gpt-5"))) {
            throw new Error(`No OpenAI API key found for ${taskModel}. Advanced OpenAI models (GPT-5, o3 series) require a valid API key. Please click the settings gear icon in the top-right corner to enter your OpenAI API key, or set the OPENAI_API_KEY environment variable.`);
          }
          if (taskProvider === "anthropic") {
            throw new Error(`No Anthropic API key found for Claude ${taskModel}. Please click the settings gear icon in the top-right corner to enter your Anthropic API key, or set the ANTHROPIC_API_KEY environment variable.`);
          }
          if (taskProvider === "deepseek") {
            throw new Error(`No DeepSeek API key found for ${taskModel}. Please click the settings gear icon in the top-right corner to enter your DeepSeek API key, or set the DEEPSEEK_API_KEY environment variable.`);
          }
          if (taskProvider === "xai") {
            throw new Error(`No xAI API key found for Grok ${taskModel}. Please click the settings gear icon in the top-right corner to enter your xAI API key, or set the XAI_API_KEY environment variable.`);
          }
          throw new Error(`No API key found for ${taskProvider}. Please click the settings gear icon in the top-right corner to enter your ${taskProvider.toUpperCase()} API key.`);
        }
        
        this.taskModel = await createAIProvider({
          provider: taskProvider,
          model: taskModel,
          baseURL: getAIProviderBaseURL(taskProvider),
          apiKey: multiApiKeyPolling(apiKey),
        });
      } catch (error) {
        console.error("Failed to initialize task model:", error);
        throw new Error(`Failed to initialize task model (${taskProvider}/${taskModel}): ${error}`);
      }
      
      // Step 4: Initialize search provider configuration if deep or medium research
      if (this.config.searchDepth !== "fast") {
        const searchProviderId = this.config.searchProviderId || "tavily";
        
        // Create a search function that uses the provider
        this.searchProvider = async (query: string) => {
          try {
            const clientApiKey = this.config.searchProviderApiKey;
            const serverApiKey = getSearchProviderApiKey(searchProviderId);
            const apiKey = clientApiKey || serverApiKey;
            
            if (searchProviderId !== "model" && !apiKey) {
              throw new Error(`No API key found for search provider: ${searchProviderId}. Please click the settings gear icon in the top-right corner to enter your ${searchProviderId.toUpperCase()} API key.`);
            }
            
            return await createSearchProvider({
              provider: searchProviderId,
              baseURL: getSearchProviderBaseURL(searchProviderId),
              apiKey: multiApiKeyPolling(apiKey),
              query: query,
              maxResult: this.config.searchDepth === "deep" ? 10 : 5,
            });
          } catch (error) {
            console.error(`Search failed for query "${query}":`, error);
            throw error;
          }
        };
      }
      
      this.initialized = true;
      
      this.config.onProgress?.({
        step: "initialization",
        status: "complete",
        message: "AI models and search providers initialized successfully"
      });
      
    } catch (error) {
      console.error("Failed to initialize AI models:", error);
      this.config.onError?.(new Error(`Initialization failed: ${error}`));
      throw error;
    }
  }
  
  /**
   * Run fast research - no web searches, just AI analysis
   * Perfect for quick overviews or when you already know the basics
   */
  async runFastResearch(): Promise<CompanyResearchResult> {
    await this.init();
    
    this.config.onProgress?.({
      step: "fast-research",
      status: "start",
      message: "Starting fast company analysis..."
    });
    
    try {
      // Step 1: Build a comprehensive prompt with all company context
      const prompt = this.buildFastResearchPrompt();
      
      // Step 2: Get AI to generate a quick analysis
      this.config.onProgress?.({
        step: "fast-research",
        status: "generating",
        message: "AI is analyzing the company..."
      });
      
      // Generate analysis using the configured task model
      const report = await this.callTaskModel(prompt);
      
      this.config.onProgress?.({
        step: "fast-research",
        status: "complete",
        message: "Fast analysis complete!"
      });
      
      return {
        report: {
          title: `${this.config.companyName} - Quick Analysis`,
          content: report,
          sections: {} // Fast mode doesn't break into sections
        },
        sources: [], // No sources in fast mode
        images: []  // No images in fast mode
      };
      
    } catch (error) {
      this.config.onError?.(error as Error);
      throw error;
    }
  }
  
  /**
   * Run medium research - limited searches on key topics
   * Good balance between speed and depth
   */
  async runMediumResearch(): Promise<CompanyResearchResult> {
    await this.init();
    
    this.config.onProgress?.({
      step: "medium-research", 
      status: "start",
      message: "Starting medium-depth company research..."
    });
    
    try {
      // Step 1: Generate focused search queries for key areas
      const searchTasks = await this.generateMediumSearchQueries();
      
      // Step 2: Execute searches (limited to ~10 queries)
      const searchResults = await this.executeSearchTasks(searchTasks.slice(0, 10));
      
      // Step 3: Generate report with medium depth
      const report = await this.generateMediumReport(searchResults);
      
      return report;
      
    } catch (error) {
      this.config.onError?.(error as Error);
      throw error;
    }
  }
  
  /**
   * Run deep research - comprehensive analysis with all investment sections
   * This is what you want for serious due diligence
   */
  async runDeepResearch(): Promise<CompanyResearchResult> {
    await this.init();
    
    this.config.onProgress?.({
      step: "deep-research",
      status: "start", 
      message: "Starting comprehensive company deep dive..."
    });
    
    try {
      // Step 1: Create detailed research plan based on investment sections
      this.config.onProgress?.({
        step: "research-plan",
        status: "generating",
        message: "Creating investment research plan..."
      });
      
      const researchPlan = await this.createInvestmentResearchPlan();
      
      // Step 2: Generate comprehensive search queries for all sections
      this.config.onProgress?.({
        step: "search-queries",
        status: "generating",
        message: "Generating search queries for all investment areas..."
      });
      
      const searchTasks = await this.generateDeepSearchQueries(researchPlan);
      
      // Step 3: Execute all searches (could be 50+ queries)
      this.config.onProgress?.({
        step: "search-execution",
        status: "start",
        message: `Executing ${searchTasks.length} search queries...`
      });
      
      const searchResults = await this.executeSearchTasks(searchTasks);
      
      // Step 4: Generate comprehensive investment report
      this.config.onProgress?.({
        step: "report-generation",
        status: "start",
        message: "Generating comprehensive investment report..."
      });
      
      const report = await this.generateDeepReport(researchPlan, searchResults);
      
      this.config.onProgress?.({
        step: "deep-research",
        status: "complete",
        message: "Deep dive research complete!"
      });
      
      return report;
      
    } catch (error) {
      this.config.onError?.(error as Error);
      throw error;
    }
  }
  
  /**
   * Build a comprehensive prompt for fast research
   * Includes all company context in a single prompt
   */
  private buildFastResearchPrompt(): string {
    const { 
      companyName, 
      companyWebsite, 
      industry, 
      subIndustries,
      competitors,
      additionalContext 
    } = this.config;
    
    // Check if systemInstruction is available
    if (!systemInstruction) {
      console.error("systemInstruction is undefined!");
      throw new Error("Failed to load investment prompts. Please check that companyDivePrompts.ts is properly configured.");
    }
    
    return `${systemInstruction}

Please provide a quick investment analysis of ${companyName}.

Company Information:
- Name: ${companyName}
- Website: ${companyWebsite || "Not provided"}
- Industry: ${industry || "Not specified"}
- Sub-Industries: ${subIndustries.length > 0 ? subIndustries.join(", ") : "Not specified"}
- Known Competitors: ${competitors.length > 0 ? competitors.join(", ") : "Not specified"}

${additionalContext ? `Additional Context: ${additionalContext}` : ""}

Please provide a concise analysis covering:
1. Company Overview - What they do and their value proposition
2. Market Position - Their place in the competitive landscape  
3. Key Strengths & Opportunities
4. Key Risks & Challenges
5. Investment Thesis - Bull and bear case

${outputGuidelinesPrompt}

Keep the analysis concise but insightful, focusing on what an investor needs to know.`;
  }
  
  /**
   * Generate search queries for medium-depth research
   * Focus on the most important areas only
   */
  private async generateMediumSearchQueries(): Promise<CompanySearchTask[]> {
    const { companyName, companyWebsite, competitors } = this.config;
    const queries: CompanySearchTask[] = [];
    
    // Company overview queries
    queries.push({
      query: `${companyName} company overview products services`,
      researchGoal: "Understand what the company does and their main offerings",
      section: "companyOverview",
      priority: "high"
    });
    
    if (companyWebsite) {
      queries.push({
        query: `site:${companyWebsite} products pricing`,
        researchGoal: "Get official information about products and pricing",
        section: "companyOverview", 
        priority: "high"
      });
    }
    
    // Recent news
    queries.push({
      query: `${companyName} news ${new Date().getFullYear()}`,
      researchGoal: "Find recent developments and announcements",
      section: "recentNews",
      priority: "high"
    });
    
    // Competitor analysis (top 3 competitors only for medium)
    competitors.slice(0, 3).forEach(competitor => {
      queries.push({
        query: `${companyName} vs ${competitor} comparison`,
        researchGoal: `Understand competitive positioning against ${competitor}`,
        section: "competitiveAnalysis",
        priority: "medium"
      });
    });
    
    // Market and funding
    queries.push({
      query: `${companyName} funding round valuation investment`,
      researchGoal: "Find funding history and investor information",
      section: "recentNews",
      priority: "medium"
    });
    
    return queries;
  }
  
  /**
   * Create a detailed investment research plan
   * This structures the deep research according to our investment framework
   * 
   * The AI customizes the plan based on company specifics
   */
  private async createInvestmentResearchPlan(): Promise<any> {
    try {
      // Use thinking model to customize the research plan
      const planPrompt = `You are planning investment research for ${this.config.companyName}.

Company Context:
- Name: ${this.config.companyName}
- Industry: ${this.config.industry || "Not specified"}
- Known Competitors: ${this.config.competitors.join(", ") || "Not specified"}
${this.config.additionalContext ? `- Additional Context: ${this.config.additionalContext}` : ""}

Create a research plan that prioritizes the most important aspects for this specific company.
Consider what's most relevant given the industry, competitive dynamics, and any specific context provided.

Available research sections:
${Object.entries(INVESTMENT_RESEARCH_SECTIONS)
  .map(([, section]) => `- ${section.title}: ${section.prompts[0]}`)
  .join("\n")}

Provide a brief rationale for which sections should be prioritized and any company-specific focus areas.`;

      const { text: planRationale } = await generateText({
        model: this.taskModel,
        prompt: planPrompt,
        temperature: 0.3,
        maxTokens: 1000,
      });
      
      // Log the plan rationale for debugging
      logger.log("Research plan rationale:", planRationale);
      
      // Build the structured plan with all sections but customized priorities
      const plan = {
        companyName: this.config.companyName,
        rationale: planRationale,
        sections: Object.entries(INVESTMENT_RESEARCH_SECTIONS).map(([key, section]) => ({
          id: key,
          title: section.title,
          prompts: section.prompts,
          priority: this.getSectionPriority(key),
          // Add any company-specific focus based on the rationale
          focus: this.extractSectionFocus(key, planRationale)
        }))
      };
      
      return plan;
      
    } catch (error) {
      console.error("Error creating research plan:", error);
      // Fallback to default plan if AI fails
      return {
        companyName: this.config.companyName,
        sections: Object.entries(INVESTMENT_RESEARCH_SECTIONS).map(([key, section]) => ({
          id: key,
          title: section.title,
          prompts: section.prompts,
          priority: this.getSectionPriority(key)
        }))
      };
    }
  }
  
  /**
   * Extract any specific focus areas for a section from the AI rationale
   */
  private extractSectionFocus(sectionId: string, rationale: string): string {
    // Simple extraction - in production, could use more sophisticated parsing
    const sectionName = INVESTMENT_RESEARCH_SECTIONS[sectionId as keyof typeof INVESTMENT_RESEARCH_SECTIONS]?.title;
    if (!sectionName) return "";
    
    // Look for mentions of the section in the rationale
    const sectionRegex = new RegExp(`${sectionName}[^.]*\\.`, "gi");
    const matches = rationale.match(sectionRegex);
    
    return matches ? matches.join(" ") : "";
  }
  
  /**
   * Determine priority of each investment section
   * Some sections are more critical than others
   */
  private getSectionPriority(sectionId: string): "high" | "medium" | "low" {
    const highPriority = ["companyOverview", "competitiveAnalysis", "bullBearCase"];
    const mediumPriority = ["marketBackground", "customersBuyersChannels", "recentNews"];
    
    if (highPriority.includes(sectionId)) return "high";
    if (mediumPriority.includes(sectionId)) return "medium";
    return "low";
  }
  
  /**
   * Generate comprehensive search queries for deep research
   * Creates queries for every investment section
   */
  private async generateDeepSearchQueries(researchPlan: any): Promise<CompanySearchTask[]> {
    const queries: CompanySearchTask[] = [];
    const { companyName, companyWebsite, industry, competitors, researchSources } = this.config;
    
    // For each investment section, generate targeted queries
    researchPlan.sections.forEach((section: any) => {
      switch (section.id) {
        case "companyOverview":
          // Multiple queries for comprehensive company understanding
          queries.push({
            query: `${companyName} products services technology platform`,
            researchGoal: "Understand core offerings and technology",
            section: section.id,
            priority: section.priority
          });
          
          queries.push({
            query: `${companyName} business model revenue streams pricing`,
            researchGoal: "Understand how they make money",
            section: section.id,
            priority: section.priority
          });
          
          if (companyWebsite) {
            queries.push({
              query: `site:${companyWebsite} case studies ROI customers`,
              researchGoal: "Find customer success stories and ROI data",
              section: section.id,
              priority: section.priority
            });
          }
          break;
          
        case "competitiveAnalysis":
          // Query for each competitor
          competitors.forEach(competitor => {
            queries.push({
              query: `${companyName} vs ${competitor} comparison features pricing`,
              researchGoal: `Detailed comparison with ${competitor}`,
              section: section.id,
              priority: section.priority
            });
          });
          
          // General competitive landscape
          queries.push({
            query: `${industry} competitive landscape market leaders ${companyName}`,
            researchGoal: "Understand overall market competition",
            section: section.id,
            priority: section.priority
          });
          break;
          
        case "marketBackground":
          queries.push({
            query: `${industry} market size growth rate trends ${new Date().getFullYear()}`,
            researchGoal: "Understand market dynamics and size",
            section: section.id,
            priority: section.priority
          });
          
          queries.push({
            query: `${industry} challenges problems pain points`,
            researchGoal: "Understand market problems being solved",
            section: section.id,
            priority: section.priority
          });
          break;
          
        // Add more cases for other sections...
        case "recentNews":
          queries.push({
            query: `${companyName} latest news announcements ${new Date().getFullYear()}`,
            researchGoal: "Find recent developments",
            section: section.id,
            priority: section.priority
          });
          
          queries.push({
            query: `${companyName} funding investment acquisition partnership`,
            researchGoal: "Find strategic moves and funding events",
            section: section.id,
            priority: section.priority
          });
          break;
      }
    });
    
    // Add queries for user-specified research sources
    researchSources.forEach(source => {
      queries.push({
        query: `site:${source} ${companyName}`,
        researchGoal: `Find information about ${companyName} on ${source}`,
        section: "additionalResearch",
        priority: "medium"
      });
    });
    
    return queries;
  }
  
  /**
   * Execute search tasks and gather results
   * This is where we actually hit the search APIs
   * 
   * Process:
   * 1. Execute each search query using the search provider
   * 2. Process results with AI to extract learnings
   * 3. Collect sources and images
   * 4. Return structured results for report generation
   */
  private async executeSearchTasks(tasks: CompanySearchTask[]): Promise<any[]> {
    this.config.onProgress?.({
      step: "search-execution",
      status: "processing",
      message: `Executing ${tasks.length} searches...`
    });
    
    const results = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      try {
        this.config.onProgress?.({
          step: "search-execution",
          status: "processing",
          message: `Searching: ${task.query}`,
          progress: `${i + 1}/${tasks.length}`
        });
        
        // Step 1: Execute the search
        const searchResult = await this.searchProvider(task.query);
        
        if (!searchResult || !searchResult.sources || searchResult.sources.length === 0) {
          logger.log(`No results for query: ${task.query}`);
          continue;
        }
        
        // Step 2: Process search results with AI to extract learnings
        // This synthesizes the raw search results into useful insights
        const learningPrompt = `You are analyzing search results for investment research on ${this.config.companyName}.

Research Goal: ${task.researchGoal}
Section: ${task.section}

Search Results:
${searchResult.sources.map((result: any, idx: number) => `
[${idx + 1}] ${result.title || "Untitled"}
URL: ${result.url}
Content: ${result.content || result.snippet || "No content available"}
`).join("\n")}

Please synthesize these search results into key learnings relevant to the research goal.
Focus on factual information that would be valuable for an investment analyst.
Be specific and include data points, dates, and concrete details when available.`;

        const { text: learning } = await generateText({
          model: this.taskModel,
          prompt: learningPrompt,
          temperature: 0.3, // Low temperature for factual synthesis
          maxTokens: 1000,
        });
        
        // Step 3: Collect sources and format them
        const sources = searchResult.sources.map((result: any) => ({
          title: result.title || "Untitled",
          url: result.url,
          snippet: result.content || result.snippet,
        }));
        
        // Step 4: Extract any images from results
        const images = searchResult.images || [];
        
        results.push({
          task: task,
          sources: sources,
          images: images,
          learning: learning,
          rawResults: searchResult // Keep raw results for debugging
        });
        
      } catch (error) {
        console.error(`Error executing search for "${task.query}":`, error);
        // Continue with other searches even if one fails
        this.config.onError?.(new Error(`Search failed for "${task.query}": ${error}`));
      }
    }
    
    this.config.onProgress?.({
      step: "search-execution",
      status: "complete",
      message: `Completed ${results.length} searches`
    });
    
    return results;
  }
  
  /**
   * Call the configured task model with the provided prompt
   * Used for fast, search-free analysis
   */
  private async callTaskModel(prompt: string): Promise<string> {
    try {
      this.config.onMessage?.({
        type: "report-chunk",
        content: "Starting AI analysis..."
      });
      
      // Use generateText for fast, non-streaming response
      const { text } = await generateText({
        model: this.taskModel,
        prompt: prompt,
        temperature: 0.7, // Some creativity but mostly factual
        maxTokens: 4000, // Enough for a comprehensive quick analysis
      });
      
      // Send the complete report
      this.config.onMessage?.({
        type: "report-complete",
        content: text
      });
      
      return text;
      
    } catch (error) {
      console.error("Error calling task model:", error);
      throw new Error(`Failed to generate fast analysis: ${error}`);
    }
  }
  
  /**
   * Generate medium-depth report with limited search results
   * Uses thinking model but focuses on key sections only
   */
  private async generateMediumReport(searchResults: any[]): Promise<CompanyResearchResult> {
    try {
      // Collect all learnings and sources
      const allLearnings: string[] = [];
      const allSources: any[] = [];
      const allImages: any[] = [];
      
      searchResults.forEach(result => {
        allLearnings.push(`[${result.task.researchGoal}]\n${result.learning}`);
        allSources.push(...result.sources);
        allImages.push(...result.images);
      });
      
      // Build focused prompt for medium depth
      // Ensure systemInstruction is defined before using it
      if (!systemInstruction) {
        throw new Error("systemInstruction is not defined. Check companyDivePrompts.ts imports.");
      }
      
      const mediumPrompt = `${systemInstruction.replace("{now}", new Date().toLocaleDateString())}

You are creating a focused investment analysis for ${this.config.companyName}.

Company Context:
- Name: ${this.config.companyName}
- Website: ${this.config.companyWebsite || "Not provided"}
- Industry: ${this.config.industry || "Not specified"}
- Sub-Industries: ${this.config.subIndustries.join(", ") || "Not specified"}
- Known Competitors: ${this.config.competitors.join(", ") || "Not specified"}
${this.config.additionalContext ? `- Additional Context: ${this.config.additionalContext}` : ""}

Research Findings:
${allLearnings.join("\n\n")}

Please create a focused investment analysis covering these key areas:
1. Company Overview and Business Model
2. Competitive Positioning
3. Market Opportunity and Growth Potential
4. Key Risks and Challenges
5. Investment Thesis (Bull and Bear Case)

${outputGuidelinesPrompt}

Keep the analysis concise but insightful, focusing on the most important investment considerations.`;

      this.config.onProgress?.({
        step: "report-generation",
        status: "processing",
        message: "Generating investment analysis..."
      });
      
      // Use streamText for medium report
      const result = streamText({
        model: this.thinkingModel,
        prompt: mediumPrompt,
        temperature: 0.5,
        maxTokens: 5000, // Smaller than deep report
      });
      
      // Stream the report
      for await (const chunk of result.textStream) {
        this.config.onMessage?.({
          type: "report-chunk",
          content: chunk
        });
      }
      
      const finalReport = await result.text;
      
      // Deduplicate sources
      const uniqueSources = Array.from(
        new Map(allSources.map(s => [s.url, s])).values()
      );
      const uniqueImages = Array.from(
        new Map(allImages.map(i => [i.url, i])).values()
      );
      
      return {
        report: {
          title: `${this.config.companyName} - Investment Analysis`,
          content: finalReport,
          sections: {} // Medium report doesn't break into detailed sections
        },
        sources: uniqueSources.slice(0, 30), // Fewer sources than deep
        images: uniqueImages.slice(0, 10)
      };
      
    } catch (error) {
      console.error("Error generating medium report:", error);
      throw new Error(`Failed to generate investment analysis: ${error}`);
    }
  }
  
  /**
   * Generate comprehensive investment report
   * This is the full deep dive with all sections
   * 
   * Uses the thinking model with streaming for real-time updates
   */
  private async generateDeepReport(
    researchPlan: any, 
    searchResults: any[]
  ): Promise<CompanyResearchResult> {
    const sections: Record<string, string> = {};
    const allSources: any[] = [];
    const allImages: any[] = [];
    
    // Collect all learnings and sources
    const learningsBySections: Record<string, string[]> = {};
    searchResults.forEach(result => {
      const sectionId = result.task.section;
      if (!learningsBySections[sectionId]) {
        learningsBySections[sectionId] = [];
      }
      learningsBySections[sectionId].push(result.learning);
      allSources.push(...result.sources);
      allImages.push(...result.images);
    });
    
    // Generate the main report using thinking model with streaming
    try {
      // Build comprehensive prompt with all learnings
      // Ensure systemInstruction is defined before using it
      if (!systemInstruction) {
        throw new Error("systemInstruction is not defined. Check companyDivePrompts.ts imports.");
      }
      
      const reportPrompt = `${systemInstruction.replace("{now}", new Date().toLocaleDateString())}

You are creating a comprehensive investment analysis report for ${this.config.companyName}.

Company Context:
- Name: ${this.config.companyName}
- Website: ${this.config.companyWebsite || "Not provided"}
- Industry: ${this.config.industry || "Not specified"}
- Sub-Industries: ${this.config.subIndustries.join(", ") || "Not specified"}
- Known Competitors: ${this.config.competitors.join(", ") || "Not specified"}
${this.config.additionalContext ? `- Additional Context: ${this.config.additionalContext}` : ""}

Research Findings by Section:
${Object.entries(learningsBySections).map(([sectionId, learnings]) => {
  const section = INVESTMENT_RESEARCH_SECTIONS[sectionId as keyof typeof INVESTMENT_RESEARCH_SECTIONS];
  return `
## ${section?.title || sectionId}
${learnings.join("\n\n")}
`;
}).join("\n")}

Please create a comprehensive investment report following this structure:
${researchPlan.sections.map((section: any) => `- ${section.title}`).join("\n")}

${outputGuidelinesPrompt}
${guidelinesPrompt}

IMPORTANT: Create a thorough, professional investment analysis that would prepare someone for a CEO meeting. Include specific data points, dates, and insights from the research. Each section should be substantial and actionable.`;

      this.config.onProgress?.({
        step: "report-generation",
        status: "processing",
        message: "Generating comprehensive investment report..."
      });
      
      // Use streamText for real-time updates
      const result = streamText({
        model: this.thinkingModel,
        prompt: reportPrompt,
        temperature: 0.5, // Balanced for coherent but insightful analysis
        maxTokens: 8000, // Allow for comprehensive report
      });
      
      const textStream = result.textStream;
      
      // Process the stream with thinking tags
      const processor = new ThinkTagStreamProcessor();
      
      // Stream the report as it's generated
      for await (const chunk of textStream) {
        // Process chunk with callbacks for content and thinking output
        processor.processChunk(
          chunk,
          // Content output callback
          (content: string) => {
            this.config.onMessage?.({
              type: "report-chunk",
              content: content
            });
          },
          // Thinking output callback (optional)
          (thinking: string) => {
            this.config.onReasoning?.({
              content: thinking
            });
          }
        );
      }
      
      // Get the final processed text
      const finalReport = await result.text;
      
      // Parse sections from the report (assuming markdown headers)
      const sectionRegex = /^##\s+(.+)$/gm;
      let match;
      let lastSectionId = "";
      let lastIndex = 0;
      
      while ((match = sectionRegex.exec(finalReport)) !== null) {
        if (lastSectionId) {
          // Save previous section
          const content = finalReport.substring(lastIndex, match.index).trim();
          sections[lastSectionId] = content;
        }
        
        // Find matching section ID
        const sectionTitle = match[1];
        const sectionEntry = Object.entries(INVESTMENT_RESEARCH_SECTIONS)
          .find(([, section]) => section.title === sectionTitle);
        
        if (sectionEntry) {
          lastSectionId = sectionEntry[0];
          lastIndex = match.index + match[0].length;
        }
      }
      
      // Save last section
      if (lastSectionId) {
        sections[lastSectionId] = finalReport.substring(lastIndex).trim();
      }
      
      // Deduplicate sources and images
      const uniqueSources = Array.from(
        new Map(allSources.map(s => [s.url, s])).values()
      );
      const uniqueImages = Array.from(
        new Map(allImages.map(i => [i.url, i])).values()
      );
      
      return {
        report: {
          title: `${this.config.companyName} - Comprehensive Investment Analysis`,
          content: finalReport,
          sections: sections
        },
        sources: uniqueSources.slice(0, 50), // Limit to top 50 sources
        images: uniqueImages.slice(0, 20) // Limit to top 20 images
      };
      
    } catch (error) {
      console.error("Error generating deep report:", error);
      throw new Error(`Failed to generate investment report: ${error}`);
    }
  }
}