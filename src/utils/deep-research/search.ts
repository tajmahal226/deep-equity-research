import {
  TAVILY_BASE_URL,
  FIRECRAWL_BASE_URL,
  EXA_BASE_URL,
  BOCHA_BASE_URL,
  SEARXNG_BASE_URL,
} from "@/constants/urls";
import { rewritingPrompt } from "@/constants/prompts";
import { completePath } from "@/utils/url";
import { pick, sort } from "radash";

type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
  score: number;
  publishedDate: string;
};

interface FirecrawlDocument<T = unknown> {
  url?: string;
  markdown?: string;
  html?: string;
  rawHtml?: string;
  links?: string[];
  extract?: T;
  json?: T;
  screenshot?: string;
  compare?: {
    previousScrapeAt: string | null;
    changeStatus: "new" | "same" | "changed" | "removed";
    visibility: "visible" | "hidden";
  };
  // v1 search only
  title?: string;
  description?: string;
}

type ExaSearchResult = {
  title: string;
  url: string;
  publishedDate: string;
  author: string;
  score: number;
  id: string;
  image?: string;
  favicon: string;
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
  summary?: string;
  subpages?: ExaSearchResult[];
  extras?: {
    links?: string[];
    imageLinks?: string[];
  };
};

type BochaSearchResult = {
  id: string | null;
  name: string;
  url: string;
  displayUrl: string;
  snippet: string;
  summary?: string;
  siteName: string;
  siteIcon: string;
  dateLastCrawled: string;
  cachedPageUrl: string | null;
  language: string | null;
  isFamilyFriendly: boolean | null;
  isNavigational: boolean | null;
};

type BochaImage = {
  webSearchUrl: string;
  name: string;
  thumbnailUrl: string;
  datePublished: string;
  contentUrl: string;
  hostPageUrl: string;
  contentSize: number;
  encodingFormat: string;
  hostPageDisplayUrl: string;
  width: number;
  height: number;
  thumbnail: {
    width: number;
    height: number;
  };
};

type SearxngSearchResult = {
  url: string;
  title: string;
  content?: string;
  engine: string;
  parsed_url: string[];
  template: "default.html" | "videos.html" | "images.html";
  engines: string[];
  positions: number[];
  publishedDate?: Date | null;
  thumbnail?: null | string;
  is_onion?: boolean;
  score: number;
  category: string;
  length?: null | string;
  duration?: null | string;
  iframe_src?: string;
  source?: string;
  metadata?: string;
  resolution?: null | string;
  img_src?: string;
  thumbnail_src?: string;
  img_format?: "jpeg" | "Culture Snaxx" | "png";
};

export interface SearchProviderOptions {
  provider: string;
  baseURL?: string;
  apiKey?: string;
  query: string;
  maxResult?: number;
  scope?: string;
}

type FetchWithTimeoutOptions = RequestInit & { timeoutMs?: number };

async function fetchWithTimeout(
  provider: string,
  input: RequestInfo | URL,
  options: FetchWithTimeoutOptions = {}
) {
  const { timeoutMs = 30_000, signal, ...init } = options;
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let abortHandler: (() => void) | undefined;
  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      abortHandler = () => controller.abort(signal.reason);
      signal.addEventListener("abort", abortHandler);
    }
  }

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    if (response.status && !response.ok) {
      const bodyText = typeof response.text === "function" ? await response.text().catch(() => "") : "";
      const snippetRaw = bodyText.replace(/\s+/g, " ").trim();
      const snippet = snippetRaw.slice(0, 200);
      const suffix = snippetRaw.length > snippet.length ? "…" : "";
      throw new Error(
        `[${provider}] Request failed with status ${response.status}: ${
          snippet ? `${snippet}${suffix}` : "No response body"
        }`
      );
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      if (timedOut) {
        throw new Error(
          `[${provider}] Request timed out after ${timeoutMs}ms`
        );
      }
      throw new Error(`[${provider}] Request was aborted: ${error.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`[${provider}] ${error.message}`);
    }
    throw new Error(`[${provider}] Unknown error occurred`);
  } finally {
    clearTimeout(timeoutId);
    if (abortHandler && signal) {
      signal.removeEventListener("abort", abortHandler);
    }
  }
}

export async function createSearchProvider({
  provider,
  baseURL,
  apiKey = "",
  query,
  maxResult = 5,
  scope,
}: SearchProviderOptions) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  if (provider === "tavily") {
    const response = await fetchWithTimeout(
      provider,
      `${completePath(baseURL || TAVILY_BASE_URL)}/search`,
      {
        method: "POST",
        headers,
        credentials: "omit",
        body: JSON.stringify({
          query: query.replaceAll("\\", "").replaceAll('"', ""),
          search_depth: "advanced",
          topic: scope || "general",
          max_results: Number(maxResult),
          include_images: true,
          include_image_descriptions: true,
          include_answer: false,
          include_raw_content: "markdown",
        }),
        timeoutMs: 30_000,
      }
    );
    const { results = [], images = [] } = await response.json();
    return {
      sources: (results as TavilySearchResult[])
        .filter((item) => item.content && item.url)
        .map((result) => {
          return {
            title: result.title,
            content: result.rawContent || result.content,
            url: result.url,
          };
        }) as Source[],
      images: images as ImageSource[],
    };
  } else if (provider === "firecrawl") {
    const response = await fetchWithTimeout(
      provider,
      `${completePath(baseURL || FIRECRAWL_BASE_URL, "/v1")}/search`,
      {
        method: "POST",
        headers,
        credentials: "omit",
        body: JSON.stringify({
          query,
          limit: maxResult,
          tbs: "qdr:w",
          origin: "api",
          scrapeOptions: {
            formats: ["markdown"],
          },
          timeout: 60000,
        }),
        timeoutMs: 60_000,
      }
    );
    const { data = [] } = await response.json();
    return {
      sources: (data as FirecrawlDocument[])
        .filter((item) => item.description && item.url)
        .map((result) => ({
          content: result.markdown || result.description,
          url: result.url,
          title: result.title,
        })) as Source[],
      images: [],
    };
  } else if (provider === "exa") {
    const response = await fetchWithTimeout(
      provider,
      `${completePath(baseURL || EXA_BASE_URL)}/search`,
      {
        method: "POST",
        headers,
        credentials: "omit",
        body: JSON.stringify({
          query,
          category: scope || "research paper",
          contents: {
            text: true,
            summary: {
              query: `Given the following query from the user:\n<query>${query}</query>\n\n${rewritingPrompt}`,
            },
            numResults: Number(maxResult) * 5,
            livecrawl: "auto",
            extras: {
              imageLinks: 3,
            },
          },
        }),
        timeoutMs: 45_000,
      }
    );
    const { results = [] } = await response.json();
    const images: ImageSource[] = [];
    return {
      sources: (results as ExaSearchResult[])
        .filter((item) => (item.summary || item.text) && item.url)
        .map((result) => {
          if (
            result.extras?.imageLinks &&
            result.extras?.imageLinks.length > 0
          ) {
            result.extras.imageLinks.forEach((url) => {
              images.push({ url, description: result.text });
            });
          }
          return {
            content: result.summary || result.text,
            url: result.url,
            title: result.title,
          };
        }) as Source[],
      images,
    };
  } else if (provider === "bocha") {
    const response = await fetchWithTimeout(
      provider,
      `${completePath(baseURL || BOCHA_BASE_URL, "/v1")}/web-search`,
      {
        method: "POST",
        headers,
        credentials: "omit",
        body: JSON.stringify({
          query,
          freshness: "noLimit",
          summary: true,
          count: maxResult,
        }),
        timeoutMs: 30_000,
      }
    );
    const { data = {} } = await response.json();
    const results = data.webPages?.value || [];
    const imageResults = data.images?.value || [];
    return {
      sources: (results as BochaSearchResult[])
        .filter((item) => item.snippet && item.url)
        .map((result) => ({
          content: result.summary || result.snippet,
          url: result.url,
          title: result.name,
        })) as Source[],
      images: (imageResults as BochaImage[]).map((item) => {
        const matchingResult = (results as BochaSearchResult[]).find(
          (result) => result.url === item.hostPageUrl
        );
        return {
          url: item.contentUrl,
          description: item.name || matchingResult?.name,
        };
      }) as ImageSource[],
    };
  } else if (provider === "searxng") {
    const params = {
      q: query,
      categories:
        scope === "academic" ? ["science", "images"] : ["general", "images"],
      engines:
        scope === "academic"
          ? [
              "arxiv",
              "google scholar",
              "pubmed",
              "wikispecies",
              "google_images",
            ]
          : [
              "google",
              "bing",
              "duckduckgo",
              "brave",
              "wikipedia",
              "bing_images",
              "google_images",
            ],
      lang: "auto",
      format: "json",
      autocomplete: "google",
    };
    const searchQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchQuery.append(key, value.toString());
    }
    const origin =
      typeof location !== "undefined"
        ? location.origin
        : typeof globalThis.location !== "undefined"
          ? globalThis.location.origin
          : undefined;
    const response = await fetchWithTimeout(
      provider,
      `${completePath(
        baseURL || SEARXNG_BASE_URL
      )}/search?${searchQuery.toString()}`,
      origin && baseURL?.startsWith(origin)
        ? {
            method: "POST",
            credentials: "omit",
            headers,
            timeoutMs: 30_000,
          }
        : { method: "GET", credentials: "omit", timeoutMs: 30_000 }
    );
    const { results = [] } = await response.json();
    const rearrangedResults = sort(
      results as SearxngSearchResult[],
      (item) => item.score,
      true
    );
    return {
      sources: rearrangedResults
        .filter((item) => item.content && item.url && item.score >= 0.5)
        .slice(0, maxResult * 5)
        .map((result) => pick(result, ["title", "content", "url"])) as Source[],
      images: rearrangedResults
        .filter((item) => item.category === "images" && item.score >= 0.5)
        .slice(0, maxResult)
        .map((result) => {
          return {
            url: result.img_src,
            description: result.title,
          };
        }) as ImageSource[],
    };
  } else {
    throw new Error("Unsupported Provider: " + provider);
  }
}
