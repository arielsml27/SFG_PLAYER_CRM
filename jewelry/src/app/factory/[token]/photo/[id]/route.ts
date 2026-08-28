import { getWorkOrderPhoto } from "@/lib/data";

/**
 * תמונה של הזמנת עבודה. הטוקן בכתובת הוא האימות — תמונה מוגשת רק
 * דרך הטוקן של הזמנת העבודה שאליה היא שייכת.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  const { token, id } = await params;
  const photo = await getWorkOrderPhoto(token, id);
  if (!photo) return new Response("לא נמצא", { status: 404 });

  const bytes = photo.data as unknown as Uint8Array;
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": photo.mime,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
