/**
 * Represents a resource in the knowledge base.
 */
interface Resource {
  /** Unique identifier for the resource. */
  id: string;
  /** Name of the resource file or URL. */
  name: string;
  /** MIME type of the resource. */
  type: string;
  /** Size of the resource in bytes. */
  size: number;
  /** Processing status of the resource. */
  status: "unprocessed" | "processing" | "completed" | "failed";
}

/**
 * Metadata for a file stored in the knowledge base.
 */
interface FileMeta {
  /** Name of the file. */
  name: string;
  /** Size of the file in bytes. */
  size: number;
  /** MIME type of the file. */
  type: string;
  /** Timestamp of the last modification. */
  lastModified: number;
}

/**
 * Represents a knowledge item (file, URL, or raw text).
 */
interface Knowledge {
  /** Unique identifier for the knowledge item. */
  id: string;
  /** Title of the knowledge item. */
  title: string;
  /** Content of the knowledge item (text). */
  content: string;
  /** Type of the knowledge item. */
  type: "file" | "url" | "knowledge";
  /** Metadata if the item is a file. */
  fileMeta?: FileMeta;
  /** URL if the item is a web resource. */
  url?: string;
  /** Creation timestamp. */
  createdAt: number;
  /** Last update timestamp. */
  updatedAt: number;
}

/**
 * Represents an image source found during research.
 */
interface ImageSource {
  /** URL of the image. */
  url: string;
  /** Description or caption of the image. */
  description?: string;
}

/**
 * Represents a source of information.
 */
interface Source {
  /** Title of the source. */
  title?: string;
  /** Content snippet or summary from the source. */
  content?: string;
  /** URL of the source. */
  url: string;
  /** Images associated with the source. */
  images?: ImageSource[];
}

/**
 * Represents the state of a search task.
 */
interface SearchTask {
  /** Current state of the task. */
  state: "unprocessed" | "processing" | "completed" | "failed";
  /** The search query. */
  query: string;
  /** The goal of the research. */
  researchGoal: string;
  /** Learnings extracted from the search. */
  learning: string;
  /** Sources found during the search. */
  sources: Source[];
  /** Images found during the search. */
  images: ImageSource[];
}

/**
 * Represents the result of a partial JSON parse.
 */
interface PartialJson {
  /** The parsed value, if available. */
  value: JSONValue | undefined;
  /** The state of the parsing attempt. */
  state:
    | "undefined-input"
    | "successful-parse"
    | "repaired-parse"
    | "failed-parse";
}

/**
 * Represents a result from a web search.
 */
interface WebSearchResult {
  /** Content snippet from the search result. */
  content: string;
  /** URL of the search result. */
  url: string;
  /** Title of the page. */
  title?: string;
}
