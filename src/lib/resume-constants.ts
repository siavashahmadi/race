import companiesData from "../data/companies.json";
import type { SkillBankCategory, SkillCategory } from "../types";

const sorted = [...companiesData].sort((a, b) => a.order - b.order);

export const COMPANY_ORDER = sorted.map((c) => c.name);

export const COMPANY_META: Record<
  string,
  { role: string; dates: string; location: string }
> = Object.fromEntries(
  sorted.map((c) => [
    c.name,
    { role: c.role, dates: c.dates, location: c.location },
  ])
);

export function getDefaultSkills(
  skillsBank: SkillBankCategory[]
): SkillCategory[] {
  return [...skillsBank]
    .sort((a, b) => a.canonicalOrder - b.canonicalOrder)
    .map((cat) => ({
      category: cat.category,
      items: cat.items.slice(0, cat.minDisplay),
    }));
}
