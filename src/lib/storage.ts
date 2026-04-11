import { SavedResumeStoreSchema } from "./schemas";
import type { SavedResume } from "../types";

const STORAGE_KEY = "race-saved-resumes";

function readStore(): SavedResume[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = SavedResumeStoreSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.entries : [];
  } catch {
    return [];
  }
}

function writeStore(entries: SavedResume[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, entries })
    );
  } catch {
    // localStorage quota exceeded — fail silently
  }
}

export function loadSavedResumes(): SavedResume[] {
  return readStore();
}

export function saveResume(entry: SavedResume): void {
  const entries = readStore();
  entries.unshift(entry);
  writeStore(entries);
}

export function deleteResume(id: string): void {
  const entries = readStore().filter((e) => e.id !== id);
  writeStore(entries);
}

export function duplicateResume(id: string): SavedResume | null {
  const entries = readStore();
  const original = entries.find((e) => e.id === id);
  if (!original) return null;

  const copy: SavedResume = {
    ...original,
    id: crypto.randomUUID(),
    label: original.label + " (copy)",
    savedAt: new Date().toISOString(),
  };
  entries.unshift(copy);
  writeStore(entries);
  return copy;
}
