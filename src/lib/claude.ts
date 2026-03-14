import Anthropic from "@anthropic-ai/sdk";
import { AnalyzeResponseSchema } from "./schemas";
import { COMPANY_ORDER, getDefaultSkills } from "./resume-constants";
import type { Bullet, SkillBankCategory, AnalyzeResponse } from "../types";

const client = new Anthropic();

export async function analyzeJobDescription(
  jd: string,
  bullets: Bullet[],
  skillsBank: SkillBankCategory[]
): Promise<AnalyzeResponse> {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

  const bulletMeta = bullets.map((b) => ({
    id: b.id,
    company: b.company,
    category: b.category,
    label: b.label,
    priority: b.priority,
    charCount: b.charCount,
  }));

  const companyList = COMPANY_ORDER.join(", ");

  const systemPrompt = `You are a technical recruiter and resume curator. Your job is to select the most relevant achievements and skills from a candidate's pre-vetted experience bank to tailor their resume for a specific job description.

You are a CURATOR, not a writer. You select from existing verified content — you never generate new text.

IMPORTANT CONSTRAINTS:
- Companies in order of recency: ${companyList}
- Select 4-6 bullets for the most recent/primary employer, 3-4 for the secondary employer, 1-2 for internships or shorter roles.
- Adjust counts based on bullet length — shorter bullets allow more selections.
- The resume MUST fit on a single page. 1 line of resume text ≈ 90-100 characters at 10pt font. A 300-char bullet = ~3 lines.
- Prioritize relevance to the JD over quantity.

For skills curation:
- Hide entire categories irrelevant to the JD
- Select items within each category (respect minDisplay/maxDisplay bounds)
- Order items within categories by JD relevance (most relevant first)
- Default to canonical category order unless JD strongly warrants reordering
- If the JD mentions a technology, ensure it appears in the relevant category`;

  const userPrompt = `## Job Description
${jd}

## Available Bullets (metadata only — select by ID)
${JSON.stringify(bulletMeta, null, 2)}

## Skills Bank (select from these pools)
${JSON.stringify(skillsBank, null, 2)}

Analyze the job description and select the most relevant bullets and skills. Use the "curate_resume" tool to return your selections.`;

  const toolSchema = {
    name: "curate_resume" as const,
    description:
      "Return curated bullet selections and skills for the resume based on JD analysis",
    input_schema: {
      type: "object" as const,
      properties: {
        selectedBulletIds: {
          type: "array" as const,
          items: { type: "string" as const },
          description:
            "Array of bullet IDs to include. Select the most relevant bullets that fit on one page.",
        },
        curatedSkills: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              category: { type: "string" as const },
              items: {
                type: "array" as const,
                items: { type: "string" as const },
              },
            },
            required: ["category", "items"],
          },
          description:
            "Curated skill categories with selected items, ordered by relevance",
        },
        reasoning: {
          type: "string" as const,
          description:
            "Brief explanation of why these bullets and skills were selected for this JD",
        },
      },
      required: ["selectedBulletIds", "curatedSkills", "reasoning"],
    },
  };

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    tools: [toolSchema],
    tool_choice: { type: "tool", name: "curate_resume" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use response");
  }

  const parsed = AnalyzeResponseSchema.parse(toolUse.input);

  // Validate that all returned bullet IDs actually exist
  const validIds = new Set(bullets.map((b) => b.id));
  const invalidIds = parsed.selectedBulletIds.filter(
    (id) => !validIds.has(id)
  );
  if (invalidIds.length > 0) {
    console.warn(
      `Claude returned invalid bullet IDs: ${invalidIds.join(", ")}. Falling back to priority-based selection.`
    );
    return fallbackSelection(bullets, skillsBank);
  }

  return parsed;
}

function fallbackSelection(
  bullets: Bullet[],
  skillsBank: SkillBankCategory[]
): AnalyzeResponse {
  const selectedIds: string[] = [];
  const defaultCounts = [5, 4, 1];

  for (let i = 0; i < COMPANY_ORDER.length; i++) {
    const company = COMPANY_ORDER[i];
    const companyBullets = bullets
      .filter((b) => b.company === company)
      .sort((a, b) => a.priority - b.priority);
    const count = defaultCounts[i] ?? 2;
    selectedIds.push(...companyBullets.slice(0, count).map((b) => b.id));
  }

  return {
    selectedBulletIds: selectedIds,
    curatedSkills: getDefaultSkills(skillsBank),
    reasoning:
      "Fallback selection based on priority ranking (AI response contained invalid IDs).",
  };
}
