/**
 * Runtime assertion or parser used by Handshook contracts.
 *
 * The function receives unknown input, returns a validated value of `T`, and
 * throws when the value does not satisfy the contract.
 */
export type Assert<T> = (input: unknown) => T;

/**
 * HTTP methods supported by Handshook endpoints.
 */
export type HttpMethod =
  | "DELETE"
  | "GET"
  | "PATCH"
  | "POST"
  | "PUT";

/**
 * Optional explicit type contract for an endpoint.
 *
 * Provide this generic to `endpoint<...>()` when you want assertion functions
 * to be checked against known request and response types.
 */
export type EndpointContract = {
  /** Validated route parameters, such as `{ leadId: string }`. */
  params?: unknown;
  /** Validated query string shape. */
  query?: unknown;
  /** Validated request body shape. */
  body?: unknown;
  /** Validated response body shape. */
  response: unknown;
};

/**
 * Runtime endpoint definition produced by `endpoint()`.
 *
 * Most application code should create these with `endpoint()` rather than
 * constructing this object by hand.
 */
export type EndpointDefinition<
  TParams = never,
  TQuery = never,
  TBody = never,
  TResponse = unknown
> = {
  /** Internal discriminator used by adapters when walking an API tree. */
  readonly kind: "handshook.endpoint";
  /** HTTP method used for requests and server registration. */
  readonly method: HttpMethod;
  /** URL path pattern, with route params written as `:paramName`. */
  readonly path: string;
  /** Request assertions for values supplied by clients or Express. */
  readonly request: {
    /** Assertion for route params. */
    readonly params?: Assert<TParams>;
    /** Assertion for query values. */
    readonly query?: Assert<TQuery>;
    /** Assertion for the JSON request body. */
    readonly body?: Assert<TBody>;
  };
  /** Assertion for endpoint responses. */
  readonly response: Assert<TResponse>;
};

/**
 * Broad endpoint type for adapter authors and internal API tree traversal.
 */
export type AnyEndpointDefinition = EndpointDefinition<any, any, any, any>;

/**
 * Nested object of logical API groups and endpoints.
 *
 * Keys organize helpers such as `client.leads.create(...)`; they do not affect
 * URL generation.
 */
export type ApiTree = {
  readonly [key: string]: AnyEndpointDefinition | ApiTree;
};

/**
 * Returns a field from a contract when present, otherwise `never`.
 */
export type MaybeField<TContract, TKey extends string> =
  TKey extends keyof TContract ? TContract[TKey] : never;
