import { z } from "zod";
import {
  BulletSchema,
  SkillBankCategorySchema,
  SkillCategorySchema,
  ProfileSchema,
  AnalyzeResponseSchema,
  ResumeStateSchema,
} from "../lib/schemas";

export type Bullet = z.infer<typeof BulletSchema>;
export type SkillBankCategory = z.infer<typeof SkillBankCategorySchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
export type ResumeState = z.infer<typeof ResumeStateSchema>;
export type Company = z.infer<typeof import("../lib/schemas").CompanyEnum>;
