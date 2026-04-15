"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { COMPANY_ORDER, COMPANY_META } from "../lib/resume-constants";
import type { Bullet, Project, SkillCategory, Profile, CompanyMetaOverride, ProjectOverride } from "../types";

interface ResumePreviewProps {
  selectedBullets: Bullet[];
  curatedSkills: SkillCategory[];
  profile: Profile;
  onOverflow?: (isOverflowing: boolean) => void;
  bulletTextOverrides?: Record<string, string>;
  bulletLabelOverrides?: Record<string, string>;
  onBulletEdit?: (id: string, newText: string) => void;
  onBulletLabelEdit?: (id: string, newLabel: string) => void;
  onBulletReset?: (id: string) => void;
  onSkillEdit?: (category: string, newItems: string) => void;
  sectionOrder?: string[];
  onBulletRewrite?: (id: string) => void;
  rewritingBulletId?: string | null;
  onSkillReorder?: (from: number, to: number) => void;
  onBulletReorder?: (id: string, direction: "up" | "down") => void;
  selectedProjects?: Project[];
  projectOverrides?: Record<string, ProjectOverride>;
  onProjectEdit?: (id: string, field: keyof ProjectOverride, value: string) => void;
  onProjectReset?: (id: string) => void;
  companyMetaOverrides?: Record<string, CompanyMetaOverride>;
  onCompanyMetaEdit?: (company: string, field: keyof CompanyMetaOverride, value: string) => void;
  pageMargin?: number;
  sectionSpacing?: number;
  bodyFontSize?: number;
  lineHeight?: number;
  hideLinkedIn?: boolean;
  onToggleLinkedIn?: () => void;
}

export default function ResumePreview({
  selectedBullets,
  curatedSkills,
  profile,
  onOverflow,
  bulletTextOverrides,
  bulletLabelOverrides,
  onBulletEdit,
  onBulletLabelEdit,
  onBulletReset,
  onSkillEdit,
  sectionOrder,
  onBulletRewrite,
  rewritingBulletId,
  onSkillReorder,
  onBulletReorder,
  selectedProjects,
  projectOverrides,
  onProjectEdit,
  onProjectReset,
  companyMetaOverrides,
  onCompanyMetaEdit,
  pageMargin,
  sectionSpacing,
  bodyFontSize,
  lineHeight,
  hideLinkedIn,
  onToggleLinkedIn,
}: ResumePreviewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current && onOverflow) {
      // 20px tolerance accounts for minor rendering differences between
      // the browser preview and Puppeteer's PDF output
      const isOver = ref.current.scrollHeight > ref.current.clientHeight + 20;
      onOverflow(isOver);
    }
  }, [selectedBullets, curatedSkills, onOverflow]);

  const bulletsByCompany = COMPANY_ORDER.reduce(
    (acc, company) => {
      acc[company] = selectedBullets.filter((b) => b.company === company);
      return acc;
    },
    {} as Record<string, Bullet[]>
  );

  const order = sectionOrder ?? ["Skills", "Experience", "Education"];

  const sp = sectionSpacing ?? 1;

  const skillsSection = curatedSkills.length > 0 ? (
    <section key="Skills" style={{ marginBottom: `${sp * 1.5}rem` }}>
      <h2 className="text-lg font-bold uppercase tracking-wide">Skills</h2>
      <div
        style={{
          borderTop: "1px solid #000",
          marginTop: "2px",
          marginBottom: "8px",
        }}
      />
      <div className="space-y-1" style={{ fontSize: `${bodyFontSize ?? 10}pt` }}>
        {curatedSkills.map((cat, i) => (
          <div key={cat.category} className="relative group">
            {onSkillReorder && (
              <div
                className="absolute flex flex-col opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: "-20px", top: 0 }}
              >
                <button
                  onClick={() => onSkillReorder(i, i - 1)}
                  disabled={i === 0}
                  className="w-4 h-3.5 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-0"
                  style={{ fontSize: "9px" }}
                >↑</button>
                <button
                  onClick={() => onSkillReorder(i, i + 1)}
                  disabled={i === curatedSkills.length - 1}
                  className="w-4 h-3.5 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-0"
                  style={{ fontSize: "9px" }}
                >↓</button>
              </div>
            )}
            <p>
              <strong>{cat.category}:</strong>{" "}
              {onSkillEdit ? (
                <EditableText
                  text={cat.items.join(", ")}
                  onCommit={(newText) => onSkillEdit(cat.category, newText)}
                />
              ) : (
                cat.items.join(", ")
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const experienceSection = (
    <section key="Experience" style={{ marginBottom: `${sp * 1.5}rem` }}>
      <h2 className="text-lg font-bold uppercase tracking-wide">
        Professional Experience
      </h2>
      <div
        style={{
          borderTop: "1px solid #000",
          marginTop: "2px",
          marginBottom: "8px",
        }}
      />
      {COMPANY_ORDER.map((company) => {
        const bullets = bulletsByCompany[company];
        if (!bullets || bullets.length === 0) return null;
        const meta = COMPANY_META[company];
        const compOv = companyMetaOverrides?.[company];
        return (
          <div key={company} style={{ marginBottom: `${sp}rem` }}>
            <div className="flex justify-between items-baseline">
              <h3 className="font-bold text-md">
                {onCompanyMetaEdit ? (
                  <EditableText
                    text={compOv?.name ?? company}
                    onCommit={(v) => onCompanyMetaEdit(company, "name", v)}
                  />
                ) : (compOv?.name ?? company)}{" "}—{" "}
                <span className="italic font-normal">
                  {onCompanyMetaEdit ? (
                    <EditableText
                      text={compOv?.role ?? meta.role}
                      onCommit={(v) => onCompanyMetaEdit(company, "role", v)}
                    />
                  ) : (compOv?.role ?? meta.role)}
                </span>
              </h3>
              <span className="text-sm font-semibold">
                {onCompanyMetaEdit ? (
                  <EditableText
                    text={compOv?.dates ?? meta.dates}
                    onCommit={(v) => onCompanyMetaEdit(company, "dates", v)}
                  />
                ) : (compOv?.dates ?? meta.dates)}
              </span>
            </div>
            {(() => {
              const locValue = compOv?.location;
              const isDeleted = locValue === "";
              const displayLoc = locValue !== undefined ? locValue : meta.location;
              if (isDeleted) {
                return onCompanyMetaEdit ? (
                  <p className="mb-1">
                    <button
                      onClick={() => onCompanyMetaEdit(company, "location", meta.location)}
                      className="text-[10px] text-gray-300 hover:text-gray-500 italic transition-colors"
                    >+ location</button>
                  </p>
                ) : null;
              }
              return (
                <p className="text-xs text-gray-600 mb-1 italic">
                  {onCompanyMetaEdit ? (
                    <>
                      <EditableText
                        text={displayLoc}
                        onCommit={(v) => onCompanyMetaEdit(company, "location", v)}
                      />
                      <button
                        onClick={() => onCompanyMetaEdit(company, "location", "")}
                        className="ml-1 text-gray-300 hover:text-red-400 transition-colors align-middle"
                        title="Remove location"
                        style={{ fontSize: "10px", lineHeight: 1 }}
                      >×</button>
                    </>
                  ) : displayLoc}
                </p>
              );
            })()}
            <ul
              className="ml-6 list-disc space-y-1"
              style={{ fontSize: `${bodyFontSize ?? 10}pt` }}
            >
              {bullets.map((bullet, idx) => {
                const isTextOverridden = !!(bulletTextOverrides && bullet.id in bulletTextOverrides);
                const isLabelOverridden = !!(bulletLabelOverrides && bullet.id in bulletLabelOverrides);
                const isOverridden = isTextOverridden || isLabelOverridden;
                const isEditable = !!onBulletEdit;
                const isRewriting = rewritingBulletId === bullet.id;
                return (
                  <li
                    key={bullet.id}
                    className="relative group"
                    style={isOverridden ? { backgroundColor: "rgba(253, 224, 71, 0.15)" } : undefined}
                  >
                    {onBulletRewrite && (
                      <button
                        onClick={() => !rewritingBulletId && onBulletRewrite(bullet.id)}
                        disabled={!!rewritingBulletId}
                        className="absolute -left-8 top-0 w-5 h-5 flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 disabled:cursor-wait"
                        title="Rewrite with AI"
                        style={{ fontSize: "11px" }}
                      >
                        {isRewriting ? "…" : "✦"}
                      </button>
                    )}
                    {isOverridden && onBulletReset && (
                      <button
                        onClick={() => onBulletReset(bullet.id)}
                        className="absolute top-0 w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Reset to original"
                        style={{ fontSize: "12px", left: onBulletRewrite ? "-52px" : "-32px" }}
                      >
                        ↺
                      </button>
                    )}
                    {onBulletReorder && (
                      <div
                        className="absolute top-0 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ right: "-28px" }}
                      >
                        <button
                          onClick={() => onBulletReorder(bullet.id, "up")}
                          disabled={idx === 0}
                          className="w-4 h-3.5 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-0"
                          style={{ fontSize: "9px" }}
                        >↑</button>
                        <button
                          onClick={() => onBulletReorder(bullet.id, "down")}
                          disabled={idx === bullets.length - 1}
                          className="w-4 h-3.5 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-0"
                          style={{ fontSize: "9px" }}
                        >↓</button>
                      </div>
                    )}
                    <strong style={isRewriting ? { opacity: 0.4 } : undefined}>
                      {isEditable && onBulletLabelEdit ? (
                        <EditableText
                          key={bullet.id + "-label-" + (isLabelOverridden ? "edited" : "original")}
                          text={bullet.label}
                          onCommit={(newLabel) => onBulletLabelEdit(bullet.id, newLabel)}
                        />
                      ) : (
                        bullet.label
                      )}
                      :
                    </strong>{" "}
                    <span style={isRewriting ? { opacity: 0.4 } : undefined}>
                      {isEditable ? (
                        <EditableText
                          key={bullet.id + "-text-" + (isTextOverridden ? "edited" : "original")}
                          text={bullet.text}
                          onCommit={(newText) => onBulletEdit(bullet.id, newText)}
                        />
                      ) : (
                        bullet.text
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );

  const projectsSection =
    selectedProjects && selectedProjects.length > 0 ? (
      <section key="Projects" style={{ marginBottom: `${sp * 1.5}rem` }}>
        <h2 className="text-lg font-bold uppercase tracking-wide">Projects</h2>
        <div
          style={{
            borderTop: "1px solid #000",
            marginTop: "2px",
            marginBottom: "8px",
          }}
        />
        <div className="space-y-2" style={{ fontSize: `${bodyFontSize ?? 10}pt` }}>
          {selectedProjects.map((project) => {
            const projOv = projectOverrides?.[project.id];
            const isOverridden = !!projOv && !!onProjectEdit;
            return (
              <div
                key={project.id}
                className="relative group"
                style={
                  isOverridden
                    ? { backgroundColor: "rgba(253, 224, 71, 0.15)" }
                    : undefined
                }
              >
                {isOverridden && onProjectReset && (
                  <button
                    onClick={() => onProjectReset(project.id)}
                    className="absolute -left-8 top-0 w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Reset to original"
                    style={{ fontSize: "12px" }}
                  >
                    ↺
                  </button>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">
                    {onProjectEdit ? (
                      <EditableText
                        text={projOv?.name ?? project.name}
                        onCommit={(v) => onProjectEdit(project.id, "name", v)}
                      />
                    ) : (projOv?.name ?? project.name)}
                  </span>
                  {project.url && (
                    <a
                      href={project.url}
                      className="text-blue-600 text-xs underline"
                    >
                      {project.url}
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-0.5">
                  {onProjectEdit ? (
                    <EditableText
                      text={projOv?.technologies ?? project.technologies.join(", ")}
                      onCommit={(v) => onProjectEdit(project.id, "technologies", v)}
                    />
                  ) : (projOv?.technologies ?? project.technologies.join(", "))}
                </p>
                <ul className="ml-6 list-disc">
                  <li>
                    {onProjectEdit ? (
                      <EditableText
                        text={projOv?.description ?? project.description}
                        onCommit={(v) => onProjectEdit(project.id, "description", v)}
                      />
                    ) : (projOv?.description ?? project.description)}
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    ) : null;

  const educationSection = (
    <section key="Education">
      <h2 className="text-lg font-bold uppercase tracking-wide">
        Education
      </h2>
      <div
        style={{
          borderTop: "1px solid #000",
          marginTop: "2px",
          marginBottom: "8px",
        }}
      />
      <div className="flex justify-between items-baseline">
        <p style={{ fontSize: `${bodyFontSize ?? 10}pt` }}>
          <strong>{profile.education.school}</strong>,{" "}
          {profile.education.degree}
        </p>
        <span className="text-sm font-semibold">
          {profile.education.graduationDate}
        </span>
      </div>
    </section>
  );

  return (
    <div
      ref={ref}
      className="resume-page bg-white"
      style={{
        width: "8.5in",
        height: "11in",
        overflow: "hidden",
        padding: `${pageMargin ?? 0.5}in`,
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
        lineHeight: lineHeight ?? 1.2,
      }}
    >
      {/* Header — always fixed at top */}
      <div className={`flex justify-between ${hideLinkedIn ? "items-center" : "items-end"} mb-4`}>
        <h1
          className="text-4xl tracking-tight"
          style={{ fontFamily: "'Libre Baskerville', serif" }}
        >
          {profile.name}
        </h1>
        <div className="text-right text-sm">
          <p>
            {profile.phone} | {profile.email}
          </p>
          {!hideLinkedIn ? (
            <p>
              <a href={profile.linkedin} className="text-blue-600 underline">{profile.linkedin}</a>
              {onToggleLinkedIn && (
                <button
                  onClick={onToggleLinkedIn}
                  className="ml-1 text-gray-300 hover:text-red-400 transition-colors align-middle"
                  title="Remove LinkedIn"
                  style={{ fontSize: "10px", lineHeight: 1 }}
                >×</button>
              )}
            </p>
          ) : onToggleLinkedIn ? (
            <button
              onClick={onToggleLinkedIn}
              className="text-[10px] text-gray-300 hover:text-gray-500 italic transition-colors"
            >+ linkedin</button>
          ) : null}
        </div>
      </div>

      {order.map((section) => {
        if (section === "Skills") return skillsSection;
        if (section === "Experience") return experienceSection;
        if (section === "Projects") return projectsSection;
        if (section === "Education") return educationSection;
        return null;
      })}
    </div>
  );
}

function EditableText({
  text,
  onCommit,
}: {
  text: string;
  onCommit: (newText: string) => void;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [editing, setEditing] = useState(false);

  useLayoutEffect(() => {
    if (editing && spanRef.current) {
      spanRef.current.focus();
    }
  }, [editing]);

  const handleBlur = () => {
    const el = spanRef.current;
    if (!el) { setEditing(false); return; }
    const newText = el.textContent?.trim() || "";
    if (newText && newText !== text) {
      onCommit(newText);
    } else if (!newText) {
      el.textContent = text;
    }
    setEditing(false);
  };

  const handleClick = () => {
    if (!editing) setEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      const el = spanRef.current;
      if (el) {
        el.textContent = text;
        el.blur();
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      spanRef.current?.blur();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const plain = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, plain);
  };

  return (
    <span
      ref={spanRef}
      contentEditable={editing}
      suppressContentEditableWarning
      onClick={handleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      style={{
        outline: "none",
        cursor: editing ? "text" : "default",
        borderRadius: "2px",
        padding: "0 2px",
        margin: "0 -2px",
        transition: "background-color 0.15s",
        backgroundColor: editing ? "#fef9c3" : undefined,
      }}
    >
      {text}
    </span>
  );
}
