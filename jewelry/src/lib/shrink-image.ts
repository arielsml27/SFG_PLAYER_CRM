/**
 * מקטין תמונה בדפדפן לפני שהיא נשלחת לשרת. תמונה מהטלפון היא 4–6MB;
 * אחרי ההקטנה היא כ-200KB, וכך קובץ המערכת — שהוא גם קובץ הגיבוי —
 * נשאר קטן מספיק כדי לגבות אותו כל יום.
 *
 * רץ רק בדפדפן (canvas, createImageBitmap).
 */
export const MAX_EDGE = 1600;
export const QUALITY = 0.85;

export type ShrunkPhoto = { name: string; dataUrl: string; kb: number };

export async function shrinkImage(file: File): Promise<ShrunkPhoto> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // createImageBitmap זורק הודעה באנגלית שלא אומרת כלום למי שבחר קובץ.
    throw new Error(`לא הצלחתי לקרוא את "${file.name}" — הקובץ פגום או בפורמט שהדפדפן לא מכיר.`);
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("הדפדפן לא תומך בעיבוד תמונה");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  return { name: file.name, dataUrl, kb: Math.round((dataUrl.length * 0.75) / 1024) };
}

/** מקטין כמה קבצים ומדלג על מה שאינו תמונה. */
export async function shrinkAll(files: FileList | File[]): Promise<ShrunkPhoto[]> {
  const out: ShrunkPhoto[] = [];
  for (const file of Array.from(files)) {
    if (!file.type.startsWith("image/")) continue;
    out.push(await shrinkImage(file));
  }
  return out;
}
