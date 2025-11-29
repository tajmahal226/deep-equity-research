# Deep Research API Documentation

## Overview

The Deep Research API provides a real-time interface for initiating and monitoring complex research tasks. Leveraging Server-Sent Events (SSE), it delivers updates, information, message, progress, and errors as they occur, allowing clients to receive continuous streams of data without polling.

## Protocol

This API uses **Server-Sent Events (SSE)** over HTTP. Clients should establish an HTTP connection and keep it open to receive a stream of events from the server.

## Data Format

All data sent via SSE adheres to the following structure:

```text
event: EventName
data: JSON_String

```

- `event`: Specifies the type of event being sent (e.g., `info`, `message`, `reasoning`, `progress`, `error`).
- `data`: A string containing a JSON object relevant to the event type.
- A double newline (`\n\n`) signifies the end of an event block.

## API Config

Recommended to use the API via `@microsoft/fetch-event-source`.

Endpoint: `/api/sse`

Method: `POST`

### Request Body

```typescript
interface Config {
  // Research topic
  query: string;
  
  // AI provider - Possible values: google, openai, anthropic, deepseek, xai, mistral, openrouter, ollama
  provider: string;
  
  // Thinking model id
  thinkingModel: string;
  
  // Task model id
  taskModel: string;
  
  // Search provider - Possible values: model, tavily, firecrawl, exa, bocha, searxng
  searchProvider: string;
  
  // **REQUIRED** User's AI provider API key
  // This is the user's personal API key for the selected AI provider
  aiApiKey: string;
  
  // **REQUIRED** User's search provider API key
  // This is the user's personal API key for the selected search provider
  // Not required if searchProvider is "model" or "searxng"
  searchApiKey: string;
  
  // Response Language, also affects the search language (optional)
  language?: string;
  
  // Maximum number of search results. Default: 5 (optional)
  maxResult?: number;
  
  // Whether to include content-related images in the final report. Default: true (optional)
  enableCitationImage?: boolean;
  
  // Whether to include citation links in search results and final reports. Default: true (optional)
  enableReferences?: boolean;
  
  // Model temperature for generation. Default: 0.7 (optional)
  temperature?: number;
}
```

**Required Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `query` | string | Research topic or question |
| `provider` | string | AI provider (openai, anthropic, google, etc.) |
| `thinkingModel` | string | Model for reasoning/planning tasks |
| `taskModel` | string | Model for execution/search tasks |
| `searchProvider` | string | Search provider (tavily, exa, model, etc.) |
| **`aiApiKey`** | **string** | **User's AI provider API key** |
| **`searchApiKey`** | **string** | **User's search provider API key** |

**Optional Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `language` | string | "en-US" | Output and search language |
| `maxResult` | number | 5 | Maximum search results |
| `enableCitationImage` | boolean | true | Include images in report |
| `enableReferences` | boolean | true | Include citation links |
| `temperature` | number | 0.7 | Model temperature (if supported) |

> **Important:** `aiApiKey` and `searchApiKey` are **required** fields. The application uses a "bring your own key" model where users provide their own API keys. Server-side fallback keys have been removed for security.
>
> Exception: `searchApiKey` is not required if `searchProvider` is `"model"` (uses AI provider's built-in search) or `"searxng"` (no API key required).

### Request Headers

```typescript
interface Headers {
  "Content-Type": "application/json";
  
  // Optional: If ACCESS_PASSWORD is configured on the server
  // Authorization: "Bearer YOUR_ACCESS_PASSWORD";
}
```

For specific usage parameter forms, see the [example code](#client-code-example).

## Response Events

The API streams data as a series of events. Each event has a type (`event`) and associated data (`data`).

### General Structure

```text
event: [event_type]
data: [JSON_payload]

```

### Event Types

The following event types are supported:

- `info`
- `message`
- `reasoning`
- `progress`
- `error`

---

### `info` Event

Sent at the beginning of the stream (or upon specific requests) to provide initial information about the API instance or the research session.

**Description:** Provides basic information about the running API instance.

**Data Structure (`data` field):** A JSON string representing the following structure:

| Parameter | Type   | Description         |
| :-------- | :----- | :------------------ |
| `name`    | string | Project name        |
| `version` | string | Current API version |

```typescript
interface InfoEvent {
  // Project name
  name: string;
  // Current API version
  version: string;
}
```

**Example:**

```text
event: info
data: {"name":"deep-research","version":"0.1.0"}

```

---

### `message` Event

Used to send text content of deep research to the client.

**Description:** Delivers textual messages during the research process.

**Data Structure (`data` field):** A JSON string representing the following structure:

| Parameter | Type   | Description                            | Notes                                                 |
| :-------- | :----- | :------------------------------------- | :---------------------------------------------------- |
| `type`    | string | Type of the message content            | Currently only `"text"` is supported.                 |
| `text`    | string | The message content (Markdown format). | Optional for future types, but required for `"text"`. |

```typescript
interface MessageEvent {
  // Message type, currently only "text" is supported
  type: "text";
  // Textual data
  text?: string;
}
```

**Example:**

```text
event: message
data: {"type":"text","text":"This is a **markdown** string."}

```

---

### `reasoning` Event

Used to send thinking content of deep research to the client. Some thinking models support output thinking process.

**Description:** Delivers textual messages during the research process.

**Data Structure (`data` field):** A JSON string representing the following structure:

| Parameter | Type   | Description                              | Notes                                 |
| :-------- | :----- | :--------------------------------------- | :------------------------------------ |
| `type`    | string | Type of the reasoning content            | Currently only `"text"` is supported. |
| `text`    | string | The reasoning content (Markdown format). | Required for `"text"`.                |

```typescript
interface ReasoningEvent {
  // Reasoning type, currently only "text" is supported
  type: "text";
  // Textual data
  text: string;
}
```

**Example:**

```text
event: message
data: {"type":"text","text":"Output thinking process"}

```

---

### `progress` Event

Communicates the current step and status of the research task execution. This is crucial for providing real-time feedback on the process flow.

**Description:** Indicates the progress of the research task, including the current step and its status (start or end).

**Data Structure (`data` field):** A JSON string representing the following structure:

| Parameter | Type                                                                            | Description                                                                                  | Notes                                                                              |
| :-------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| `step`    | "report-plan" \| "serp-query" \| "task-list" \| "search-task" \| "final-report" | The identifier of the current step in the research process.                                  | See "Possible `step` Values" below.                                                |
| `status`  | "start" \| "end"                                                                | The status of the current step.                                                              | Indicates if the step is starting or ending. See "Possible `status` Values" below. |
| `name`    | string                                                                          | A descriptive name for the specific instance of the step (e.g., for a specific search task). | Included only when `step` is `"search-task"`.                                      |
| `data`    | any                                                                             | Optional data relevant to the step's outcome or details.                                     | May be included when `status` is `"end"`. The content varies by step.              |

```typescript
interface ProgressEvent {
  // Current step
  step:
    | "report-plan"
    | "serp-query"
    | "task-list"
    | "search-task"
    | "final-report";
  // Status of the step
  status: "start" | "end";
  // Name of the specific task (e.g., search query)
  name?: string;
  // Data related to the step's outcome or details
  data?: any;
}
```

**Possible `step` Values:**

- `report-plan`: The system is generating or processing the overall report plan.
- `serp-query`: The system is performing a Search Engine Results Page (SERP) query.
- `task-list`: The system is generating or processing a list of specific research tasks.
- `search-task`: The system is executing a specific search task. This step includes the `name` parameter.
- `final-report`: The system is compiling or finalizing the comprehensive research report.

**Possible `status` Values:**

- `start`: Indicates that the specified `step` has just begun.
- `end`: Indicates that the specified `step` has just finished.

**Example:**

```text
event: progress
data: {"step":"search-task","status":"start","name":"AI trends for this year"}

event: progress
data: {"step":"search-task","status":"end","name":"AI trends for this year","data":{"results_count": 15}}

```

---

### `error` Event

Sent when an error occurs during the research process that prevents the task from completing successfully or requires user attention.

**Description:** Signals that an error has occurred.

**Data Structure (`data` field):** A JSON string typically containing information about the error. A common structure is:

| Parameter | Type   | Description                                | Notes |
| :-------- | :----- | :----------------------------------------- | :---- |
| `message` | string | A human-readable description of the error. |       |

```typescript
interface ErrorEvent {
  // A human-readable description of the error.
  message: string;
}
```

**Common Error Messages:**
- `"API key required for {provider}. Please configure your API key in Settings."` - User needs to add their API key
- `"Rate limit exceeded. Try again in {seconds} seconds."` - Rate limit hit, wait and retry
- `"Unauthorized"` - ACCESS_PASSWORD required but not provided

**Example:**

```text
event: error
data: {"message":"API key required for openai. Please configure your API key in Settings."}

```

---

## Error Handling

Clients should always listen for the `error` event. Upon receiving an `error` event, the client should typically display the error message to the user and may consider the current research task terminated unless otherwise specified by the API's behavior.

**Common error scenarios:**
1. **Missing API Keys** - User hasn't configured their API keys in Settings UI
2. **Invalid API Keys** - Provided key is incorrect or expired
3. **Rate Limiting** - Too many requests from the same IP address
4. **Model Errors** - Selected model not available or doesn't support requested features

## Client Code Example

This example demonstrates how to connect to the SSE endpoint using `@microsoft/fetch-event-source` and listen for the defined event types, specifically focusing on displaying `message` events.

```typescript
import { fetchEventSource } from "@microsoft/fetch-event-source";

const ctrl = new AbortController();

// Get user's API keys from your settings/storage
const userOpenAIKey = getUserSetting("openAIApiKey"); // User's personal OpenAI key
const userTavilyKey = getUserSetting("tavilyApiKey"); // User's personal Tavily key

let report = "";
fetchEventSource("/api/sse", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // Optional: If server has ACCESS_PASSWORD configured
    // Authorization: "Bearer YOUR_ACCESS_PASSWORD",
  },
  body: JSON.stringify({
    query: "AI trends for this year",
    provider: "openai",
    thinkingModel: "gpt-4o",
    taskModel: "gpt-4o-mini",
    searchProvider: "tavily",
    
    // REQUIRED: Pass user's API keys
    aiApiKey: userOpenAIKey,
    searchApiKey: userTavilyKey,
    
    // Optional parameters
    language: "en-US",
    maxResult: 5,
    enableCitationImage: true,
    enableReferences: true,
    temperature: 0.7,
  }),
  signal: ctrl.signal,
  onmessage(msg) {
    const msgData = JSON.parse(msg.data);
    if (msg.event === "message") {
      if (msgData.type === "text") {
        report += msgData.text;
      }
    } else if (msg.event === "progress") {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[${msgData.step}]: ${msgData.name ? `${msgData.name} ` : ""}${
            msgData.status
          }`
        );
        if (msgData.data) console.log(msgData.data);
      }
    } else if (msg.event === "error") {
      throw new Error(msgData.message);
    }
  },
  onclose() {
    if (process.env.NODE_ENV !== "production") {
      console.log(report);
    }
  },
  onerror(err) {
    console.error("SSE connection error:", err);
    throw err;
  },
});

// To cancel the request
// ctrl.abort();
```

## Security Model

This API uses a **"bring your own key"** model:

- **Users provide API keys** - Each user supplies their own AI and search provider keys via the Settings UI
- **No server-side fallbacks** - Server-side API keys have been removed for security and cost control
- **Client-side storage** - User keys are stored in browser localStorage (client-side only)
- **Cost isolation** - Each user pays for their own API usage

**Benefits:**
- ✅ Zero server-side API costs for deployment owner
- ✅ Better security (no shared keys to protect)
- ✅ Scalable to unlimited users
- ✅ Users control their own spending

## Rate Limiting

The API implements rate limiting to prevent abuse:

| Endpoint | Default Limit | Per |
|----------|---------------|-----|
| AI Proxies | 100 requests/hour | IP address |
| Search Proxies | 200 requests/hour | IP address |
| Research Endpoints | 50 requests/hour | IP address |

Rate limit exceeded responses return HTTP 429 with:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in {seconds} seconds.",
  "retryAfter": 3600
}
```

Clients should respect the `Retry-After` header and implement exponential backoff.
