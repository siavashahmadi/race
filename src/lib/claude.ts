import Anthropic from "@anthropic-ai/sdk";
import { AnalyzeResponseSchema, OptimizeResponseSchema } from "./schemas";
import { COMPANY_ORDER, getDefaultSkills } from "./resume-constants";
import type { Bullet, SkillBankCategory, AnalyzeResponse, OptimizeResponse } from "../types";

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
- If the JD mentions a technology, ensure it appears in the relevant category

Additionally, extract 10-25 important keywords from the job description: specific technologies, frameworks, methodologies, domain terms, and key qualifications. Exclude generic words like "team", "experience", "responsibilities". Use specific terms — e.g., "Golang" not "Go", "Kubernetes" not "K8s". Avoid keywords shorter than 3 characters.`;

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
        keywords: {
          type: "array" as const,
          items: { type: "string" as const },
          description:
            "10-25 important keywords from the JD: specific technologies, frameworks, methodologies, domain terms, key qualifications. Exclude generic words.",
        },
      },
      required: ["selectedBulletIds", "curatedSkills", "reasoning", "keywords"],
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
    keywords: [],
  };
}

export async function optimizeForRole(
  jd: string,
  bullets: Bullet[],
  skillsBank: SkillBankCategory[]
): Promise<OptimizeResponse> {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  const companyList = COMPANY_ORDER.join(", ");

  const systemPrompt = `You are a technical resume optimizer. Your job is to select the most relevant achievements from a candidate's experience bank AND rewrite them to better match the job description's language, keywords, and priorities.

You REWRITE bullet text to:
- Mirror the JD's terminology and phrasing (e.g., if the JD says "distributed systems" instead of "microservices", use their language)
- Emphasize the aspects of each achievement most relevant to this specific role
- Weave in keywords and technologies from the JD where the candidate's experience plausibly supports them
- Preserve factual accuracy — never fabricate metrics, technologies not adjacent to what they used, or outcomes
- Keep the rewrite similar in length to the original (within ~20% character count)

IMPORTANT CONSTRAINTS:
- Companies in order of recency: ${companyList}
- Select 4-6 bullets for the most recent/primary employer, 3-4 for the secondary, 1-2 for internships or shorter roles.
- Adjust counts based on bullet length — shorter bullets allow more selections.
- The resume MUST fit on a single page. 1 line of resume text ≈ 90-100 characters at 10pt font.
- Prioritize relevance to the JD over quantity.

For skills curation:
- Hide entire categories irrelevant to the JD
- Select items within each category
- Order items by JD relevance (most relevant first)
- You MAY add skills mentioned in the JD that are not in the candidate's bank, if they are plausible adjacent skills the candidate could credibly claim based on their experience
- If the JD mentions a specific framework/tool and the candidate has experience with a similar one, include the JD's version

Additionally, extract 10-25 important keywords from the job description: specific technologies, frameworks, methodologies, domain terms, and key qualifications. Exclude generic words like "team", "experience", "responsibilities". Use specific terms — e.g., "Golang" not "Go", "Kubernetes" not "K8s". Avoid keywords shorter than 3 characters.`;

  const userPrompt = `## Job Description
${jd}

## Available Bullets (select by ID, rewrite the text field to match the JD)
${JSON.stringify(bullets, null, 2)}

## Skills Bank (select from these, and add JD-mentioned skills if plausible)
${JSON.stringify(skillsBank, null, 2)}

Analyze the JD, select the most relevant bullets, rewrite their text to align with the JD, and curate skills. Use the "optimize_resume" tool.`;

  const toolSchema = {
    name: "optimize_resume" as const,
    description:
      "Return optimized bullet selections with rewritten text and curated skills",
    input_schema: {
      type: "object" as const,
      properties: {
        selectedBulletIds: {
          type: "array" as const,
          items: { type: "string" as const },
          description: "Array of bullet IDs to include.",
        },
        bulletTextOverrides: {
          type: "object" as const,
          additionalProperties: { type: "string" as const },
          description:
            "Map of bullet ID to rewritten text. Include an entry for every selected bullet that you rewrote.",
        },
        bulletLabelOverrides: {
          type: "object" as const,
          additionalProperties: { type: "string" as const },
          description:
            "Map of bullet ID to rewritten label. Only include if the label should change to better match the JD.",
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
            "Curated skill categories. May include skills not in the bank if JD mentions them and they are plausible.",
        },
        reasoning: {
          type: "string" as const,
          description:
            "Explain what was changed and why for each rewritten bullet",
        },
        keywords: {
          type: "array" as const,
          items: { type: "string" as const },
          description:
            "10-25 important keywords from the JD: specific technologies, frameworks, methodologies, domain terms, key qualifications. Exclude generic words.",
        },
      },
      required: [
        "selectedBulletIds",
        "bulletTextOverrides",
        "curatedSkills",
        "reasoning",
        "keywords",
      ],
    },
  };

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    temperature: 0.4,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    tools: [toolSchema],
    tool_choice: { type: "tool", name: "optimize_resume" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use response");
  }

  const parsed = OptimizeResponseSchema.parse(toolUse.input);

  const validIds = new Set(bullets.map((b) => b.id));
  const invalidIds = parsed.selectedBulletIds.filter(
    (id) => !validIds.has(id)
  );
  if (invalidIds.length > 0) {
    console.warn(
      `Optimize returned invalid bullet IDs: ${invalidIds.join(", ")}. Falling back.`
    );
    return {
      ...fallbackSelection(bullets, skillsBank),
      bulletTextOverrides: {},
      bulletLabelOverrides: {},
      keywords: [],
    };
  }

  // Strip overrides for non-selected bullets
  const selectedSet = new Set(parsed.selectedBulletIds);
  const cleanTextOverrides: Record<string, string> = {};
  const cleanLabelOverrides: Record<string, string> = {};
  for (const [id, text] of Object.entries(parsed.bulletTextOverrides || {})) {
    if (selectedSet.has(id)) cleanTextOverrides[id] = text;
  }
  for (const [id, label] of Object.entries(parsed.bulletLabelOverrides || {})) {
    if (selectedSet.has(id)) cleanLabelOverrides[id] = label;
  }

  return {
    ...parsed,
    bulletTextOverrides: cleanTextOverrides,
    bulletLabelOverrides: cleanLabelOverrides,
  };
}
