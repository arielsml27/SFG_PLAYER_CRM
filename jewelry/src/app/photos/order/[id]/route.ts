import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * תמונת הזמנה בצד הניהולי. דורשת סשן, ולכן היא לא תלויה בשאלה אם עמוד
 * הלקוח או ההצעה מפורסמים — הבעלים צריך לראות את התמונות שלו גם כששני
 * הקישורים כבויים.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!(await verifySessionToken(token))) return new Response("לא נמצא", { status: 404 });

  const { id } = await params;
  const rows = await db
    .select()
    .from(schema.orderPhotos)
    .where(eq(schema.orderPhotos.id, id))
    .limit(1);
  const photo = rows[0];
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
