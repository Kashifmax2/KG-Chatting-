/**
 * Mock data in `src/data` are shared, module-level singletons read all over the
 * app. They are meant to be immutable seeds — any mutation must go through a
 * store that clones first. In development we deep-freeze them so an accidental
 * in-place write throws loudly instead of silently corrupting shared state.
 * In production this is a no-op (no traversal cost).
 *
 * Call once at the bottom of a data module:
 *   freezeSeeds(users, friends, notifications);
 */
export function freezeSeeds(...values: unknown[]): void {
  if (!import.meta.env.DEV) return;
  for (const value of values) deepFreeze(value);
}

function deepFreeze(value: unknown): void {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
}
