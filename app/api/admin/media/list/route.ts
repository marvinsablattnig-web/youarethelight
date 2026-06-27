import { NextResponse } from "next/server";

import { getStorageBucket, normalizeStorageDirectory, type VideoAsset } from "@/lib/cms/media";
import { getSupabaseAdminClient, requireEditorFromHeaders } from "@/lib/cms/auth";

type StorageListItem = {
  name: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  } | null;
};

export async function GET(request: Request) {
  const auth = await requireEditorFromHeaders(request.headers);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const requestedDirectory = url.searchParams.get("directory") || "videos/uploads";

  try {
    const directory = normalizeStorageDirectory(requestedDirectory);
    const bucket = getStorageBucket();
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(bucket).list(directory, {
      limit: 100,
      sortBy: {
        column: "name",
        order: "desc",
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = ((data || []) as StorageListItem[])
      .filter((item) => Boolean(item.name))
      .map((item) => {
        const path = `${directory}/${item.name}`;
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);

        const asset: VideoAsset & { filename: string } = {
          filename: item.name,
          url: publicUrl,
          path,
          bucket,
          mimeType: item.metadata?.mimetype || "video/mp4",
          size: item.metadata?.size || 0,
          title: item.name.replace(/\.[^.]+$/, ""),
          alt: null,
          posterUrl: null,
          duration: null,
          width: null,
          height: null,
        };

        return asset;
      });

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Media-Liste konnte nicht geladen werden." },
      { status: 500 },
    );
  }
}
