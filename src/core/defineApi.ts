import type { ApiTree } from "./types";

/**
 * Defines a nested API contract while preserving its exact TypeScript shape.
 *
 * @example
 * ```ts
 * export const api = defineApi({
 *   leads: {
 *     create: endpoint({ ... })
 *   }
 * });
 * ```
 */
export function defineApi<const TApi extends ApiTree>(api: TApi): TApi {
  return api;
}
