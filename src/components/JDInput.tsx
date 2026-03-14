"use client";

import { useState } from "react";

interface JDInputProps {
  onAnalyze: (jd: string) => void;
  isLoading: boolean;
}

export default function JDInput({ onAnalyze, isLoading }: JDInputProps) {
  const [jd, setJd] = useState("");

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700">
        Paste Job Description
      </label>
      <textarea
        className="w-full h-64 p-4 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Paste the full job description here..."
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        disabled={isLoading}
      />
      <button
        onClick={() => onAnalyze(jd)}
        disabled={!jd.trim() || isLoading}
        className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Analyzing with AI...
          </span>
        ) : (
          "Analyze & Curate Resume"
        )}
      </button>
    </div>
  );
}
