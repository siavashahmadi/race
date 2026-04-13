"use client";

import type { Project, ProjectOverride } from "../types";

interface ProjectToggleProps {
  allProjects: Project[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  projectOverrides?: Record<string, ProjectOverride>;
}

export default function ProjectToggle({
  allProjects,
  selectedIds,
  onToggle,
  projectOverrides,
}: ProjectToggleProps) {
  const sorted = [...allProjects].sort((a, b) => a.priority - b.priority);

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-400 italic">No projects in bank.</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map((project) => {
        const isSelected = selectedIds.includes(project.id);
        const isOverridden = !!projectOverrides?.[project.id];
        const description = projectOverrides?.[project.id]?.description ?? project.description;

        return (
          <button
            key={project.id}
            onClick={() => onToggle(project.id)}
            className={`w-full text-left p-2 rounded-lg border transition-colors ${
              isSelected
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`flex-shrink-0 w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[9px] ${
                    isSelected
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-400"
                  }`}
                >
                  {isSelected ? "✓" : ""}
                </span>
                <span className="font-medium text-xs text-gray-900 truncate">
                  {project.name}
                </span>
                {isOverridden && (
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-yellow-400" title="Edited" />
                )}
              </div>
            </div>
            <p className="mt-0.5 text-[10px] text-gray-400 ml-5">
              {project.technologies.join(", ")}
            </p>
            <p className="mt-0.5 text-[10px] text-gray-500 ml-5 line-clamp-2">
              {description.slice(0, 80)}{description.length > 80 ? "…" : ""}
            </p>
          </button>
        );
      })}
    </div>
  );
}
