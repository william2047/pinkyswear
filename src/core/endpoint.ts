import type {
  AnyEndpointDefinition,
  Assert,
  EndpointContract,
  EndpointDefinition,
  HttpMethod,
  MaybeField
} from "./types";

type AnyEndpointOptions = {
  method: HttpMethod;
  path: string;
  request?: {
    params?: Assert<unknown>;
    query?: Assert<unknown>;
    body?: Assert<unknown>;
  };
  response: Assert<unknown>;
};

type InferAssert<TValue> = TValue extends Assert<infer TResult> ? TResult : never;

type InferRequestField<TOptions, TKey extends "body" | "params" | "query"> =
  TOptions extends { request?: infer TRequest }
    ? TRequest extends Record<TKey, infer TAssert>
      ? InferAssert<TAssert>
      : never
    : never;

type InferEndpointResponse<TOptions> =
  TOptions extends { response: infer TAssert } ? InferAssert<TAssert> : never;

/**
 * Options accepted by `endpoint()` when an explicit endpoint contract is used.
 */
export type EndpointOptions<TContract extends EndpointContract> = {
  /** HTTP method used for this endpoint. */
  method: HttpMethod;
  /** URL path pattern, with route params written as `:paramName`. */
  path: string;
  /** Optional request assertions for params, query, and body. */
  request?: {
    /** Assertion for route params. */
    params?: Assert<MaybeField<TContract, "params">>;
    /** Assertion for query values. */
    query?: Assert<MaybeField<TContract, "query">>;
    /** Assertion for the JSON request body. */
    body?: Assert<MaybeField<TContract, "body">>;
  };
  /** Required assertion for the endpoint response. */
  response: Assert<TContract["response"]>;
};

/**
 * Defines a single HTTP endpoint.
 *
 * Request and response types are inferred from assertions by default. Provide
 * an explicit generic when you want TypeScript to verify that assertions satisfy
 * a known contract shape.
 *
 * @example
 * ```ts
 * endpoint<{
 *   body: CreateLeadBody;
 *   response: Lead;
 * }>({
 *   method: "POST",
 *   path: "/leads",
 *   request: { body: assert(assertCreateLeadBody) },
 *   response: assert(assertLead)
 * });
 * ```
 */
export function endpoint<
  TContract extends EndpointContract = never,
  const TOptions extends AnyEndpointOptions = AnyEndpointOptions
>(
  options: [TContract] extends [never] ? TOptions : EndpointOptions<TContract>
): EndpointDefinition<
  [TContract] extends [never]
    ? InferRequestField<TOptions, "params">
    : MaybeField<TContract, "params">,
  [TContract] extends [never]
    ? InferRequestField<TOptions, "query">
    : MaybeField<TContract, "query">,
  [TContract] extends [never]
    ? InferRequestField<TOptions, "body">
    : MaybeField<TContract, "body">,
  [TContract] extends [never]
    ? InferEndpointResponse<TOptions>
    : TContract["response"]
> {
  const endpointOptions = options as AnyEndpointOptions;

  return {
    kind: "handshook.endpoint",
    method: endpointOptions.method,
    path: endpointOptions.path,
    request: endpointOptions.request ?? {},
    response: endpointOptions.response
  } as AnyEndpointDefinition as EndpointDefinition<
    [TContract] extends [never]
      ? InferRequestField<TOptions, "params">
      : MaybeField<TContract, "params">,
    [TContract] extends [never]
      ? InferRequestField<TOptions, "query">
      : MaybeField<TContract, "query">,
    [TContract] extends [never]
      ? InferRequestField<TOptions, "body">
      : MaybeField<TContract, "body">,
    [TContract] extends [never]
      ? InferEndpointResponse<TOptions>
      : TContract["response"]
  >;
}
