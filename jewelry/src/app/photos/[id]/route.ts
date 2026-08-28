import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { isPhotoPublic } from "@/lib/data";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * מגיש תמונת מוצר מתוך קובץ ה-SQLite.
 * תמונה של דגם מפורסם פתוחה לכל אחד — עמוד השיתוף חייב אותה.
 * תמונה של דגם שאינו מפורסם דורשת סשן.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!(await isPhotoPublic(id))) {
    const token = (await cookies()).get(AUTH_COOKIE)?.value;
    if (!(await verifySessionToken(token))) return new Response("לא נמצא", { status: 404 });
  }

  const rows = await db
    .select()
    .from(schema.productPhotos)
    .where(eq(schema.productPhotos.id, id))
    .limit(1);
  const photo = rows[0];
  if (!photo) return new Response("לא נמצא", { status: 404 });

  const bytes = photo.data as unknown as Uint8Array;
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": photo.mime,
      "Content-Length": String(bytes.byteLength),
      // התמונה לעולם לא משתנה בכתובת שלה — מחיקה יוצרת מזהה חדש.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
