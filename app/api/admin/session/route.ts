import { NextResponse } from "next/server";

import { requireEditorFromHeaders } from "@/lib/cms/auth";

export async function GET(request: Request) {
  const result = await requireEditorFromHeaders(request.headers);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ user: result.user });
}
