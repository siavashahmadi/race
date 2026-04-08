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
}: ResumePreviewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current && onOverflow) {
      const height = ref.current.scrollHeight;
      const threshold = 1056; // 11in * 96dpi — matches the container's minHeight
      const isOver = height > threshold;
      console.log(`[ResumePreview] scrollHeight: ${height}px, threshold: ${threshold}px, overflowing: ${isOver}`);
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

  return (
    <div
      ref={ref}
      className="resume-page bg-white"
      style={{
        width: "8.5in",
        minHeight: "11in",
        padding: "0.5in",
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1.2,
      }}
    >
      {/* Header */}
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

      {/* Skills */}
      {curatedSkills.length > 0 && (
        <section className="mb-6">
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
      )}

      {/* Experience */}
      <section className="mb-6">
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
                      className="relative group"
                      style={isOverridden ? { backgroundColor: "rgba(253, 224, 71, 0.15)" } : undefined}
                    >
                      {isOverridden && onBulletReset && (
                        <button
                          onClick={() => onBulletReset(bullet.id)}
                          className="absolute -left-5 top-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 transition-opacity"
                          title="Reset to original"
                          style={{ fontSize: "10pt" }}
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

      {/* Education */}
      <section>
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
  const [focused, setFocused] = useState(false);

  const handleBlur = () => {
    setFocused(false);
    const el = spanRef.current;
    if (!el) return;
    const newText = el.textContent?.trim() || "";
    if (newText && newText !== text) {
      onCommit(newText);
    } else if (!newText) {
      el.textContent = text;
    }
  };

  const handleFocus = () => {
    setFocused(true);
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
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      style={{
        outline: "none",
        cursor: "text",
        borderRadius: "2px",
        padding: "0 2px",
        margin: "0 -2px",
        transition: "background-color 0.15s",
        backgroundColor: focused ? "#fef9c3" : undefined,
      }}
    >
      {text}
    </span>
  );
}
