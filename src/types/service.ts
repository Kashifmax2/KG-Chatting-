/**
 * Shared types for the service layer.
 *
 * Services return a discriminated `Result<T>` so callers (stores) handle
 * success and failure explicitly instead of relying on thrown exceptions
 * crossing layer boundaries. `ServiceError` carries a stable code plus a
 * user-facing message.
 */

export type ServiceErrorCode =
  | "unauthenticated"
  | "permission-denied"
  | "not-found"
  | "already-exists"
  | "invalid-argument"
  | "network"
  | "offline"
  | "timeout"
  | "rate-limited"
  | "unavailable"
  | "not-implemented"
  | "unknown";

export interface ServiceError {
  /** Stable machine-readable code for branching and telemetry. */
  code: ServiceErrorCode;
  /** Message safe to show an end user. */
  message: string;
  /** Whether retrying the operation might succeed. */
  retryable: boolean;
  /** Original error, kept for developer logs only. */
  cause?: unknown;
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };

/** A cleanup function returned by realtime subscription methods. */
export type Unsubscribe = () => void;
