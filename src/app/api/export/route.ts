import { NextResponse } from "next/server";
import { ExportRequestSchema } from "../../../lib/schemas";
import { generatePDF } from "../../../lib/pdf";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ExportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const pdfBuffer = await generatePDF({
      selectedBulletIds: parsed.data.selectedBulletIds,
      selectedProjectIds: parsed.data.selectedProjectIds,
      curatedSkills: parsed.data.curatedSkills,
      bulletTextOverrides: parsed.data.bulletTextOverrides,
      bulletLabelOverrides: parsed.data.bulletLabelOverrides,
      companyMetaOverrides: parsed.data.companyMetaOverrides,
      projectOverrides: parsed.data.projectOverrides,
      sectionOrder: parsed.data.sectionOrder,
      pageMargin: parsed.data.pageMargin,
      sectionSpacing: parsed.data.sectionSpacing,
      bodyFontSize: parsed.data.bodyFontSize,
      lineHeight: parsed.data.lineHeight,
      hideLinkedIn: parsed.data.hideLinkedIn,
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}
