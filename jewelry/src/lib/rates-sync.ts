import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "./data";
import { fetchLiveRates } from "./rates";

export type ApplyResult = { ok: boolean; message: string };

const nowIso = () => new Date().toISOString();

/**
 * מושך שערים ושומר אותם. שער שלא נמשך נשאר כפי שהיה — עדכון חלקי עדיף
 * על כלום, וכלום עדיף על מספר שגוי שיזחל לתוך כל תמחור שייעשה אחריו.
 */
export async function applyLiveRates(): Promise<ApplyResult> {
  const current = await getSettings();
  const live = await fetchLiveRates();

  const gold = live.goldSpotUsdOz ?? current.goldSpotUsdOz;
  const fx = live.fxUsdIls ?? current.fxUsdIls;
  const sources = [live.goldSource, live.fxSource].filter(Boolean) as string[];

  if (!sources.length) {
    return {
      ok: false,
      message: `לא הצלחתי למשוך שערים. ${live.errors[0] ?? "אין חיבור לאינטרנט?"}`,
    };
  }

  await db
    .update(schema.settings)
    .set({
      goldSpotUsdOz: gold,
      fxUsdIls: fx,
      ratesFetchedAt: nowIso(),
      ratesSource: sources.join(" · "),
      updatedAt: nowIso(),
    })
    .where(eq(schema.settings.id, "singleton"));

  await db.insert(schema.rateHistory).values({
    id: randomUUID(),
    goldSpotUsdOz: gold,
    fxUsdIls: fx,
    vatPct: current.vatPct,
    createdAt: nowIso(),
  });

  const missing = [
    live.goldSpotUsdOz === null ? "זהב" : null,
    live.fxUsdIls === null ? "דולר" : null,
  ].filter(Boolean);

  return {
    ok: true,
    message: missing.length
      ? `עודכן חלקית — ${missing.join(" ו-")} לא נמשכו ונשארו כפי שהיו. מקור: ${sources.join(" · ")}`
      : `זהב $${gold.toLocaleString()} · דולר ₪${fx.toFixed(4)} — מקור: ${sources.join(" · ")}`,
  };
}

/** מחזיר null אם השערים עדיין טריים ולא היה צורך לגעת ברשת. */
export async function refreshRatesIfStale(maxAgeHours = 12): Promise<ApplyResult | null> {
  const settings = await getSettings();
  const fetchedAt = settings.ratesFetchedAt ? Date.parse(settings.ratesFetchedAt) : NaN;
  if (Number.isFinite(fetchedAt) && Date.now() - fetchedAt < maxAgeHours * 3_600_000) return null;
  return applyLiveRates();
}
