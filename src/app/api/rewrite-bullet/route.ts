import { NextResponse } from "next/server";
import { RewriteBulletRequestSchema } from "../../../lib/schemas";
import { rewriteBullet } from "../../../lib/claude";

export async function POST(request: Request) {
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.json(
      { error: "Disabled in demo mode" },
      { status: 403 }
    );
  }
  try {
    const body = await request.json();
    const parsed = RewriteBulletRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const result = await rewriteBullet(
      parsed.data.bulletId,
      parsed.data.currentText,
      parsed.data.currentLabel,
      parsed.data.jobDescription
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("Rewrite error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Rewrite failed" },
      { status: 500 }
    );
  }
}
