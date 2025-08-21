import { zodToJsonSchema } from "zod-to-json-schema";
import {
  z,
  ZodRawShape,
  ZodObject,
  ZodString,
  AnyZodObject,
  ZodTypeAny,
  ZodType,
  ZodTypeDef,
  ZodOptional,
} from "zod";
import {
  Implementation,
  Tool,
  ListToolsResult,
  CallToolResult,
  McpError,
  ErrorCode,
  CompleteRequest,
  CompleteResult,
  PromptReference,
  ResourceReference,
  Resource,
  ListResourcesResult,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  CompleteRequestSchema,
  ListPromptsResult,
  Prompt,
  PromptArgument,
  GetPromptResult,
  ReadResourceResult,
  ServerRequest,
  ServerCapabilities,
  ServerNotification,
  ToolAnnotations,
  ClientCapabilities,
  CreateMessageRequest,
  CreateMessageResultSchema,
  EmptyResultSchema,
  InitializedNotificationSchema,
  InitializeRequest,
  InitializeRequestSchema,
  InitializeResult,
  LATEST_PROTOCOL_VERSION,
  ListRootsRequest,
  ListRootsResultSchema,
  LoggingMessageNotification,
  Notification,
  Request,
  ResourceUpdatedNotification,
  Result,
  ServerResult,
  SUPPORTED_PROTOCOL_VERSIONS,
} from "./types";
import { Completable, CompletableDef } from "./completable";
import { UriTemplate, Variables } from "./shared/uriTemplate";
import {
  mergeCapabilities,
  RequestHandlerExtra,
  Protocol,
  ProtocolOptions,
  RequestOptions,
} from "./shared/protocol";
import { Transport } from "./shared/transport";

export type ServerOptions = ProtocolOptions & {
  /**
   * Capabilities to advertise as being supported by this server.
   */
  capabilities?: ServerCapabilities;

  /**
   * Optional instructions describing how to use the server and its features.
   */
  instructions?: string;
};

/**
 * An MCP server on top of a pluggable transport.
 *
 * This server will automatically respond to the initialization flow as initiated from the client.
 *
 * To use with custom types, extend the base Request/Notification/Result types and pass them as type parameters:
 *
 * ```typescript
 * // Custom schemas
 * const CustomRequestSchema = RequestSchema.extend({...})
 * const CustomNotificationSchema = NotificationSchema.extend({...})
 * const CustomResultSchema = ResultSchema.extend({...})
 *
 * // Type aliases
 * type CustomRequest = z.infer<typeof CustomRequestSchema>
 * type CustomNotification = z.infer<typeof CustomNotificationSchema>
 * type CustomResult = z.infer<typeof CustomResultSchema>
 *
 * // Create typed server
 * const server = new Server<CustomRequest, CustomNotification, CustomResult>({
 *   name: "CustomServer",
 *   version: "1.0.0"
 * })
 * ```
 */
export class Server<
  RequestT extends Request = Request,
  NotificationT extends Notification = Notification,
  ResultT extends Result = Result
> extends Protocol<
  ServerRequest | RequestT,
  ServerNotification | NotificationT,
  ServerResult | ResultT
> {
  private _clientCapabilities?: ClientCapabilities;
  private _clientVersion?: Implementation;
  private _capabilities: ServerCapabilities;
  private _instructions?: string;

  /**
   * Callback for when initialization has fully completed (i.e., the client has sent an `initialized` notification).
   */
  oninitialized?: () => void;

  /**
   * Initializes this server with the given name and version information.
   */
  constructor(private _serverInfo: Implementation, options?: ServerOptions) {
    super(options);
    this._capabilities = options?.capabilities ?? {};
    this._instructions = options?.instructions;

    this.setRequestHandler(InitializeRequestSchema, (request) =>
      this._oninitialize(request)
    );
    this.setNotificationHandler(InitializedNotificationSchema, () =>
      this.oninitialized?.()
    );
  }

  /**
   * Registers new capabilities. This can only be called before connecting to a transport.
   *
   * The new capabilities will be merged with any existing capabilities previously given (e.g., at initialization).
   */
  public registerCapabilities(capabilities: ServerCapabilities): void {
    if (this.transport) {
      throw new Error(
        "Cannot register capabilities after connecting to transport"
      );
    }

    this._capabilities = mergeCapabilities(this._capabilities, capabilities);
  }

  protected assertCapabilityForMethod(method: RequestT["method"]): void {
    switch (method as ServerRequest["method"]) {
      case "sampling/createMessage":
        if (!this._clientCapabilities?.sampling) {
          throw new Error(
            `Client does not support sampling (required for ${method})`
          );
        }
        break;

      case "roots/list":
        if (!this._clientCapabilities?.roots) {
          throw new Error(
            `Client does not support listing roots (required for ${method})`
          );
        }
        break;

      case "ping":
        // No specific capability required for ping
        break;
    }
  }

  protected assertNotificationCapability(
    method: (ServerNotification | NotificationT)["method"]
  ): void {
    switch (method as ServerNotification["method"]) {
      case "notifications/message":
        if (!this._capabilities.logging) {
          throw new Error(
            `Server does not support logging (required for ${method})`
          );
        }
        break;

      case "notifications/resources/updated":
      case "notifications/resources/list_changed":
        if (!this._capabilities.resources) {
          throw new Error(
            `Server does not support notifying about resources (required for ${method})`
          );
        }
        break;

      case "notifications/tools/list_changed":
        if (!this._capabilities.tools) {
          throw new Error(
            `Server does not support notifying of tool list changes (required for ${method})`
          );
        }
        break;

      case "notifications/prompts/list_changed":
        if (!this._capabilities.prompts) {
          throw new Error(
            `Server does not support notifying of prompt list changes (required for ${method})`
          );
        }
        break;

      case "notifications/cancelled":
        // Cancellation notifications are always allowed
        break;

      case "notifications/progress":
        // Progress notifications are always allowed
        break;
    }
  }

  protected assertRequestHandlerCapability(method: string): void {
    switch (method) {
      case "sampling/createMessage":
        if (!this._capabilities.sampling) {
          throw new Error(
            `Server does not support sampling (required for ${method})`
          );
        }
        break;

      case "logging/setLevel":
        if (!this._capabilities.logging) {
          throw new Error(
            `Server does not support logging (required for ${method})`
          );
        }
        break;

      case "prompts/get":
      case "prompts/list":
        if (!this._capabilities.prompts) {
          throw new Error(
            `Server does not support prompts (required for ${method})`
          );
        }
        break;

      case "resources/list":
      case "resources/templates/list":
      case "resources/read":
        if (!this._capabilities.resources) {
          throw new Error(
            `Server does not support resources (required for ${method})`
          );
        }
        break;

      case "tools/call":
      case "tools/list":
        if (!this._capabilities.tools) {
          throw new Error(
            `Server does not support tools (required for ${method})`
          );
        }
        break;

      case "ping":
      case "initialize":
        // No specific capability required for these methods
        break;
    }
  }

  private async _oninitialize(
    request: InitializeRequest
  ): Promise<InitializeResult> {
    const requestedVersion = request.params.protocolVersion;

    this._clientCapabilities = request.params.capabilities;
    this._clientVersion = request.params.clientInfo;

    return {
      protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
        ? requestedVersion
        : LATEST_PROTOCOL_VERSION,
      capabilities: this.getCapabilities(),
      serverInfo: this._serverInfo,
      ...(this._instructions && { instructions: this._instructions }),
    };
  }

  /**
   * After initialization has completed, this will be populated with the client's reported capabilities.
   */
  getClientCapabilities(): ClientCapabilities | undefined {
    return this._clientCapabilities;
  }

  /**
   * After initialization has completed, this will be populated with information about the client's name and version.
   */
  getClientVersion(): Implementation | undefined {
    return this._clientVersion;
  }

  private getCapabilities(): ServerCapabilities {
    return this._capabilities;
  }

  async ping() {
    return this.request({ method: "ping" }, EmptyResultSchema);
  }

  async createMessage(
    params: CreateMessageRequest["params"],
    options?: RequestOptions
  ) {
    return this.request(
      { method: "sampling/createMessage", params },
      CreateMessageResultSchema,
      options
    );
  }

  async listRoots(
    params?: ListRootsRequest["params"],
    options?: RequestOptions
  ) {
    return this.request(
      { method: "roots/list", params },
      ListRootsResultSchema,
      options
    );
  }

  async sendLoggingMessage(params: LoggingMessageNotification["params"]) {
    return this.notification({ method: "notifications/message", params });
  }

  async sendResourceUpdated(params: ResourceUpdatedNotification["params"]) {
    return this.notification({
      method: "notifications/resources/updated",
      params,
    });
  }

  async sendResourceListChanged() {
    return this.notification({
      method: "notifications/resources/list_changed",
    });
  }

  async sendToolListChanged() {
    return this.notification({ method: "notifications/tools/list_changed" });
  }

  async sendPromptListChanged() {
    return this.notification({ method: "notifications/prompts/list_changed" });
  }
}

/**
 * High-level MCP server that provides a simpler API for working with resources, tools, and prompts.
 * For advanced usage (like sending notifications or setting custom request handlers), use the underlying
 * Server instance available via the `server` property.
 */
export class McpServer {
  /**
   * The underlying Server instance, useful for advanced operations like sending notifications.
   */
  public readonly server: Server;

  private _registeredResources: { [uri: string]: RegisteredResource } = {};
  private _registeredResourceTemplates: {
    [name: string]: RegisteredResourceTemplate;
  } = {};
  private _registeredTools: { [name: string]: RegisteredTool } = {};
  private _registeredPrompts: { [name: string]: RegisteredPrompt } = {};

  constructor(serverInfo: Implementation, options?: ServerOptions) {
    this.server = new Server(serverInfo, options);
  }

  /**
   * Attaches to the given transport, starts it, and starts listening for messages.
   *
   * The `server` object assumes ownership of the Transport, replacing any callbacks that have already been set, and expects that it is the only user of the Transport instance going forward.
   */
  async connect(transport: Transport): Promise<void> {
    return await this.server.connect(transport);
  }

  /**
   * Closes the connection.
   */
  async close(): Promise<void> {
    await this.server.close();
  }

  private _toolHandlersInitialized = false;

  private setToolRequestHandlers() {
    if (this._toolHandlersInitialized) {
      return;
    }

    this.server.assertCanSetRequestHandler(
      ListToolsRequestSchema.shape.method.value
    );
    this.server.assertCanSetRequestHandler(
      CallToolRequestSchema.shape.method.value
    );

    this.server.registerCapabilities({
      tools: {
        listChanged: true,
      },
    });

    this.server.setRequestHandler(
      ListToolsRequestSchema,
      (): ListToolsResult => ({
        tools: Object.entries(this._registeredTools)
          .filter(([, tool]) => tool.enabled)
          .map(([name, tool]): Tool => {
            const toolDefinition: Tool = {
              name,
              description: tool.description,
              inputSchema: tool.inputSchema
                ? (zodToJsonSchema(tool.inputSchema, {
                    strictUnions: true,
                  }) as Tool["inputSchema"])
                : EMPTY_OBJECT_JSON_SCHEMA,
              annotations: tool.annotations,
            };

            if (tool.outputSchema) {
              toolDefinition.outputSchema = zodToJsonSchema(tool.outputSchema, {
                strictUnions: true,
              }) as Tool["outputSchema"];
            }

            return toolDefinition;
          }),
      })
    );

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request, extra): Promise<CallToolResult> => {
        const tool = this._registeredTools[request.params.name];
        if (!tool) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Tool ${request.params.name} not found`
          );
        }

        if (!tool.enabled) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Tool ${request.params.name} disabled`
          );
        }

        let result: CallToolResult;

        if (tool.inputSchema) {
          const parseResult = await tool.inputSchema.safeParseAsync(
            request.params.arguments
          );
          if (!parseResult.success) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid arguments for tool ${request.params.name}: ${parseResult.error.message}`
            );
          }

          const args = parseResult.data;
          const cb = tool.callback as ToolCallback<ZodRawShape>;
          try {
            result = await Promise.resolve(cb(args, extra));
          } catch (error) {
            result = {
              content: [
                {
                  type: "text",
                  text: error instanceof Error ? error.message : String(error),
                },
              ],
              isError: true,
            };
          }
        } else {
          const cb = tool.callback as ToolCallback<undefined>;
          try {
            result = await Promise.resolve(cb(extra));
          } catch (error) {
            result = {
              content: [
                {
                  type: "text",
                  text: error instanceof Error ? error.message : String(error),
                },
              ],
              isError: true,
            };
          }
        }

        // Handle structured output and backward compatibility
        if (tool.outputSchema) {
          // Tool has outputSchema, so result must have structuredContent (unless it's an error)
          if (!result.structuredContent && !result.isError) {
            throw new McpError(
              ErrorCode.InternalError,
              `Tool ${request.params.name} has outputSchema but returned no structuredContent`
            );
          }

          // For backward compatibility, if structuredContent is provided but no content,
          // automatically serialize the structured content to text
          if (result.structuredContent && !result.content) {
            result.content = [
              {
                type: "text",
                text: JSON.stringify(result.structuredContent, null, 2),
              },
            ];
          }
        } else {
          // Tool must have content if no outputSchema
          if (!result.content && !result.isError) {
            throw new McpError(
              ErrorCode.InternalError,
              `Tool ${request.params.name} has no outputSchema and must return content`
            );
          }

          // If structuredContent is provided, it's an error
          if (result.structuredContent) {
            throw new McpError(
              ErrorCode.InternalError,
              `Tool ${request.params.name} has no outputSchema but returned structuredContent`
            );
          }
        }

        return result;
      }
    );

    this._toolHandlersInitialized = true;
  }

  private _completionHandlerInitialized = false;

  private setCompletionRequestHandler() {
    if (this._completionHandlerInitialized) {
      return;
    }

    this.server.assertCanSetRequestHandler(
      CompleteRequestSchema.shape.method.value
    );

    this.server.setRequestHandler(
      CompleteRequestSchema,
      async (request): Promise<CompleteResult> => {
        switch (request.params.ref.type) {
          case "ref/prompt":
            return this.handlePromptCompletion(request, request.params.ref);

          case "ref/resource":
            return this.handleResourceCompletion(request, request.params.ref);

          default:
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid completion reference: ${request.params.ref}`
            );
        }
      }
    );

    this._completionHandlerInitialized = true;
  }

  private async handlePromptCompletion(
    request: CompleteRequest,
    ref: PromptReference
  ): Promise<CompleteResult> {
    const prompt = this._registeredPrompts[ref.name];
    if (!prompt) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Prompt ${ref.name} not found`
      );
    }

    if (!prompt.enabled) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Prompt ${ref.name} disabled`
      );
    }

    if (!prompt.argsSchema) {
      return EMPTY_COMPLETION_RESULT;
    }

    const field = prompt.argsSchema.shape[request.params.argument.name];
    if (!(field instanceof Completable)) {
      return EMPTY_COMPLETION_RESULT;
    }

    const def: CompletableDef<ZodString> = field._def;
    const suggestions = await def.complete(request.params.argument.value);
    return createCompletionResult(suggestions);
  }

  private async handleResourceCompletion(
    request: CompleteRequest,
    ref: ResourceReference
  ): Promise<CompleteResult> {
    const template = Object.values(this._registeredResourceTemplates).find(
      (t) => t.resourceTemplate.uriTemplate.toString() === ref.uri
    );

    if (!template) {
      if (this._registeredResources[ref.uri]) {
        // Attempting to autocomplete a fixed resource URI is not an error in the spec (but probably should be).
        return EMPTY_COMPLETION_RESULT;
      }

      throw new McpError(
        ErrorCode.InvalidParams,
        `Resource template ${request.params.ref.uri} not found`
      );
    }

    const completer = template.resourceTemplate.completeCallback(
      request.params.argument.name
    );
    if (!completer) {
      return EMPTY_COMPLETION_RESULT;
    }

    const suggestions = await completer(request.params.argument.value);
    return createCompletionResult(suggestions);
  }

  private _resourceHandlersInitialized = false;

  private setResourceRequestHandlers() {
    if (this._resourceHandlersInitialized) {
      return;
    }

    this.server.assertCanSetRequestHandler(
      ListResourcesRequestSchema.shape.method.value
    );
    this.server.assertCanSetRequestHandler(
      ListResourceTemplatesRequestSchema.shape.method.value
    );
    this.server.assertCanSetRequestHandler(
      ReadResourceRequestSchema.shape.method.value
    );

    this.server.registerCapabilities({
      resources: {
        listChanged: true,
      },
    });

    this.server.setRequestHandler(
      ListResourcesRequestSchema,
      async (_, extra) => {
        const resources = Object.entries(this._registeredResources)
          .filter(([, resource]) => resource.enabled)
          .map(([uri, resource]) => ({
            uri,
            name: resource.name,
            ...resource.metadata,
          }));

        const templateResources: Resource[] = [];
        for (const template of Object.values(
          this._registeredResourceTemplates
        )) {
          if (!template.resourceTemplate.listCallback) {
            continue;
          }

          const result = await template.resourceTemplate.listCallback(extra);
          for (const resource of result.resources) {
            templateResources.push({
              ...resource,
              ...template.metadata,
            });
          }
        }

        return { resources: [...resources, ...templateResources] };
      }
    );

    this.server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      async () => {
        const resourceTemplates = Object.entries(
          this._registeredResourceTemplates
        ).map(([name, template]) => ({
          name,
          uriTemplate: template.resourceTemplate.uriTemplate.toString(),
          ...template.metadata,
        }));

        return { resourceTemplates };
      }
    );

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request, extra) => {
        const uri = new URL(request.params.uri);

        // First check for exact resource match
        const resource = this._registeredResources[uri.toString()];
        if (resource) {
          if (!resource.enabled) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Resource ${uri} disabled`
            );
          }
          return resource.readCallback(uri, extra);
        }

        // Then check templates
        for (const template of Object.values(
          this._registeredResourceTemplates
        )) {
          const variables = template.resourceTemplate.uriTemplate.match(
            uri.toString()
          );
          if (variables) {
            return template.readCallback(uri, variables, extra);
          }
        }

        throw new McpError(
          ErrorCode.InvalidParams,
          `Resource ${uri} not found`
        );
      }
    );

    this.setCompletionRequestHandler();

    this._resourceHandlersInitialized = true;
  }

  private _promptHandlersInitialized = false;

  private setPromptRequestHandlers() {
    if (this._promptHandlersInitialized) {
      return;
    }

    this.server.assertCanSetRequestHandler(
      ListPromptsRequestSchema.shape.method.value
    );
    this.server.assertCanSetRequestHandler(
      GetPromptRequestSchema.shape.method.value
    );

    this.server.registerCapabilities({
      prompts: {
        listChanged: true,
      },
    });

    this.server.setRequestHandler(
      ListPromptsRequestSchema,
      (): ListPromptsResult => ({
        prompts: Object.entries(this._registeredPrompts)
          .filter(([, prompt]) => prompt.enabled)
          .map(([name, prompt]): Prompt => {
            return {
              name,
              description: prompt.description,
              arguments: prompt.argsSchema
                ? promptArgumentsFromSchema(prompt.argsSchema)
                : undefined,
            };
          }),
      })
    );

    this.server.setRequestHandler(
      GetPromptRequestSchema,
      async (request, extra): Promise<GetPromptResult> => {
        const prompt = this._registeredPrompts[request.params.name];
        if (!prompt) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Prompt ${request.params.name} not found`
          );
        }

        if (!prompt.enabled) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Prompt ${request.params.name} disabled`
          );
        }

        if (prompt.argsSchema) {
          const parseResult = await prompt.argsSchema.safeParseAsync(
            request.params.arguments
          );
          if (!parseResult.success) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid arguments for prompt ${request.params.name}: ${parseResult.error.message}`
            );
          }

          const args = parseResult.data;
          const cb = prompt.callback as PromptCallback<PromptArgsRawShape>;
          return await Promise.resolve(cb(args, extra));
        } else {
          const cb = prompt.callback as PromptCallback<undefined>;
          return await Promise.resolve(cb(extra));
        }
      }
    );

    this.setCompletionRequestHandler();

    this._promptHandlersInitialized = true;
  }

  /**
   * Registers a resource `name` at a fixed URI, which will use the given callback to respond to read requests.
   */
  resource(
    name: string,
    uri: string,
    readCallback: ReadResourceCallback
  ): RegisteredResource;

  /**
   * Registers a resource `name` at a fixed URI with metadata, which will use the given callback to respond to read requests.
   */
  resource(
    name: string,
    uri: string,
    metadata: ResourceMetadata,
    readCallback: ReadResourceCallback
  ): RegisteredResource;

  /**
   * Registers a resource `name` with a template pattern, which will use the given callback to respond to read requests.
   */
  resource(
    name: string,
    template: ResourceTemplate,
    readCallback: ReadResourceTemplateCallback
  ): RegisteredResourceTemplate;

  /**
   * Registers a resource `name` with a template pattern and metadata, which will use the given callback to respond to read requests.
   */
  resource(
    name: string,
    template: ResourceTemplate,
    metadata: ResourceMetadata,
    readCallback: ReadResourceTemplateCallback
  ): RegisteredResourceTemplate;

  resource(
    name: string,
    uriOrTemplate: string | ResourceTemplate,
    ...rest: unknown[]
  ): RegisteredResource | RegisteredResourceTemplate {
    let metadata: ResourceMetadata | undefined;
    if (typeof rest[0] === "object") {
      metadata = rest.shift() as ResourceMetadata;
    }

    const readCallback = rest[0] as
      | ReadResourceCallback
      | ReadResourceTemplateCallback;

    if (typeof uriOrTemplate === "string") {
      if (this._registeredResources[uriOrTemplate]) {
        throw new Error(`Resource ${uriOrTemplate} is already registered`);
      }

      const registeredResource: RegisteredResource = {
        name,
        metadata,
        readCallback: readCallback as ReadResourceCallback,
        enabled: true,
        disable: () => registeredResource.update({ enabled: false }),
        enable: () => registeredResource.update({ enabled: true }),
        remove: () => registeredResource.update({ uri: null }),
        update: (updates) => {
          if (
            typeof updates.uri !== "undefined" &&
            updates.uri !== uriOrTemplate
          ) {
            delete this._registeredResources[uriOrTemplate];
            if (updates.uri)
              this._registeredResources[updates.uri] = registeredResource;
          }
          if (typeof updates.name !== "undefined")
            registeredResource.name = updates.name;
          if (typeof updates.metadata !== "undefined")
            registeredResource.metadata = updates.metadata;
          if (typeof updates.callback !== "undefined")
            registeredResource.readCallback = updates.callback;
          if (typeof updates.enabled !== "undefined")
            registeredResource.enabled = updates.enabled;
          this.sendResourceListChanged();
        },
      };
      this._registeredResources[uriOrTemplate] = registeredResource;

      this.setResourceRequestHandlers();
      this.sendResourceListChanged();
      return registeredResource;
    } else {
      if (this._registeredResourceTemplates[name]) {
        throw new Error(`Resource template ${name} is already registered`);
      }

      const registeredResourceTemplate: RegisteredResourceTemplate = {
        resourceTemplate: uriOrTemplate,
        metadata,
        readCallback: readCallback as ReadResourceTemplateCallback,
        enabled: true,
        disable: () => registeredResourceTemplate.update({ enabled: false }),
        enable: () => registeredResourceTemplate.update({ enabled: true }),
        remove: () => registeredResourceTemplate.update({ name: null }),
        update: (updates) => {
          if (typeof updates.name !== "undefined" && updates.name !== name) {
            delete this._registeredResourceTemplates[name];
            if (updates.name)
              this._registeredResourceTemplates[updates.name] =
                registeredResourceTemplate;
          }
          if (typeof updates.template !== "undefined")
            registeredResourceTemplate.resourceTemplate = updates.template;
          if (typeof updates.metadata !== "undefined")
            registeredResourceTemplate.metadata = updates.metadata;
          if (typeof updates.callback !== "undefined")
            registeredResourceTemplate.readCallback = updates.callback;
          if (typeof updates.enabled !== "undefined")
            registeredResourceTemplate.enabled = updates.enabled;
          this.sendResourceListChanged();
        },
      };
      this._registeredResourceTemplates[name] = registeredResourceTemplate;

      this.setResourceRequestHandlers();
      this.sendResourceListChanged();
      return registeredResourceTemplate;
    }
  }

  private _createRegisteredTool(
    name: string,
    description: string | undefined,
    inputSchema: ZodRawShape | undefined,
    outputSchema: ZodRawShape | undefined,
    annotations: ToolAnnotations | undefined,
    callback: ToolCallback<ZodRawShape | undefined>
  ): RegisteredTool {
    const registeredTool: RegisteredTool = {
      description,
      inputSchema:
        inputSchema === undefined ? undefined : z.object(inputSchema),
      outputSchema:
        outputSchema === undefined ? undefined : z.object(outputSchema),
      annotations,
      callback,
      enabled: true,
      disable: () => registeredTool.update({ enabled: false }),
      enable: () => registeredTool.update({ enabled: true }),
      remove: () => registeredTool.update({ name: null }),
      update: (updates) => {
        if (typeof updates.name !== "undefined" && updates.name !== name) {
          delete this._registeredTools[name];
          if (updates.name)
            this._registeredTools[updates.name] = registeredTool;
        }
        if (typeof updates.description !== "undefined")
          registeredTool.description = updates.description;
        if (typeof updates.paramsSchema !== "undefined")
          registeredTool.inputSchema = z.object(updates.paramsSchema);
        if (typeof updates.callback !== "undefined")
          registeredTool.callback = updates.callback;
        if (typeof updates.annotations !== "undefined")
          registeredTool.annotations = updates.annotations;
        if (typeof updates.enabled !== "undefined")
          registeredTool.enabled = updates.enabled;
        this.sendToolListChanged();
      },
    };
    this._registeredTools[name] = registeredTool;

    this.setToolRequestHandlers();
    this.sendToolListChanged();

    return registeredTool;
  }

  /**
   * Registers a zero-argument tool `name`, which will run the given function when the client calls it.
   */
  tool(name: string, cb: ToolCallback): RegisteredTool;

  /**
   * Registers a zero-argument tool `name` (with a description) which will run the given function when the client calls it.
   */
  tool(name: string, description: string, cb: ToolCallback): RegisteredTool;

  /**
   * Registers a tool taking either a parameter schema for validation or annotations for additional metadata.
   * This unified overload handles both `tool(name, paramsSchema, cb)` and `tool(name, annotations, cb)` cases.
   *
   * Note: We use a union type for the second parameter because TypeScript cannot reliably disambiguate
   * between ToolAnnotations and ZodRawShape during overload resolution, as both are plain object types.
   */
  tool<Args extends ZodRawShape>(
    name: string,
    paramsSchemaOrAnnotations: Args | ToolAnnotations,
    cb: ToolCallback<Args>
  ): RegisteredTool;

  /**
   * Registers a tool `name` (with a description) taking either parameter schema or annotations.
   * This unified overload handles both `tool(name, description, paramsSchema, cb)` and
   * `tool(name, description, annotations, cb)` cases.
   *
   * Note: We use a union type for the third parameter because TypeScript cannot reliably disambiguate
   * between ToolAnnotations and ZodRawShape during overload resolution, as both are plain object types.
   */
  tool<Args extends ZodRawShape>(
    name: string,
    description: string,
    paramsSchemaOrAnnotations: Args | ToolAnnotations,
    cb: ToolCallback<Args>
  ): RegisteredTool;

  /**
   * Registers a tool with both parameter schema and annotations.
   */
  tool<Args extends ZodRawShape>(
    name: string,
    paramsSchema: Args,
    annotations: ToolAnnotations,
    cb: ToolCallback<Args>
  ): RegisteredTool;

  /**
   * Registers a tool with description, parameter schema, and annotations.
   */
  tool<Args extends ZodRawShape>(
    name: string,
    description: string,
    paramsSchema: Args,
    annotations: ToolAnnotations,
    cb: ToolCallback<Args>
  ): RegisteredTool;

  /**
   * tool() implementation. Parses arguments passed to overrides defined above.
   */
  tool(name: string, ...rest: unknown[]): RegisteredTool {
    if (this._registeredTools[name]) {
      throw new Error(`Tool ${name} is already registered`);
    }

    let description: string | undefined;
    let inputSchema: ZodRawShape | undefined;
    let outputSchema: ZodRawShape | undefined;
    let annotations: ToolAnnotations | undefined;

    // Tool properties are passed as separate arguments, with omissions allowed.
    // Support for this style is frozen as of protocol version 2025-03-26. Future additions
    // to tool definition should *NOT* be added.

    if (typeof rest[0] === "string") {
      description = rest.shift() as string;
    }

    // Handle the different overload combinations
    if (rest.length > 1) {
      // We have at least one more arg before the callback
      const firstArg = rest[0];

      if (isZodRawShape(firstArg)) {
        // We have a params schema as the first arg
        inputSchema = rest.shift() as ZodRawShape;

        // Check if the next arg is potentially annotations
        if (
          rest.length > 1 &&
          typeof rest[0] === "object" &&
          rest[0] !== null &&
          !isZodRawShape(rest[0])
        ) {
          // Case: tool(name, paramsSchema, annotations, cb)
          // Or: tool(name, description, paramsSchema, annotations, cb)
          annotations = rest.shift() as ToolAnnotations;
        }
      } else if (typeof firstArg === "object" && firstArg !== null) {
        // Not a ZodRawShape, so must be annotations in this position
        // Case: tool(name, annotations, cb)
        // Or: tool(name, description, annotations, cb)
        annotations = rest.shift() as ToolAnnotations;
      }
    }
    const callback = rest[0] as ToolCallback<ZodRawShape | undefined>;

    return this._createRegisteredTool(
      name,
      description,
      inputSchema,
      outputSchema,
      annotations,
      callback
    );
  }

  /**
   * Registers a tool with a config object and callback.
   */
  registerTool<InputArgs extends ZodRawShape, OutputArgs extends ZodRawShape>(
    name: string,
    config: {
      description?: string;
      inputSchema?: InputArgs;
      outputSchema?: OutputArgs;
      annotations?: ToolAnnotations;
    },
    cb: ToolCallback<InputArgs>
  ): RegisteredTool {
    if (this._registeredTools[name]) {
      throw new Error(`Tool ${name} is already registered`);
    }

    const { description, inputSchema, outputSchema, annotations } = config;

    return this._createRegisteredTool(
      name,
      description,
      inputSchema,
      outputSchema,
      annotations,
      cb as ToolCallback<ZodRawShape | undefined>
    );
  }

  /**
   * Registers a zero-argument prompt `name`, which will run the given function when the client calls it.
   */
  prompt(name: string, cb: PromptCallback): RegisteredPrompt;

  /**
   * Registers a zero-argument prompt `name` (with a description) which will run the given function when the client calls it.
   */
  prompt(
    name: string,
    description: string,
    cb: PromptCallback
  ): RegisteredPrompt;

  /**
   * Registers a prompt `name` accepting the given arguments, which must be an object containing named properties associated with Zod schemas. When the client calls it, the function will be run with the parsed and validated arguments.
   */
  prompt<Args extends PromptArgsRawShape>(
    name: string,
    argsSchema: Args,
    cb: PromptCallback<Args>
  ): RegisteredPrompt;

  /**
   * Registers a prompt `name` (with a description) accepting the given arguments, which must be an object containing named properties associated with Zod schemas. When the client calls it, the function will be run with the parsed and validated arguments.
   */
  prompt<Args extends PromptArgsRawShape>(
    name: string,
    description: string,
    argsSchema: Args,
    cb: PromptCallback<Args>
  ): RegisteredPrompt;

  prompt(name: string, ...rest: unknown[]): RegisteredPrompt {
    if (this._registeredPrompts[name]) {
      throw new Error(`Prompt ${name} is already registered`);
    }

    let description: string | undefined;
    if (typeof rest[0] === "string") {
      description = rest.shift() as string;
    }

    let argsSchema: PromptArgsRawShape | undefined;
    if (rest.length > 1) {
      argsSchema = rest.shift() as PromptArgsRawShape;
    }

    const cb = rest[0] as PromptCallback<PromptArgsRawShape | undefined>;
    const registeredPrompt: RegisteredPrompt = {
      description,
      argsSchema: argsSchema === undefined ? undefined : z.object(argsSchema),
      callback: cb,
      enabled: true,
      disable: () => registeredPrompt.update({ enabled: false }),
      enable: () => registeredPrompt.update({ enabled: true }),
      remove: () => registeredPrompt.update({ name: null }),
      update: (updates) => {
        if (typeof updates.name !== "undefined" && updates.name !== name) {
          delete this._registeredPrompts[name];
          if (updates.name)
            this._registeredPrompts[updates.name] = registeredPrompt;
        }
        if (typeof updates.description !== "undefined")
          registeredPrompt.description = updates.description;
        if (typeof updates.argsSchema !== "undefined")
          registeredPrompt.argsSchema = z.object(updates.argsSchema);
        if (typeof updates.callback !== "undefined")
          registeredPrompt.callback = updates.callback;
        if (typeof updates.enabled !== "undefined")
          registeredPrompt.enabled = updates.enabled;
        this.sendPromptListChanged();
      },
    };
    this._registeredPrompts[name] = registeredPrompt;

    this.setPromptRequestHandlers();
    this.sendPromptListChanged();

    return registeredPrompt;
  }

  /**
   * Checks if the server is connected to a transport.
   * @returns True if the server is connected
   */
  isConnected() {
    return this.server.transport !== undefined;
  }

  /**
   * Sends a resource list changed event to the client, if connected.
   */
  sendResourceListChanged() {
    if (this.isConnected()) {
      this.server.sendResourceListChanged();
    }
  }

  /**
   * Sends a tool list changed event to the client, if connected.
   */
  sendToolListChanged() {
    if (this.isConnected()) {
      this.server.sendToolListChanged();
    }
  }

  /**
   * Sends a prompt list changed event to the client, if connected.
   */
  sendPromptListChanged() {
    if (this.isConnected()) {
      this.server.sendPromptListChanged();
    }
  }
}

/**
 * A callback to complete one variable within a resource template's URI template.
 */
export type CompleteResourceTemplateCallback = (
  value: string
) => string[] | Promise<string[]>;

/**
 * A resource template combines a URI pattern with optional functionality to enumerate
 * all resources matching that pattern.
 */
export class ResourceTemplate {
  private _uriTemplate: UriTemplate;

  constructor(
    uriTemplate: string | UriTemplate,
    private _callbacks: {
      /**
       * A callback to list all resources matching this template. This is required to specified, even if `undefined`, to avoid accidentally forgetting resource listing.
       */
      list: ListResourcesCallback | undefined;

      /**
       * An optional callback to autocomplete variables within the URI template. Useful for clients and users to discover possible values.
       */
      complete?: {
        [variable: string]: CompleteResourceTemplateCallback;
      };
    }
  ) {
    this._uriTemplate =
      typeof uriTemplate === "string"
        ? new UriTemplate(uriTemplate)
        : uriTemplate;
  }

  /**
   * Gets the URI template pattern.
   */
  get uriTemplate(): UriTemplate {
    return this._uriTemplate;
  }

  /**
   * Gets the list callback, if one was provided.
   */
  get listCallback(): ListResourcesCallback | undefined {
    return this._callbacks.list;
  }

  /**
   * Gets the callback for completing a specific URI template variable, if one was provided.
   */
  completeCallback(
    variable: string
  ): CompleteResourceTemplateCallback | undefined {
    return this._callbacks.complete?.[variable];
  }
}

/**
 * Callback for a tool handler registered with Server.tool().
 *
 * Parameters will include tool arguments, if applicable, as well as other request handler context.
 *
 * The callback should return:
 * - `structuredContent` if the tool has an outputSchema defined
 * - `content` if the tool does not have an outputSchema
 * - Both fields are optional but typically one should be provided
 */
export type ToolCallback<Args extends undefined | ZodRawShape = undefined> =
  Args extends ZodRawShape
    ? (
        args: z.objectOutputType<Args, ZodTypeAny>,
        extra: RequestHandlerExtra<ServerRequest, ServerNotification>
      ) => CallToolResult | Promise<CallToolResult>
    : (
        extra: RequestHandlerExtra<ServerRequest, ServerNotification>
      ) => CallToolResult | Promise<CallToolResult>;

export type RegisteredTool = {
  description?: string;
  inputSchema?: AnyZodObject;
  outputSchema?: AnyZodObject;
  annotations?: ToolAnnotations;
  callback: ToolCallback<undefined | ZodRawShape>;
  enabled: boolean;
  enable(): void;
  disable(): void;
  update<
    InputArgs extends ZodRawShape,
    OutputArgs extends ZodRawShape
  >(updates: {
    name?: string | null;
    description?: string;
    paramsSchema?: InputArgs;
    outputSchema?: OutputArgs;
    annotations?: ToolAnnotations;
    callback?: ToolCallback<InputArgs>;
    enabled?: boolean;
  }): void;
  remove(): void;
};

const EMPTY_OBJECT_JSON_SCHEMA = {
  type: "object" as const,
};

// Helper to check if an object is a Zod schema (ZodRawShape)
function isZodRawShape(obj: unknown): obj is ZodRawShape {
  if (typeof obj !== "object" || obj === null) return false;

  const isEmptyObject = Object.keys(obj).length === 0;

  // Check if object is empty or at least one property is a ZodType instance
  // Note: use heuristic check to avoid instanceof failure across different Zod versions
  return isEmptyObject || Object.values(obj as object).some(isZodTypeLike);
}

function isZodTypeLike(value: unknown): value is ZodType {
  return (
    value !== null &&
    typeof value === "object" &&
    "parse" in value &&
    typeof value.parse === "function" &&
    "safeParse" in value &&
    typeof value.safeParse === "function"
  );
}

/**
 * Additional, optional information for annotating a resource.
 */
export type ResourceMetadata = Omit<Resource, "uri" | "name">;

/**
 * Callback to list all resources matching a given template.
 */
export type ListResourcesCallback = (
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>
) => ListResourcesResult | Promise<ListResourcesResult>;

/**
 * Callback to read a resource at a given URI.
 */
export type ReadResourceCallback = (
  uri: URL,
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>
) => ReadResourceResult | Promise<ReadResourceResult>;

export type RegisteredResource = {
  name: string;
  metadata?: ResourceMetadata;
  readCallback: ReadResourceCallback;
  enabled: boolean;
  enable(): void;
  disable(): void;
  update(updates: {
    name?: string;
    uri?: string | null;
    metadata?: ResourceMetadata;
    callback?: ReadResourceCallback;
    enabled?: boolean;
  }): void;
  remove(): void;
};

/**
 * Callback to read a resource at a given URI, following a filled-in URI template.
 */
export type ReadResourceTemplateCallback = (
  uri: URL,
  variables: Variables,
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>
) => ReadResourceResult | Promise<ReadResourceResult>;

export type RegisteredResourceTemplate = {
  resourceTemplate: ResourceTemplate;
  metadata?: ResourceMetadata;
  readCallback: ReadResourceTemplateCallback;
  enabled: boolean;
  enable(): void;
  disable(): void;
  update(updates: {
    name?: string | null;
    template?: ResourceTemplate;
    metadata?: ResourceMetadata;
    callback?: ReadResourceTemplateCallback;
    enabled?: boolean;
  }): void;
  remove(): void;
};

type PromptArgsRawShape = {
  [k: string]:
    | ZodType<string, ZodTypeDef, string>
    | ZodOptional<ZodType<string, ZodTypeDef, string>>;
};

export type PromptCallback<
  Args extends undefined | PromptArgsRawShape = undefined
> = Args extends PromptArgsRawShape
  ? (
      args: z.objectOutputType<Args, ZodTypeAny>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => GetPromptResult | Promise<GetPromptResult>
  : (
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => GetPromptResult | Promise<GetPromptResult>;

export type RegisteredPrompt = {
  description?: string;
  argsSchema?: ZodObject<PromptArgsRawShape>;
  callback: PromptCallback<undefined | PromptArgsRawShape>;
  enabled: boolean;
  enable(): void;
  disable(): void;
  update<Args extends PromptArgsRawShape>(updates: {
    name?: string | null;
    description?: string;
    argsSchema?: Args;
    callback?: PromptCallback<Args>;
    enabled?: boolean;
  }): void;
  remove(): void;
};

function promptArgumentsFromSchema(
  schema: ZodObject<PromptArgsRawShape>
): PromptArgument[] {
  return Object.entries(schema.shape).map(
    ([name, field]): PromptArgument => ({
      name,
      description: field.description,
      required: !field.isOptional(),
    })
  );
}

function createCompletionResult(suggestions: string[]): CompleteResult {
  return {
    completion: {
      values: suggestions.slice(0, 100),
      total: suggestions.length,
      hasMore: suggestions.length > 100,
    },
  };
}

const EMPTY_COMPLETION_RESULT: CompleteResult = {
  completion: {
    values: [],
    hasMore: false,
  },
};
