import { randomBytes } from "node:crypto";

/**
 * סלאג לשיתוף: קריא, ASCII, ובלתי-ניתן לניחוש.
 * נוצר פעם אחת בפרסום ולא משתנה — כדי שלינק שכבר נשלח ללקוח לא יישבר.
 */
export function makeSlug(seed: string): string {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const suffix = randomBytes(4).toString("hex");
  return base ? `${base}-${suffix}` : suffix;
}

/** בסיס הכתובת ללינקים שנשלחים החוצה. */
export function shareBase(configured?: string | null): string {
  const fromEnv = process.env.PUBLIC_BASE_URL;
  return (configured || fromEnv || "http://localhost:3000").replace(/\/+$/, "");
}

export function productShareUrl(base: string, slug: string) {
  return `${base}/p/${slug}`;
}

export function collectionShareUrl(base: string, slug: string) {
  return `${base}/c/${slug}`;
}

/** קישור וואטסאפ עם הודעה מוכנה. */
export function whatsappLink(phone: string | null | undefined, text: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  const msg = encodeURIComponent(text);
  return digits ? `https://wa.me/${digits}?text=${msg}` : `https://wa.me/?text=${msg}`;
}
