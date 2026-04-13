import { z } from "zod";
import {
  BulletSchema,
  ProjectSchema,
  SkillBankCategorySchema,
  SkillCategorySchema,
  ProfileSchema,
  AnalyzeResponseSchema,
  OptimizeResponseSchema,
  ResumeStateSchema,
  SavedResumeSchema,
  SavedResumeStoreSchema,
  CompanyMetaOverrideSchema,
  ProjectOverrideSchema,
} from "../lib/schemas";

export type Bullet = z.infer<typeof BulletSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type SkillBankCategory = z.infer<typeof SkillBankCategorySchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
export type OptimizeResponse = z.infer<typeof OptimizeResponseSchema>;
export type ResumeState = z.infer<typeof ResumeStateSchema>;
export type SavedResume = z.infer<typeof SavedResumeSchema>;
export type SavedResumeStore = z.infer<typeof SavedResumeStoreSchema>;
export type Company = z.infer<typeof import("../lib/schemas").CompanyEnum>;
export type CompanyMetaOverride = z.infer<typeof CompanyMetaOverrideSchema>;
export type ProjectOverride = z.infer<typeof ProjectOverrideSchema>;
