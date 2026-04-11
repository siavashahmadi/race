import { readFile } from "fs/promises";
import { join } from "path";
import type { Bullet, SkillBankCategory, Profile } from "../types";

import baseProfile from "../data/profile.json";
import baseExperienceBank from "../data/experience_bank.json";
import baseSkillsBank from "../data/skills_bank.json";
import baseCompanies from "../data/companies.json";

const OVERRIDES_DIR = join(process.cwd(), "src/data/overrides");

async function loadWithOverride<T>(filename: string, baseData: T): Promise<T> {
  try {
    const raw = await readFile(join(OVERRIDES_DIR, filename), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return baseData;
  }
}

export async function loadProfile(): Promise<Profile> {
  return loadWithOverride<Profile>("profile.json", baseProfile as Profile);
}

export async function loadExperienceBank(): Promise<Bullet[]> {
  return loadWithOverride<Bullet[]>(
    "experience_bank.json",
    baseExperienceBank as Bullet[]
  );
}

export async function loadSkillsBank(): Promise<SkillBankCategory[]> {
  return baseSkillsBank as SkillBankCategory[];
}

export async function loadCompanies() {
  return loadWithOverride(
    "companies.json",
    baseCompanies as typeof baseCompanies
  );
}

export async function loadAllData() {
  const [profile, experienceBank, skillsBank, companies] = await Promise.all([
    loadProfile(),
    loadExperienceBank(),
    loadSkillsBank(),
    loadCompanies(),
  ]);
  return { profile, experienceBank, skillsBank, companies };
}
