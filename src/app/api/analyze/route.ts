import { NextResponse } from "next/server";
import { AnalyzeRequestSchema } from "../../../lib/schemas";
import { analyzeJobDescription, optimizeForRole } from "../../../lib/claude";
import experienceBank from "../../../data/experience_bank.json";
import skillsBank from "../../../data/skills_bank.json";
import projectsBank from "../../../data/projects_bank.json";
import type { Bullet, Project, SkillBankCategory } from "../../../types";

export async function POST(request: Request) {
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.json(
      { error: "AI analysis is disabled in demo mode" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = AnalyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result =
      parsed.data.mode === "optimize"
        ? await optimizeForRole(
            parsed.data.jobDescription,
            experienceBank as Bullet[],
            skillsBank as SkillBankCategory[],
            projectsBank as Project[]
          )
        : await analyzeJobDescription(
            parsed.data.jobDescription,
            experienceBank as Bullet[],
            skillsBank as SkillBankCategory[],
            projectsBank as Project[]
          );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
