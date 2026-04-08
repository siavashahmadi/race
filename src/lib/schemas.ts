import { z } from "zod";
import companiesData from "../data/companies.json";

const companyNames = companiesData.map((c) => c.name) as [string, ...string[]];
export const CompanyEnum = z.enum(companyNames);

export const BulletSchema = z.object({
  id: z.string(),
  company: CompanyEnum,
  category: z.array(z.string()),
  label: z.string(),
  text: z.string(),
  priority: z.number().min(1).max(3),
  charCount: z.number(),
});

export const SkillBankCategorySchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
  canonicalOrder: z.number(),
  minDisplay: z.number(),
  maxDisplay: z.number(),
});

export const SkillCategorySchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
});

export const ProfileSchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  linkedin: z.string(),
  education: z.object({
    school: z.string(),
    degree: z.string(),
    graduationDate: z.string(),
  }),
});

export const AnalyzeRequestSchema = z.object({
  jobDescription: z.string(),
  mode: z.enum(["curate", "optimize"]).default("curate"),
});

export const AnalyzeResponseSchema = z.object({
  selectedBulletIds: z.array(z.string()),
  curatedSkills: z.array(SkillCategorySchema),
  reasoning: z.string(),
});

export const OptimizeResponseSchema = AnalyzeResponseSchema.extend({
  bulletTextOverrides: z.record(z.string(), z.string()).default({}),
  bulletLabelOverrides: z.record(z.string(), z.string()).default({}),
});

export const ExportRequestSchema = z.object({
  selectedBulletIds: z.array(z.string()),
  curatedSkills: z.array(SkillCategorySchema),
  bulletTextOverrides: z.record(z.string(), z.string()).default({}),
  bulletLabelOverrides: z.record(z.string(), z.string()).default({}),
});

export const ResumeStateSchema = z.object({
  selectedBulletIds: z.array(z.string()),
  curatedSkills: z.array(SkillCategorySchema),
  bulletTextOverrides: z.record(z.string(), z.string()).default({}),
  bulletLabelOverrides: z.record(z.string(), z.string()).default({}),
});
