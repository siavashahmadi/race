"use client";

import { COMPANY_ORDER, COMPANY_META } from "../lib/resume-constants";
import type { Bullet } from "../types";

interface BulletToggleProps {
  allBullets: Bullet[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function BulletToggle({
  allBullets,
  selectedIds,
  onToggle,
}: BulletToggleProps) {
  const selectedSet = new Set(selectedIds);

  return (
    <div className="space-y-6">
      {COMPANY_ORDER.map((company) => {
        const companyBullets = allBullets.filter((b) => b.company === company);
        const selectedCount = companyBullets.filter((b) =>
          selectedSet.has(b.id)
        ).length;
        const meta = COMPANY_META[company];

        return (
          <div key={company}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm">
                {company}{" "}
                <span className="font-normal text-gray-500">
                  — {meta.role}
                </span>
              </h3>
              <span className="text-xs font-mono text-gray-500">
                {selectedCount} selected
              </span>
            </div>
            <div className="space-y-1">
              {companyBullets.map((bullet) => {
                const isSelected = selectedSet.has(bullet.id);
                return (
                  <button
                    key={bullet.id}
                    title={bullet.text}
                    onClick={() => onToggle(bullet.id)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors border ${
                      isSelected
                        ? "border-l-4 border-l-blue-500 border-gray-200 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">{bullet.label}</span>
                    <span className="text-gray-500 ml-2 text-xs">
                      {bullet.text.slice(0, 60)}{bullet.text.length > 60 ? "..." : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
