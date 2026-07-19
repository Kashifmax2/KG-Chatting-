/**
 * Development-only logger.
 *
 * Logs are emitted only during development (`import.meta.env.DEV`). In
 * production builds these become no-ops so nothing leaks to the console.
 * `error` always logs — production error reporting still needs a signal.
 */
import { env } from "@/config/env";

type LogArgs = unknown[];

export const logger = {
  debug: (...args: LogArgs): void => {
    if (env.isDev) console.debug("[KG]", ...args);
  },
  info: (...args: LogArgs): void => {
    if (env.isDev) console.info("[KG]", ...args);
  },
  warn: (...args: LogArgs): void => {
    if (env.isDev) console.warn("[KG]", ...args);
  },
  error: (...args: LogArgs): void => {
    // Errors are always surfaced; a reporting sink can hook in here later.
    console.error("[KG]", ...args);
  },
} as const;
