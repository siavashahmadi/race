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
} from "../types";
import type { DemoScenario } from "../data/demos";

interface AppShellProps {
  allBullets: Bullet[];
  skillsBank: SkillBankCategory[];
  profile: Profile;
  demoMode?: boolean;
  demoScenarios?: DemoScenario[];
}

export default function AppShell({
  allBullets,
  skillsBank,
  profile,
  demoMode = false,
  demoScenarios,
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
  const [bulletTextOverrides, setBulletTextOverrides] = useState<Record<string, string>>({});
  const [bulletLabelOverrides, setBulletLabelOverrides] = useState<Record<string, string>>({});
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [previewZoom, setPreviewZoom] = useState(0.7);

  const selectedBullets = allBullets
    .filter((b) => selectedIds.includes(b.id))
    .map((b) => {
      let result = b;
      if (b.id in bulletTextOverrides) result = { ...result, text: bulletTextOverrides[b.id] };
      if (b.id in bulletLabelOverrides) result = { ...result, label: bulletLabelOverrides[b.id] };
      return result;
    });

  const handleBulletTextEdit = useCallback((id: string, newText: string) => {
    setBulletTextOverrides((prev) => ({ ...prev, [id]: newText }));
  }, []);

  const handleBulletLabelEdit = useCallback((id: string, newLabel: string) => {
    setBulletLabelOverrides((prev) => ({ ...prev, [id]: newLabel }));
  }, []);

  const handleSkillEdit = useCallback((category: string, newItems: string) => {
    const items = newItems.split(",").map((s) => s.trim()).filter(Boolean);
    setCuratedSkills((prev) =>
      prev.map((c) => (c.category === category ? { ...c, items } : c))
    );
  }, []);

  const handleBulletReset = useCallback((id: string) => {
    setBulletTextOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setBulletLabelOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleAnalyze = async (jd: string, mode: "curate" | "optimize" = "curate") => {
    setIsAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd, mode }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }
      const data = await res.json();
      setSelectedIds(data.selectedBulletIds);
      setCuratedSkills(data.curatedSkills);
      setReasoning(data.reasoning);
      setBulletTextOverrides(data.bulletTextOverrides || {});
      setBulletLabelOverrides(data.bulletLabelOverrides || {});
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

  const handleDemoSelect = (scenario: DemoScenario) => {
    setSelectedIds(scenario.result.selectedBulletIds);
    setCuratedSkills(scenario.result.curatedSkills);
    setReasoning(scenario.result.reasoning);
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
          bulletTextOverrides,
          bulletLabelOverrides,
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
          {demoMode && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              Demo
            </span>
          )}
        </h1>
      </header>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!hasAnalyzed ? (
        <div className="max-w-2xl mx-auto p-6 mt-8">
          {demoMode && demoScenarios ? (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-2">
                Try a Sample Job Description
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                See how RACE curates a resume for different roles. Pick a
                scenario below — the AI curation is pre-computed, but the
                toggle controls, live preview, and PDF export all work for
                real.
              </p>
              <div className="space-y-3">
                {demoScenarios.map((scenario) => (
                  <button
                    key={scenario.title}
                    onClick={() => handleDemoSelect(scenario)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                      {scenario.title}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {scenario.jobDescription}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">
                Step 1: Paste Job Description
              </h2>
              <JDInput onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
              {!isAnalyzing && (
                <button
                  onClick={handleManualMode}
                  className="mt-3 w-full py-2 px-4 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Build Manually
                </button>
              )}
            </div>
          )}

          {isAnalyzing && (
            <div className="mt-6 text-center text-gray-500 text-sm">
              <div className="animate-pulse">
                AI is analyzing the job description and curating your resume...
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Mobile tab bar */}
          <div className="lg:hidden flex border-b bg-white">
            <button
              onClick={() => setMobileTab("edit")}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                mobileTab === "edit"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMobileTab("preview")}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                mobileTab === "preview"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              Preview
            </button>
          </div>

          {/* Desktop layout — unchanged */}
          <div className="hidden lg:flex gap-6 p-6 h-[calc(100vh-65px)]">
            {/* Left panel — controls */}
            <div className="w-[40%] overflow-y-auto space-y-6">
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

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h2 className="text-sm font-semibold mb-3 text-gray-700">
                  Experience Bullets
                </h2>
                <BulletToggle
                  allBullets={allBullets}
                  selectedIds={selectedIds}
                  onToggle={handleToggleBullet}
                  bulletTextOverrides={bulletTextOverrides}
                  bulletLabelOverrides={bulletLabelOverrides}
                />
              </div>

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

              <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
                <button
                  onClick={handleExport}
                  disabled={isExporting || selectedIds.length === 0}
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
                    setBulletTextOverrides({});
                    setBulletLabelOverrides({});
                  }}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Start Over
                </button>
              </div>
            </div>

            {/* Right panel — preview */}
            <div className="w-[60%] overflow-auto flex flex-col items-center p-2">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setPreviewZoom((z) => Math.max(0.3, z - 0.1))}
                  className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-mono"
                >
                  -
                </button>
                <span className="text-xs text-gray-500 w-12 text-center">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button
                  onClick={() => setPreviewZoom((z) => Math.min(1.5, z + 0.1))}
                  className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-mono"
                >
                  +
                </button>
              </div>
              <div
                style={{
                  width: `calc(8.5in * ${previewZoom})`,
                  height: `calc(11in * ${previewZoom})`,
                  overflow: "hidden",
                }}
                className={isOverflowing ? "ring-4 ring-red-500 rounded" : ""}
              >
                <div style={{ transform: `scale(${previewZoom})`, transformOrigin: "top left" }}>
                  <ResumePreview
                    selectedBullets={selectedBullets}
                    curatedSkills={curatedSkills}
                    profile={profile}
                    onOverflow={handleOverflow}
                    bulletTextOverrides={bulletTextOverrides}
                    bulletLabelOverrides={bulletLabelOverrides}
                    onBulletEdit={handleBulletTextEdit}
                    onBulletLabelEdit={handleBulletLabelEdit}
                    onBulletReset={handleBulletReset}
                    onSkillEdit={handleSkillEdit}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Edit tab */}
          {mobileTab === "edit" && (
            <div className="lg:hidden overflow-y-auto p-4 space-y-4 pb-32">
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

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h2 className="text-sm font-semibold mb-3 text-gray-700">
                  Experience Bullets
                </h2>
                <BulletToggle
                  allBullets={allBullets}
                  selectedIds={selectedIds}
                  onToggle={handleToggleBullet}
                  bulletTextOverrides={bulletTextOverrides}
                  bulletLabelOverrides={bulletLabelOverrides}
                />
              </div>

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
            </div>
          )}

          {/* Mobile Preview tab */}
          {mobileTab === "preview" && (
            <div className="lg:hidden overflow-auto p-4 pb-32 flex justify-center">
              <div
                style={{
                  width: "calc(8.5in * 0.45)",
                  height: "calc(11in * 0.45)",
                  overflow: "hidden",
                }}
                className={isOverflowing ? "ring-4 ring-red-500 rounded" : ""}
              >
                <div style={{ transform: "scale(0.45)", transformOrigin: "top left" }}>
                  <ResumePreview
                    selectedBullets={selectedBullets}
                    curatedSkills={curatedSkills}
                    profile={profile}
                    onOverflow={handleOverflow}
                    bulletTextOverrides={bulletTextOverrides}
                    bulletLabelOverrides={bulletLabelOverrides}
                    onBulletEdit={handleBulletTextEdit}
                    onBulletLabelEdit={handleBulletLabelEdit}
                    onBulletReset={handleBulletReset}
                    onSkillEdit={handleSkillEdit}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mobile sticky bottom bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-2">
            {isOverflowing && (
              <p className="text-red-600 text-xs font-medium text-center">
                Content overflows one page.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={isExporting || selectedIds.length === 0}
                className="flex-1 py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isExporting ? "Generating..." : "Download PDF"}
              </button>
              <button
                onClick={() => {
                  setHasAnalyzed(false);
                  setSelectedIds([]);
                  setCuratedSkills([]);
                  setReasoning("");
                  setBulletTextOverrides({});
                  setBulletLabelOverrides({});
                }}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Start Over
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
