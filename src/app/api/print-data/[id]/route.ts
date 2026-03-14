import { NextResponse } from "next/server";
import { getCache } from "../../../../lib/print-cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = getCache(id);

  if (!state) {
    return NextResponse.json(
      { error: "Resume state not found or expired" },
      { status: 404 }
    );
  }

  return NextResponse.json(state);
}
