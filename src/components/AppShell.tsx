"use client";

import { useState, useCallback } from "react";
import JDInput from "./JDInput";
import BulletToggle from "./BulletToggle";
import SkillsEditor from "./SkillsEditor";
import ResumePreview from "./ResumePreview";
import { getDefaultSkills } from "../lib/resume-constants";
import type {
  Bullet,
  SkillCategory,
  SkillBankCategory,
  Profile,
  AnalyzeResponse,
} from "../types";

interface AppShellProps {
  allBullets: Bullet[];
  skillsBank: SkillBankCategory[];
  profile: Profile;
}

export default function AppShell({
  allBullets,
  skillsBank,
  profile,
}: AppShellProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [curatedSkills, setCuratedSkills] = useState<SkillCategory[]>([]);
  const [reasoning, setReasoning] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const selectedBullets = allBullets.filter((b) => selectedIds.includes(b.id));

  const handleAnalyze = async (jd: string) => {
    setIsAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }
      const data: AnalyzeResponse = await res.json();
      setSelectedIds(data.selectedBulletIds);
      setCuratedSkills(data.curatedSkills);
      setReasoning(data.reasoning);
      setHasAnalyzed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualMode = () => {
    setSelectedIds([]);
    setCuratedSkills(getDefaultSkills(skillsBank));
    setReasoning("");
    setHasAnalyzed(true);
  };

  const handleToggleBullet = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError("");
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedBulletIds: selectedIds,
          curatedSkills,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOverflow = useCallback((isOver: boolean) => {
    setIsOverflowing(isOver);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">
          RACE{" "}
          <span className="font-normal text-gray-500 text-sm">
            Resume-as-Code Engine
          </span>
        </h1>
        {!hasAnalyzed && !isAnalyzing && (
          <button
            onClick={handleManualMode}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Build Manually
          </button>
        )}
      </header>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!hasAnalyzed ? (
        <div className="max-w-2xl mx-auto p-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Step 1: Paste Job Description</h2>
            <JDInput onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
          </div>

          {isAnalyzing && (
            <div className="mt-6 text-center text-gray-500 text-sm">
              <div className="animate-pulse">
                AI is analyzing the job description and curating your resume...
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-6 p-6 h-[calc(100vh-65px)]">
          {/* Left panel — controls */}
          <div className="w-[40%] overflow-y-auto space-y-6">
            {/* Reasoning */}
            {reasoning && (
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 w-full"
                >
                  <span className={`transition-transform ${showReasoning ? "rotate-90" : ""}`}>
                    &#9654;
                  </span>
                  AI Reasoning
                </button>
                {showReasoning && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {reasoning}
                  </p>
                )}
              </div>
            )}

            {/* Bullets */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-semibold mb-3 text-gray-700">
                Experience Bullets
              </h2>
              <BulletToggle
                allBullets={allBullets}
                selectedIds={selectedIds}
                onToggle={handleToggleBullet}
              />
            </div>

            {/* Skills */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-semibold mb-3 text-gray-700">
                Skills
              </h2>
              <SkillsEditor
                skillsBank={skillsBank}
                curatedSkills={curatedSkills}
                onChange={setCuratedSkills}
              />
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
              <button
                onClick={handleExport}
                disabled={isOverflowing || isExporting || selectedIds.length === 0}
                className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExporting ? "Generating PDF..." : "Download PDF"}
              </button>
              {isOverflowing && (
                <p className="text-red-600 text-xs font-medium">
                  Content overflows the page. Remove some bullets or skills to
                  fit on one page.
                </p>
              )}
              <button
                onClick={() => {
                  setHasAnalyzed(false);
                  setSelectedIds([]);
                  setCuratedSkills([]);
                  setReasoning("");
                }}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Start Over
              </button>
            </div>
          </div>

          {/* Right panel — preview */}
          <div className="w-[60%] overflow-auto flex justify-center">
            <div
              className={`transform origin-top scale-[0.7] ${isOverflowing ? "ring-4 ring-red-500 rounded" : ""}`}
            >
              <ResumePreview
                selectedBullets={selectedBullets}
                curatedSkills={curatedSkills}
                profile={profile}
                onOverflow={handleOverflow}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
