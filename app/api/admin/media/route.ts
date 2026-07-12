import { NextResponse } from "next/server";

import { getStorageBucket } from "@/lib/cms/media";
import { getSupabaseAdminClient, requireEditorFromHeaders } from "@/lib/cms/auth";

type DeleteMediaPayload = {
  bucket?: string;
  path?: string;
  directory?: string;
  filename?: string;
};

export async function DELETE(request: Request) {
  const auth = await requireEditorFromHeaders(request.headers);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as DeleteMediaPayload | null;

  const path =
    body?.path || [body?.directory, body?.filename].filter(Boolean).join("/");

  if (!path) {
    return NextResponse.json({ error: "Es wurde kein Storage-Pfad uebergeben." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const bucket = body?.bucket || getStorageBucket();
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Asset konnte nicht geloescht werden." },
      { status: 500 },
    );
  }
}
