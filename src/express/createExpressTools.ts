import type { AnyEndpointDefinition, ApiTree, HttpMethod } from "../core/types";
import type {
  InferBody,
  InferParams,
  InferQuery,
  InferResponse
} from "../core/inference";

/**
 * Minimal Express-compatible request shape used by Handshook middleware.
 *
 * In Express apps, `middleware` attaches validated values to `req.handshook`.
 */
export type HandshookRequest<
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown
> = {
  /** Raw Express route params. */
  params: unknown;
  /** Raw Express query object. */
  query: unknown;
  /** Raw Express request body. */
  body: unknown;
  /** Values validated by Handshook request assertions. */
  handshook?: {
    /** Validated route params. */
    params: TParams;
    /** Validated query values. */
    query: TQuery;
    /** Validated request body. */
    body: TBody;
  };
};

/**
 * Minimal Express-compatible response shape used for assertion failures.
 */
export type HandshookResponse = {
  /** Sets the HTTP status code before sending JSON. */
  status: (statusCode: number) => {
    /** Sends a JSON response body. */
    json: (body: unknown) => unknown;
  };
};

/**
 * Minimal Express-compatible `next` callback.
 */
export type HandshookNext = () => void;

/**
 * Middleware generated for a single endpoint.
 *
 * It validates request params, query, and body when assertions are present,
 * writes the validated values to `req.handshook`, and returns `400 Bad Request`
 * when an assertion throws.
 */
export type HandshookMiddleware<
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown
> = (
  req: HandshookRequest<TParams, TQuery, TBody>,
  res: HandshookResponse,
  next: HandshookNext
) => void;

/**
 * Express-facing helpers generated for a single endpoint.
 */
export type ExpressEndpointTools<TEndpoint> = {
  /** Endpoint path suitable for Express route registration. */
  path: string;
  /** HTTP method declared by the endpoint. */
  method: HttpMethod;
  /** Middleware that validates request values and attaches `req.handshook`. */
  middleware: HandshookMiddleware<
    InferParams<TEndpoint>,
    InferQuery<TEndpoint>,
    InferBody<TEndpoint>
  >;
  /** Validates a controller result before sending it as a response. */
  assertResponse: (input: unknown) => InferResponse<TEndpoint>;
};

/**
 * Express helper shape generated from an API contract.
 *
 * Endpoint leaves become route helper objects, while groups preserve the same
 * nesting as the original `defineApi()` object.
 */
export type ExpressToolsFor<TApi> = {
  [TKey in keyof TApi]: TApi[TKey] extends { readonly kind: "handshook.endpoint" }
    ? ExpressEndpointTools<TApi[TKey]>
    : TApi[TKey] extends ApiTree
      ? ExpressToolsFor<TApi[TKey]>
      : never;
};

/**
 * Creates typed Express route helpers from a Handshook API contract.
 *
 * Handshook does not register controllers for you. Use the generated `path`,
 * `method`, `middleware`, and `assertResponse` values with your existing
 * Express routing style.
 *
 * @example
 * ```ts
 * const expressApi = createExpressTools(api);
 *
 * app.post(
 *   expressApi.leads.create.path,
 *   expressApi.leads.create.middleware,
 *   async (req, res) => {
 *     res.json(expressApi.leads.create.assertResponse(result));
 *   }
 * );
 * ```
 */
export function createExpressTools<const TApi extends ApiTree>(
  api: TApi
): ExpressToolsFor<TApi> {
  return mapApi(api, (endpoint) => {
    return {
      path: endpoint.path,
      method: endpoint.method,
      middleware: createMiddleware(endpoint),
      assertResponse: endpoint.response
    };
  }) as ExpressToolsFor<TApi>;
}

function createMiddleware(endpoint: AnyEndpointDefinition): HandshookMiddleware {
  return (req, res, next) => {
    try {
      req.handshook = {
        params: assertIfPresent(endpoint.request.params, req.params),
        query: assertIfPresent(endpoint.request.query, req.query),
        body: assertIfPresent(endpoint.request.body, req.body)
      };
      next();
    } catch (error) {
      res.status(400).json({
        error: "Bad Request",
        message: error instanceof Error ? error.message : "Request assertion failed"
      });
    }
  };
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
