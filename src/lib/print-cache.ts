import { ResumeState } from "../types";

const cache = new Map<string, ResumeState>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

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
