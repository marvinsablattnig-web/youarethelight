import { NextResponse } from "next/server";

import {
  MAX_VIDEO_UPLOAD_BYTES,
  buildStoragePath,
  getStorageBucket,
  isVideoMimeType,
} from "@/lib/cms/media";
import { getSupabaseAdminClient, requireEditorFromHeaders } from "@/lib/cms/auth";

type SignedUploadPayload = {
  directory?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
};

export async function POST(request: Request) {
  const auth = await requireEditorFromHeaders(request.headers);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as SignedUploadPayload | null;

  if (!body?.directory || !body.filename || !body.mimeType || typeof body.size !== "number") {
    return NextResponse.json({ error: "Unvollstaendige Upload-Daten." }, { status: 400 });
  }

  if (!isVideoMimeType(body.mimeType)) {
    return NextResponse.json({ error: "Dieser Dateityp ist fuer Video-Uploads nicht erlaubt." }, { status: 415 });
  }

  if (body.size <= 0 || body.size > MAX_VIDEO_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Die Dateigroesse liegt ausserhalb des erlaubten Bereichs." }, { status: 413 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const bucket = getStorageBucket();
    const path = buildStoragePath({
      directory: body.directory,
      filename: body.filename,
    });
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

    if (error || !data?.token) {
      return NextResponse.json(
        { error: error?.message || "Upload-URL konnte nicht erstellt werden." },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({
      bucket,
      path,
      publicUrl,
      token: data.token,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload-URL konnte nicht erstellt werden." },
      { status: 500 },
    );
  }
}
