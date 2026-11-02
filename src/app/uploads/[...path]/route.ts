import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

// Serves files uploaded at runtime (player photos, videos) from public/uploads.
// In production public/uploads is a symlink to the persistent /data/uploads
// volume (see docker-entrypoint.sh). Next.js standalone only serves files that
// existed in /public at build time, so runtime uploads returned 404 without
// this route.

export const dynamic = "force-dynamic";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const relative = path.normalize((parts ?? []).join("/"));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const filePath = path.join(UPLOADS_ROOT, relative);
  if (!filePath.startsWith(UPLOADS_ROOT)) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return new NextResponse("Not found", { status: 404 });
    const data = await fs.readFile(filePath);
    const type = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": type,
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
