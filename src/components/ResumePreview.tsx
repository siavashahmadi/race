"use client";

import { useEffect, useRef } from "react";
import { COMPANY_ORDER, COMPANY_META } from "../lib/resume-constants";
import type { Bullet, SkillCategory, Profile } from "../types";

interface ResumePreviewProps {
  selectedBullets: Bullet[];
  curatedSkills: SkillCategory[];
  profile: Profile;
  onOverflow?: (isOverflowing: boolean) => void;
}

export default function ResumePreview({
  selectedBullets,
  curatedSkills,
  profile,
  onOverflow,
}: ResumePreviewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && onOverflow) {
      const isOverflowing = ref.current.scrollHeight > 1056; // 11in * 96dpi
      onOverflow(isOverflowing);
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
          <p className="text-blue-600 underline">{profile.linkedin}</p>
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
                <strong>{cat.category}:</strong> {cat.items.join(", ")}
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
                {bullets.map((bullet) => (
                  <li key={bullet.id}>
                    <strong>{bullet.label}:</strong> {bullet.text}
                  </li>
                ))}
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
