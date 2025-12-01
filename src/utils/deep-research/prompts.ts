import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import {
  systemInstruction,
  systemQuestionPrompt,
  reportPlanPrompt,
  serpQueriesPrompt,
  queryResultPrompt,
  citationRulesPrompt,
  searchResultPrompt,
  searchKnowledgeResultPrompt,
  reviewPrompt,
  finalReportCitationImagePrompt,
  finalReportReferencesPrompt,
  finalReportPrompt,
} from "@/constants/prompts";

/**
 * Gets the Zod schema for SERP queries.
 *
 * @returns Zod array schema for SERP queries.
 */
export function getSERPQuerySchema() {
  return z
    .array(
      z
        .object({
          query: z.string().describe("The SERP query."),
          researchGoal: z
            .string()
            .describe(
              "First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions. JSON reserved words should be escaped."
            ),
        })
        .required({ query: true, researchGoal: true })
    )
    .describe(`List of SERP queries.`);
}

/**
 * Gets the JSON schema string for SERP queries.
 *
 * @returns JSON schema string.
 */
export function getSERPQueryOutputSchema() {
  const SERPQuerySchema = getSERPQuerySchema();
  return JSON.stringify(zodToJsonSchema(SERPQuerySchema), null, 4);
}

/**
 * Generates the system prompt with the current date.
 *
 * @returns System prompt string.
 */
export function getSystemPrompt() {
  return systemInstruction.replace("{now}", new Date().toISOString());
}

/**
 * Generates the prompt for asking clarifying questions.
 *
 * @param query - The user's query.
 * @returns Prompt string.
 */
export function generateQuestionsPrompt(query: string) {
  return systemQuestionPrompt.replace("{query}", query);
}

/**
 * Generates the prompt for writing a report plan.
 *
 * @param query - The user's query.
 * @returns Prompt string.
 */
export function writeReportPlanPrompt(query: string) {
  return reportPlanPrompt.replace("{query}", query);
}

/**
 * Generates the prompt for creating SERP queries.
 *
 * @param plan - The research plan.
 * @returns Prompt string.
 */
export function generateSerpQueriesPrompt(plan: string) {
  return serpQueriesPrompt
    .replace("{plan}", plan)
    .replace("{outputSchema}", getSERPQueryOutputSchema());
}

/**
 * Generates the prompt for processing search results.
 *
 * @param query - The search query.
 * @param researchGoal - The goal of the research.
 * @returns Prompt string.
 */
export function processResultPrompt(query: string, researchGoal: string) {
  return queryResultPrompt
    .replace("{query}", query)
    .replace("{researchGoal}", researchGoal);
}

/**
 * Generates the prompt for processing search results with context.
 *
 * @param query - The search query.
 * @param researchGoal - The research goal.
 * @param results - The search results.
 * @param enableReferences - Whether to include citation rules.
 * @returns Prompt string.
 */
export function processSearchResultPrompt(
  query: string,
  researchGoal: string,
  results: Source[],
  enableReferences: boolean
) {
  const context = results.map(
    (result, idx) =>
      `<content index="${idx + 1}" url="${result.url}">\n${
        result.content
      }\n</content>`
  );
  return (
    searchResultPrompt + (enableReferences ? `\n\n${citationRulesPrompt}` : "")
  )
    .replace("{query}", query)
    .replace("{researchGoal}", researchGoal)
    .replace("{context}", context.join("\n"));
}

function resolveLocationHost() {
  if (typeof location !== "undefined" && location?.host) {
    return location.host;
  }

  if (typeof globalThis !== "undefined") {
    const globalLocation = (globalThis as { location?: { host?: string } }).location;
    if (globalLocation?.host) {
      return globalLocation.host;
    }
  }

  return "knowledge-base";
}

/**
 * Generates the prompt for processing knowledge base search results.
 *
 * @param query - The search query.
 * @param researchGoal - The research goal.
 * @param results - The knowledge results.
 * @returns Prompt string.
 */
export function processSearchKnowledgeResultPrompt(
  query: string,
  researchGoal: string,
  results: Knowledge[]
) {
  const host = resolveLocationHost();
  const context = results.map(
    (result, idx) =>
      `<content index="${idx + 1}" url="${host}">\n${
        result.content
      }\n</content>`
  );
  return searchKnowledgeResultPrompt
    .replace("{query}", query)
    .replace("{researchGoal}", researchGoal)
    .replace("{context}", context.join("\n"));
}

/**
 * Generates the prompt for reviewing SERP queries.
 *
 * @param plan - The research plan.
 * @param learning - Learnings so far.
 * @param suggestion - User suggestion.
 * @returns Prompt string.
 */
export function reviewSerpQueriesPrompt(
  plan: string,
  learning: string[],
  suggestion: string
) {
  const learnings = learning.map(
    (detail) => `<learning>\n${detail}\n</learning>`
  );
  return reviewPrompt
    .replace("{plan}", plan)
    .replace("{learnings}", learnings.join("\n"))
    .replace("{suggestion}", suggestion)
    .replace("{outputSchema}", getSERPQueryOutputSchema());
}

/**
 * Generates the prompt for writing the final report.
 *
 * @param plan - The research plan.
 * @param learning - All learnings.
 * @param source - Sources used.
 * @param images - Images found.
 * @param requirement - User requirements.
 * @param enableCitationImage - Whether to include images.
 * @param enableReferences - Whether to include references.
 * @returns Prompt string.
 */
export function writeFinalReportPrompt(
  plan: string,
  learning: string[],
  source: Source[],
  images: ImageSource[],
  requirement: string,
  enableCitationImage: boolean,
  enableReferences: boolean
) {
  const learnings = learning.map(
    (detail) => `<learning>\n${detail}\n</learning>`
  );
  const sources = source.map(
    (item, idx) =>
      `<source index="${idx + 1}" url="${item.url}">\n${item.title}\n</source>`
  );
  const imageList = images.map(
    (source, idx) => `${idx + 1}. ![${source.description}](${source.url})`
  );
  return (
    finalReportPrompt +
    (enableCitationImage
      ? `\n**Including meaningful images from the previous research in the report is very helpful.**\n\n${finalReportCitationImagePrompt}`
      : "") +
    (enableReferences ? `\n\n${finalReportReferencesPrompt}` : "")
  )
    .replace("{plan}", plan)
    .replace("{learnings}", learnings.join("\n"))
    .replace("{sources}", sources.join("\n"))
    .replace("{images}", imageList.join("\n"))
    .replace("{requirement}", requirement);
}
