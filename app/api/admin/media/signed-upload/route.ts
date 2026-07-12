import { NextResponse } from "next/server";

import {
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  buildStoragePath,
  getStorageBucket,
  isImageMimeType,
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
    return NextResponse.json({ error: "Unvollständige Upload-Daten." }, { status: 400 });
  }

  const isVideoUpload = isVideoMimeType(body.mimeType);
  const isImageUpload = isImageMimeType(body.mimeType);

  if (!isVideoUpload && !isImageUpload) {
    return NextResponse.json({ error: "Dieser Dateityp ist für Uploads nicht erlaubt." }, { status: 415 });
  }

  const maxSize = isVideoUpload ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;

  if (body.size <= 0 || body.size > maxSize) {
    return NextResponse.json({ error: "Die Dateigröße liegt außerhalb des erlaubten Bereichs." }, { status: 413 });
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
