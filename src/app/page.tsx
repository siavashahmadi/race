import AppShell from "../components/AppShell";
import experienceBank from "../data/experience_bank.json";
import skillsBank from "../data/skills_bank.json";
import profile from "../data/profile.json";
import type { Bullet, SkillBankCategory, Profile } from "../types";

export default function Home() {
  return (
    <AppShell
      allBullets={experienceBank as Bullet[]}
      skillsBank={skillsBank as SkillBankCategory[]}
      profile={profile as Profile}
    />
  );
}
