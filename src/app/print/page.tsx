"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ResumePreview from "../../components/ResumePreview";
import experienceBank from "../../data/experience_bank.json";
import profile from "../../data/profile.json";
import type { Bullet, SkillCategory, Profile, ResumeState } from "../../types";

function PrintContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [state, setState] = useState<ResumeState | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!id) {
      setError("No print ID provided");
      return;
    }
    fetch(`/api/print-data/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch print data");
        return res.json();
      })
      .then(setState)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div>Error: {error}</div>;
  if (!state) return <div>Loading...</div>;

  const allBullets = experienceBank as Bullet[];
  const selectedBullets = allBullets
    .filter((b) => state.selectedBulletIds.includes(b.id))
    .map((b) => {
      let result = b;
      if (state.bulletTextOverrides && b.id in state.bulletTextOverrides) result = { ...result, text: state.bulletTextOverrides[b.id] };
      if (state.bulletLabelOverrides && b.id in state.bulletLabelOverrides) result = { ...result, label: state.bulletLabelOverrides[b.id] };
      return result;
    });

  return (
    <div style={{ width: "816px", margin: "0 auto", transform: "none" }}>
      <ResumePreview
        selectedBullets={selectedBullets}
        curatedSkills={state.curatedSkills}
        profile={profile as Profile}
        sectionOrder={state.sectionOrder}
      />
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrintContent />
    </Suspense>
  );
}
