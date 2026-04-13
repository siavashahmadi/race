"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { COMPANY_ORDER, COMPANY_META } from "../lib/resume-constants";
import type { Bullet, SkillCategory, Profile } from "../types";

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

  const skillsSection = curatedSkills.length > 0 ? (
    <section key="Skills" className="mb-6">
      <h2 className="text-lg font-bold uppercase tracking-wide">Skills</h2>
      <div
        style={{
          borderTop: "1px solid #000",
          marginTop: "2px",
          marginBottom: "8px",
        }}
      />
      <div className="space-y-1" style={{ fontSize: "10pt" }}>
        {curatedSkills.map((cat) => (
          <p key={cat.category}>
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
        ))}
      </div>
    </section>
  ) : null;

  const experienceSection = (
    <section key="Experience" className="mb-6">
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
        return (
          <div key={company} className="mb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-bold text-md">
                {company} —{" "}
                <span className="italic font-normal">{meta.role}</span>
              </h3>
              <span className="text-sm font-semibold">{meta.dates}</span>
            </div>
            <p className="text-xs text-gray-600 mb-1 italic">
              {meta.location}
            </p>
            <ul
              className="ml-4 list-disc space-y-1"
              style={{ fontSize: "10pt" }}
            >
              {bullets.map((bullet) => {
                const isTextOverridden = !!(bulletTextOverrides && bullet.id in bulletTextOverrides);
                const isLabelOverridden = !!(bulletLabelOverrides && bullet.id in bulletLabelOverrides);
                const isOverridden = isTextOverridden || isLabelOverridden;
                const isEditable = !!onBulletEdit;
                return (
                  <li
                    key={bullet.id}
                    className="relative"
                    style={isOverridden ? { backgroundColor: "rgba(253, 224, 71, 0.15)" } : undefined}
                  >
                    {isOverridden && onBulletReset && (
                      <button
                        onClick={() => onBulletReset(bullet.id)}
                        className="absolute -left-8 top-0 w-5 h-5 pr-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Reset to original"
                        style={{ fontSize: "12px" }}
                      >
                        ↺
                      </button>
                    )}
                    <strong>
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
                    {isEditable ? (
                      <EditableText
                        key={bullet.id + "-text-" + (isTextOverridden ? "edited" : "original")}
                        text={bullet.text}
                        onCommit={(newText) => onBulletEdit(bullet.id, newText)}
                      />
                    ) : (
                      bullet.text
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );

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
        <p style={{ fontSize: "10pt" }}>
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
        padding: "0.5in",
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1.2,
      }}
    >
      {/* Header — always fixed at top */}
      <div className="flex justify-between items-end mb-4">
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
          <a href={profile.linkedin} className="text-blue-600 underline">{profile.linkedin}</a>
        </div>
      </div>

      {order.map((section) => {
        if (section === "Skills") return skillsSection;
        if (section === "Experience") return experienceSection;
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
