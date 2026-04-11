"use client";

import { useState, useMemo } from "react";
import type { Bullet, SkillCategory } from "../types";

interface KeywordGapProps {
  keywords: string[];
  selectedBullets: Bullet[];
  curatedSkills: SkillCategory[];
}

export default function KeywordGap({
  keywords,
  selectedBullets,
  curatedSkills,
}: KeywordGapProps) {
  const [expanded, setExpanded] = useState(false);

  const { matched, missing, score } = useMemo(() => {
    const content = [
      ...selectedBullets.map((b) => b.text),
      ...selectedBullets.map((b) => b.label),
      ...curatedSkills.flatMap((c) => c.items),
    ]
      .join(" ")
      .toLowerCase();

    const matched: string[] = [];
    const missing: string[] = [];

    for (const kw of keywords) {
      if (content.includes(kw.toLowerCase())) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    }

    const score =
      keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : 0;

    return { matched, missing, score };
  }, [keywords, selectedBullets, curatedSkills]);

  if (keywords.length === 0) return null;

  const scoreColor =
    score >= 75
      ? "text-green-600"
      : score >= 50
        ? "text-amber-600"
        : "text-red-600";

  const scoreBg =
    score >= 75
      ? "bg-green-50 border-green-200"
      : score >= 50
        ? "bg-amber-50 border-amber-200"
        : "bg-red-50 border-red-200";

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700"
        >
          <span
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          >
            &#9654;
          </span>
          ATS Keyword Match
        </button>
        <div
          className={`px-3 py-1 rounded-full border text-sm font-bold ${scoreBg} ${scoreColor}`}
        >
          {score}%
        </div>
      </div>

      <div className="mt-2 flex gap-3 text-xs text-gray-500">
        <span>
          <span className="font-medium text-green-600">{matched.length}</span>{" "}
          matched
        </span>
        <span>
          <span className="font-medium text-red-600">{missing.length}</span>{" "}
          missing
        </span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          {matched.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1.5">
                Found in resume
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matched.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          {missing.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1.5">
                Missing from resume
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 border border-red-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
