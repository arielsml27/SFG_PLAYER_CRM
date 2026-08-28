/**
 * בדיקת שפיות בעלייה. רצה פעם אחת, לפני הבקשה הראשונה.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { isUsingFallbackSecret } = await import("@/lib/auth");

  if (isUsingFallbackSecret()) {
    const message = [
      "",
      "  APP_SECRET לא הוגדר.",
      "",
      "  הסוד הזה חותם את עוגיית הסשן. בלעדיו המערכת משתמשת בסוד שכתוב בקוד,",
      "  וכל מי שראה את הקוד יכול לזייף כניסה. זה מקובל רק בפיתוח מקומי.",
      "",
      "  ליצירת סוד:  node scripts/setup-secret.mjs",
      "",
    ].join("\n");

    if (process.env.NODE_ENV === "production") {
      console.error(message);
      throw new Error("APP_SECRET חסר — סירוב לעלות במצב production");
    }
    console.warn(message);
  }
}
