"use client";

import type { SkillCategory, SkillBankCategory } from "../types";

interface SkillsEditorProps {
  skillsBank: SkillBankCategory[];
  curatedSkills: SkillCategory[];
  onChange: (skills: SkillCategory[]) => void;
}

export default function SkillsEditor({
  skillsBank,
  curatedSkills,
  onChange,
}: SkillsEditorProps) {
  const curatedMap = new Map(curatedSkills.map((c) => [c.category, c]));

  const toggleCategory = (category: string) => {
    if (curatedMap.has(category)) {
      onChange(curatedSkills.filter((c) => c.category !== category));
    } else {
      const bank = skillsBank.find((b) => b.category === category);
      if (bank) {
        onChange([
          ...curatedSkills,
          { category, items: bank.items.slice(0, bank.minDisplay) },
        ]);
      }
    }
  };

  const toggleItem = (category: string, item: string) => {
    const existing = curatedMap.get(category);
    if (!existing) return;

    const hasItem = existing.items.includes(item);
    if (!hasItem) {
      const bank = skillsBank.find((b) => b.category === category);
      if (bank && existing.items.length >= bank.maxDisplay) return;
    }
    const newItems = hasItem
      ? existing.items.filter((i) => i !== item)
      : [...existing.items, item];

    onChange(
      curatedSkills.map((c) =>
        c.category === category ? { ...c, items: newItems } : c
      )
    );
  };

  return (
    <div className="space-y-4">
      {skillsBank
        .sort((a, b) => a.canonicalOrder - b.canonicalOrder)
        .map((bank) => {
          const isActive = curatedMap.has(bank.category);
          const curated = curatedMap.get(bank.category);
          const activeItems = new Set(curated?.items || []);

          return (
            <div key={bank.category} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleCategory(bank.category)}
                    className="rounded"
                  />
                  <span
                    className={`font-semibold text-sm ${!isActive ? "text-gray-400" : ""}`}
                  >
                    {bank.category}
                  </span>
                </label>
                {isActive && (
                  <span className={`text-xs ${activeItems.size >= bank.maxDisplay ? "text-amber-600 font-semibold" : "text-gray-500"}`}>
                    {activeItems.size}/{bank.maxDisplay}
                  </span>
                )}
              </div>
              {isActive && (
                <div className="flex flex-wrap gap-1">
                  {bank.items.map((item) => {
                    const isOn = activeItems.has(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleItem(bank.category, item)}
                        className={`px-2 py-0.5 rounded text-xs transition-colors ${
                          isOn
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-gray-100 text-gray-400 line-through border border-gray-200"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
