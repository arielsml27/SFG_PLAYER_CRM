/**
 * משיכת שערים חיים: זהב ספוט לאונקיית טרוי בדולר, ושער הדולר מול השקל.
 *
 * שני עקרונות:
 * 1. **לכל שער יש מקור גיבוי.** ספק אחד שנפל לא משבית את השני, ולא את המערכת.
 * 2. **מספר לא סביר נדחה.** תשובה משובשת שמחליפה שער זהב תעוות כל תמחור
 *    שייעשה אחריה, ולכן עדיף לא לעדכן מאשר לעדכן שטות.
 */

/** גבולות שפיות. מחוץ להם — התשובה לא מתקבלת. */
const GOLD_RANGE: [number, number] = [500, 20_000];
const FX_RANGE: [number, number] = [1.5, 10];

const TIMEOUT_MS = 8_000;

export type LiveRates = {
  goldSpotUsdOz: number | null;
  fxUsdIls: number | null;
  goldSource: string | null;
  fxSource: string | null;
  errors: string[];
};

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const inRange = (n: unknown, [lo, hi]: [number, number]): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= lo && n <= hi;

/**
 * סורק אובייקט JSON לעומק ומחזיר את הערך המספרי הראשון שגם שמו מתאים
 * וגם ערכו סביר. בנק ישראל שינה את שמות השדות בעבר; חיפוש לפי דפוס
 * שורד שינוי כזה, בעוד נתיב קשיח נשבר בשקט.
 */
function findNumber(node: unknown, keyRe: RegExp, range: [number, number]): number | null {
  if (node === null || typeof node !== "object") return null;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (keyRe.test(key) && inRange(value, range)) return value;
  }
  for (const value of Object.values(node as Record<string, unknown>)) {
    const found = findNumber(value, keyRe, range);
    if (found !== null) return found;
  }
  return null;
}

type Source<T> = { name: string; url: string; pick: (json: unknown) => T | null };

const GOLD_SOURCES: Source<number>[] = [
  {
    name: "gold-api.com",
    url: "https://api.gold-api.com/price/XAU",
    pick: (j) => findNumber(j, /^price$/i, GOLD_RANGE),
  },
  {
    name: "goldprice.org",
    url: "https://data-asg.goldprice.org/dbXRates/USD",
    pick: (j) => findNumber(j, /^xauPrice$/i, GOLD_RANGE),
  },
];

const FX_SOURCES: Source<number>[] = [
  {
    name: "בנק ישראל",
    url: "https://boi.org.il/PublicApi/GetExchangeRate?key=USD",
    pick: (j) => findNumber(j, /currentexchangerate|^rate$/i, FX_RANGE),
  },
  {
    name: "frankfurter (ECB)",
    url: "https://api.frankfurter.dev/v1/latest?base=USD&symbols=ILS",
    pick: (j) => findNumber(j, /^ILS$/i, FX_RANGE),
  },
];

async function firstThatAnswers(
  sources: Source<number>[],
  errors: string[]
): Promise<{ value: number; source: string } | null> {
  for (const source of sources) {
    try {
      const value = source.pick(await getJson(source.url));
      if (value !== null) return { value, source: source.name };
      errors.push(`${source.name}: תשובה בלי מספר סביר`);
    } catch (e) {
      errors.push(`${source.name}: ${e instanceof Error ? e.message : "לא נענה"}`);
    }
  }
  return null;
}

export async function fetchLiveRates(): Promise<LiveRates> {
  const errors: string[] = [];
  const [gold, fx] = await Promise.all([
    firstThatAnswers(GOLD_SOURCES, errors),
    firstThatAnswers(FX_SOURCES, errors),
  ]);

  return {
    goldSpotUsdOz: gold?.value ?? null,
    fxUsdIls: fx?.value ?? null,
    goldSource: gold?.source ?? null,
    fxSource: fx?.source ?? null,
    errors,
  };
}
