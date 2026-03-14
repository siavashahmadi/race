import { NextResponse } from "next/server";
import { AnalyzeRequestSchema } from "../../../lib/schemas";
import { analyzeJobDescription } from "../../../lib/claude";
import experienceBank from "../../../data/experience_bank.json";
import skillsBank from "../../../data/skills_bank.json";
import type { Bullet, SkillBankCategory } from "../../../types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = AnalyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await analyzeJobDescription(
      parsed.data.jobDescription,
      experienceBank as Bullet[],
      skillsBank as SkillBankCategory[]
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
