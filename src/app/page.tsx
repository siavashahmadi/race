import AppShell from "../components/AppShell";
import experienceBank from "../data/experience_bank.json";
import skillsBank from "../data/skills_bank.json";
import profile from "../data/profile.json";
import { DEMO_SCENARIOS } from "../data/demos";
import type { Bullet, SkillBankCategory, Profile } from "../types";

export default function Home() {
  const isDemoMode = process.env.DEMO_MODE === "true";

  return (
    <AppShell
      allBullets={experienceBank as Bullet[]}
      skillsBank={skillsBank as SkillBankCategory[]}
      profile={profile as Profile}
      demoMode={isDemoMode}
      demoScenarios={isDemoMode ? DEMO_SCENARIOS : undefined}
    />
  );
}
