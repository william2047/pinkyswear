import type { EndpointDefinition } from "./types";

/**
 * Extracts the validated route params type from an endpoint definition.
 */
export type InferParams<TEndpoint> =
  TEndpoint extends EndpointDefinition<infer TParams, any, any, any>
    ? TParams
    : never;

/**
 * Extracts the validated query type from an endpoint definition.
 */
export type InferQuery<TEndpoint> =
  TEndpoint extends EndpointDefinition<any, infer TQuery, any, any>
    ? TQuery
    : never;

/**
 * Extracts the validated request body type from an endpoint definition.
 */
export type InferBody<TEndpoint> =
  TEndpoint extends EndpointDefinition<any, any, infer TBody, any>
    ? TBody
    : never;

/**
 * Extracts the validated response type from an endpoint definition.
 */
export type InferResponse<TEndpoint> =
  TEndpoint extends EndpointDefinition<any, any, any, infer TResponse>
    ? TResponse
    : never;
