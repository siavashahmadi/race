import { ResumeState } from "../types";

// Store on globalThis so the cache survives Turbopack module isolation
// between API routes (export route writes, print-data route reads).
const g = globalThis as unknown as {
  __printCache?: Map<string, ResumeState>;
  __printTimers?: Map<string, ReturnType<typeof setTimeout>>;
};
if (!g.__printCache) g.__printCache = new Map();
if (!g.__printTimers) g.__printTimers = new Map();

const cache = g.__printCache;
const timers = g.__printTimers;

export function setCache(id: string, state: ResumeState): void {
  const existing = timers.get(id);
  if (existing) clearTimeout(existing);
  cache.set(id, state);
  timers.set(
    id,
    setTimeout(() => {
      cache.delete(id);
      timers.delete(id);
    }, 60_000)
  );
}

export function getCache(id: string): ResumeState | undefined {
  return cache.get(id);
}
