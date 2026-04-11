"use client";

import { useState, useEffect } from "react";
import { loadSavedResumes, deleteResume } from "../lib/storage";
import type { SavedResume } from "../types";

interface SavedResumesProps {
  onLoad: (entry: SavedResume) => void;
  onDuplicate: (entry: SavedResume) => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function SavedResumes({ onLoad, onDuplicate }: SavedResumesProps) {
  const [entries, setEntries] = useState<SavedResume[]>([]);

  useEffect(() => {
    setEntries(loadSavedResumes());
  }, []);

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this saved resume?")) return;
    deleteResume(id);
    setEntries(loadSavedResumes());
  };

  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4">Saved Resumes</h2>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">
                  {entry.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {timeAgo(entry.savedAt)} &middot;{" "}
                  {entry.selectedBulletIds.length} bullets
                  {entry.keywords.length > 0 && (
                    <> &middot; {entry.keywords.length} keywords</>
                  )}
                </div>
                {entry.jdSnippet && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {entry.jdSnippet}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onLoad(entry)}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Load
              </button>
              <button
                onClick={() => onDuplicate(entry)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Duplicate &amp; Edit
              </button>
              <button
                onClick={() => handleDelete(entry.id)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
