/**
 * Retry-with-backoff helper for transient failures.
 *
 * Only retries errors our error system marks as retryable (network, offline,
 * timeout, unavailable, rate-limited). Everything else fails fast so real bugs
 * and permission errors surface immediately instead of being retried blindly.
 */

import { toAppError } from "./errors";

export interface RetryOptions {
  /** Maximum attempts including the first. Default 3. */
  attempts?: number;
  /** Base delay in ms before the first retry. Default 300. */
  baseDelayMs?: number;
  /** Upper bound on any single backoff delay. Default 5000. */
  maxDelayMs?: number;
  /** Abort signal to cancel between attempts. */
  signal?: AbortSignal;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(toAppError({ code: "cancelled" }));
      return;
    }
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(toAppError({ code: "cancelled" }));
      },
      { once: true }
    );
  });
}

/**
 * Runs `fn`, retrying on retryable errors with exponential backoff.
 * Re-throws the last `AppError` if all attempts fail.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { attempts = 3, baseDelayMs = 300, maxDelayMs = 5000, signal } = options;

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const appError = toAppError(error);
      const isLast = attempt === attempts;
      if (isLast || !appError.retryable) throw appError;

      // Exponential backoff: base * 2^(attempt-1), capped.
      const backoff = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await delay(backoff, signal);
    }
  }
  // Unreachable, but keeps the type checker happy.
  throw toAppError(lastError);
}
