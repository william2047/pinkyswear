import type { AnyEndpointDefinition, ApiTree } from "../core/types";
import type {
  InferBody,
  InferParams,
  InferQuery,
  InferResponse
} from "../core/inference";

/**
 * Configuration for `createClient()`.
 */
export type CreateClientConfig = {
  /**
   * Base URL prepended to every endpoint path.
   *
   * Use an absolute URL for cross-origin APIs or a relative path such as
   * `"/api"` for same-origin APIs.
   */
  baseUrl: string;
  /**
   * Fetch implementation to use.
   *
   * Defaults to `globalThis.fetch`. Supplying this is useful in tests or
   * runtimes where fetch is not globally available.
   */
  fetch?: typeof fetch;
  /**
   * Headers sent with each request.
   *
   * When a request has a body, Handshook adds `Content-Type:
   * application/json` before applying these headers.
   */
  headers?: HeadersInit | (() => HeadersInit);
};

type RequestInput<TEndpoint> =
  ([InferParams<TEndpoint>] extends [never]
    ? Record<never, never>
    : { params: InferParams<TEndpoint> }) &
  ([InferQuery<TEndpoint>] extends [never]
    ? Record<never, never>
    : { query: InferQuery<TEndpoint> }) &
  ([InferBody<TEndpoint>] extends [never]
    ? Record<never, never>
    : { body: InferBody<TEndpoint> });

type ClientCall<TEndpoint> =
  keyof RequestInput<TEndpoint> extends never
    ? () => Promise<InferResponse<TEndpoint>>
    : (input: RequestInput<TEndpoint>) => Promise<InferResponse<TEndpoint>>;

/**
 * Browser client shape generated from an API contract.
 *
 * Endpoint leaves become async functions, while groups preserve the same
 * nesting as the original `defineApi()` object.
 */
export type ClientFor<TApi> = {
  [TKey in keyof TApi]: TApi[TKey] extends { readonly kind: "handshook.endpoint" }
    ? ClientCall<TApi[TKey]>
    : TApi[TKey] extends ApiTree
      ? ClientFor<TApi[TKey]>
      : never;
};

/**
 * Creates a typed browser fetch client from a Handshook API contract.
 *
 * The generated client validates request inputs before sending them, builds URL
 * params and query strings, parses JSON responses, validates responses, and
 * returns the asserted response type.
 *
 * @example
 * ```ts
 * const client = createClient(api, { baseUrl: "/api" });
 *
 * const lead = await client.leads.create({
 *   body: { name: "John" }
 * });
 * ```
 */
export function createClient<const TApi extends ApiTree>(
  api: TApi,
  config: CreateClientConfig
): ClientFor<TApi> {
  const fetcher = config.fetch ?? globalThis.fetch;

  if (!fetcher) {
    throw new Error("handshook: fetch is not available");
  }

  return mapApi(api, (endpoint) => {
    return async (input?: Record<string, unknown>) => {
      const params = assertIfPresent(endpoint.request.params, input?.params);
      const query = assertIfPresent(endpoint.request.query, input?.query);
      const body = assertIfPresent(endpoint.request.body, input?.body);
      const url = buildUrl(config.baseUrl, endpoint.path, params, query);
      const response = await fetcher(url, {
        method: endpoint.method,
        headers: buildHeaders(config.headers, body !== undefined),
        body: body === undefined ? undefined : JSON.stringify(body)
      });

      const payload = await readJson(response);
      return endpoint.response(payload);
    };
  }) as ClientFor<TApi>;
}

function mapApi(
  tree: ApiTree,
  createEndpointValue: (endpoint: AnyEndpointDefinition) => unknown
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(tree)) {
    result[key] = isEndpoint(value)
      ? createEndpointValue(value)
      : mapApi(value, createEndpointValue);
  }

  return result;
}

function isEndpoint(value: AnyEndpointDefinition | ApiTree): value is AnyEndpointDefinition {
  return "kind" in value && value.kind === "handshook.endpoint";
}

function assertIfPresent<T>(
  assertion: ((input: unknown) => T) | undefined,
  value: unknown
): T | undefined {
  return assertion ? assertion(value) : undefined;
}

function buildHeaders(
  headers: CreateClientConfig["headers"],
  hasBody: boolean
): HeadersInit {
  const resolved = typeof headers === "function" ? headers() : headers;

  if (!hasBody) {
    return resolved ?? {};
  }

  return {
    "Content-Type": "application/json",
    ...(resolved ?? {})
  };
}

function buildUrl(
  baseUrl: string,
  path: string,
  params: unknown,
  query: unknown
): string {
  const urlBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const urlPath = path.startsWith("/") ? path : `/${path}`;
  const interpolatedPath = interpolatePath(urlPath, params);
  const queryString = buildQueryString(query);

  return `${urlBase}${interpolatedPath}${queryString}`;
}

function interpolatePath(path: string, params: unknown): string {
  if (!isRecord(params)) {
    return path;
  }

  return path.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = params[key];

    if (value === undefined || value === null) {
      throw new Error(`handshook: missing path param "${key}"`);
    }

    return encodeURIComponent(String(value));
  });
}

function buildQueryString(query: unknown): string {
  if (!isRecord(query)) {
    return "";
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    appendQueryValue(search, key, value);
  }

  const value = search.toString();
  return value ? `?${value}` : "";
}

function appendQueryValue(
  search: URLSearchParams,
  key: string,
  value: unknown
): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryValue(search, key, item);
    }
    return;
  }

  search.append(key, String(value));
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
