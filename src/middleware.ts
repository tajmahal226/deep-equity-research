import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getCustomModelList, multiApiKeyPolling } from "@/utils/model";
import { verifySignature } from "@/utils/signature";


const getEnvConfig = () => ({
  accessPassword: process.env.ACCESS_PASSWORD || "",
  googleGenerativeAIKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  deepSeekApiKey: process.env.DEEPSEEK_API_KEY || "",
  xaiApiKey: process.env.XAI_API_KEY || "",
  mistralApiKey: process.env.MISTRAL_API_KEY || "",
  tavilyApiKey: process.env.TAVILY_API_KEY || "",
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY || "",
  exaApiKey: process.env.EXA_API_KEY || "",
  bochaApiKey: process.env.BOCHA_API_KEY || "",
  disabledAIProvider: process.env.NEXT_PUBLIC_DISABLED_AI_PROVIDER || "",
  disabledSearchProvider: process.env.NEXT_PUBLIC_DISABLED_SEARCH_PROVIDER || "",
  modelList: process.env.NEXT_PUBLIC_MODEL_LIST || "",
});
/**
 * Safely extracts a Bearer token from an Authorization header.
 * @param authHeader - The Authorization header value.
 * @returns The token without "Bearer " prefix, or null if invalid.
 */
function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  const token = parts[1].trim();
  return token.length > 0 ? token : null;
}

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: "/api/:path*",
};

const ERRORS = {
  NO_PERMISSIONS: {
    code: 403,
    message: "No permissions",
    status: "FORBIDDEN",
  },
  NO_API_KEY: {
    code: 500,
    message: "The server does not have an API key.",
    status: "Internal Server Error",
  },
};

/**
 * Middleware for handling API request authentication and proxying.
 * Verifies signatures, checks permissions, and injects API keys.
 *
 * @param request - The incoming Next.js request.
 * @returns The Next.js response.
 */
export async function middleware(request: NextRequest) {
  // Debug logging removed for security - do not log request objects in production

  const {
    accessPassword,
    anthropicApiKey,
    bochaApiKey,
    deepSeekApiKey,
    disabledAIProvider,
    disabledSearchProvider,
    exaApiKey,
    firecrawlApiKey,
    googleGenerativeAIKey,
    mistralApiKey,
    modelList,
    openRouterApiKey,
    openaiApiKey,
    tavilyApiKey,
    xaiApiKey,
  } = getEnvConfig();
  
  // Read request body once to avoid multiple consumption issues
  let requestBody = null;
  let clonedRequest = request;
  if (request.method.toUpperCase() !== "GET") {
    try {
      const body = await request.text();
      requestBody = body ? JSON.parse(body) : {};
      // Create a new request with the body intact for downstream processing
      clonedRequest = new NextRequest(request.url, {
        method: request.method,
        headers: request.headers,
        body: body || undefined,
      });
    } catch (error) {
      console.error("Error parsing request body in middleware:", error);
      requestBody = {};
    }
  }

  const disabledAIProviders =
    disabledAIProvider.length > 0 ? disabledAIProvider.split(",") : [];
  const disabledSearchProviders =
    disabledSearchProvider.length > 0
      ? disabledSearchProvider.split(",")
      : [];

  const hasDisabledGeminiModel = () => {
    if (request.method.toUpperCase() === "GET") return false;
    const { availableModelList, disabledModelList } = getCustomModelList(
      modelList.length > 0 ? modelList.split(",") : []
    );
    const isAvailableModel = availableModelList.some((availableModel) =>
      request.nextUrl.pathname.includes(`models/${availableModel}:`)
    );
    if (isAvailableModel) return false;
    if (disabledModelList.includes("all")) return true;
    return disabledModelList.some((disabledModel) =>
      request.nextUrl.pathname.includes(`models/${disabledModel}:`)
    );
  };
  const hasDisabledAIModel = (body: any = {}) => {
    if (request.method.toUpperCase() === "GET") return false;
    const { model = "" } = body;
    const { availableModelList, disabledModelList } = getCustomModelList(
      modelList.length > 0 ? modelList.split(",") : []
    );
    const isAvailableModel = availableModelList.some(
      (availableModel) => availableModel === model
    );
    if (isAvailableModel) return false;
    if (disabledModelList.includes("all")) return true;
    return disabledModelList.some((disabledModel) => disabledModel === model);
  };

  if (request.nextUrl.pathname.startsWith("/api/ai/google")) {
    const authorization = request.headers.get("x-goog-api-key") || "";
    const isDisabledGeminiModel = hasDisabledGeminiModel();
    if (
      !verifySignature(authorization, accessPassword, Date.now()) ||
      disabledAIProviders.includes("google") ||
      isDisabledGeminiModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const apiKey = multiApiKeyPolling(googleGenerativeAIKey);
      if (apiKey) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set(
          "x-goog-api-client",
          request.headers.get("x-goog-api-client") || "genai-js/0.24.0"
        );
        requestHeaders.set("x-goog-api-key", apiKey);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/openrouter")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = hasDisabledAIModel(requestBody);
    if (
      !verifySignature(
        extractBearerToken(authorization) ?? "",
        accessPassword,
        Date.now()
      ) ||
      disabledAIProviders.includes("openrouter") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const apiKey = multiApiKeyPolling(openRouterApiKey);
      if (apiKey) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/openai")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = hasDisabledAIModel(requestBody);
    if (
      !verifySignature(
        extractBearerToken(authorization) ?? "",
        accessPassword,
        Date.now()
      ) ||
      disabledAIProviders.includes("openai") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const apiKey = multiApiKeyPolling(openaiApiKey);
      if (apiKey) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/anthropic")) {
    const authorization = request.headers.get("x-api-key") || "";
    const isDisabledModel = hasDisabledAIModel(requestBody);
    if (
      !verifySignature(authorization, accessPassword, Date.now()) ||
      disabledAIProviders.includes("anthropic") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const apiKey = multiApiKeyPolling(anthropicApiKey);
      if (apiKey) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("x-api-key", apiKey);
        requestHeaders.set(
          "anthropic-version",
          request.headers.get("anthropic-version") || "2023-06-01"
        );
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/deepseek")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = hasDisabledAIModel(requestBody);
    if (
      !verifySignature(
        extractBearerToken(authorization) ?? "",
        accessPassword,
        Date.now()
      ) ||
      disabledAIProviders.includes("deepseek") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const apiKey = multiApiKeyPolling(deepSeekApiKey);
      if (apiKey) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/xai")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = hasDisabledAIModel(requestBody);
    if (
      !verifySignature(
        extractBearerToken(authorization) ?? "",
        accessPassword,
        Date.now()
      ) ||
      disabledAIProviders.includes("xai") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const apiKey = multiApiKeyPolling(xaiApiKey);
      if (apiKey) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/mistral")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = hasDisabledAIModel(requestBody);
    if (
      !verifySignature(
        extractBearerToken(authorization) ?? "",
        accessPassword,
        Date.now()
      ) ||
      disabledAIProviders.includes("mistral") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const apiKey = multiApiKeyPolling(mistralApiKey);
      if (apiKey) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  // The ollama model only verifies access to the backend API
  if (request.nextUrl.pathname.startsWith("/api/ai/ollama")) {
    const authorization = request.headers.get("authorization") || "";
    const isDisabledModel = hasDisabledAIModel(requestBody);
    if (
      !verifySignature(
        extractBearerToken(authorization) ?? "",
        accessPassword,
        Date.now()
      ) ||
      disabledAIProviders.includes("ollama") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(
        "Content-Type",
        request.headers.get("Content-Type") || "application/json"
      );
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/tavily")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(
        extractBearerToken(authorization) ?? "",
        accessPassword,
        Date.now()
      ) ||
      disabledSearchProviders.includes("tavily")
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const apiKey = multiApiKeyPolling(tavilyApiKey);
      if (apiKey) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/firecrawl")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(
        extractBearerToken(authorization) ?? "",
        accessPassword,
        Date.now()
      ) ||
      disabledSearchProviders.includes("firecrawl")
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const apiKey = multiApiKeyPolling(firecrawlApiKey);
      if (apiKey) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/exa")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(
        extractBearerToken(authorization) ?? "",
        accessPassword,
        Date.now()
      ) ||
      disabledSearchProviders.includes("exa")
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const apiKey = multiApiKeyPolling(exaApiKey);
      if (apiKey) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/bocha")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(
        extractBearerToken(authorization) ?? "",
        accessPassword,
        Date.now()
      ) ||
      disabledSearchProviders.includes("bocha")
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const apiKey = multiApiKeyPolling(bochaApiKey);
      if (apiKey) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKey}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/searxng")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(
        extractBearerToken(authorization) ?? "",
        accessPassword,
        Date.now()
      ) ||
      disabledSearchProviders.includes("searxng")
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(
        "Content-Type",
        request.headers.get("Content-Type") || "application/json"
      );
      requestHeaders.delete("Authorization");
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/crawler")) {
    const authorization = request.headers.get("authorization") || "";
    if (
      request.method.toUpperCase() !== "POST" ||
      !verifySignature(extractBearerToken(authorization) ?? "", accessPassword, Date.now())
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(
        "Content-Type",
        request.headers.get("Content-Type") || "application/json"
      );
      requestHeaders.delete("Authorization");
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/sse")) {
    let authorization = request.headers.get("authorization") || "";
    if (authorization !== "") {
      authorization = extractBearerToken(authorization) || "";
    } else if (request.method.toUpperCase() === "GET") {
      authorization = request.nextUrl.searchParams.get("password") || "";
    }
    if (authorization !== accessPassword) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(
        "Content-Type",
        request.headers.get("Content-Type") || "application/json"
      );
      requestHeaders.delete("Authorization");
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/mcp")) {
    const authorization = request.headers.get("authorization") || "";
    if (extractBearerToken(authorization) !== accessPassword) {
      const responseHeaders = new Headers();
      responseHeaders.set("WWW-Authenticate", ERRORS.NO_PERMISSIONS.message);
      return NextResponse.json(
        {
          error: 401,
          error_description: ERRORS.NO_PERMISSIONS.message,
          error_uri: request.nextUrl,
        },
        { headers: responseHeaders, status: 401 }
      );
    } else {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(
        "Content-Type",
        request.headers.get("Content-Type") || "application/json"
      );
      requestHeaders.delete("Authorization");
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  return NextResponse.next({
    request: clonedRequest,
  });
}
