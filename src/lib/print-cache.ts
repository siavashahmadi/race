import { ResumeState } from "../types";

const cache = new Map<string, ResumeState>();

export function setCache(id: string, state: ResumeState): void {
  cache.set(id, state);
  setTimeout(() => {
    cache.delete(id);
  }, 60_000);
}

export function getCache(id: string): ResumeState | undefined {
  return cache.get(id);
}
