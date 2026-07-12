import { NextResponse } from "next/server";
import type { Media } from "tinacms";

import { getStorageBucket, normalizeStorageDirectory, type MediaAsset } from "@/lib/cms/media";
import { getSupabaseAdminClient, requireEditorFromHeaders } from "@/lib/cms/auth";

type StorageListItem = {
  id?: string | null;
  name: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  } | null;
};

type MediaManagerItem = Media & MediaAsset & {
  sourceType?: "upload";
  vimeoUrl?: string;
  posterUrl?: string | null;
  duration?: number | null;
  bucket?: string;
  path?: string;
};

const ROOT_MEDIA_DIRECTORIES: MediaManagerItem[] = [
  {
    id: "videos",
    type: "dir",
    filename: "videos",
    directory: "",
    bucket: getStorageBucket(),
    path: "videos",
    url: "",
    mimeType: "",
    size: 0,
  },
  {
    id: "images",
    type: "dir",
    filename: "images",
    directory: "",
    bucket: getStorageBucket(),
    path: "images",
    url: "",
    mimeType: "",
    size: 0,
  },
];

export async function GET(request: Request) {
  const auth = await requireEditorFromHeaders(request.headers);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const requestedDirectory = url.searchParams.get("directory")?.trim() || "";
  const filesOnly = url.searchParams.get("filesOnly") === "true";

  try {
    if (!requestedDirectory) {
      return NextResponse.json({
        items: filesOnly ? [] : ROOT_MEDIA_DIRECTORIES,
      });
    }

    const directory = normalizeStorageDirectory(requestedDirectory);
    const bucket = getStorageBucket();
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(bucket).list(directory, {
      limit: 200,
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
      .flatMap((item) => {
        const path = `${directory}/${item.name}`;
        const isDirectory = !item.metadata?.mimetype && (item.metadata?.size == null || item.id == null);

        if (isDirectory) {
          if (filesOnly) {
            return [];
          }

          const dirItem: MediaManagerItem = {
            id: path,
            type: "dir",
            filename: item.name,
            directory,
            sourceType: "upload",
            bucket,
            path,
            url: "",
            vimeoUrl: "",
            mimeType: "",
            size: 0,
          };

          return [dirItem];
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);

        const asset: MediaManagerItem = {
          id: path,
          type: "file",
          filename: item.name,
          directory,
          sourceType: "upload",
          src: publicUrl,
          url: publicUrl,
          vimeoUrl: "",
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

        return [asset];
      });

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Media-Liste konnte nicht geladen werden." },
      { status: 500 },
    );
  }
}
