"use client";

import { useState, useCallback } from "react";
import JDInput from "./JDInput";
import BulletToggle from "./BulletToggle";
import ProjectToggle from "./ProjectToggle";
import SkillsEditor from "./SkillsEditor";
import ResumePreview from "./ResumePreview";
import KeywordGap from "./KeywordGap";
import SavedResumes from "./SavedResumes";
import { getDefaultSkills } from "../lib/resume-constants";
import { saveResume, duplicateResume } from "../lib/storage";
import type {
  Bullet,
  Project,
  SkillCategory,
  SkillBankCategory,
  Profile,
  SavedResume,
  CompanyMetaOverride,
  ProjectOverride,
} from "../types";
import type { DemoScenario } from "../data/demos";

interface AppShellProps {
  allBullets: Bullet[];
  allProjects: Project[];
  skillsBank: SkillBankCategory[];
  profile: Profile;
  demoMode?: boolean;
  demoScenarios?: DemoScenario[];
}

export default function AppShell({
  allBullets,
  allProjects,
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
  const [keywords, setKeywords] = useState<string[]>([]);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [saveLabel, setSaveLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveConfirm, setSaveConfirm] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>(["Skills", "Experience", "Projects", "Education"]);
  const [rewritingBulletId, setRewritingBulletId] = useState<string | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [companyMetaOverrides, setCompanyMetaOverrides] = useState<Record<string, CompanyMetaOverride>>({});
  const [projectOverrides, setProjectOverrides] = useState<Record<string, ProjectOverride>>({});
  const [pageMargin, setPageMargin] = useState(0.5);
  const [sectionSpacing, setSectionSpacing] = useState(1.0);
  const [bodyFontSize, setBodyFontSize] = useState(10);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [hideLinkedIn, setHideLinkedIn] = useState(false);

  const selectedBullets = selectedIds
    .map((id) => allBullets.find((b) => b.id === id))
    .filter((b): b is Bullet => !!b)
    .map((b) => {
      let result = b;
      if (b.id in bulletTextOverrides) result = { ...result, text: bulletTextOverrides[b.id] };
      if (b.id in bulletLabelOverrides) result = { ...result, label: bulletLabelOverrides[b.id] };
      return result;
    });

  const selectedProjects = allProjects
    .filter((p) => selectedProjectIds.includes(p.id))
    .map((p) => {
      const ov = projectOverrides[p.id];
      if (!ov) return p;
      return {
        ...p,
        ...(ov.name && { name: ov.name }),
        ...(ov.technologies && { technologies: ov.technologies.split(",").map((t) => t.trim()).filter(Boolean) }),
        ...(ov.description && { description: ov.description }),
      };
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

  const handleSkillReorder = useCallback((from: number, to: number) => {
    setCuratedSkills((prev) => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }, []);

  const handleCompanyMetaEdit = useCallback((company: string, field: keyof CompanyMetaOverride, value: string) => {
    setCompanyMetaOverrides((prev) => ({
      ...prev,
      [company]: { ...prev[company], [field]: value },
    }));
  }, []);

  const handleProjectEdit = useCallback((id: string, field: keyof ProjectOverride, value: string) => {
    setProjectOverrides((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }, []);

  const handleProjectReset = useCallback((id: string) => {
    setProjectOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleToggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulletRewrite = useCallback(async (id: string) => {
    const bullet = selectedBullets.find((b) => b.id === id);
    if (!bullet || !jobDescription) return;
    setRewritingBulletId(id);
    try {
      const res = await fetch("/api/rewrite-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulletId: id,
          currentText: bullet.text,
          currentLabel: bullet.label,
          jobDescription,
        }),
      });
      if (!res.ok) throw new Error("Rewrite failed");
      const data = await res.json();
      setBulletTextOverrides((prev) => ({ ...prev, [id]: data.text }));
      if (data.label) setBulletLabelOverrides((prev) => ({ ...prev, [id]: data.label }));
    } catch (err) {
      console.error("Bullet rewrite failed:", err);
    } finally {
      setRewritingBulletId(null);
    }
  }, [selectedBullets, jobDescription]);

  const handleMoveSection = useCallback((index: number, direction: "up" | "down") => {
    setSectionOrder((prev) => {
      const next = [...prev];
      const swap = direction === "up" ? index - 1 : index + 1;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
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

  const handleBulletReorder = useCallback((id: string, direction: "up" | "down") => {
    setSelectedIds((prev) => {
      const bullet = allBullets.find((b) => b.id === id);
      if (!bullet) return prev;
      const companyIds = prev.filter(
        (sid) => allBullets.find((b) => b.id === sid)?.company === bullet.company
      );
      const pos = companyIds.indexOf(id);
      if (direction === "up" && pos === 0) return prev;
      if (direction === "down" && pos === companyIds.length - 1) return prev;
      const swapPos = direction === "up" ? pos - 1 : pos + 1;
      const newCompanyIds = [...companyIds];
      [newCompanyIds[pos], newCompanyIds[swapPos]] = [newCompanyIds[swapPos], newCompanyIds[pos]];
      let ci = 0;
      return prev.map((sid) => {
        const b = allBullets.find((b) => b.id === sid);
        if (b?.company === bullet.company) return newCompanyIds[ci++];
        return sid;
      });
    });
  }, [allBullets]);

  const handleAnalyze = async (jd: string, mode: "curate" | "optimize" = "curate") => {
    setIsAnalyzing(true);
    setError("");
    setJobDescription(jd);
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
      setSelectedProjectIds(data.selectedProjectIds || []);
      setCuratedSkills(data.curatedSkills);
      setReasoning(data.reasoning);
      setBulletTextOverrides(data.bulletTextOverrides || {});
      setBulletLabelOverrides(data.bulletLabelOverrides || {});
      setCompanyMetaOverrides({});
      setProjectOverrides({});
      setPageMargin(0.5);
      setSectionSpacing(1.0);
      setBodyFontSize(10);
      setLineHeight(1.2);
      setHideLinkedIn(false);
      setKeywords(data.keywords || []);
      setHasAnalyzed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualMode = () => {
    setSelectedIds([]);
    setSelectedProjectIds([]);
    setCuratedSkills(getDefaultSkills(skillsBank));
    setReasoning("");
    setKeywords([]);
    setCompanyMetaOverrides({});
    setProjectOverrides({});
    setPageMargin(0.5);
    setSectionSpacing(1.0);
    setBodyFontSize(10);
    setLineHeight(1.2);
    setHideLinkedIn(false);
    setHasAnalyzed(true);
  };

  const handleDemoSelect = (scenario: DemoScenario) => {
    setSelectedIds(scenario.result.selectedBulletIds);
    setSelectedProjectIds([]);
    setCuratedSkills(scenario.result.curatedSkills);
    setReasoning(scenario.result.reasoning);
    setKeywords([]);
    setCompanyMetaOverrides({});
    setProjectOverrides({});
    setPageMargin(0.5);
    setSectionSpacing(1.0);
    setBodyFontSize(10);
    setLineHeight(1.2);
    setHideLinkedIn(false);
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
          selectedProjectIds,
          curatedSkills,
          bulletTextOverrides,
          bulletLabelOverrides,
          companyMetaOverrides,
          projectOverrides,
          sectionOrder,
          pageMargin,
          sectionSpacing,
          bodyFontSize,
          lineHeight,
          hideLinkedIn,
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

  const handleSaveResume = () => {
    if (!saveLabel.trim()) return;
    saveResume({
      id: crypto.randomUUID(),
      label: saveLabel.trim(),
      savedAt: new Date().toISOString(),
      jdSnippet: jobDescription.slice(0, 120),
      selectedBulletIds: selectedIds,
      selectedProjectIds,
      curatedSkills,
      bulletTextOverrides,
      bulletLabelOverrides,
      companyMetaOverrides,
      projectOverrides,
      keywords,
      sectionOrder,
      pageMargin,
      sectionSpacing,
      bodyFontSize,
      lineHeight,
      hideLinkedIn,
    });
    setSaveLabel("");
    setIsSaving(false);
    setSaveConfirm(true);
    setTimeout(() => setSaveConfirm(false), 2000);
  };

  const handleLoadResume = (entry: SavedResume) => {
    setSelectedIds(entry.selectedBulletIds);
    setSelectedProjectIds(entry.selectedProjectIds);
    setCuratedSkills(entry.curatedSkills);
    setBulletTextOverrides(entry.bulletTextOverrides);
    setBulletLabelOverrides(entry.bulletLabelOverrides);
    setCompanyMetaOverrides(entry.companyMetaOverrides);
    setProjectOverrides(entry.projectOverrides);
    setPageMargin(entry.pageMargin);
    setSectionSpacing(entry.sectionSpacing);
    setBodyFontSize(entry.bodyFontSize);
    setLineHeight(entry.lineHeight);
    setHideLinkedIn(entry.hideLinkedIn);
    setKeywords(entry.keywords);
    setSectionOrder(entry.sectionOrder);
    setJobDescription("");
    setReasoning("");
    setHasAnalyzed(true);
  };

  const handleDuplicateAndEdit = (entry: SavedResume) => {
    const copy = duplicateResume(entry.id);
    if (copy) handleLoadResume(copy);
  };

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
        {hasAnalyzed && (
          <button
            onClick={() => setHasAnalyzed(false)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Saved Resumes
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

          {!demoMode && (
            <SavedResumes
              onLoad={handleLoadResume}
              onDuplicate={handleDuplicateAndEdit}
            />
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

              {keywords.length > 0 && (
                <KeywordGap
                  keywords={keywords}
                  selectedBullets={selectedBullets}
                  curatedSkills={curatedSkills}
                />
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

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h2 className="text-sm font-semibold mb-3 text-gray-700">
                  Projects
                </h2>
                <ProjectToggle
                  allProjects={allProjects}
                  selectedIds={selectedProjectIds}
                  onToggle={handleToggleProject}
                  projectOverrides={projectOverrides}
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
                {!isSaving ? (
                  <button
                    onClick={() => setIsSaving(true)}
                    disabled={selectedIds.length === 0}
                    className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saveConfirm ? "Saved!" : "Save Resume"}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={saveLabel}
                      onChange={(e) => setSaveLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveResume()}
                      placeholder="Label, e.g. &quot;ML Engineer @ Acme&quot;"
                      autoFocus
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSaveResume}
                      disabled={!saveLabel.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setIsSaving(false); setSaveLabel(""); }}
                      className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    setHasAnalyzed(false);
                    setSelectedIds([]);
                    setSelectedProjectIds([]);
                    setCuratedSkills([]);
                    setReasoning("");
                    setBulletTextOverrides({});
                    setBulletLabelOverrides({});
                    setCompanyMetaOverrides({});
                    setProjectOverrides({});
                    setPageMargin(0.5);
                    setSectionSpacing(1.0);
                    setBodyFontSize(10);
                    setLineHeight(1.2);
                    setHideLinkedIn(false);
                    setKeywords([]);
                    setJobDescription("");
                    setSectionOrder(["Skills", "Experience", "Projects", "Education"]);
                  }}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Start Over
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h2 className="text-sm font-semibold mb-3 text-gray-700">Section Order</h2>
                <div className="space-y-1">
                  {sectionOrder.map((section, i) => (
                    <div key={section} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-800">{section}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMoveSection(i, "up")}
                          disabled={i === 0}
                          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                        >↑</button>
                        <button
                          onClick={() => handleMoveSection(i, "down")}
                          disabled={i === sectionOrder.length - 1}
                          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                        >↓</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
                <h2 className="text-sm font-semibold text-gray-700">Layout</h2>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Margins</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPageMargin((m) => Math.max(0.25, parseFloat((m - 0.05).toFixed(2))))} disabled={pageMargin <= 0.25} className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-mono disabled:opacity-40">−</button>
                    <span className="text-xs text-gray-500 w-14 text-center">{pageMargin.toFixed(2)}in</span>
                    <button onClick={() => setPageMargin((m) => Math.min(1.0, parseFloat((m + 0.05).toFixed(2))))} disabled={pageMargin >= 1.0} className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-mono disabled:opacity-40">+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Spacing</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setSectionSpacing((s) => Math.max(0.25, parseFloat((s - 0.05).toFixed(2))))} disabled={sectionSpacing <= 0.25} className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-mono disabled:opacity-40">−</button>
                    <span className="text-xs text-gray-500 w-14 text-center">{sectionSpacing.toFixed(2)}×</span>
                    <button onClick={() => setSectionSpacing((s) => Math.min(2.0, parseFloat((s + 0.05).toFixed(2))))} disabled={sectionSpacing >= 2.0} className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-mono disabled:opacity-40">+</button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
                <h2 className="text-sm font-semibold text-gray-700">Typography</h2>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Font size</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setBodyFontSize((s) => Math.max(8, parseFloat((s - 0.5).toFixed(1))))} disabled={bodyFontSize <= 8} className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-mono disabled:opacity-40">−</button>
                    <span className="text-xs text-gray-500 w-14 text-center">{bodyFontSize.toFixed(1)}pt</span>
                    <button onClick={() => setBodyFontSize((s) => Math.min(11, parseFloat((s + 0.5).toFixed(1))))} disabled={bodyFontSize >= 11} className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-mono disabled:opacity-40">+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Line height</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setLineHeight((h) => Math.max(0.9, parseFloat((h - 0.05).toFixed(2))))} disabled={lineHeight <= 0.9} className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-mono disabled:opacity-40">−</button>
                    <span className="text-xs text-gray-500 w-14 text-center">{lineHeight.toFixed(2)}</span>
                    <button onClick={() => setLineHeight((h) => Math.min(1.4, parseFloat((h + 0.05).toFixed(2))))} disabled={lineHeight >= 1.4} className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-mono disabled:opacity-40">+</button>
                  </div>
                </div>
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
                    sectionOrder={sectionOrder}
                    onBulletRewrite={jobDescription ? handleBulletRewrite : undefined}
                    rewritingBulletId={rewritingBulletId}
                    onSkillReorder={handleSkillReorder}
                    onBulletReorder={handleBulletReorder}
                    selectedProjects={selectedProjects}
                    projectOverrides={projectOverrides}
                    onProjectEdit={handleProjectEdit}
                    onProjectReset={handleProjectReset}
                    companyMetaOverrides={companyMetaOverrides}
                    onCompanyMetaEdit={handleCompanyMetaEdit}
                    pageMargin={pageMargin}
                    sectionSpacing={sectionSpacing}
                    bodyFontSize={bodyFontSize}
                    lineHeight={lineHeight}
                    hideLinkedIn={hideLinkedIn}
                    onToggleLinkedIn={() => setHideLinkedIn((h) => !h)}
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

              {keywords.length > 0 && (
                <KeywordGap
                  keywords={keywords}
                  selectedBullets={selectedBullets}
                  curatedSkills={curatedSkills}
                />
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

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h2 className="text-sm font-semibold mb-3 text-gray-700">
                  Projects
                </h2>
                <ProjectToggle
                  allProjects={allProjects}
                  selectedIds={selectedProjectIds}
                  onToggle={handleToggleProject}
                  projectOverrides={projectOverrides}
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
                    sectionOrder={sectionOrder}
                    onBulletRewrite={jobDescription ? handleBulletRewrite : undefined}
                    rewritingBulletId={rewritingBulletId}
                    onSkillReorder={handleSkillReorder}
                    onBulletReorder={handleBulletReorder}
                    selectedProjects={selectedProjects}
                    projectOverrides={projectOverrides}
                    onProjectEdit={handleProjectEdit}
                    onProjectReset={handleProjectReset}
                    companyMetaOverrides={companyMetaOverrides}
                    onCompanyMetaEdit={handleCompanyMetaEdit}
                    pageMargin={pageMargin}
                    sectionSpacing={sectionSpacing}
                    bodyFontSize={bodyFontSize}
                    lineHeight={lineHeight}
                    hideLinkedIn={hideLinkedIn}
                    onToggleLinkedIn={() => setHideLinkedIn((h) => !h)}
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
                  setSelectedProjectIds([]);
                  setCuratedSkills([]);
                  setReasoning("");
                  setBulletTextOverrides({});
                  setBulletLabelOverrides({});
                  setCompanyMetaOverrides({});
                  setProjectOverrides({});
                  setPageMargin(0.5);
                  setSectionSpacing(1.0);
                  setBodyFontSize(10);
                  setLineHeight(1.2);
                  setHideLinkedIn(false);
                  setKeywords([]);
                  setJobDescription("");
                  setSectionOrder(["Skills", "Experience", "Projects", "Education"]);
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
