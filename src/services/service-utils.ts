/**
 * Shared helpers for the service layer.
 *
 * Phase 03 defines architecture only — service methods declare their typed
 * contracts but have no business logic yet. `notImplemented` gives every stub a
 * single, honest failure mode so an accidental early call fails loudly instead
 * of silently returning fake data. Phase 04+ replaces these bodies with real
 * Firebase operations.
 */
import type { Result, ServiceError, ServiceErrorCode } from "@/types/service";
import type { AppErrorCode } from "@/utils/errors";
import { toAppError } from "@/utils/errors";

/** Marks a not-yet-implemented service method. */
export function notImplemented(feature: string): never {
  throw new Error(`[service] Not implemented yet: ${feature}`);
}

/** Maps the internal error taxonomy to the service-facing one. */
const CODE_MAP: Record<AppErrorCode, ServiceErrorCode> = {
  network: "network",
  offline: "offline",
  timeout: "timeout",
  "permission-denied": "permission-denied",
  unauthenticated: "unauthenticated",
  "not-found": "not-found",
  "already-exists": "already-exists",
  "invalid-input": "invalid-argument",
  "rate-limited": "rate-limited",
  unavailable: "unavailable",
  cancelled: "unknown",
  unknown: "unknown",
};

/** Wraps a thrown value into a failed `Result`. */
export function toFailure(error: unknown): { ok: false; error: ServiceError } {
  const appError = toAppError(error);
  return {
    ok: false,
    error: {
      code: CODE_MAP[appError.code],
      message: appError.userMessage,
      retryable: appError.retryable,
      cause: appError.cause,
    },
  };
}

/** Wraps a value into a successful `Result`. */
export function toSuccess<T>(data: T): { ok: true; data: T } {
  return { ok: true, data };
}

/**
 * Runs a service operation, normalising any thrown error into a failed
 * `Result`. Once methods have real bodies they can wrap them with this to get
 * consistent error shaping for free.
 */
export async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return toSuccess(await fn());
  } catch (error) {
    return toFailure(error);
  }
}
