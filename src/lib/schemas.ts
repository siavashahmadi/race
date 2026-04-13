import { z } from "zod";
import companiesData from "../data/companies.json";

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  url: z.string().optional(),
  category: z.array(z.string()),
  priority: z.number().min(1).max(3),
  charCount: z.number(),
});

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
  selectedProjectIds: z.array(z.string()).default([]),
  curatedSkills: z.array(SkillCategorySchema),
  reasoning: z.string(),
  keywords: z.array(z.string()).default([]),
});

export const OptimizeResponseSchema = AnalyzeResponseSchema.extend({
  bulletTextOverrides: z.record(z.string(), z.string()).default({}),
  bulletLabelOverrides: z.record(z.string(), z.string()).default({}),
});

const sectionOrderField = z
  .array(z.string())
  .default(["Skills", "Experience", "Projects", "Education"]);

export const CompanyMetaOverrideSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  dates: z.string().optional(),
});

export const ProjectOverrideSchema = z.object({
  name: z.string().optional(),
  technologies: z.string().optional(),
  description: z.string().optional(),
});

export const ExportRequestSchema = z.object({
  selectedBulletIds: z.array(z.string()),
  selectedProjectIds: z.array(z.string()).default([]),
  curatedSkills: z.array(SkillCategorySchema),
  bulletTextOverrides: z.record(z.string(), z.string()).default({}),
  bulletLabelOverrides: z.record(z.string(), z.string()).default({}),
  companyMetaOverrides: z.record(z.string(), CompanyMetaOverrideSchema).default({}),
  projectOverrides: z.record(z.string(), ProjectOverrideSchema).default({}),
  sectionOrder: sectionOrderField,
});

export const ResumeStateSchema = z.object({
  selectedBulletIds: z.array(z.string()),
  selectedProjectIds: z.array(z.string()).default([]),
  curatedSkills: z.array(SkillCategorySchema),
  bulletTextOverrides: z.record(z.string(), z.string()).default({}),
  bulletLabelOverrides: z.record(z.string(), z.string()).default({}),
  companyMetaOverrides: z.record(z.string(), CompanyMetaOverrideSchema).default({}),
  projectOverrides: z.record(z.string(), ProjectOverrideSchema).default({}),
  sectionOrder: sectionOrderField,
});

export const SavedResumeSchema = z.object({
  id: z.string(),
  label: z.string(),
  savedAt: z.string(),
  jdSnippet: z.string().default(""),
  selectedBulletIds: z.array(z.string()),
  selectedProjectIds: z.array(z.string()).default([]),
  curatedSkills: z.array(SkillCategorySchema),
  bulletTextOverrides: z.record(z.string(), z.string()).default({}),
  bulletLabelOverrides: z.record(z.string(), z.string()).default({}),
  companyMetaOverrides: z.record(z.string(), CompanyMetaOverrideSchema).default({}),
  projectOverrides: z.record(z.string(), ProjectOverrideSchema).default({}),
  keywords: z.array(z.string()).default([]),
  sectionOrder: sectionOrderField,
});

export const SavedResumeStoreSchema = z.object({
  version: z.literal(1),
  entries: z.array(SavedResumeSchema),
});

export const RewriteBulletRequestSchema = z.object({
  bulletId: z.string(),
  currentText: z.string(),
  currentLabel: z.string(),
  jobDescription: z.string(),
});

export const RewriteBulletResponseSchema = z.object({
  text: z.string(),
  label: z.string().optional(),
});
