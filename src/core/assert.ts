import type { Assert } from "./types";

/**
 * Normalizes an assertion function for use in a Handshook contract.
 *
 * Use this around project-specific validators so `endpoint()` can infer their
 * return types and adapters can call the same runtime assertion.
 */
export function assert<T>(assertion: Assert<T>): Assert<T> {
  return assertion;
}
